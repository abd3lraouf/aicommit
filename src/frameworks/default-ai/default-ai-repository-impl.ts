/**
 * Default AI repository implementation that generates commit messages
 * by calling a local API server
 */

import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { AIRepository } from '../../core/repositories/ai-repository';
import { debugLog } from '../cli/debug';
import { styles } from '../cli/styles';
import { getApiConfig } from '../../config';

// Interface for commit message in JSON format
interface CommitMessageResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    logprobs: null;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    }
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  stats: Record<string, unknown>;
  system_fingerprint: string;
}

// Interface for the parsed JSON content in the response
interface CommitContent {
  emoji: string;
  type: string;
  scope: string;
  subject: string;
  body: {
    summary: string;
    bulletPoints: string[];
  };
}

export class DefaultAIRepositoryImpl implements AIRepository {
  private apiHost: string;
  private apiPort: number;
  private apiEndpoint: string;
  private apiModel: string;
  private apiTimeout: number;
  
  constructor() {
    // Load configuration from the config system
    const apiConfig = getApiConfig();
    
    this.apiHost = apiConfig.host;
    this.apiPort = apiConfig.port;
    this.apiEndpoint = apiConfig.endpoint;
    this.apiModel = apiConfig.model;
    this.apiTimeout = apiConfig.timeout;
    
    debugLog('DefaultAI', `API configured: http://${this.apiHost}:${this.apiPort}${this.apiEndpoint}`);
  }
  
  /**
   * Generate a commit message by calling the API
   * @param prompt The prompt containing git status and diff information
   * @returns A conventional commit message
   */
  async generateCommitMessage(prompt: string): Promise<string> {
    debugLog('DefaultAI', 'Generating commit message from git changes');
    
    try {
      // Call the API
      const jsonResponse = await this.callCommitApi(prompt);
      
      // Extract the commit content from the response
      const commitContent = this.parseResponse(jsonResponse);
      
      // Format the commit message for git
      const message = this.formatCommitMessage(commitContent);
      
      debugLog('DefaultAI', 'Generated commit message', message);
      return message;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog('DefaultAI', 'Error generating commit message', errorMessage);
      return 'chore: update project files';
    }
  }
  
