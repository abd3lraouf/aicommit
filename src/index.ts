#!/usr/bin/env node
/**
 * AICommit - Smart Git commit message generator
 */

import { App } from './app';
import { debugLog } from './frameworks/cli/debug';

async function main(): Promise<number> {
  try {
    debugLog('Main', 'Starting AICommit');
    const app = new App();
    return await app.run();
  } catch (error) {
    console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

// Run the application and exit with the result code
main().then(process.exit).catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
}); 