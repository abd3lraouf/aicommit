#!/usr/bin/env node

// This is a special wrapper for ES modules compatibility
// It ensures that the shebang line is preserved and the module runs correctly

import { fileURLToPath } from 'url';
import path from 'path';
import { runCli } from './index.js';

// Support for __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run the CLI application
runCli().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
