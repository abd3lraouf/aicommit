#!/usr/bin/env node

/**
 * ESM Compatible CLI entry point for AICommit
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { execSync } from 'child_process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// Path utilities for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * The main entry point for the AICommit CLI
 */
async function main() {
  try {
    console.log(chalk.blue('AICommit - Generating commit message using local AI...'));
    
    // Parse CLI arguments with yargs
    const argv = yargs(hideBin(process.argv))
      .option('debug', {
        type: 'boolean',
        description: 'Enable debug logging',
        default: false
      })
      .option('dry-run', {
        type: 'boolean',
        description: 'Do not commit changes, just print commit message',
        default: false
      })
      .option('interactive', {
        type: 'boolean',
        description: 'Edit commit message before committing',
        default: false
      })
      .option('verbose', {
        type: 'boolean',
        description: 'Show detailed output',
        default: true
      })
      .option('api-host', {
        type: 'string',
        description: 'API server host',
        default: 'localhost'
      })
      .option('api-port', {
        type: 'number',
        description: 'API server port',
        default: 1234
      })
      .option('api-endpoint', {
        type: 'string',
        description: 'API server endpoint',
        default: '/v1/chat/completions'
      })
      .help()
      .alias('h', 'help')
      .parse();
    
    if (argv.debug) {
      console.log(chalk.yellow('Debug mode enabled'));
      console.log('CLI arguments:', argv);
    }
    
    // Check if git is available
    try {
      execSync('git --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Git is not installed or not available in the PATH');
    }
    
    // Check if the current directory is a git repository
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Current directory is not a git repository');
    }
    
    // Check if there are staged changes
    const status = execSync('git status --porcelain').toString();
    if (!status.trim()) {
      throw new Error('No changes to commit. Stage your changes with git add first.');
    }
    
    console.log(chalk.green('Staged changes found, generating commit message...'));
    
    // For now, just exit with success to test the basic CLI
    console.log(chalk.yellow('ESM-compatible CLI working correctly!'));
    console.log(chalk.cyan('Next step: Connect to the actual implementation.'));
    
    return 0;
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    return 1;
  }
}

// Run the application
main().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
