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
  // Check if we're in a CI environment or if output should be suppressed
  const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';
  const isSilent = process.env.npm_config_loglevel === 'silent' || process.argv.includes('--silent');
  
  // Skip output in CI or silent mode
  if (isCI || isSilent) {
    return;
  }

  // Add a small delay to ensure output is visible after pnpm build approval
  if (process.env.npm_config_user_agent?.includes('pnpm')) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const hasModules = await importModules();

  if (hasModules) {
    // Display formatted welcome message with chalk and boxen
    const message = `
${chalk.bold('🎉 AICommit installed successfully!')}

${chalk.yellow('⚠️  Setup Required:')} You need a local AI server with the ${chalk.green('qwen3-4b-teen-emo')} model.

${chalk.bold('🚀 Quick Start:')}
1. Install LM Studio: ${chalk.cyan('https://lmstudio.ai')}
2. Load model: ${chalk.green('qwen3-4b-teen-emo')}
3. Start server: ${chalk.cyan('http://localhost:1234')}
4. Run: ${chalk.cyan('aicommit config')} to configure
5. Use: ${chalk.cyan('aicommit')} in any git repository

${chalk.bold('📖 Documentation:')}
${chalk.cyan('https://github.com/abd3lraouf/aicommit#readme')}
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
🎉 AICommit installed successfully!

⚠️  Setup Required: You need a local AI server with the qwen3-4b-teen-emo model.

🚀 Quick Start:
1. Install LM Studio: https://lmstudio.ai
2. Load model: qwen3-4b-teen-emo
3. Start server: http://localhost:1234
4. Run: aicommit config
5. Use: aicommit in any git repository

📖 Documentation: https://github.com/abd3lraouf/aicommit#readme
`);
  }
}

// Execute the main function and handle errors
main().catch(err => {
  console.error('Error in postinstall script:', err);
});
