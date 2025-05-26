/**
 * Default AI repository implementation that generates commit messages
 * by calling a local API server
 */

import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { AIRepository } from '../../core/repositories/ai-repository.js';
import { GitChangeAnalysis } from '../../core/entities/git.js';
import { generateDynamicCommitSchema, generateContextualInstructions, getChangeAnalysisDescription } from '../../schemas/dynamic-schema-generator.js';
import { generateDynamicCommitGrammar, generateGBNFContextualInstructions, getGBNFGrammarDescription } from '../../schemas/gbnf-grammar-generator.js';
import { debugLog } from '../cli/debug.js';
import { styles } from '../cli/styles.js';
import { getApiConfig } from '../../config/index.js';

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
   * @param analysis Optional git change analysis for dynamic schema generation
   * @returns A conventional commit message
   */
  async generateCommitMessage(prompt: string, analysis?: GitChangeAnalysis): Promise<string> {
    debugLog('DefaultAI', 'Generating commit message from git changes');
    
    if (analysis) {
      debugLog('DefaultAI', 'Using dynamic schema based on change analysis');
      debugLog('DefaultAI', getChangeAnalysisDescription(analysis));
    }
    
    try {
      // Call the API with optional analysis
      const jsonResponse = await this.callCommitApi(prompt, analysis);
      
      // Extract the commit content from the response
      const commitContent = this.parseResponse(jsonResponse);
      
      // Format the commit message for git
      const message = this.formatCommitMessage(commitContent);
      
      debugLog('DefaultAI', 'Generated commit message', message);
      return message;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog('DefaultAI', 'Error generating commit message', errorMessage);
      // Instead of returning a fallback message, throw the error to halt execution
      throw new Error(`API Error: Failed to generate commit message. ${errorMessage}`);
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
  private async callCommitApi(prompt: string, analysis?: GitChangeAnalysis): Promise<CommitMessageResponse> {
    return new Promise((resolve, reject) => {
      // Generate GBNF grammar based on analysis or use static grammar
      let grammarString: string;
      let contextualInstructions = '';
      
      if (analysis) {
        // Use dynamic GBNF grammar based on change analysis
        grammarString = generateDynamicCommitGrammar({ analysis });
        contextualInstructions = generateGBNFContextualInstructions(analysis);
        debugLog('DefaultAI', 'Generated dynamic GBNF grammar based on change analysis');
        debugLog('DefaultAI', getGBNFGrammarDescription(analysis));
      } else {
        // Fallback to static GBNF grammar
        grammarString = `# Static GBNF Grammar for Conventional Commit Messages

# Root rule - defines the complete JSON object structure
root ::= "{" space 
  emoji-kv "," space 
  type-kv "," space 
  scope-kv "," space 
  subject-kv "," space 
  body-kv 
"}" space

# Key-value pairs for each field
emoji-kv ::= "\\"emoji\\"" space ":" space emoji-value
type-kv ::= "\\"type\\"" space ":" space type-value
scope-kv ::= "\\"scope\\"" space ":" space scope-value
subject-kv ::= "\\"subject\\"" space ":" space subject-value
body-kv ::= "\\"body\\"" space ":" space body-value

# Emoji field - restricted to conventional commit emojis
emoji-value ::= "\\"" emoji-char "\\"" space
emoji-char ::= "✨" | "🐛" | "📚" | "💎" | "📦" | "⚡️" | "🧪" | "🧹" | "🚦" | "🏗️" | "⏪" | "🔀" | "⬆️" | "🔥" | "🔒" | "🔧" | "🌐" | "🔖" | "🗄️" | "♿️" | "💡" | "🎉"

# Type field - conventional commit types
type-value ::= "\\"" type-enum "\\"" space
type-enum ::= "feat" | "fix" | "docs" | "style" | "refactor" | "perf" | "test" | "chore" | "ci" | "build" | "revert" | "merge" | "deps" | "breaking" | "security" | "config" | "i18n" | "release" | "db" | "a11y" | "ux" | "init"

# Scope field - component or area affected (3+ chars)
scope-value ::= "\\"" scope-text "\\"" space
scope-text ::= scope-char scope-char scope-char scope-char*
scope-char ::= [a-zA-Z0-9_-]

# Subject field - brief description (10+ chars)
subject-value ::= "\\"" subject-text "\\"" space
subject-text ::= subject-char{10,100}
subject-char ::= [^"\\\\\\x00-\\x1F] | "\\\\" ("\\"" | "\\\\\\\\" | "b" | "f" | "n" | "r" | "t" | "u" [0-9a-fA-F]{4})

# Body object containing summary and bulletPoints
body-value ::= "{" space 
  summary-kv "," space 
  bullet-points-kv 
"}" space

# Summary field - extended description (5+ chars)
summary-kv ::= "\\"summary\\"" space ":" space summary-value
summary-value ::= "\\"" summary-text "\\"" space
summary-text ::= summary-char{5,500}
summary-char ::= [^"\\\\\\x00-\\x1F] | "\\\\" ("\\"" | "\\\\\\\\" | "b" | "f" | "n" | "r" | "t" | "u" [0-9a-fA-F]{4})

# Bullet points array - static 1-5 items for fallback
bullet-points-kv ::= "\\"bulletPoints\\"" space ":" space bullet-points-array
bullet-points-array ::= "[" space bullet-points-items "]" space
bullet-points-items ::= bullet-point-item ("," space bullet-point-item){0,4}

# Individual bullet point item
bullet-point-item ::= "\\"" bullet-point-text "\\"" space
bullet-point-text ::= bullet-char{1,100}
bullet-char ::= [^"\\\\\\x00-\\x1F] | "\\\\" ("\\"" | "\\\\\\\\" | "b" | "f" | "n" | "r" | "t" | "u" [0-9a-fA-F]{4})

# Whitespace handling
space ::= [ \\t\\n]*`;
        
        contextualInstructions = `You are an AI designed to analyze git diffs and generate a conventional commit message in JSON format. Your output will be constrained by a GBNF grammar that enforces the correct structure and field constraints.

IMPORTANT CONSTRAINTS (enforced by grammar):
- emoji: Must be one of the predefined conventional commit emojis
- type: Must be a valid conventional commit type (feat, fix, docs, etc.)
- scope: Must be at least 3 characters, alphanumeric with dashes/underscores
- subject: Must be 10-100 characters, imperative present tense
- body.summary: Must be 5-500 characters, high-level overview
- body.bulletPoints: Must contain 1-5 items, each 1-100 characters

The grammar will automatically enforce JSON structure and field constraints. Focus on providing meaningful, accurate content that describes the changes.`;
        
        debugLog('DefaultAI', 'Using static GBNF grammar (no change analysis provided)');
      }
      
      // Create the system prompt
      const systemPrompt = `${contextualInstructions}

Follow the Conventional Commits specification (conventionalcommits.org) when generating the JSON content:

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

Analyze the following git diff and provide the content for the commit message JSON object. Your response will be automatically constrained by the GBNF grammar to ensure proper structure and field validation.`;
      
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
        max_tokens: 20000,
        stream: false,
        grammar: grammarString
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
          stream: parsedPostData.stream,
          grammar: parsedPostData.grammar ? 'GBNF grammar provided' : 'No grammar'
        }
      }, 'api');
      
      // Log the GBNF grammar in debug mode (truncated for readability)
      if (parsedPostData.grammar) {
        debugLog('DefaultAI', 'GBNF Grammar (first 500 chars):', parsedPostData.grammar.substring(0, 500) + '...', 'api');
      }
      
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
            reject(new Error(`Failed to parse API response: ${errorMessage}. The API might have returned an invalid JSON format.`));
          }
        });
      });
      
      req.on('error', (e) => {
        reject(new Error(`API request failed: ${e.message}. Please check your API configuration and ensure the server is running.`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`API request timed out after ${this.apiTimeout}ms. Please verify your API server is responsive or increase the timeout value.`));
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
        throw new Error('Invalid API response format: No content found in the response. The API may not have generated any content.');
      }
      
      // Clean the content to extract JSON from markdown code blocks
      let cleanedContent = content.trim();
      
      // Remove markdown code block markers if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing whitespace
      cleanedContent = cleanedContent.trim();
      
      // Additional fallback: if content still doesn't start with {, try to find the first JSON object
      if (!cleanedContent.startsWith('{')) {
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[0];
          debugLog('DefaultAI', 'Extracted JSON from mixed content using regex fallback');
        }
      }
      
      debugLog('DefaultAI', 'Cleaned content for parsing:', cleanedContent.substring(0, 200) + '...');
      
      // Parse the JSON content
      try {
        const parsedContent = JSON.parse(cleanedContent);
        
        // Transform flat structure to nested structure if needed
        // Handle case where AI generates "body.summary" and "body.bulletPoints" as flat keys
        if (parsedContent['body.summary'] || parsedContent['body.bulletPoints']) {
          debugLog('DefaultAI', 'Detected flat body structure, transforming to nested structure');
          
          const transformedContent: CommitContent = {
            emoji: parsedContent.emoji,
            type: parsedContent.type,
            scope: parsedContent.scope || '',
            subject: parsedContent.subject,
            body: {
              summary: parsedContent['body.summary'] || '',
              bulletPoints: parsedContent['body.bulletPoints'] || []
            }
          };
          
          debugLog('DefaultAI', 'Transformed content structure:', transformedContent);
          return transformedContent;
        }
        
        // Return as-is if already in correct nested structure
        return parsedContent as CommitContent;
      } catch (parseError) {
        // Provide more detailed error for JSON parsing issues
        debugLog('DefaultAI', 'JSON parse error:', parseError);
        debugLog('DefaultAI', 'Original content:', content);
        debugLog('DefaultAI', 'Cleaned content:', cleanedContent);
        throw new Error(`Failed to parse JSON from API response. The API returned non-JSON content: ${content.substring(0, 100)}...`);
      }
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
