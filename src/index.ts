#!/usr/bin/env node
/**
 * AICommit - Smart Git commit message generator
 */

import { App } from './app.js';
import { debugLog } from './frameworks/cli/debug.js';

export async function runCli(): Promise<number> {
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
if (import.meta.url.endsWith(process.argv[1])) {
  runCli().then(process.exit).catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
} 