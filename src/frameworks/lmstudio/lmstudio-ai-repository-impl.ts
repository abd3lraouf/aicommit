import { LMStudioClient } from '@lmstudio/sdk';
import { z } from 'zod';
import { AIRepository } from '../../core/repositories/ai-repository.js';
import { GitChangeAnalysis } from '../../core/entities/git.js';
import { debugLog } from '../cli/debug.js';
import { getApiConfig } from '../../config/index.js';
import { createAIError } from '../../core/errors/ai-errors.js';
import { LMStudioClientManager } from './lmstudio-client-manager.js';

// Zod schema for the commit message structure
const commitMessageSchema = z.object({
  emoji: z.string().min(1).max(10),
  type: z.enum([
    'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore',
    'ci', 'build', 'revert', 'merge', 'deps', 'breaking', 'security',
    'config', 'i18n', 'release', 'db', 'a11y', 'ux', 'init'
  ]),
  scope: z.string().min(3),
  subject: z.string().min(10).max(100),
  body: z.object({
    summary: z.string().min(5).max(500),
    bulletPoints: z.array(z.string().min(1).max(100)).min(1).max(8)
  })
});

type CommitMessage = z.infer<typeof commitMessageSchema>;

export class LMStudioAIRepositoryImpl implements AIRepository {
  private clientManager: LMStudioClientManager;

  constructor() {
    const apiConfig = getApiConfig();
    
    // Initialize LM Studio client manager
    this.clientManager = new LMStudioClientManager({
      host: apiConfig.host,
      port: apiConfig.port,
      model: apiConfig.model,
      timeout: apiConfig.timeout
    });
    
    debugLog('LMStudio', `Initialized LM Studio AI repository with model: ${apiConfig.model}`);
  }

  async generateCommitMessage(prompt: string, analysis?: GitChangeAnalysis): Promise<string> {
    debugLog('LMStudio', 'Generating commit message using LM Studio SDK');
    
    if (analysis) {
      debugLog('LMStudio', 'Using dynamic schema based on change analysis');
      debugLog('LMStudio', `Change analysis: ${analysis.totalChangeCount} files, ${analysis.suggestedBulletPoints.min}-${analysis.suggestedBulletPoints.max} bullet points`);
    }

    try {
      // Ensure connection and model are loaded
      await this.clientManager.checkConnection();
      const model = await this.clientManager.ensureModelLoaded();
      debugLog('LMStudio', `Successfully loaded model: ${this.clientManager.getConfig().model}`);

      // Create dynamic schema based on analysis
      const dynamicSchema = this.createDynamicSchema(analysis);
      
      // Generate system prompt
      const systemPrompt = this.createSystemPrompt(analysis);
      
      // Generate user prompt
      const userPrompt = `Analyze this git diff and generate a conventional commit message:\n\n\`\`\`diff\n${prompt}\n\`\`\``;

      debugLog('LMStudio', 'Making structured prediction request');
      debugLog('LMStudio', `System prompt length: ${systemPrompt.length} characters`);
      debugLog('LMStudio', `User prompt length: ${userPrompt.length} characters`);

      // Use structured output with the dynamic schema
      const result = await model.respond(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        {
          structured: dynamicSchema,
          maxTokens: 2000, // Prevent infinite generation
          temperature: 0.7,
          topP: 0.9
        }
      );

      debugLog('LMStudio', 'Successfully received structured response');
      
      // The result.parsed contains the validated and typed commit message
      const commitContent = result.parsed as CommitMessage;
      
      // Format the commit message
      const formattedMessage = this.formatCommitMessage(commitContent);
      
      debugLog('LMStudio', 'Generated commit message', formattedMessage);
      return formattedMessage;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog('LMStudio', 'Error generating commit message', errorMessage);
      
      const config = this.clientManager.getConfig();
      const aiError = createAIError(error, {
        modelName: config.model,
        host: config.host,
        port: config.port,
        timeout: config.timeout
      });
      
      throw aiError;
    }
  }

