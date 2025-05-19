/**
 * Configuration system tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { jest } from '@jest/globals';
import { 
  Config, 
  ApiConfig, 
  CliOptions, 
  initializeConfig, 
  getConfig, 
  getApiConfig, 
  getCliOptions,
  _resetConfig 
} from '../src/config';

describe('Configuration System', () => {
  beforeEach(() => {
    // Reset the configuration before each test
    _resetConfig();
    
    // Mock the filesystem operations
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => '{}');
    jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Default Configuration', () => {
    it('should provide default API configuration when no sources available', async () => {
      await initializeConfig({});
      const config = getConfig();
      
      expect(config.api).toBeDefined();
      expect(config.api.host).toBe('localhost');
      expect(config.api.port).toBe(1234);
      expect(config.api.endpoint).toBe('/v1/chat/completions');
      expect(config.api.model).toBe('local-model');
      expect(config.api.timeout).toBe(30000);
    });
    
    it('should provide default CLI options when no sources available', async () => {
      await initializeConfig({});
      const options = getCliOptions();
      
      expect(options).toBeDefined();
      expect(options.dryRun).toBe(false);
      expect(options.interactive).toBe(false);
      expect(options.verbose).toBe(true);
      expect(options.debug).toBe(false);
    });
  });
  
  describe('CLI Arguments Priority', () => {
    it('should prioritize CLI arguments over default configuration', async () => {
      const cliArgs = {
        'api-host': 'cli-host',
        'api-port': 5678,
        'dry-run': true,
        'debug': true
      };
      
      await initializeConfig(cliArgs);
      const config = getConfig();
      
      expect(config.api.host).toBe('cli-host');
      expect(config.api.port).toBe(5678);
      expect(config.cli.dryRun).toBe(true);
      expect(config.cli.debug).toBe(true);
      
      // Other options should still have default values
      expect(config.api.endpoint).toBe('/v1/chat/completions');
      expect(config.cli.verbose).toBe(true);
    });
  });
  
  describe('Environment Variables', () => {
    beforeEach(() => {
      // Mock environment variables
      process.env.AI_API_HOST = 'env-host';
      process.env.AI_API_PORT = '9876';
      process.env.AI_API_MODEL = 'env-model';
    });
    
    afterEach(() => {
      // Clean up environment variables
      delete process.env.AI_API_HOST;
      delete process.env.AI_API_PORT;
      delete process.env.AI_API_MODEL;
    });
    
    it('should load configuration from environment variables', async () => {
      await initializeConfig({});
      const config = getConfig();
      
      expect(config.api.host).toBe('env-host');
      expect(config.api.port).toBe(9876);
      expect(config.api.model).toBe('env-model');
      
      // Other options should still have default values
      expect(config.api.endpoint).toBe('/v1/chat/completions');
    });
    
    it('should prioritize CLI arguments over environment variables', async () => {
      const cliArgs = {
        'api-host': 'cli-host',
        'api-port': 5678
      };
      
      await initializeConfig(cliArgs);
      const config = getConfig();
      
      expect(config.api.host).toBe('cli-host');
      expect(config.api.port).toBe(5678);
      expect(config.api.model).toBe('env-model'); // Should still use env variable
    });
  });
  
  describe('RC File Configuration', () => {
    it('should load configuration from RC file', async () => {
      // Mock the cosmiconfig explorer result
      jest.mock('cosmiconfig', () => ({
        cosmiconfig: jest.fn().mockImplementation(() => ({
          search: jest.fn().mockResolvedValue({
            config: {
              api: {
                host: 'rc-host',
                port: 4321,
                model: 'rc-model'
              },
              cli: {
                interactive: true
              }
            },
            filepath: '/path/to/.aicommitrc'
          }),
        }))
      }));
      
      await initializeConfig({});
      const config = getConfig();
      
      expect(config.api.host).toBe('rc-host');
      expect(config.api.port).toBe(4321);
      expect(config.api.model).toBe('rc-model');
      expect(config.cli.interactive).toBe(true);
      
      // Other options should still have default values
      expect(config.api.endpoint).toBe('/v1/chat/completions');
      expect(config.cli.verbose).toBe(true);
    });
    
    it('should prioritize CLI arguments over RC file configuration', async () => {
      // Mock the cosmiconfig explorer result
      jest.mock('cosmiconfig', () => ({
        cosmiconfig: jest.fn().mockImplementation(() => ({
          search: jest.fn().mockResolvedValue({
            config: {
              api: {
                host: 'rc-host',
                port: 4321
              }
            },
            filepath: '/path/to/.aicommitrc'
          }),
        }))
      }));
      
      const cliArgs = {
        'api-host': 'cli-host'
      };
      
      await initializeConfig(cliArgs);
      const config = getConfig();
      
      expect(config.api.host).toBe('cli-host');
      expect(config.api.port).toBe(4321); // Should use RC file value
    });
  });
  
  describe('Configuration Helpers', () => {
    it('should provide API configuration through getApiConfig', async () => {
      await initializeConfig({
        'api-host': 'test-host',
        'api-port': 1234
      });
      
      const apiConfig = getApiConfig();
      
      expect(apiConfig).toBeDefined();
      expect(apiConfig.host).toBe('test-host');
      expect(apiConfig.port).toBe(1234);
    });
    
    it('should provide CLI options through getCliOptions', async () => {
      await initializeConfig({
        'dry-run': true,
        'interactive': true
      });
      
      const cliOptions = getCliOptions();
      
      expect(cliOptions).toBeDefined();
      expect(cliOptions.dryRun).toBe(true);
      expect(cliOptions.interactive).toBe(true);
    });
  });
});