  /**
   * Estimate the token count of a string
   * This is a very rough estimate based on 4 characters ~= 1 token
   * @param text The text to estimate token count for
   * @returns Estimated token count
   */
  private estimateTokenCount(text: string): number {
    // A very simple estimation: ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Call the API to generate a commit message
   */
  private async callCommitApi(prompt: string): Promise<CommitMessageResponse> {
    return new Promise((resolve, reject) => {
      // Load the schema content
      const schemaPath = path.join(__dirname, '../../schemas/commit-message-schema.json');
      let schemaContent = '';
      
      try {
        if (fs.existsSync(schemaPath)) {
          schemaContent = fs.readFileSync(schemaPath, 'utf8');
          debugLog('DefaultAI', 'Loaded JSON schema from file');
        } else {
          debugLog('DefaultAI', 'Schema file not found at:', schemaPath);
        }
      } catch (error) {
        debugLog('DefaultAI', 'Error loading schema file:', error);
      }
      
      // Create the system prompt
      const systemPrompt = `You are an AI designed to analyze git diffs and generate content for a conventional commit message JSON object. Your output MUST be a JSON object conforming to the schema enforced by the server. Based on the provided git diff, analyze the changes and provide the content for the JSON fields according to these rules, following the Conventional Commits specification (conventionalcommits.org):

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
   - Avoid using "this commit" or "this change" - focus on the change itself.
   - Avoid using "fixes" or "resolves" - focus on the change itself.

6. For the \`body.bulletPoints\` field (detailed changes):
   - Provide an array of strings.
   - Each string in the array should be the content of a specific change point.
   - When this JSON is rendered into a text commit message, each of these strings will be prefixed with a hyphen (-) and a space to form a bullet point.
   - Be specific about what changed.
   - Use imperative mood consistently.
   - Provide content for at least one bullet point.

7. For breaking changes:
   - If the change is breaking, ensure the \`type\` is \`breaking\` or append \`!\` after the subject in the conceptual header (which will be reflected in the \`subject\` field content or possibly noted in the \`body.summary\`). Clearly state the breaking nature in the \`subject\` or \`body.summary\`.

${schemaContent ? `Here is the JSON schema that your response must conform to:\n\n${schemaContent}\n\n` : ''}

Analyze the following git diff and provide the content for the commit message JSON object. Generate ONLY the JSON object.`;
      
      const postData = JSON.stringify({
        model: this.apiModel,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Analyze this git diff:\n\n\`\`\`diff\n${prompt}\n\`\`\`\n`
          }
        ],
        temperature: 0.8,
        max_tokens: 8000,
        stream: false
      });
      
      const options = {
        hostname: this.apiHost,
        port: this.apiPort,
        path: this.apiEndpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: this.apiTimeout
      };
      
      // Estimate and log token count when debug is enabled
      const estimatedSystemTokens = this.estimateTokenCount(systemPrompt);
      const estimatedUserTokens = this.estimateTokenCount(prompt);
      const estimatedTotalTokens = estimatedSystemTokens + estimatedUserTokens;
      
      debugLog('DefaultAI', `Making API request to: http://${this.apiHost}:${this.apiPort}${this.apiEndpoint}`);
      debugLog('DefaultAI', 'Estimated token count:', {
        system_prompt: estimatedSystemTokens,
        user_prompt: estimatedUserTokens,
        total: estimatedTotalTokens
      });
      
      // Parse the post data to access and log the full messages
      const parsedPostData = JSON.parse(postData);
      
      // Log the full request payload in debug mode
      debugLog('DefaultAI', 'API request payload:', {
        method: options.method,
        url: `http://${this.apiHost}:${this.apiPort}${this.apiEndpoint}`,
        headers: options.headers,
        body: {
          model: parsedPostData.model,
          messages: parsedPostData.messages, // This will fully expand the messages array
          temperature: parsedPostData.temperature,
          max_tokens: parsedPostData.max_tokens,
          stream: parsedPostData.stream
        }
      }, 'api');
      
      // Add a visual separator in debug logs
      debugLog('DefaultAI', styles.debugSeparator());
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(data);
            
            // Log token usage information when debug is enabled
            if (jsonResponse.usage) {
              debugLog('DefaultAI', 'Token usage:', {
                prompt_tokens: jsonResponse.usage.prompt_tokens,
                completion_tokens: jsonResponse.usage.completion_tokens,
                total_tokens: jsonResponse.usage.total_tokens
              });
            }
            
            // Log the API response in debug mode with full content
            debugLog('DefaultAI', 'API response:', {
              id: jsonResponse.id,
              object: jsonResponse.object,
              created: jsonResponse.created,
              model: jsonResponse.model,
              choices: jsonResponse.choices,
              usage: jsonResponse.usage,
              system_fingerprint: jsonResponse.system_fingerprint
            }, 'api');
            
            // Add a visual separator after API response
            debugLog('DefaultAI', styles.debugSeparator());
            
            resolve(jsonResponse);
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            reject(new Error(`Failed to parse API response: ${errorMessage}`));
          }
        });
      });
      
      req.on('error', (e) => {
        reject(new Error(`API request failed: ${e.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`API request timed out after ${this.apiTimeout}ms`));
      });
      
      req.write(postData);
      req.end();
    });
  }
  
  /**
   * Parse the API response and extract the commit content
   */
  private parseResponse(response: CommitMessageResponse): CommitContent {
    try {
      // Extract the content from the first choice
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Invalid API response format');
      }
      
      // Parse the JSON content
      return JSON.parse(content) as CommitContent;
    } catch (error: unknown) {
      debugLog('DefaultAI', 'Error parsing response', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse commit content: ${errorMessage}`);
    }
  }
  
  /**
   * Format the commit content into a Git commit message
   */
  private formatCommitMessage(content: CommitContent): string {
    // Format the headline
    const scope = content.scope ? `(${content.scope})` : '';
    const headline = `${content.emoji} ${content.type}${scope}: ${content.subject}`;
    
    // Format the body summary
    const summary = content.body.summary || '';
    
    // Format the bullet points
    const bulletPoints = content.body.bulletPoints
      .map(point => `- ${point}`)
      .join('\n');
    
    // Combine everything into a commit message
    return `${headline}\n\n${summary}\n\n${bulletPoints}`;
  }
}
