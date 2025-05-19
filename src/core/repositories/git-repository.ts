/**
 * Interface for Git repository operations
 */

import { GitStatus, FileChanges } from '../entities/git.js';

export interface GitRepository {
  /**
   * Check if current directory is inside a git repository
   */
  isGitRepository(): Promise<boolean>;
  
  /**
   * Get current Git status (staged, unstaged, untracked files)
   */
  getStatus(): Promise<GitStatus>;
  
  /**
   * Get file changes (diff content)
   */
  getFileChanges(): Promise<FileChanges>;
  
  /**
   * Commit changes with the provided message
   * @param message - Commit message to use
   * @param stageAll - Whether to stage all unstaged files before committing
   */
  commitChanges(message: string, stageAll?: boolean): Promise<boolean>;
} 