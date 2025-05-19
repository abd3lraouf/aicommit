/**
 * Use case for generating commit messages with AI
 */

import { GitStatus, FileChanges } from '../entities/git.js';
import { GitRepository } from '../repositories/git-repository.js';
import { AIRepository } from '../repositories/ai-repository.js';
import { debugLog } from '../../frameworks/cli/debug.js';

export class GenerateCommitMessageUseCase {
  constructor(
    private gitRepository: GitRepository,
    private aiRepository: AIRepository
  ) {}

  /**
   * Create a prompt for the AI based on Git status and file changes
   * @param status Git repository status
   * @param changes Detailed file changes
   * @returns Formatted prompt string
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
${changes.staged_diff.substring(0, 10000)}

Your output should be in JSON format according to this structure:
{
  "emoji": "✨", // Appropriate emoji for the commit type
  "type": "feat", // Conventional commit type
  "scope": "api", // Optional component scope 
  "subject": "add oauth authentication", // Description in imperative mood
  "body": {
    "summary": "Enhances security and follows industry standards", // High-level overview
    "bulletPoints": [ // Array of specific changes
      "Add login screen with provider selection",
      "Implement token management for Google auth",
      "Create secure token storage"
    ]
  }
}

Follow the Conventional Commits specification (conventionalcommits.org) with the following structure:

1. Format the message as: <type>[optional scope]: <description>

2. Type must be one of the following:
   - feat: A new feature
   - fix: A bug fix
   - docs: Documentation only changes
   - style: Changes that do not affect the meaning of the code
   - refactor: A code change that neither fixes a bug nor adds a feature
   - perf: A code change that improves performance
   - test: Adding missing or correcting existing tests
   - chore: Changes to the build process or auxiliary tools
   - ci: Continuous integration changes
   - build: Changes to the build process
   - revert: Revert changes
   - merge: Merge branches
   - deps: Update dependencies
   - breaking: Breaking changes
   - security: Security fixes
   - config: Configuration changes
   - i18n: Internationalization changes
   - release: Release changes
   - db: Database changes
   - a11y: Accessibility changes
   - ux: User experience changes
   - init: Initial commit

3. Add a scope in parentheses for additional context: feat(api):

4. Description:
   - Use imperative, present tense (e.g., "add" not "added" or "adds")
   - Don't capitalize the first letter
   - No period at the end
   - Keep it under 50 characters

5. High-level overview paragraph:
   - Add a paragraph after the first line providing a high-level context about the change
   - Focus on "why" this change matters and its overall impact
   - Keep this short but informative (1 sentence, 1 paragraph)
   - Use imperative mood consistently
   - Avoid jargon or overly technical terms
   - Use clear and concise language
   - Avoid using "we" or "I" - focus on the change itself

6. Detailed changes:
   - List specific changes as bullet points
   - Be specific about what changed
   - Use imperative mood consistently

7. For breaking changes:
   - Add ! before the colon: feat!: or feat(scope)!:
   - Include "BREAKING CHANGE:" in the footer

8. CRITICAL INSTRUCTIONS
   - ONLY output the JSON object itself - NOTHING ELSE
   - DO NOT include any commentary, explanations, or notes about what you did
   - DO NOT wrap the JSON in quotes, backticks, or any other markers
   - DO NOT add any text before or after the JSON object itself
   - The output will be parsed as JSON by the application`;
  }

  /**
   * Generate a commit message using AI based on current repository changes
   */
  async execute(): Promise<string> {
    debugLog('UseCase', 'Starting commit message generation process');
    
    // Check if we're in a git repository
    const isRepo = await this.gitRepository.isGitRepository();
    if (!isRepo) {
      debugLog('UseCase', 'Not in a git repository');
      throw new Error('Not in a git repository');
    }

    // Get git status
    debugLog('UseCase', 'Getting git status');
    const status = await this.gitRepository.getStatus();
    
    // Check if there are any changes to commit
    if (!status.staged.trim() && !status.unstaged.trim() && !status.untracked.trim()) {
      debugLog('UseCase', 'No changes detected to commit');
      throw new Error('No changes detected to commit');
    }
    
    // Get detailed file changes
    debugLog('UseCase', 'Getting detailed file changes');
    const fileChanges = await this.gitRepository.getFileChanges();
    
    // Create prompt for AI
    debugLog('UseCase', 'Creating prompt for AI');
    const prompt = this.createPrompt(status, fileChanges);
    
    // Generate commit message using AI
    debugLog('UseCase', 'Generating commit message using API');
    const commitMessage = await this.aiRepository.generateCommitMessage(prompt);
    
    // Message now comes formatted from the API with emojis
    debugLog('UseCase', 'Commit message generated successfully');
    return commitMessage;
  }
}