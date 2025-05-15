#!/usr/bin/env node

/**
 * Generate a changelog from git commit messages since the last tag.
 * Uses conventional commits to categorize changes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CATEGORIES = {
  feat: '🚀 Features',
  fix: '🐛 Bug Fixes',
  docs: '📚 Documentation',
  style: '💅 Styling',
  refactor: '♻️ Refactoring',
  perf: '⚡ Performance',
  test: '🧪 Tests',
  build: '🏗️ Build',
  ci: '👷 CI',
  chore: '🔧 Chores',
  revert: '⏪ Reverts',
  deps: '📦 Dependencies',
};

// Default behavior - generate changelog since the last tag
function generateChangelog() {
  try {
    const currentVersion = getCurrentVersion();
    console.log(`Generating changelog for version ${currentVersion}...`);
    
    // Get the last tag
    let lastTag;
    try {
      lastTag = execSync('git describe --tags --abbrev=0').toString().trim();
      console.log(`Last tag: ${lastTag}`);
    } catch (error) {
      console.log('No previous tags found. Generating changelog from the first commit.');
      lastTag = '';
    }
    
    // Get commits since the last tag
    const gitLogCommand = lastTag 
      ? `git log ${lastTag}..HEAD --pretty=format:"%h %s" --no-merges`
      : `git log --pretty=format:"%h %s" --no-merges`;
      
    const commits = execSync(gitLogCommand).toString().trim().split('\n');
    if (!commits[0]) {
      console.log('No commits found since the last tag.');
      return '';
    }
    
    // Parse commits and group by type
    const categorizedCommits = {};
    const breakingChanges = [];
    
    commits.forEach(commit => {
      const [hash, ...messageParts] = commit.split(' ');
      let message = messageParts.join(' ');
      
      // Extract type from conventional commit format
      const typeMatch = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
      if (!typeMatch) return; // Skip non-conventional commits
      
      const [, type, scope, breaking, description] = typeMatch;
      
      // Handle breaking changes
      if (breaking) {
        breakingChanges.push({
          type,
          scope,
          description,
          hash
        });
      }
      
      // Format the commit message
      let formattedMessage = `- ${description} (${hash})`;
      if (scope) {
        formattedMessage = `- **${scope}**: ${description} (${hash})`;
      }
      
      // Add to the appropriate category
      const category = CATEGORIES[type] || CATEGORIES.chore;
      if (!categorizedCommits[category]) {
        categorizedCommits[category] = [];
      }
      categorizedCommits[category].push(formattedMessage);
    });
    
    // Generate the markdown
    let changelog = `# Changelog\n\n## ${currentVersion} (${new Date().toISOString().split('T')[0]})\n\n`;
    
    // Add breaking changes section if any
    if (breakingChanges.length > 0) {
      changelog += '### ⚠️ BREAKING CHANGES\n\n';
      breakingChanges.forEach(change => {
        let message = `- **${change.type}`;
        if (change.scope) message += `(${change.scope})`;
        message += `**: ${change.description} (${change.hash})\n`;
        changelog += message;
      });
      changelog += '\n';
    }
    
    // Add sections for each category with commits
    Object.keys(CATEGORIES).forEach(key => {
      const categoryName = CATEGORIES[key];
      const commits = categorizedCommits[categoryName];
      
      if (commits && commits.length > 0) {
        changelog += `### ${categoryName}\n\n`;
        commits.forEach(commit => {
          changelog += `${commit}\n`;
        });
        changelog += '\n';
      }
    });
    
    // Write to CHANGELOG.md if required
    const shouldWriteFile = process.argv.includes('--write');
    if (shouldWriteFile) {
      const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
      let existingChangelog = '';
      
      // Read existing changelog if it exists
      if (fs.existsSync(changelogPath)) {
        existingChangelog = fs.readFileSync(changelogPath, 'utf8');
        // Remove the header (first line) from existing changelog
        existingChangelog = existingChangelog.split('\n').slice(1).join('\n');
      }
      
      // Combine new changelog with existing content
      const combinedChangelog = `${changelog}${existingChangelog}`;
      fs.writeFileSync(changelogPath, combinedChangelog);
      console.log(`Changelog written to ${changelogPath}`);
    }
    
    return changelog;
  } catch (error) {
    console.error('Error generating changelog:', error.message);
    process.exit(1);
  }
}

// Get current version from package.json
function getCurrentVersion() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

// If script is run directly
if (require.main === module) {
  const changelog = generateChangelog();
  if (!process.argv.includes('--write')) {
    console.log(changelog);
  }
}

module.exports = { generateChangelog };
