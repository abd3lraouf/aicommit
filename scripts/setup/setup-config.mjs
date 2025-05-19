#!/usr/bin/env node

/**
 * Setup script to create an initial .aicommitrc file
 * This consolidated version works in both ESM and CommonJS environments
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import os from 'os';

// Try to import chalk, but have a fallback if it fails
let chalk;
try {
  chalk = (await import('chalk')).default;
} catch (error) {
  // Create a simple chalk-like object with basic formatting functions
  chalk = {
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: {
      green: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
      yellow: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m`,
    }
  };
}

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default configuration
const defaultConfig = {
  api: {
    host: 'localhost',
    port: 1234,
    endpoint: '/v1/chat/completions',
    model: 'Qwen/Qwen3-4B',
    timeout: 30000
  },
  cli: {
    dryRun: false,
    interactive: false,
    verbose: true,
    debug: false
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask a question and get the answer
 */
function question(query, defaultValue) {
  return new Promise(resolve => {
    const fullQuery = defaultValue !== undefined
      ? `${query} [${defaultValue}]: `
      : `${query}: `;
    
    rl.question(chalk.cyan(fullQuery), (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Ask a yes/no question
 */
async function confirm(query, defaultValue = false) {
  const defaultStr = defaultValue ? 'Y/n' : 'y/N';
  const answer = await question(`${query} (${defaultStr})`, defaultValue ? 'y' : 'n');
  return answer.toLowerCase() === 'y';
}

/**
 * Main configuration function
 */
async function configureSettings() {
  console.log(chalk.bold('\nAICommit Configuration Setup\n'));
  console.log(chalk.yellow('This will create a .aicommitrc.json file with your preferred settings.\n'));
  
  const config = {...defaultConfig};
  
  // API Settings
  console.log(chalk.bold('\nAPI Server Settings:'));
  config.api.host = await question('API Host', config.api.host);
  config.api.port = parseInt(await question('API Port', config.api.port), 10);
  config.api.endpoint = await question('API Endpoint', config.api.endpoint);
  config.api.model = await question('Model Name', config.api.model);
  config.api.timeout = parseInt(await question('Request Timeout (ms)', config.api.timeout), 10);
  
  // CLI Settings
  console.log(chalk.bold('\nCLI Settings:'));
  config.cli.interactive = await confirm('Enable interactive mode by default? (allows editing before commit)', config.cli.interactive);
  config.cli.verbose = await confirm('Enable verbose output by default?', config.cli.verbose);
  config.cli.debug = await confirm('Enable debug mode by default?', config.cli.debug);
  config.cli.dryRun = await confirm('Enable dry run mode by default? (does not commit changes)', config.cli.dryRun);
  
  // Save location
  console.log(chalk.bold('\nConfiguration Location:'));
  const useGlobal = await confirm('Save as global configuration? (in your home directory)', true);
  
  // Determine save path
  const savePath = useGlobal
    ? path.join(os.homedir(), '.aicommitrc.json')
    : path.join(process.cwd(), '.aicommitrc.json');
  
  // Check if file already exists
  if (fs.existsSync(savePath)) {
    const overwrite = await confirm(`${savePath} already exists. Overwrite?`, false);
    if (!overwrite) {
      console.log(chalk.yellow('\nSetup canceled. Existing file was not modified.'));
      rl.close();
      return;
    }
  }
  
  // Write configuration
  try {
    fs.writeFileSync(savePath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`\nConfiguration saved to ${savePath}`));
    console.log(chalk.yellow('You can edit this file at any time or override settings via command-line arguments.\n'));
  } catch (error) {
    console.error(chalk.red(`Error saving configuration: ${error.message}`));
  }
  
  rl.close();
}

// Run the configuration process
configureSettings().catch(error => {
  console.error(chalk.red('Error setting up configuration:'), error);
  process.exit(1);
});
