/**
 * CLI presenter implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface CliOptions {
  dryRun: boolean;
  interactive: boolean;
}

export class CliPresenter {
  /**
   * Parse command line arguments for the script
   * @param args Command line arguments
   * @returns Object containing parsed arguments
   */
  parseArguments(args: string[] = process.argv.slice(2)): CliOptions {
    const parsedArgs = yargs(args)
      .option('dry-run', {
        alias: 'd',
        type: 'boolean',
        description: 'Show the commit message without committing',
        default: false
      })
      .option('interactive', {
        alias: 'i',
        type: 'boolean',
        description: 'Edit the commit message before committing',
        default: false
      })
      .help()
      .alias('help', 'h')
      .parseSync();

    return {
      dryRun: parsedArgs['dry-run'] || false,
      interactive: parsedArgs['interactive'] || false
    };
  }

  /**
   * Open the user's preferred editor to edit the commit message
   * @param commitMessage Initial commit message
   * @returns Edited commit message
   */
  editCommitMessage(commitMessage: string): string {
    const editFile = path.join(os.tmpdir(), `commit-msg-${Date.now()}.txt`);
    fs.writeFileSync(editFile, commitMessage, 'utf8');
    
    // Open editor for user to edit message
    const editor = process.env.EDITOR || 'vim';
    child_process.spawnSync(editor, [editFile], { stdio: 'inherit' });
    
    // Read the edited message
    const editedMessage = fs.readFileSync(editFile, 'utf8');
    
    // Clean up temporary file
    fs.unlinkSync(editFile);
    
    return editedMessage;
  }

  /**
   * Display a success message
   * @param message Success message to display
   */
  showSuccess(message: string): void {
    console.log(message);
  }

  /**
   * Display an error message
   * @param message Error message to display
   */
  showError(message: string): void {
    console.error(message);
  }

  /**
   * Display the commit message in dry-run mode
   * @param message Commit message to display
   */
  showDryRunMessage(message: string): void {
    console.log('Dry run mode. The commit message would be:');
    console.log('\n' + message + '\n');
  }
} 