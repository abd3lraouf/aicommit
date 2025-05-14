/**
 * Core domain entities related to Git
 */

/**
 * Represents the current Git repository status
 */
export interface GitStatus {
  staged: string;     // Staged files and their status
  unstaged: string;   // Unstaged but modified files and their status
  untracked: string;  // Untracked files
}

/**
 * Represents the changes in Git repository files
 */
export interface FileChanges {
  staged_diff: string;    // Diff content of staged changes
  unstaged_diff: string;  // Diff content of unstaged changes
}

/**
 * Mapping of conventional commit types to GitHub-friendly emojis
 */
export const COMMIT_TYPE_EMOJIS: Record<string, string> = {
  'feat': '✨',     // Feature - sparkles
  'fix': '🐛',      // Bug fix - bug
  'docs': '📝',     // Documentation - memo
  'style': '💄',    // Style/UI - lipstick
  'refactor': '♻️',  // Refactor - recycle
  'perf': '⚡️',     // Performance - zap
  'test': '✅',     // Tests - white check mark
  'chore': '🔧',    // Chore/Maintenance - wrench
  'ci': '👷',       // CI/CD - construction worker
  'build': '🏗️',    // Build system - building construction
  'revert': '⏪',   // Revert changes - rewind
  'merge': '🔀',    // Merge branches - twisted arrows
  'deps': '📦',     // Dependencies - package
  'breaking': '💥', // Breaking changes - explosion
  'security': '🔒', // Security - lock
  'config': '🔧',   // Configuration - wrench
  'i18n': '🌐',     // Internationalization - globe
  'release': '🚀',  // Release - rocket
  'db': '🗃️',       // Database - card file box
  'a11y': '♿',     // Accessibility - wheelchair
  'ux': '🎨',       // UX/Design - artist palette
  'init': '🎉',     // Initial commit - party popper
}; 