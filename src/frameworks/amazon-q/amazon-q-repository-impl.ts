/**
 * Amazon Q repository implementation using Node.js child_process
 */

import * as child_process from 'child_process';
import { AIRepository } from '../../core/repositories/ai-repository';
import { debugLog, debugExtraction } from '../cli/debug';

export class AmazonQRepositoryImpl implements AIRepository {
  /**
   * Extract the actual commit message from Amazon Q output by removing headers and UI elements
   * @param output Raw output from Amazon Q
   * @returns Clean commit message
   */
  private extractCommitMessage(output: string): string {
    debugLog('AmazonQ', 'Extracting commit message from raw output');
    
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
    
    // Remove any potential duplicate newlines
    output = output.replace(/\n{3,}/g, '\n\n');
    
    // Remove the first line if it's empty
    output = output.replace(/^\s*\n/, '');
    
    // Log original and cleaned message for debugging
    debugExtraction(output, output.trim());
    
    return output;
  }

  /**
   * Generate a commit message using Amazon Q based on provided content
   * @param prompt - The prompt containing git status and diff information
   */
  async generateCommitMessage(prompt: string): Promise<string> {
    try {
      debugLog('AmazonQ', 'Generating commit message with Amazon Q');
      
      // Use spawn to send the prompt via stdin
      const process = child_process.spawnSync('q', ['chat', '--trust-all-tools', '--no-interactive'], {
        input: prompt,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      if (process.status !== 0) {
        debugLog('AmazonQ', 'Error from Amazon Q process', process.stderr);
        throw new Error(`Amazon Q error: ${process.stderr}`);
      }
      
      debugLog('AmazonQ', 'Received response from Amazon Q');
      
      // Clean the output to extract just the commit message
      const cleanMessage = this.extractCommitMessage(process.stdout);
      
      // If the message is still empty or just whitespace after cleaning, return an error
      if (!cleanMessage || cleanMessage.trim() === '') {
        debugLog('AmazonQ', 'Amazon Q returned an empty message after processing');
        throw new Error("Amazon Q returned an empty or invalid commit message");
      }
      
      return cleanMessage;
    } catch (e) {
      debugLog('AmazonQ', 'Exception while generating commit message', e);
      throw new Error(`Error calling Amazon Q: ${e}`);
    }
  }
} 