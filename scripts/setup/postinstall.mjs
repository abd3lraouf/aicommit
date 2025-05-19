#!/usr/bin/env node

/**
 * Post-install script that displays information about setting up the API server
 * This consolidated version replaces all previous postinstall scripts
 */

// Try different ways to import packages based on the Node.js environment
let chalk, boxen;

async function importModules() {
  try {
    // Try ESM imports first
    [chalk, boxen] = await Promise.all([
      import('chalk').then(m => m.default),
      import('boxen').then(m => m.default)
    ]);
    return true;
  } catch (error) {
    try {
      // Try dynamic import if direct ESM imports fail
      chalk = (await import('chalk')).default;
      boxen = (await import('boxen')).default;
      return true;
    } catch (error) {
      // Create simple fallback functions
      chalk = {
        bold: (text) => `\x1b[1m${text}\x1b[0m`,
        green: (text) => `\x1b[32m${text}\x1b[0m`,
        yellow: (text) => `\x1b[33m${text}\x1b[0m`,
        blue: (text) => `\x1b[34m${text}\x1b[0m`,
        red: (text) => `\x1b[31m${text}\x1b[0m`,
        cyan: (text) => `\x1b[36m${text}\x1b[0m`,
      };
      
      boxen = (text, options) => {
        const width = text.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
        const border = '─'.repeat(width + 2);
        return `┌${border}┐\n${text.split('\n').map(line => `│ ${line}${' '.repeat(width - line.length + 1)}│`).join('\n')}\n└${border}┘`;
      };
      
      console.log('Using fallback formatting for display');
      return true;
    }
  }
}

async function main() {
  const hasModules = await importModules();

  if (hasModules) {
    // Display formatted welcome message with chalk and boxen
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
  } else {
    // Plain text fallback without chalk/boxen
    console.log(`
Thank you for installing AICommit!

Important: AICommit requires a local API server running with the THUDM/GLM-4-32B-Base-0414 model.

Default Configuration:
API Server: http://192.168.1.2:1234/v1/chat/completions

To customize your configuration:
1. Create a .aicommitrc.json file in your project directory or home directory
2. Use command-line options to override configuration
3. Edit the .env file for environment variables

For server setup instructions see: AI_SERVER_SETUP.md
For complete documentation, visit: https://github.com/abd3lraouf/aicommit#readme
`);
  }
}

// Execute the main function and handle errors
main().catch(err => {
  console.error('Error in postinstall script:', err);
});
