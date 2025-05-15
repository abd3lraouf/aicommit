/**
 * Use case for generating commit messages with AI
 */

import { GitStatus, FileChanges, COMMIT_TYPE_EMOJIS } from '../entities/git';
import { GitRepository } from '../repositories/git-repository';
import { AIRepository } from '../repositories/ai-repository';

export class GenerateCommitMessageUseCase {
  constructor(
    private gitRepository: GitRepository,
    private aiRepository: AIRepository
  ) {}

  /**
   * Create a prompt for the AI based on Git status and file changes
   */
  private createPrompt(status: GitStatus, changes: FileChanges): string {
    return `Generate a concise, best-practice Git commit message based on these changes:

Staged files:
${status.staged}

Unstaged files:
${status.unstaged}

Untracked files:
${status.untracked}

Changes in staged files:
${changes.staged_diff.substring(0, 2000)}  # Limiting to 2000 chars to avoid overwhelming AI

Follow the Conventional Commits specification (conventionalcommits.org) with the following structure:

1. Format the message as: <type>[optional scope]: <description>

   [high-level overview paragraph]
   
   [detailed changes as bullet points]

2. Type must be one of the following:
   - feat: A new feature
   - fix: A bug fix
   - docs: Documentation only changes
   - style: Changes that do not affect the meaning of the code
   - refactor: A code change that neither fixes a bug nor adds a feature
   - perf: A code change that improves performance
   - test: Adding missing or correcting existing tests
   - chore: Changes to the build process or auxiliary tools
   - ci : Continuous integration changes
   - build : Changes to the build process
   - revert : Revert changes
   - merge : Merge branches
   - deps : Update dependencies
   - breaking : Breaking changes
   - security : Security fixes
   - config : Configuration changes
   - i18n : Internationalization changes
   - release : Release changes
   - db : Database changes
   - a11y : Accessibility changes
   - ux : User experience changes
   - init :  Initial commit

3. Add a scope in parentheses for additional context: feat(api):

4. Description:
   - Use imperative, present tense (e.g., "add" not "added" or "adds")
   - Don't capitalize the first letter
   - No period at the end
   - Keep it under 50 characters

5. High-level overview paragraph:
   - Add a paragraph after the first line providing a high-level context about the change
   - Focus on "why" this change matters and its overall impact
   - Keep this short but informative (1 sentences, 1 paragraph)
   - Use imperative mood consistently
   - Avoid jargon or overly technical terms
   - Use clear and concise language
   - Avoid using "we" or "I" - focus on the change itself
   - Avoid using "this commit" or "this change" - focus on the change itself
   - Avoid using "fixes" or "resolves" - focus on the change itself

6. Detailed changes:
   - List specific changes as bullet points with hyphens (-)
   - Be specific about what changed
   - Use imperative mood consistently
   - NEVER add empty lines between bullet points
   - Each bullet point should be on a consecutive line

7. For breaking changes:
   - Add ! before the colon: feat!: or feat(scope)!:
   - Include "BREAKING CHANGE:" in the footer

8. CRITICAL INSTRUCTIONS
   - ONLY output the commit message text itself - NOTHING ELSE
   - DO NOT include any commentary, explanations, or notes about what you did
   - DO NOT start with phrases like "Here's a commit message" or "This commit message..."
   - DO NOT wrap the message in quotes, backticks, or any other markers EXCEPT for the required tags below
   - DO NOT add any text before or after the commit message itself
   - The output will be used AS-IS in a git commit command
   - ANY text you generate will be included in the git history
   - ALWAYS wrap your commit message EXACTLY with <commit-start> and <commit-end> tags
   - NEVER include <commit-start> or <commit-end> tags inside the commit message body
   - NEVER include empty lines between bullet points in the list of changes

Example:
\`\`\`
<commit-start>
feat(auth): add OAuth2 authentication

This authentication implementation enhances security and follows modern industry standards, allowing users to sign in with popular providers without creating new credentials.

- Add login screen with provider selection
- Implement token management for Google auth
- Create secure token storage
- Add auto refresh for expired tokens
- Update user profile to display auth method

<commit-end>
\`\`\`

<commit-start>
feat(scope): description

Overview, big picture, and context about the change in a way that a human would understand it. just one paragraph.

- List of changes
- More changes (if any)
- Even more changes (if any)
<commit-end>

Examples:

<commit-start>
feat(auth): add OAuth2 authentication

This authentication implementation enhances security and follows modern industry standards, allowing users to sign in with popular providers without creating new credentials.

- Add login screen with provider selection
- Implement token management for Google auth
- Create secure token storage
- Add auto refresh for expired tokens
- Update user profile to display auth method
<commit-end>

<commit-start>
fix(ui): resolve button alignment issue in mobile view

Ensures consistent UI appearance across all device sizes by correcting flexbox layout properties that were causing alignment problems on smaller screens.

- Adjust margin and padding values
- Add proper media queries
- Fix flexbox alignment properties
- Update responsive container styles
<commit-end>`;
  }

