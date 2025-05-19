#!/usr/bin/env node

/**
 * Test script for API integration
 * This will simulate a git diff and call the API to generate a commit message
 */

import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load env vars
config();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get API configuration from environment variables or fallback to defaults
const API_HOST = process.env.AI_API_HOST || 'localhost';
const API_PORT = parseInt(process.env.AI_API_PORT || '1234', 10);
const API_ENDPOINT = process.env.AI_API_ENDPOINT || '/v1/chat/completions';
const API_MODEL = process.env.AI_API_MODEL || 'Qwen/Qwen3-4B';
const API_TIMEOUT = parseInt(process.env.AI_API_TIMEOUT || '30000', 10);

// Log the configuration being used
console.log('Using API configuration:');
console.log(`Host: ${API_HOST}`);
console.log(`Port: ${API_PORT}`);
console.log(`Endpoint: ${API_ENDPOINT}`);
console.log(`Model: ${API_MODEL}`);
console.log(`Timeout: ${API_TIMEOUT}ms`);

// Sample git diff for testing
const sampleDiff = `
diff --git a/src/frameworks/default-ai/default-ai-repository-impl.ts b/src/frameworks/default-ai/default-ai-repository-impl.ts
index 1234567..89abcdef 100644
--- a/src/frameworks/default-ai/default-ai-repository-impl.ts
+++ b/src/frameworks/default-ai/default-ai-repository-impl.ts
@@ -1,10 +1,18 @@
/**
 * Default AI repository implementation that generates commit messages
 * by calling a local API server
 */

import * as http from 'http';
import { AIRepository } from '../../core/repositories/ai-repository';
import { debugLog } from '../cli/debug';

+// Interface for commit message in JSON format
+interface CommitMessageResponse {
+  id: string;
+  object: string;
+  created: number;
+  model: string;
+  choices: Array<{
+    index: number;
+    logprobs: null;
+    finish_reason: string;
+    message: {
+      role: string;
+      content: string;
+    }
+  }>;
+  usage: {
+    prompt_tokens: number;
+    completion_tokens: number;
+    total_tokens: number;
+  };
+  stats: Record<string, unknown>;
+  system_fingerprint: string;
+}`;

// Try to load the JSON schema
let schemaContent = '';
try {
  const schemaPath = path.join(process.cwd(), 'src/schemas/commit-message-schema.json');
  if (fs.existsSync(schemaPath)) {
    schemaContent = fs.readFileSync(schemaPath, 'utf8');
    console.log('Loaded JSON schema from file');
  } else {
    console.log('Schema file not found at:', schemaPath);
  }
} catch (error) {
  console.error('Error loading schema file:', error);
}

// Function to test the API integration
async function testApiIntegration() {
  console.log(`Testing API integration with server at http://${API_HOST}:${API_PORT}${API_ENDPOINT}`);
  
  const postData = JSON.stringify({
    model: API_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an AI designed to analyze git diffs and generate content for a conventional commit message JSON object. Your output MUST be a JSON object conforming to the schema enforced by the server. Based on the provided git diff, analyze the changes and provide the content for the JSON fields according to these rules, following the Conventional Commits specification (conventionalcommits.org):

1. For the \`type\` field, choose one of the following:
   - feat: A new feature
   - fix: A bug fix
   - docs: Documentation only changes
   - style: Changes that do not affect the meaning of the code
   - refactor: A code change that neither fixes a bug nor adds a feature
   - perf: A code change that improves performance
   - test: Adding missing or correcting existing tests
   - chore: Changes to the build process or auxiliary tools
   - ci: Continuous integration changes
   - build: Changes to the build process
   - revert: Revert changes
   - merge: Merge branches
   - deps: Update dependencies
   - breaking: Breaking changes
   - security: Security fixes
   - config: Configuration changes
   - i18n: Internationalization changes
   - release: Release changes
   - db: Database changes
   - a11y: Accessibility changes
   - ux: User experience changes
   - init: Initial commit

2. For the \`emoji\` field, select a single emoji that conventionally corresponds to the chosen \`type\` (e.g., ✨ for feat, 🐛 for fix, 📚 for docs).

3. For the \`scope\` field, identify the component affected and provide its name in lowercase (e.g., 'api', 'auth').

4. For the \`subject\` field (description):
   - Use imperative, present tense (e.g., "add" not "added" or "adds")
   - Don't capitalize the first letter
   - No period at the end
   - Keep it under 50 characters.

5. For the \`body.summary\` field (high-level overview paragraph):
   - Provide a single paragraph giving a high-level context about the change.
   - Focus on "why" this change matters and its overall impact.
   - Keep this short but informative (aim for one sentence).
   - Use imperative mood consistently.
   - Avoid jargon or overly technical terms.
   - Use clear and concise language.
   - Avoid using "we" or "I" - focus on the change itself.

6. For the \`body.bulletPoints\` field (detailed changes):
   - Provide an array of strings.
   - Each string in the array should be the content of a specific change point.
   - When this JSON is rendered into a text commit message, each of these strings will be prefixed with a hyphen (-) and a space to form a bullet point.
   - Be specific about what changed.
   - Use imperative mood consistently.
   - Provide content for at least one bullet point.

${schemaContent ? `Here is the JSON schema that your response must conform to:\n\n${schemaContent}\n\n` : ''}

Analyze the following git diff and provide the content for the commit message JSON object. Generate ONLY the JSON object.`
      },
      {
        role: "user",
        content: `Analyze this git diff:\n\n\`\`\`diff\n${sampleDiff}\n\`\`\`\n`
      }
    ],
    temperature: 0.8,
    max_tokens: 20000,
    stream: false
  });
  
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: API_ENDPOINT,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: API_TIMEOUT
  };
  
  return new Promise((resolve, reject) => {
    console.log(`Sending request to: http://${API_HOST}:${API_PORT}${API_ENDPOINT}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log('API Response Status:', res.statusCode);
          console.log('\nAPI Response:');
          console.log(JSON.stringify(response, null, 2));
          
          // Extract and parse the JSON content from the response
          const content = response.choices[0]?.message?.content;
          if (content) {
            console.log('\nParsed Commit Content:');
            try {
              const commitContent = JSON.parse(content);
              console.log(JSON.stringify(commitContent, null, 2));
              
              // Format the commit message
              const scope = commitContent.scope ? `(${commitContent.scope})` : '';
              const headline = `${commitContent.emoji} ${commitContent.type}${scope}: ${commitContent.subject}`;
              const summary = commitContent.body.summary || '';
              const bulletPoints = commitContent.body.bulletPoints
                .map(point => `- ${point}`)
                .join('\n');
              
              const formattedMessage = `${headline}\n\n${summary}\n\n${bulletPoints}`;
              
              console.log('\nFormatted Commit Message:');
              console.log(formattedMessage);
            } catch (parseError) {
              console.error('Error parsing commit content as JSON:', parseError);
              console.log('Raw content received:', content);
            }
          } else {
            console.error('No content found in API response');
          }
          
          resolve(true);
        } catch (error) {
          console.error('Error processing response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('API request failed:', error);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error(`Request timed out after ${API_TIMEOUT}ms`);
      req.destroy();
      reject(new Error('Request timed out'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
testApiIntegration()
  .then(() => console.log('\nTest completed successfully'))
  .catch(error => console.error('\nTest failed:', error));
