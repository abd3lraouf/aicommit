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
 * Analysis of git changes to determine schema constraints
 */
export interface GitChangeAnalysis {
  stagedFileCount: number;
  modifiedFileCount: number;
  addedFileCount: number;
  deletedFileCount: number;
  totalChangeCount: number;
  suggestedBulletPoints: {
    min: number;
    max: number;
  };
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

/**
 * Analyze git status to determine file counts and suggested bullet points
 */
export function analyzeGitChanges(status: GitStatus, changes: FileChanges): GitChangeAnalysis {
  const stagedFiles = status.staged.split('\n').filter(line => line.trim());
  const stagedFileCount = stagedFiles.length;
  
  // Count different types of changes from staged files
  let addedFileCount = 0;
  let modifiedFileCount = 0;
  let deletedFileCount = 0;
  
  stagedFiles.forEach(line => {
    const statusChar = line.charAt(0);
    switch (statusChar) {
      case 'A':
        addedFileCount++;
        break;
      case 'M':
        modifiedFileCount++;
        break;
      case 'D':
        deletedFileCount++;
        break;
      case 'R':
      case 'C':
        modifiedFileCount++; // Renamed/copied files count as modifications
        break;
    }
  });
  
  const totalChangeCount = addedFileCount + modifiedFileCount + deletedFileCount;
  
  // Calculate suggested bullet points based on changes
  // For small changes (1-2 files): 1-3 bullet points
  // For medium changes (3-5 files): 2-5 bullet points  
  // For large changes (6+ files): 3-8 bullet points
  let suggestedMin = 1;
  let suggestedMax = 3;
  
  if (totalChangeCount <= 2) {
    suggestedMin = 1;
    suggestedMax = Math.max(3, totalChangeCount + 1);
  } else if (totalChangeCount <= 5) {
    suggestedMin = 2;
    suggestedMax = Math.max(5, totalChangeCount);
  } else {
    suggestedMin = 3;
    suggestedMax = Math.min(8, Math.max(6, Math.ceil(totalChangeCount * 0.8)));
  }
  
  return {
    stagedFileCount,
    modifiedFileCount,
    addedFileCount,
    deletedFileCount,
    totalChangeCount,
    suggestedBulletPoints: {
      min: suggestedMin,
      max: suggestedMax
    }
  };
} 