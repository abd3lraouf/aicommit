#!/usr/bin/env node

// This is a simple launcher script that delegates to the ES Module CLI entry point
import('./dist/cli.js').catch(err => {
  console.error('Error starting AICommit:', err.message);
  process.exit(1);
});
