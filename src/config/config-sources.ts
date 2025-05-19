/**
 * Configuration sources implementation
 * Loads configuration from various sources:
 * - RC files (.aicommitrc, .aicommitrc.json, .aicommitrc.yaml)
 * - Environment variables (.env)
 * - Command line arguments
 */

import * as path from 'path';
import * as os from 'os';
import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { Config, configSchema, ApiConfig, CliOptions, defaultConfig } from './config-schema.js';
import { debugLog } from '../frameworks/cli/debug.js';

// Module name for cosmiconfig
const MODULE_NAME = 'aicommit';

/**
 * Load configuration from .aicommitrc files
 * Searches in the following locations (in order):
 * - .aicommitrc, .aicommitrc.json, .aicommitrc.yaml in current directory
 * - .aicommitrc, .aicommitrc.json, .aicommitrc.yaml in home directory
 */
export async function loadRcConfig(): Promise<Partial<Config>> {
  try {
    // Create cosmiconfig explorer with proper search strategy
    const explorer = cosmiconfig(MODULE_NAME, {
      searchPlaces: [
        '.aicommitrc',
        '.aicommitrc.json',
        '.aicommitrc.yaml',
        '.aicommitrc.yml',
      ],
      cache: false,
      stopDir: os.homedir(),  // This ensures it will go up to the home directory
    });

    // Search for config file starting from current directory
    // This will check current dir and parent directories up to home dir
    let result = await explorer.search();
    
    // If still not found, explicitly check home directory
    if (!result) {
      const homePath = os.homedir();
      const homeExplorer = cosmiconfig(MODULE_NAME, {
        searchPlaces: [
          '.aicommitrc',
          '.aicommitrc.json',
          '.aicommitrc.yaml',
          '.aicommitrc.yml',
        ],
        cache: false,
      });
      result = await homeExplorer.search(homePath);
    }

    if (result && result.config) {
      debugLog('Config', `Loaded configuration from ${result.filepath}`);
      
      // Validate the config
      try {
        const validatedConfig = configSchema.partial().parse(result.config);
        return validatedConfig;
      } catch (error) {
        if (error instanceof z.ZodError) {
          debugLog('Config', 'Invalid RC file configuration:', error.errors);
        }
        // Return empty object if validation fails
        return {};
      }
    }
    
    debugLog('Config', 'No RC file found');
    return {};
  } catch (error) {
    debugLog('Config', 'Error loading RC configuration:', error);
    return {};
  }
}

/**
 * Load configuration from environment variables (.env file)
 * Maps environment variables to configuration properties
 */
export function loadEnvConfig(): Partial<Config> {
  // Load variables from .env file
  dotenvConfig();
  
  // Create configuration object from environment variables
  const config: Partial<Config> = {
    api: {
      host: process.env.AI_API_HOST || defaultConfig.api.host,
      port: process.env.AI_API_PORT ? parseInt(process.env.AI_API_PORT, 10) : defaultConfig.api.port,
      endpoint: process.env.AI_API_ENDPOINT || defaultConfig.api.endpoint,
      model: process.env.AI_API_MODEL || defaultConfig.api.model,
      timeout: process.env.AI_API_TIMEOUT ? parseInt(process.env.AI_API_TIMEOUT, 10) : defaultConfig.api.timeout,
    },
  };

  // Remove undefined properties for cleaner merging
  Object.keys(config.api || {}).forEach(key => {
    if (config.api && config.api[key as keyof ApiConfig] === undefined) {
      delete config.api[key as keyof ApiConfig];
    }
  });

  if (Object.keys(config.api || {}).length === 0) {
    delete config.api;
  }

  debugLog('Config', 'Loaded environment variables:', 
    Object.keys(process.env).filter(key => key.startsWith('AI_API_')));
  
  return config;
}

/**
 * Convert CLI arguments to config structure
 */
export function cliArgsToConfig(args: Record<string, any>): Partial<Config> {
  // Map CLI arguments to config structure
  const config: Partial<Config> = {
    cli: {
      dryRun: args['dry-run'],
      interactive: args.interactive,
      verbose: args.verbose,
      debug: args.debug,
    },
    api: {
      host: args['api-host'],
      port: args['api-port'],
      endpoint: args['api-endpoint'],
      model: args['api-model'],
      timeout: args['api-timeout'],
    },
  };

  // Remove undefined CLI properties
  Object.keys(config.cli || {}).forEach(key => {
    if (config.cli && config.cli[key as keyof CliOptions] === undefined) {
      delete config.cli[key as keyof CliOptions];
    }
  });

  // Remove undefined API properties
  Object.keys(config.api || {}).forEach(key => {
    if (config.api && config.api[key as keyof ApiConfig] === undefined) {
      delete config.api[key as keyof ApiConfig];
    }
  });

  if (Object.keys(config.cli || {}).length === 0) {
    delete config.cli;
  }

  if (Object.keys(config.api || {}).length === 0) {
    delete config.api;
  }

  return config;
}
