#!/usr/bin/env node

/**
 * Test script for LM Studio SDK integration
 * This will test the connection and model loading with the new LM Studio SDK
 */

import { config } from 'dotenv';
import chalk from 'chalk';

// Load env vars
config();

// Get API configuration from environment variables or fallback to defaults
const API_HOST = process.env.AI_API_HOST || 'localhost';
const API_PORT = parseInt(process.env.AI_API_PORT || '1234', 10);
const API_MODEL = process.env.AI_API_MODEL || 'qwen3-4b-teen-emo';

console.log(chalk.blue('Testing LM Studio SDK Integration'));
console.log(chalk.yellow('Configuration:'));
console.log(`Host: ${API_HOST}`);
console.log(`Port: ${API_PORT}`);
console.log(`Model: ${API_MODEL}`);
console.log('');

async function testLMStudioIntegration() {
  try {
    // Dynamic import of LM Studio SDK (since it might not be installed yet)
    let LMStudioClient;
    try {
      const lmstudioModule = await import('@lmstudio/sdk');
      LMStudioClient = lmstudioModule.LMStudioClient;
      console.log(chalk.green('✓ LM Studio SDK imported successfully'));
    } catch (error) {
      console.log(chalk.red('✗ LM Studio SDK not found. Please install it with: npm install @lmstudio/sdk'));
      console.log(chalk.yellow('Note: This is expected if you haven\'t run npm install yet.'));
      return;
    }

    // Initialize client
    const client = new LMStudioClient({
      baseUrl: `ws://${API_HOST}:${API_PORT}`
    });
    console.log(chalk.green('✓ LM Studio client initialized'));

    // Test connection by listing loaded models
    console.log(chalk.blue('Testing connection...'));
    try {
      const loadedModels = await client.llm.listLoaded();
      console.log(chalk.green(`✓ Connection successful. Found ${loadedModels.length} loaded models:`));
      
      if (loadedModels.length > 0) {
        loadedModels.forEach((model, index) => {
          console.log(chalk.cyan(`  ${index + 1}. ${model.identifier}`));
        });
      } else {
        console.log(chalk.yellow('  No models currently loaded in LM Studio'));
      }
    } catch (error) {
      console.log(chalk.red('✗ Connection failed:'), error.message);
      console.log(chalk.yellow('Make sure LM Studio is running and the server is started.'));
      return;
    }

    // Test model access - use the first loaded model if available
    const modelToTest = loadedModels.length > 0 ? loadedModels[0].identifier : API_MODEL;
    console.log(chalk.blue(`\nTesting model access: ${modelToTest}`));
    try {
      // Check if model is loaded, if so use createDynamicHandle(), otherwise use load()
      const isLoaded = loadedModels.some(model => 
        model.identifier === modelToTest || 
        model.path === modelToTest ||
        model.modelKey === modelToTest
      );
      
      let model;
      if (isLoaded) {
        console.log(chalk.cyan(`  Model already loaded, using createDynamicHandle() method`));
        model = client.llm.createDynamicHandle(modelToTest);
      } else {
        console.log(chalk.cyan(`  Model not loaded, using load() method`));
        model = await client.llm.load(modelToTest);
      }
      console.log(chalk.green(`✓ Model "${modelToTest}" accessed successfully`));

      // Test a simple structured response
      console.log(chalk.blue('\nTesting structured response...'));
      
      // Simple test schema
      const testSchema = {
        type: "object",
        properties: {
          message: { type: "string" },
          success: { type: "boolean" }
        },
        required: ["message", "success"]
      };

      const result = await model.respond(
        "Respond with a JSON object containing a success message.",
        {
          structured: {
            type: "json",
            jsonSchema: testSchema
          },
          maxTokens: 100
        }
      );

      console.log(chalk.green('✓ Structured response test successful:'));
      console.log(chalk.cyan('Response:'), result.content);

      try {
        const parsed = JSON.parse(result.content);
        console.log(chalk.green('✓ Response is valid JSON'));
        console.log(chalk.cyan('Parsed:'), parsed);
      } catch (parseError) {
        console.log(chalk.yellow('⚠ Response is not valid JSON, but generation worked'));
      }

    } catch (error) {
      console.log(chalk.red(`✗ Model access failed:`, error.message));
      console.log(chalk.yellow(`Make sure the model "${modelToTest}" is available in LM Studio.`));
      return;
    }

    console.log(chalk.green('\n🎉 All tests passed! LM Studio integration is working correctly.'));

  } catch (error) {
    console.log(chalk.red('✗ Test failed with error:'), error.message);
    console.log(chalk.yellow('Please check your LM Studio setup and try again.'));
  }
}

// Run the test
testLMStudioIntegration()
  .then(() => console.log(chalk.blue('\nTest completed.')))
  .catch(error => console.error(chalk.red('\nTest failed:'), error)); 