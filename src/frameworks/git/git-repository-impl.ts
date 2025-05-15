/**
 * Git repository implementation using Node.js child_process
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import chalk from 'chalk';
import figures from 'figures';
import { GitRepository } from '../../core/repositories/git-repository';
import { GitStatus, FileChanges } from '../../core/entities/git';
import { styles } from '../cli/styles';
import { debugLog } from '../cli/debug';

export class GitRepositoryImpl implements GitRepository {
  /**
   * Check if current directory is inside a git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      debugLog('Git', 'Checking if current directory is inside a git repository');
      child_process.execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' });
      debugLog('Git', 'Current directory is inside a git repository');
      return true;
    } catch (e) {
      debugLog('Git', 'Current directory is not inside a git repository', e);
      return false;
    }
  }
  
  /**
   * Get current Git status (staged, unstaged, untracked files)
   */
  async getStatus(): Promise<GitStatus> {
    try {
      debugLog('Git', 'Getting current git status');
      
      // Get staged files
      const staged = child_process.execSync('git diff --name-status --staged', { encoding: 'utf8' });
      debugLog('Git', `Staged files: ${staged.trim() || 'None'}`);
      
      // Get unstaged but modified files
      const unstaged = child_process.execSync('git diff --name-status', { encoding: 'utf8' });
      debugLog('Git', `Unstaged files: ${unstaged.trim() || 'None'}`);
      
      // Get untracked files
      const untracked = child_process.execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' });
      debugLog('Git', `Untracked files: ${untracked.trim() || 'None'}`);
      
      return { staged, unstaged, untracked };
    } catch (e) {
      debugLog('Git', 'Error getting git status', e);
      throw new Error(`Error getting git status: ${e}`);
    }
  }
  
  /**
   * Get file changes (diff content)
   */
  async getFileChanges(): Promise<FileChanges> {
    try {
      debugLog('Git', 'Getting file changes (diff content)');
      
      // Get diff of staged files
      const staged_diff = child_process.execSync('git diff --staged', { encoding: 'utf8' });
      debugLog('Git', `Staged diff size: ${staged_diff.length} characters`);
      
      // Get diff of unstaged files
      const unstaged_diff = child_process.execSync('git diff', { encoding: 'utf8' });
      debugLog('Git', `Unstaged diff size: ${unstaged_diff.length} characters`);
      
      return { staged_diff, unstaged_diff };
    } catch (e) {
      debugLog('Git', 'Error getting file changes', e);
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
      debugLog('Git', `Committing changes with message: "${message.split('\n')[0]}..."`);
      debugLog('Git', `Stage all files: ${stageAll}`);
      
      // Check if there are any staged changes
      const stagedFiles = child_process.execSync('git diff --staged --name-only', { encoding: 'utf8' });
      debugLog('Git', `Staged files: ${stagedFiles.trim() || 'None'}`);
      
      // If no staged changes and stageAll is true, stage all changes
      if (!stagedFiles.trim() && stageAll) {
        debugLog('Git', 'No staged changes. Staging all changes...');
        console.log(styles.processText('No staged changes. Staging all changes...'));
        child_process.execSync('git add .');
        
        // Get newly staged files for display
        const newlyStagedFiles = child_process.execSync('git diff --staged --name-only', { encoding: 'utf8' });
        debugLog('Git', `Newly staged files: ${newlyStagedFiles.trim() || 'None'}`);
        
        if (newlyStagedFiles.trim()) {
          console.log(styles.successText('Successfully staged files:'));
          newlyStagedFiles.split('\n').filter(f => f.trim()).forEach(file => {
            console.log(styles.bullet(file));
          });
        }
      } else if (stagedFiles.trim()) {
        debugLog('Git', 'Committing existing staged files');
        console.log(styles.processText('Committing staged files:'));
        stagedFiles.split('\n').filter(f => f.trim()).forEach(file => {
          console.log(styles.bullet(file));
        });
      }
      
      // Write the commit message to a temp file
      const tempFile = path.join(os.tmpdir(), `commit-msg-${Date.now()}.txt`);
      debugLog('Git', `Writing commit message to temporary file: ${tempFile}`);
      fs.writeFileSync(tempFile, message);
      
      try {
        // Execute the git commit command using the temp file
        debugLog('Git', 'Executing git commit command');
        console.log(styles.processText('Executing git commit...'));
        child_process.execSync(`git commit -F ${tempFile}`, { stdio: 'inherit' });
        debugLog('Git', 'Commit successful');
        console.log(styles.successText('Commit successful!'));
        return true;
      } finally {
        // Clean up the temp file
        debugLog('Git', `Cleaning up temporary file: ${tempFile}`);
        fs.unlinkSync(tempFile);
      }
    } catch (error) {
      debugLog('Git', 'Failed to commit', error);
      console.error(styles.errorText(`Failed to commit: ${error}`));
      return false;
    }
  }
} 