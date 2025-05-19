/**
 * Configuration loader
 * Responsible for loading, merging, and validating configuration from all sources
 */

import deepmerge from 'deepmerge';
import { Config, defaultConfig, configSchema } from './config-schema';
import { loadRcConfig, loadEnvConfig, cliArgsToConfig } from './config-sources';
import { debugLog } from '../frameworks/cli/debug';

/**
 * Configuration loader class
 * Singleton implementation that loads, merges, and validates configuration
 */
export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: Config = defaultConfig;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Initialize configuration from all sources
   * @param cliArgs Command line arguments
   */
  public async initialize(cliArgs: Record<string, any> = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      debugLog('Config', 'Loading configuration...');

      // Load configuration from different sources
      const rcConfig = await loadRcConfig();
      const envConfig = loadEnvConfig();
      const cliConfig = cliArgsToConfig(cliArgs);

      // Merge configurations in order of precedence (lowest to highest)
      const mergedConfig = deepmerge.all([
        defaultConfig,    // Default values (lowest priority)
        envConfig,        // Environment variables
        rcConfig,         // RC files
        cliConfig,        // CLI arguments (highest priority)
      ], {
        // Clone objects during merge to avoid modifying source objects
        clone: true,
      }) as Config;

      // Validate the merged configuration
      this.config = configSchema.parse(mergedConfig);
      
      debugLog('Config', 'Configuration loaded successfully');
      if (this.config.cli.debug) {
        debugLog('Config', 'Final configuration:', this.config);
      }

      this.isInitialized = true;
    } catch (error) {
      debugLog('Config', 'Error loading configuration:', error);
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  /**
   * Get the current configuration
   * @returns Complete configuration object
   */
  public getConfig(): Config {
    if (!this.isInitialized) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Reset the configuration for testing purposes
   * @private
   */
  public _reset(): void {
    this.config = defaultConfig;
    this.isInitialized = false;
  }
}
