#!/usr/bin/env node
/**
 * AICommit - Smart Git commit message generator using Amazon Q
 */

import { App } from './app';

async function main(): Promise<number> {
  const app = new App();
  return await app.run();
}

// Run the application and exit with the result code
main().then(process.exit).catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
}); 