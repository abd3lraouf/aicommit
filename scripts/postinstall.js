#!/usr/bin/env node

/**
 * Post-install script that displays information about setting up the API server
 */

const chalk = require('chalk');
const boxen = require('boxen');

const message = `
${chalk.bold('Thank you for installing AICommit!')}

${chalk.yellow('Important:')} AICommit requires a local API server running with the ${chalk.green('THUDM/GLM-4-32B-Base-0414')} model.

${chalk.bold('Default Configuration:')}
API Server: ${chalk.cyan('http://192.168.1.2:1234/v1/chat/completions')}

To customize your configuration:

1. Create a ${chalk.cyan('.aicommitrc.json')} file in your project directory
   or home directory with your preferred settings

2. Use command-line options to override configuration:
   ${chalk.cyan('$ aicommit --api-host=localhost --api-port=1234')}

3. Edit the .env file for environment variables:
   ${chalk.cyan('$ nano .env')}

For server setup instructions see:
${chalk.cyan('AI_SERVER_SETUP.md')}

For complete documentation, visit:
${chalk.blue('https://github.com/abd3lraouf/aicommit#readme')}
`;

console.log(boxen(message, {
  padding: 1,
  margin: 1,
  borderStyle: 'round',
  borderColor: 'green',
}));
