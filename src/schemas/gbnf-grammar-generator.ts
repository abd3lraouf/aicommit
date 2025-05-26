/**
 * GBNF Grammar Generator for Commit Messages
 * Generates GBNF grammars that adapt to the number and type of changes
 * Following llama.cpp GBNF best practices for structured output
 */

import { GitChangeAnalysis } from '../core/entities/git.js';

export interface GBNFGrammarOptions {
  analysis: GitChangeAnalysis;
}

/**
 * Generate a dynamic GBNF grammar based on git change analysis
 */
export function generateDynamicCommitGrammar(options: GBNFGrammarOptions): string {
  const { analysis } = options;
  const { suggestedBulletPoints } = analysis;

  // Define the root rule that matches the complete JSON structure
  const grammar = `# Dynamic GBNF Grammar for Conventional Commit Messages
# Generated for ${analysis.totalChangeCount} file change(s)
# Expecting ${suggestedBulletPoints.min}-${suggestedBulletPoints.max} bullet points

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

# Bullet points array with dynamic count based on analysis
bullet-points-kv ::= "\\"bulletPoints\\"" space ":" space bullet-points-array
bullet-points-array ::= "[" space bullet-points-items "]" space
${generateBulletPointsRule(suggestedBulletPoints)}

# Individual bullet point item
bullet-point-item ::= "\\"" bullet-point-text "\\"" space
bullet-point-text ::= bullet-char{1,100}
bullet-char ::= [^"\\\\\\x00-\\x1F] | "\\\\" ("\\"" | "\\\\\\\\" | "b" | "f" | "n" | "r" | "t" | "u" [0-9a-fA-F]{4})

# Whitespace handling
space ::= [ \\t\\n]*`;

  return grammar;
}

/**
 * Generate the bullet points rule with dynamic count constraints
 */
function generateBulletPointsRule(suggestedBulletPoints: { min: number; max: number }): string {
  const { min, max } = suggestedBulletPoints;
  
  if (min === max) {
    // Exact count
    if (min === 1) {
      return `bullet-points-items ::= bullet-point-item`;
    } else {
      const items = Array(min).fill('bullet-point-item').join(' "," space ');
      return `bullet-points-items ::= ${items}`;
    }
  } else {
    // Range count - use efficient repetition pattern
    const required = Array(min).fill('bullet-point-item').join(' "," space ');
    const optional = max - min;
    
    if (optional === 0) {
      return `bullet-points-items ::= ${required}`;
    } else if (optional === 1) {
      return `bullet-points-items ::= ${required} ("," space bullet-point-item)?`;
    } else {
      // Use efficient {m,n} syntax for ranges
      return `bullet-points-items ::= bullet-point-item ("," space bullet-point-item){${min-1},${max-1}}`;
    }
  }
}

/**
 * Generate contextual instructions for the AI when using GBNF grammar
 */
export function generateGBNFContextualInstructions(analysis: GitChangeAnalysis): string {
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

  return `You are an AI designed to analyze git diffs and generate a conventional commit message in JSON format. Your output will be constrained by a GBNF grammar that enforces the correct structure and field constraints.

This commit involves ${changeDescription}.

IMPORTANT CONSTRAINTS (enforced by grammar):
- emoji: Must be one of the predefined conventional commit emojis
- type: Must be a valid conventional commit type (feat, fix, docs, etc.)
- scope: Must be at least 3 characters, alphanumeric with dashes/underscores
- subject: Must be 10-100 characters, imperative present tense
- body.summary: Must be 5-500 characters, high-level overview
- body.bulletPoints: Must contain exactly ${suggestedBulletPoints.min}-${suggestedBulletPoints.max} items, each 1-100 characters

BULLET POINTS GUIDANCE:
- Provide exactly ${suggestedBulletPoints.min} to ${suggestedBulletPoints.max} bullet points
- Each bullet point should describe a specific change or group of related changes
- Be concise but specific about what changed
- Use imperative mood (e.g., "add", "update", "remove")
- Focus on the most important changes if there are many files

The grammar will automatically enforce JSON structure and field constraints. Focus on providing meaningful, accurate content that describes the changes.`;
}

/**
 * Get a human-readable description of the GBNF grammar configuration
 */
export function getGBNFGrammarDescription(analysis: GitChangeAnalysis): string {
  const { totalChangeCount, addedFileCount, modifiedFileCount, deletedFileCount, suggestedBulletPoints } = analysis;
  
  return `GBNF Grammar Configuration:
- Total files: ${totalChangeCount}
- Added: ${addedFileCount}, Modified: ${modifiedFileCount}, Deleted: ${deletedFileCount}
- Bullet points constraint: ${suggestedBulletPoints.min}-${suggestedBulletPoints.max} items
- Grammar enforces: JSON structure, field types, length constraints, enum values`;
} 