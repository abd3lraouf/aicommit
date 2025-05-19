/**
 * Git repository implementation using Node.js child_process
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import chalk from 'chalk';
import figures from 'figures';
import { GitRepository } from '../../core/repositories/git-repository.js';
import { GitStatus, FileChanges } from '../../core/entities/git.js';
import { styles } from '../cli/styles.js';

export class GitRepositoryImpl implements GitRepository {
  /**
   * Check if current directory is inside a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      child_process.execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' });
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Get current Git status (staged, unstaged, untracked files)
   */
  async getStatus(): Promise<GitStatus> {
    try {
      // Get staged files
      const staged = child_process.execSync('git diff --name-status --staged', { encoding: 'utf8' });
      
      // Get unstaged but modified files
      const unstaged = child_process.execSync('git diff --name-status', { encoding: 'utf8' });
      
      // Get untracked files
      const untracked = child_process.execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' });
      
      return { staged, unstaged, untracked };
    } catch (e) {
      throw new Error(`Error getting git status: ${e}`);
    }
  }
  
  /**
   * Get file changes (diff content)
   */
  async getFileChanges(): Promise<FileChanges> {
    try {
      // Get diff of staged files
      const staged_diff = child_process.execSync('git diff --staged', { encoding: 'utf8' });
      
      // Get diff of unstaged files
      const unstaged_diff = child_process.execSync('git diff', { encoding: 'utf8' });
      
      return { staged_diff, unstaged_diff };
    } catch (e) {
      throw new Error(`Error getting file changes: ${e}`);
    }
  }
  
  /**
   * Commit changes with the provided message
   * @param message - Commit message to use
   * @param stageAll - Whether to stage all unstaged files before committing
   */
  async commitChanges(message: string, stageAll: boolean = false): Promise<boolean> {
    try {
      // Check if there are any staged changes
      const stagedFiles = child_process.execSync('git diff --staged --name-only', { encoding: 'utf8' });
      
      // If no staged changes and stageAll is true, stage all changes
      if (!stagedFiles.trim() && stageAll) {
        console.log(styles.processText('No staged changes. Staging all changes...'));
        child_process.execSync('git add .');
        
        // Get newly staged files for display
        const newlyStagedFiles = child_process.execSync('git diff --staged --name-only', { encoding: 'utf8' });
        if (newlyStagedFiles.trim()) {
          console.log(styles.successText('Successfully staged files:'));
          newlyStagedFiles.split('\n').filter(f => f.trim()).forEach(file => {
            console.log(styles.bullet(file));
          });
        }
      } else if (stagedFiles.trim()) {
        console.log(styles.processText('Committing staged files:'));
        stagedFiles.split('\n').filter(f => f.trim()).forEach(file => {
          console.log(styles.bullet(file));
        });
      }
      
      // Write the commit message to a temp file
      const tempFile = path.join(os.tmpdir(), `commit-msg-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, message);
      
      try {
        // Execute the git commit command using the temp file
        console.log(styles.processText('Executing git commit...'));
        child_process.execSync(`git commit -F ${tempFile}`, { stdio: 'inherit' });
        console.log(styles.successText('Commit successful!'));
        return true;
      } finally {
        // Clean up the temp file
        fs.unlinkSync(tempFile);
      }
    } catch (error) {
      console.error(styles.errorText(`Failed to commit: ${error}`));
      return false;
    }
  }
} 