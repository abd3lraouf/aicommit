/**
 * Amazon Q repository implementation using Node.js child_process
 */

import * as child_process from 'child_process';
import { AIRepository } from '../../core/repositories/ai-repository';
import { debugLog, debugExtraction } from '../cli/debug';

export class AmazonQRepositoryImpl implements AIRepository {
  /**
   * Cleans up common formatting issues in extracted commit messages
   * @param message Raw commit message to clean
   * @returns Cleaned commit message
   */
  private cleanFormattingIssues(message: string): string {
    if (!message) return message;
    
    // Remove any nested commit tags inside the message
    let cleanedMessage = message.replace(/<commit-start>|<commit-end>/g, '');
    
    // Fix bullet point lists with empty lines between them
    const lines = cleanedMessage.split('\n');
    const resultLines = [];
    let lastLineBullet = false;
    let skipNextEmptyLine = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isBullet = line.startsWith('-') || line.startsWith('*');
      const isEmpty = line === '';
      
      // Skip empty lines between bullet points
      if (isEmpty && lastLineBullet && i < lines.length - 1) {
        const nextLine = lines[i + 1].trim();
        const nextIsBullet = nextLine.startsWith('-') || nextLine.startsWith('*');
        
        if (nextIsBullet) {
          skipNextEmptyLine = true;
          continue; // Skip this empty line
        }
      }
      
      if (!isEmpty || !skipNextEmptyLine) {
        resultLines.push(lines[i]); // Keep original indentation
      }
      
      skipNextEmptyLine = false;
      lastLineBullet = isBullet;
    }
    
    cleanedMessage = resultLines.join('\n');
    
    // Fix other common formatting issues
    
    // Remove any potential duplicate newlines (3+ newlines becomes 2)
    cleanedMessage = cleanedMessage.replace(/\n{3,}/g, '\n\n');
    
    // Remove the first line if it's empty
    cleanedMessage = cleanedMessage.replace(/^\s*\n/, '');
    
    // Final trim
    cleanedMessage = cleanedMessage.trim();
    