  private createDynamicSchema(analysis?: GitChangeAnalysis): typeof commitMessageSchema {
    if (!analysis) {
      return commitMessageSchema;
    }

    // Create a dynamic schema based on the change analysis
    const dynamicBulletPointsSchema = z.array(z.string().min(1).max(100))
      .min(analysis.suggestedBulletPoints.min)
      .max(analysis.suggestedBulletPoints.max);

    return z.object({
      emoji: z.string().min(1).max(10),
      type: z.enum([
        'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore',
        'ci', 'build', 'revert', 'merge', 'deps', 'breaking', 'security',
        'config', 'i18n', 'release', 'db', 'a11y', 'ux', 'init'
      ]),
      scope: z.string().min(3),
      subject: z.string().min(10).max(100),
      body: z.object({
        summary: z.string().min(5).max(500),
        bulletPoints: dynamicBulletPointsSchema
      })
    });
  }

  private createSystemPrompt(analysis?: GitChangeAnalysis): string {
    let contextualInstructions = '';
    
    if (analysis) {
      const { totalChangeCount, addedFileCount, modifiedFileCount, deletedFileCount, suggestedBulletPoints } = analysis;
      
      let changeDescription = "";
      if (addedFileCount > 0 && modifiedFileCount > 0 && deletedFileCount > 0) {
        changeDescription = `${addedFileCount} added, ${modifiedFileCount} modified, and ${deletedFileCount} deleted files`;
      } else if (addedFileCount > 0 && modifiedFileCount > 0) {
        changeDescription = `${addedFileCount} added and ${modifiedFileCount} modified files`;
      } else if (modifiedFileCount > 0 && deletedFileCount > 0) {
        changeDescription = `${modifiedFileCount} modified and ${deletedFileCount} deleted files`;
      } else if (addedFileCount > 0) {
        changeDescription = `${addedFileCount} new file${addedFileCount > 1 ? 's' : ''}`;
      } else if (modifiedFileCount > 0) {
        changeDescription = `${modifiedFileCount} modified file${modifiedFileCount > 1 ? 's' : ''}`;
      } else if (deletedFileCount > 0) {
        changeDescription = `${deletedFileCount} deleted file${deletedFileCount > 1 ? 's' : ''}`;
      } else {
        changeDescription = `${totalChangeCount} file change${totalChangeCount > 1 ? 's' : ''}`;
      }

      contextualInstructions = `
IMPORTANT: This commit involves ${changeDescription}.
For the bulletPoints field:
- Provide exactly ${suggestedBulletPoints.min} to ${suggestedBulletPoints.max} bullet points
- Each bullet point should correspond to a specific change or group of related changes
- Be concise but specific about what changed
- Focus on the most important changes if there are many files
- Use imperative mood consistently (e.g., "add", "update", "remove")`;
    }

    return `You are an AI designed to analyze git diffs and generate conventional commit messages in a structured JSON format. Your response will be automatically validated against a strict schema.

${contextualInstructions}

Follow the Conventional Commits specification (conventionalcommits.org):

1. **emoji**: Select a single emoji that corresponds to the commit type:
   - ✨ for feat (new features)
   - 🐛 for fix (bug fixes)
   - 📝 for docs (documentation)
   - 💄 for style (formatting, styling)
   - ♻️ for refactor (code restructuring)
   - ⚡ for perf (performance improvements)
   - ✅ for test (adding tests)
   - 🔧 for chore (maintenance)
   - 👷 for ci (CI/CD changes)
   - 🏗️ for build (build system changes)

2. **type**: Choose the appropriate conventional commit type that matches your emoji selection.

3. **scope**: Identify the component or area affected (minimum 3 characters, e.g., 'api', 'auth', 'ui').

4. **subject**: Write a brief description using:
   - Imperative, present tense (e.g., "add" not "added")
   - No capitalization of first letter
   - No period at the end
   - 10-100 characters

5. **body.summary**: Provide a high-level overview (5-500 characters):
   - Focus on "why" this change matters
   - Use imperative mood
   - Avoid technical jargon
   - One clear sentence

6. **body.bulletPoints**: List specific changes:
   - Use imperative mood consistently
   - Be specific about what changed
   - Each point should be 1-100 characters
   - Focus on the most important changes

The response will be validated against a strict schema, so ensure all fields are properly formatted and within the specified constraints.`;
  }

  private formatCommitMessage(content: CommitMessage): string {
    const scope = content.scope ? `(${content.scope})` : '';
    const headline = `${content.emoji} ${content.type}${scope}: ${content.subject}`;
    
    // Format the body summary
    const summary = content.body.summary || '';
    
    // Format the bullet points
    const bulletPoints = content.body.bulletPoints
      .map(point => `- ${point}`)
      .join('\n');
    
    return `${headline}\n\n${summary}\n\n${bulletPoints}`;
  }
} 