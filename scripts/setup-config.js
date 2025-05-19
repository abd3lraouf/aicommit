#!/usr/bin/env node

/**
 * Setup script to create an initial .aicommitrc file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

// Default configuration
const defaultConfig = {
  api: {
    host: 'localhost',
    port: 1234,
    endpoint: '/v1/chat/completions',
    model: 'local-model',
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
  const defaultText = defaultValue ? 'Y/n' : 'y/N';
  const answer = await question(`${query} (${defaultText})`, defaultValue ? 'y' : 'n');
  return answer.toLowerCase() === 'y';
}

/**
 * Main setup function
 */
async function setup() {
  console.log(chalk.bold.green('\nAICommit Configuration Setup\n'));
  console.log('This script will help you create a .aicommitrc.json configuration file.');
  console.log('Press Enter to accept the default value in brackets.\n');
  
  // Create a copy of default configuration
  const config = JSON.parse(JSON.stringify(defaultConfig));
  
  // API Configuration
  console.log(chalk.yellow.bold('\nAPI Configuration:'));
  config.api.host = await question('API Host', config.api.host);
  config.api.port = parseInt(await question('API Port', config.api.port), 10);
  config.api.endpoint = await question('API Endpoint', config.api.endpoint);
  config.api.model = await question('AI Model Name', config.api.model);
  config.api.timeout = parseInt(await question('API Timeout (ms)', config.api.timeout), 10);
  
  // CLI Configuration
  console.log(chalk.yellow.bold('\nCLI Configuration:'));
  config.cli.interactive = await confirm('Enable interactive mode by default?', config.cli.interactive);
  config.cli.verbose = await confirm('Enable verbose output by default?', config.cli.verbose);
  config.cli.debug = await confirm('Enable debug mode by default?', config.cli.debug);
  
  // Determine where to save the file
  console.log(chalk.yellow.bold('\nFile Location:'));
  const useGlobal = await confirm('Save as global configuration in home directory?', false);
  
  const targetPath = useGlobal
    ? path.join(require('os').homedir(), '.aicommitrc.json')
    : path.join(process.cwd(), '.aicommitrc.json');
  
  // Check if file already exists
  if (fs.existsSync(targetPath)) {
    const overwrite = await confirm(`${targetPath} already exists. Overwrite?`, false);
    if (!overwrite) {
      console.log(chalk.yellow('\nSetup canceled. Existing file was not modified.'));
      rl.close();
      return;
    }
  }
  
  // Save the configuration
  try {
    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(chalk.green(`\nConfiguration file saved to ${targetPath}`));
  } catch (error) {
    console.error(chalk.red(`Error saving configuration: ${error.message}`));
  }
  
  rl.close();
}

// Run the setup
setup().catch(error => {
  console.error(chalk.red(`Error during setup: ${error.message}`));
  rl.close();
});
