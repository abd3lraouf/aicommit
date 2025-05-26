/**
 * Interface for AI service operations
 */

import { GitChangeAnalysis } from '../entities/git.js';

export interface AIRepository {
  /**
   * Generate a commit message using AI based on provided content
   * @param prompt - The prompt containing git status and diff information
   * @param analysis - Optional git change analysis for dynamic schema generation
   */
  generateCommitMessage(prompt: string, analysis?: GitChangeAnalysis): Promise<string>;
} 