    return cleanedMessage;
  }

  /**
   * Extract the actual commit message from Amazon Q output by removing headers and UI elements
   * @param output Raw output from Amazon Q
   * @returns Clean commit message
   */
  private extractCommitMessage(output: string): string {
    // Try to extract message between commit tags first (primary extraction method)
    const taggedContentMatch = output.match(/<commit-start>\s*([\s\S]*?)\s*<commit-end>/);
    if (taggedContentMatch && taggedContentMatch[1]) {
      const taggedMessage = taggedContentMatch[1].trim();
      debugLog('Extract', 'Found tagged commit message');
      
      // Clean up the message to fix common formatting issues and ensure correctness
      const cleanedMessage = this.cleanFormattingIssues(taggedMessage);
      
      // Validate that the extracted content looks like a commit message
      if (this.validateCommitMessage(cleanedMessage)) {
        return cleanedMessage;
      } else {
        debugLog('Extract', 'Tagged content does not appear to be a valid commit message, falling back');
      }
    } else {
      debugLog('Extract', 'No commit tags found in response, falling back to standard extraction');
    }
    
    // Secondary extraction methods if tags aren't found or don't contain valid content
    
    // Remove the MCP safety message
    output = output.replace(/To learn more about MCP safety.*?\n/s, '');
    
    // Remove the help line with commands and shortcuts
    output = output.replace(/\/help.*?fuzzy search\n/s, '');
    
    // Remove the separator line (horizontal dash line)
    output = output.replace(/━+/g, '');
    
    // Remove any ANSI color/formatting codes
    output = output.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
    
    // Remove any leading/trailing whitespace and empty lines
    output = output.trim();
    
    // Look for common patterns that indicate AI is adding commentary before or after the message
    // Remove text like "Here's a commit message:" or "This commit message follows the convention..."
    output = output.replace(/^(Here'?s\s(a|your|the)\s(commit\smessage|message).*?[:]\s*)/i, '');
    output = output.replace(/^(I've\s(created|generated|written)\s(a|the)\s(commit\smessage|message).*?[:]\s*)/i, '');
    output = output.replace(/^(This\s(commit\smessage|message)\s(follows|is|adheres).*?[:]\s*)/i, '');
    output = output.replace(/^(Based\son\sthe\schanges.*?[:]\s*)/i, '');
    
    // Remove any trailing explanations or commentary
    output = output.replace(/(\n\n.*?((follows|adheres to|uses|is formatted according to).*?conventional\scommits|explanation|commentary|note).*)$/is, '');
    
    // Handle multi-line model context or explanations before the commit message
    // Find the first line that looks like a conventional commit
    const lines = output.split('\n');
    const conventionalCommitLineIndex = lines.findIndex(line => 
      /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert|merge|deps|breaking|security|config|i18n|release|db|a11y|ux|init)(\([a-zA-Z0-9-_]+\))?!?:\s.+/.test(line)
    );
    
    if (conventionalCommitLineIndex > 0) {
      debugLog('Extract', `Found conventional commit format at line ${conventionalCommitLineIndex + 1}`);
      output = lines.slice(conventionalCommitLineIndex).join('\n');
    }
    
    // Remove code block markers if the message is wrapped in them
    output = output.replace(/^```[a-z]*\n([\s\S]*?)\n```$/m, '$1');
    
    // Remove any potential duplicate newlines
    output = output.replace(/\n{3,}/g, '\n\n');
    
    // Remove the first line if it's empty
    output = output.replace(/^\s*\n/, '');
    
    // Final trim
    output = output.trim();
    
    return output;
  }

  /**
   * Validates that the extracted message looks like a proper commit message
   * following conventional commit format
   * @param message The message to validate
   * @returns Whether the message appears to be a valid commit message
   */
  private validateCommitMessage(message: string): boolean {
    if (!message || message.trim() === '') {
      debugLog('Validation', 'Message is empty or whitespace only');
      return false;
    }

    // Check if the message contains any commit tags inside it - this is invalid
    if (message.includes('<commit-start>') || message.includes('<commit-end>')) {
      debugLog('Validation', 'Message contains commit tags inside the content - invalid');
      return false;
    }

    // Check for any common prefixes that would indicate this isn't just a commit message
    const badPrefixes = [
      'here',
      'here is',
      'here\'s',
      'this commit',
      'i\'ve',
      'i have',
      'below is',
      'following is',
      'this is',
      'the commit',
      'based on',
      '<commit',  // Would match partial tag
      'commit-start',
      'commit-end',
    ];

    const lowerMessage = message.toLowerCase().trim();
    if (badPrefixes.some(prefix => lowerMessage.startsWith(prefix))) {
      debugLog('Validation', `Message starts with a bad prefix: ${lowerMessage.split(' ').slice(0, 3).join(' ')}...`);
      return false;
    }

    // Check for conventional commit format (type: description)
    // Include the case where an emoji is already at the beginning
    const emojiPattern = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s+/u;
    const firstLine = message.split('\n')[0].replace(emojiPattern, ''); // Remove emoji if present
    
    // This regex matches strings like "feat: add feature" or "fix(scope): fix bug"
    const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert|merge|deps|breaking|security|config|i18n|release|db|a11y|ux|init)(\([a-zA-Z0-9-_]+\))?!?:\s.+/;
    
    const isConventionalFormat = conventionalCommitPattern.test(firstLine);
    
    if (!isConventionalFormat) {
      debugLog('Validation', `First line does not match conventional commit format: "${firstLine}"`);
      return false;
    }
    
    // Check for improper spacing between bullet points
    const lines = message.split('\n');
    let inBulletList = false;
    let emptyLineFoundBetweenBullets = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isBulletPoint = line.startsWith('-') || line.startsWith('*');
      
      if (isBulletPoint) {
        // If we're already in a bullet list and the previous line was empty,
        // this indicates an empty line between bullet points - which is wrong
        if (inBulletList && i > 0 && lines[i-1].trim() === '') {
          debugLog('Validation', 'Found empty line between bullet points, which is not allowed');
          emptyLineFoundBetweenBullets = true;
          break;
        }
        inBulletList = true;
      } else if (line === '') {
        // It's an empty line, which is fine unless the next line is a bullet point
        // (That will be checked in the next iteration)
      } else {
        // Not a bullet and not empty, so we're no longer in a bullet list
        inBulletList = false;
      }
    }
    
    if (emptyLineFoundBetweenBullets) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate a commit message using Amazon Q based on provided content
   * @param prompt - The prompt containing git status and diff information
   */
  async generateCommitMessage(prompt: string): Promise<string> {
    try {
      // Use spawn to send the prompt via stdin
      const process = child_process.spawnSync('q', ['chat', '--trust-all-tools', '--no-interactive'], {
        input: prompt,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      if (process.status !== 0) {
        throw new Error(`Amazon Q error: ${process.stderr}`);
      }
      
      debugLog('AmazonQ', 'Checking for commit tags in response');
      const hasCommitStartTag = process.stdout.includes('<commit-start>');
      const hasCommitEndTag = process.stdout.includes('<commit-end>');
      debugLog('AmazonQ', `Tags found: start=${hasCommitStartTag}, end=${hasCommitEndTag}`);
      
      // Check for mismatched tags (one tag exists but not the other)
      if ((hasCommitStartTag && !hasCommitEndTag) || (!hasCommitStartTag && hasCommitEndTag)) {
        debugLog('AmazonQ', 'WARNING: Mismatched tags detected. Processing may be unreliable.');
      }
      
      // Clean the output to extract just the commit message
      let cleanMessage = this.extractCommitMessage(process.stdout);
      
      // Debug logging
      debugExtraction(process.stdout, cleanMessage);
      
      // If the validation fails, try more aggressive extraction methods
      if (!this.validateCommitMessage(cleanMessage)) {
        debugLog('AmazonQ', 'Initial commit message extraction failed validation. Trying alternative extraction...');
        
        // Try to find a code block that might contain the commit message
        const codeBlockMatch = process.stdout.match(/```(?:commit|bash|shell)?\n([\s\S]*?)\n```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          const potentialMessage = codeBlockMatch[1].trim();
          debugLog('AmazonQ', 'Found code block, trying as commit message', potentialMessage);
          if (this.validateCommitMessage(potentialMessage)) {
            cleanMessage = this.cleanFormattingIssues(potentialMessage);
          }
        }
        
        // Try to extract text between a section that looks like a commit message
        if (!this.validateCommitMessage(cleanMessage)) {
          debugLog('AmazonQ', 'Code block extraction failed or not found. Trying pattern matching...');
          const conventionalCommitPattern = /(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert|merge|deps|breaking|security|config|i18n|release|db|a11y|ux|init)(\([a-zA-Z0-9-_]+\))?!?:\s[^\n]+(\n\n[\s\S]+)?/;
          const matchResult = process.stdout.match(conventionalCommitPattern);
          
          if (matchResult && matchResult[0]) {
            cleanMessage = matchResult[0].trim();
            debugLog('AmazonQ', 'Found pattern match', cleanMessage);
            
            // Apply formatting fixes to the extracted message
            cleanMessage = this.cleanFormattingIssues(cleanMessage);
          }
        }
      }
      
      // If the message is still empty or just whitespace after cleaning, return an error
      if (!cleanMessage || cleanMessage.trim() === '') {
        debugLog('AmazonQ', 'Final message is empty or whitespace');
        throw new Error("Amazon Q returned an empty or invalid commit message");
      }
      
      // Final validation of the commit message format
      if (!this.validateCommitMessage(cleanMessage)) {
        debugLog('AmazonQ', 'Final message validation failed', cleanMessage);
        throw new Error("Amazon Q returned a commit message that does not follow conventional commit format");
      }
      
      // Apply final formatting fixes
      cleanMessage = this.cleanFormattingIssues(cleanMessage);
      
      debugLog('AmazonQ', 'Successfully extracted commit message', cleanMessage);
      return cleanMessage;
    } catch (e) {
      throw new Error(`Error calling Amazon Q: ${e}`);
    }
  }
}