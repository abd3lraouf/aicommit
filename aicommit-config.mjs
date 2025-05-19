#!/usr/bin/env node

/**
 * Configuration setup script wrapper
 * This script makes it easier to run the configuration setup
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import child_process from 'child_process';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to setup-config.mjs
const setupScriptPath = path.resolve(__dirname, 'scripts', 'setup', 'setup-config.mjs');

// Check if setup script exists
if (!fs.existsSync(setupScriptPath)) {
  console.error(`Setup script not found at: ${setupScriptPath}`);
  process.exit(1);
}

// Run setup script
try {
  const result = child_process.spawnSync('node', [setupScriptPath], { 
    stdio: 'inherit',
    shell: true
  });
  
  if (result.status !== 0) {
    console.error('Configuration setup failed with exit code:', result.status);
    process.exit(result.status);
  }
} catch (error) {
  console.error('Error running configuration setup:', error);
  process.exit(1);
}