  /**
   * Add appropriate GitHub-friendly emoji based on the commit type
   * @param commitMessage The original commit message
   * @returns Commit message with added emoji
   */
  private addEmojiToCommitMessage(commitMessage: string): string {
    // Match the commit type from the first line
    const lines = commitMessage.split('\n');
    const firstLine = lines[0] || '';
    
    // Look for the conventional commit format: type(scope): description
    const match = firstLine.match(/^([\w]+)(?:\(.*?\))?(!)?:/);
    
    if (match) {
      const commitType = match[1].toLowerCase();
      const isBreaking = Boolean(match[2]);
      
      // Get the appropriate emoji
      let emoji = COMMIT_TYPE_EMOJIS[commitType] || '';
      
      // Add breaking change emoji if it's a breaking change
      if (isBreaking) {
        emoji = `${COMMIT_TYPE_EMOJIS['breaking'] || '💥'} ${emoji}`;
      }
      
      if (emoji) {
        // Replace the first line with the emoji-prefixed version
        lines[0] = `${emoji} ${firstLine}`;
        return lines.join('\n');
      }
    }
    
    return commitMessage;
  }

  /**
   * Enhance the commit message by adding emojis and ensuring it has a high-level overview
   * @param commitMessage The original commit message from AI
   * @returns Enhanced commit message
   */
  private enhanceCommitMessage(commitMessage: string): string {
    // First add emojis
    let emojifiedMessage = this.addEmojiToCommitMessage(commitMessage);
    
    const lines = emojifiedMessage.split('\n');
    
    // Make sure there's a blank line after the first line (between title and body)
    if (lines.length > 1 && lines[1].trim() !== '') {
      lines.splice(1, 0, '');
    }
    
    // Process the body of the commit message (starting from line 2)
    if (lines.length > 2) {
      let i = 2;
      let inBulletList = false;
      
      while (i < lines.length) {
        const currentLine = lines[i].trim();
        const prevLine = i > 2 ? lines[i-1].trim() : '';
        
        // Check if this line is a bullet point
        const isBullet = currentLine.startsWith('-') || currentLine.startsWith('*');
        
        // Handle bullet points - don't add blank lines between bullet points
        if (isBullet) {
          inBulletList = true;
          i++;
          continue;
        }
        
        // If we're transitioning out of a bullet list or between paragraphs, ensure proper spacing
        if ((inBulletList && currentLine !== '') || 
            (prevLine !== '' && currentLine !== '' && !prevLine.startsWith('-') && !prevLine.startsWith('*'))) {
          // Add a blank line before starting a new paragraph
          lines.splice(i, 0, '');
          i++;
          inBulletList = false;
        }
        
        i++;
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Generate a commit message using AI based on current repository changes
   */
  async execute(): Promise<string> {
    // Check if we're in a git repository
    const isRepo = await this.gitRepository.isGitRepository();
    if (!isRepo) {
      throw new Error('Not in a git repository');
    }

    // Get git status
    const status = await this.gitRepository.getStatus();
    
    // Check if there are any changes to commit
    if (!status.staged.trim() && !status.unstaged.trim() && !status.untracked.trim()) {
      throw new Error('No changes detected to commit');
    }
    
    // Get detailed file changes
    const fileChanges = await this.gitRepository.getFileChanges();
    
    // Create prompt for AI
    const prompt = this.createPrompt(status, fileChanges);
    
    // Generate commit message using AI
    const rawCommitMessage = await this.aiRepository.generateCommitMessage(prompt);
    
    // Enhance with emojis and formatting
    return this.enhanceCommitMessage(rawCommitMessage);
  }
}