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

   [optional footer(s)]

2. Type must be one of the following:
   - feat: A new feature
   - fix: A bug fix
   - docs: Documentation only changes
   - style: Changes that do not affect the meaning of the code
   - refactor: A code change that neither fixes a bug nor adds a feature
   - perf: A code change that improves performance
   - test: Adding missing or correcting existing tests
   - chore: Changes to the build process or auxiliary tools

3. Add an optional scope in parentheses for additional context: feat(api):

4. Description:
   - Use imperative, present tense (e.g., "add" not "added" or "adds")
   - Don't capitalize the first letter
   - No period at the end
   - Keep it under 50 characters

5. High-level overview paragraph:
   - Add a paragraph after the first line providing a high-level context about the change
   - Focus on "why" this change matters and its overall impact
   - Keep this short but informative (1-3 sentences)

6. Detailed changes:
   - List specific changes as bullet points with hyphens (-)
   - Be specific about what changed
   - Use imperative mood consistently

7. For breaking changes:
   - Add ! before the colon: feat!: or feat(scope)!:
   - Include "BREAKING CHANGE:" in the footer

8. Footer (if needed):
   - Reference issues: "Fixes #123" or "Refs #123"
   - Include metadata like "Reviewed-by: name"

Example:
\`\`\`
feat(auth): add OAuth2 authentication

This authentication implementation enhances security and follows modern industry standards, allowing users to sign in with popular providers without creating new credentials.

- Add login screen with provider selection
- Implement token management for Google auth
- Create secure token storage
- Add auto refresh for expired tokens
- Update user profile to display auth method

Fixes #42
\`\`\`

IMPORTANT: Output should contain ONLY the commit message itself without any other text.`;
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
        return commitMessage.replace(firstLine, `${emoji} ${firstLine}`);
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
    
    // Make sure there's a blank line after the first line
    const lines = emojifiedMessage.split('\n');
    if (lines.length > 1 && lines[1].trim() !== '') {
      lines.splice(1, 0, '');
      emojifiedMessage = lines.join('\n');
    }
    
    return emojifiedMessage;
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