/**
 * CLI presenter implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import yargs from 'yargs';
import chalk from 'chalk';
import boxen from 'boxen';
import { styles } from './styles';
import { CliOptions as ConfigCliOptions } from '../../config';

export interface CliOptions extends ConfigCliOptions {
  // Extended CLI options with API configuration
  apiHost?: string;
  apiPort?: number;
  apiEndpoint?: string;
  apiModel?: string;
  apiTimeout?: number;
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
      .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Show verbose output with emojis and formatting',
        default: true
      })
      .option('debug', {
        type: 'boolean',
        description: 'Enable debug logging for troubleshooting',
        default: false
      })
      // API Configuration Options
      .option('api-host', {
        type: 'string',
        description: 'API server hostname',
        group: 'API Configuration:'
      })
      .option('api-port', {
        type: 'number',
        description: 'API server port',
        group: 'API Configuration:'
      })
      .option('api-endpoint', {
        type: 'string',
        description: 'API endpoint path',
        group: 'API Configuration:'
      })
      .option('api-model', {
        type: 'string',
        description: 'AI model name to use',
        group: 'API Configuration:'
      })
      .option('api-timeout', {
        type: 'number',
        description: 'API request timeout in milliseconds',
        group: 'API Configuration:'
      })
      .help()
      .alias('help', 'h')
      .parseSync();

    return {
      dryRun: parsedArgs['dry-run'] || false,
      interactive: parsedArgs['interactive'] || false,
      verbose: parsedArgs['verbose'] !== false, // Default to true unless explicitly set to false
      debug: parsedArgs['debug'] || false,
      apiHost: parsedArgs['api-host'],
      apiPort: parsedArgs['api-port'],
      apiEndpoint: parsedArgs['api-endpoint'],
      apiModel: parsedArgs['api-model'],
      apiTimeout: parsedArgs['api-timeout']
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
    console.log(styles.successText(message));
  }

  /**
   * Display an error message
   * @param message Error message to display
   */
  showError(message: string): void {
    console.error(styles.errorText(message));
  }

  /**
   * Display the commit message in dry-run mode
   * @param message Commit message to display
   */
  showDryRunMessage(message: string): void {
    console.log(styles.infoText('Dry run mode. The commit message would be:'));
    
    const boxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round' as any,
      borderColor: 'cyan',
      backgroundColor: '#222'
    };
    
    console.log(boxen(message, boxenOptions));
  }

  /**
   * Display a verbose process message with step information
   * @param message Message describing the current process step
   */
  showProcess(message: string, options?: { verbose?: boolean }): void {
    const shouldShow = options?.verbose ?? true;
    if (shouldShow) {
      console.log(styles.processText(message));
    }
  }

  /**
   * Display a commit message with styling
   * @param message The commit message to display
   * @param title Optional title to display before the message
   */
  showCommitMessage(message: string, title?: string): void {
    if (title) {
      console.log(`\n${chalk.bold(title)}\n`);
    }
    
    const boxenOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round' as any,
      borderColor: 'cyan',
      backgroundColor: '#222'
    };
    
    console.log(boxen(message, boxenOptions));
  }
  
  /**
   * Display a staged files summary
   * @param stagedFiles The list of staged files
   */
  showStagedFiles(stagedFiles: string): void {
    if (!stagedFiles.trim()) {
      console.log(styles.warningText('No staged files'));
      return;
    }
    
    console.log(`\n${chalk.bold('Staged files:')}`);
    const files = stagedFiles.split('\n').filter(f => f.trim());
    files.forEach(file => {
      console.log(styles.bullet(file));
    });
    console.log();
  }
  
  /**
   * Display a step indicator (e.g., 1/3, 2/3, etc.)
   * @param current Current step
   * @param total Total steps
   * @param message Message describing the step
   */
  showStep(current: number, total: number, message: string, options?: { verbose?: boolean }): void {
    const shouldShow = options?.verbose ?? true;
    if (shouldShow) {
      console.log(`\n${styles.step(current, total)} ${chalk.bold(message)}\n`);
    }
  }
}