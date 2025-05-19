/**
 * Configuration module public API
 */

import { ConfigLoader } from './config-loader.js';
import { Config, ApiConfig, CliOptions } from './config-schema.js';

export { Config, ApiConfig, CliOptions };

/**
 * Initialize the configuration system
 * @param cliArgs Command line arguments
 */
export async function initializeConfig(cliArgs: Record<string, any> = {}): Promise<void> {
  await ConfigLoader.getInstance().initialize(cliArgs);
}

/**
 * Get the complete configuration
 * @returns The complete configuration object
 */
export function getConfig(): Config {
  return ConfigLoader.getInstance().getConfig();
}

/**
 * Get API configuration
 * @returns API configuration section
 */
export function getApiConfig(): ApiConfig {
  return getConfig().api;
}

/**
 * Get CLI options configuration
 * @returns CLI options configuration section
 */
export function getCliOptions(): CliOptions {
  return getConfig().cli;
}

// For testing purposes only
export function _resetConfig(): void {
  ConfigLoader.getInstance()._reset();
}
