/**
 * Dynamic JSON Schema Generator for Commit Messages
 * Generates schemas that adapt to the number and type of changes
 */

import { GitChangeAnalysis } from '../core/entities/git.js';

export interface DynamicSchemaOptions {
  analysis: GitChangeAnalysis;
  useStructuredOutput?: boolean;
}

/**
 * Generate a dynamic JSON schema based on git change analysis
 */
export function generateDynamicCommitSchema(options: DynamicSchemaOptions): object {
  const { analysis, useStructuredOutput = false } = options;
  const { suggestedBulletPoints, totalChangeCount } = analysis;

  // Base schema structure
  const baseSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "DynamicConventionalCommitMessage",
    "description": `Schema for a conventional Git commit message adapted for ${totalChangeCount} file change(s). Bullet points should appear with a dash in the final text.`,
    "type": "object",
    "properties": {
      "emoji": {
        "description": "A unique emoji representing the type of change.",
        "type": "string",
        "minLength": 1,
        "maxLength": 10,
        "enum": [
          "✨", "🐛", "📚", "💎", "📦", "⚡️", "🧪", "🧹", "🚦", "🏗️",
          "⏪", "🔀", "⬆️", "🔥", "🔒", "🔧", "🌐", "🔖", "🗄️", "♿️",
          "💡", "🎉"
        ]
      },
      "type": {
        "description": "The type of change based on conventional commits.",
        "type": "string",
        "enum": [
          "feat", "fix", "docs", "style", "refactor", "perf", "test", "chore",
          "ci", "build", "revert", "merge", "deps", "breaking", "security",
          "config", "i18n", "release", "db", "a11y", "ux", "init"
        ],
        "minLength": 1
      },
      "scope": {
        "description": "The component or scope affected (e.g., parser, api, auth).",
        "type": "string",
        "minLength": 3
      },
      "subject": {
        "description": "A brief, imperative, present tense summary of the change (max 50 chars recommended but not enforced by schema).",
        "type": "string",
        "minLength": 10
      },
      "body": {
        "description": "The commit message body, providing more detail.",
        "type": "object",
        "properties": {
          "summary": {
            "description": "An extended summary in the body. A paragraph lists the big picture of the changes.",
            "type": "string",
            "minLength": 5
          },
          "bulletPoints": {
            "description": `Bullet points detailing changes. Each string item corresponds to a line that should be prefixed with a dash in the final text output to suit a markdown bullet point (only 1 dash at the start). Provide ${suggestedBulletPoints.min}-${suggestedBulletPoints.max} bullet points based on the ${totalChangeCount} file change(s).`,
            "type": "array",
            "items": {
              "type": "string",
              "maxLength": 100
            },
            "minItems": suggestedBulletPoints.min,
            "maxItems": suggestedBulletPoints.max
          }
        },
        "required": ["summary", "bulletPoints"],
        "additionalProperties": false
      }
    },
    "required": ["emoji", "type", "scope", "subject", "body"],
    "additionalProperties": false
  };

  // If using structured output (for LM Studio or similar), wrap in response_format
  if (useStructuredOutput) {
    return {
      "type": "json_schema",
      "json_schema": {
        "name": "dynamic_commit_response",
        "strict": true,
        "schema": baseSchema
      }
    };
  }

  return baseSchema;
}

/**
 * Generate contextual instructions for the AI based on change analysis
 */
export function generateContextualInstructions(analysis: GitChangeAnalysis): string {
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

  return `
IMPORTANT: This commit involves ${changeDescription}. 

For the bulletPoints field:
- Provide exactly ${suggestedBulletPoints.min} to ${suggestedBulletPoints.max} bullet points
- Each bullet point should correspond to a specific change or group of related changes
- Be concise but specific about what changed
- Focus on the most important changes if there are many files
- Use imperative mood consistently (e.g., "add", "update", "remove")

Examples of good bullet points for this type of change:
${generateExampleBulletPoints(analysis)}`;
}

/**
 * Generate example bullet points based on change analysis
 */
function generateExampleBulletPoints(analysis: GitChangeAnalysis): string {
  const { addedFileCount, modifiedFileCount, deletedFileCount } = analysis;
  const examples: string[] = [];

  if (addedFileCount > 0) {
    examples.push("- Add new authentication middleware for API routes");
    examples.push("- Implement user profile validation schema");
  }
  
  if (modifiedFileCount > 0) {
    examples.push("- Update database connection configuration");
    examples.push("- Refactor error handling in user service");
  }
  
  if (deletedFileCount > 0) {
    examples.push("- Remove deprecated utility functions");
    examples.push("- Clean up unused test fixtures");
  }

  // If no specific changes, provide generic examples
  if (examples.length === 0) {
    examples.push("- Update component props interface");
    examples.push("- Fix memory leak in event listeners");
    examples.push("- Add comprehensive error handling");
  }

  return examples.slice(0, 3).join('\n');
}

/**
 * Get a human-readable description of the change analysis
 */
export function getChangeAnalysisDescription(analysis: GitChangeAnalysis): string {
  const { totalChangeCount, addedFileCount, modifiedFileCount, deletedFileCount, suggestedBulletPoints } = analysis;
  
  return `Change Analysis:
- Total files: ${totalChangeCount}
- Added: ${addedFileCount}, Modified: ${modifiedFileCount}, Deleted: ${deletedFileCount}
- Suggested bullet points: ${suggestedBulletPoints.min}-${suggestedBulletPoints.max}`;
} 