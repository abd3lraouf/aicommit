/**
 * Configuration schema definitions and validators
 */

import { z } from 'zod';

// API configuration schema
export const apiConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().int().positive().default(1234),
  endpoint: z.string().startsWith('/').default('/v1/chat/completions'),
  model: z.string().default('local-model'),
  timeout: z.number().int().positive().default(30000), // 30 seconds
});

// CLI options schema
export const cliOptionsSchema = z.object({
  dryRun: z.boolean().default(false),
  interactive: z.boolean().default(false),
  verbose: z.boolean().default(true),
  debug: z.boolean().default(false),
});

// Complete configuration schema
export const configSchema = z.object({
  api: apiConfigSchema,
  cli: cliOptionsSchema,
});

// Generate TypeScript types from schemas
export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type CliOptions = z.infer<typeof cliOptionsSchema>;
export type Config = z.infer<typeof configSchema>;

// Default configuration values
export const defaultConfig: Config = {
  api: {
    host: 'localhost',
    port: 1234,
    endpoint: '/v1/chat/completions',
    model: 'local-model',
    timeout: 30000,
  },
  cli: {
    dryRun: false,
    interactive: false,
    verbose: true,
    debug: false,
  },
};
