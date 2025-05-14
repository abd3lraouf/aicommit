/**
 * Interface for AI service operations
 */

export interface AIRepository {
  /**
   * Generate a commit message using AI based on provided content
   * @param prompt - The prompt containing git status and diff information
   */
  generateCommitMessage(prompt: string): Promise<string>;
} 