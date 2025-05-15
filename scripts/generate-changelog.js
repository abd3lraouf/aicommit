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
    
    // Get commits since the last tag with full commit messages
    const gitLogCommand = lastTag 
      ? `git log ${lastTag}..HEAD --pretty=format:"%H%n%s%n%b%n--COMMIT--" --no-merges`
      : `git log --pretty=format:"%H%n%s%n%b%n--COMMIT--" --no-merges`;
      
    const commitsRaw = execSync(gitLogCommand).toString().trim();
    
    if (!commitsRaw) {
      console.log('No commits found since the last tag.');
      return '';
    }
    
    const commitChunks = commitsRaw.split('\n--COMMIT--\n').filter(Boolean);
    console.log(`Found ${commitChunks.length} commits to process for changelog.`);
    
    // Parse commits and group by type
    const categorizedCommits = {};
    const breakingChanges = [];
    
    commitChunks.forEach(chunk => {
      const lines = chunk.split('\n');
      const hash = lines[0];
      const subject = lines[1];
      // Everything after subject line and before --COMMIT-- marker is the body
      const body = lines.slice(2).join('\n').trim();
      
      // First try to match conventional commit with emoji prefix
      // Format: "emoji type(scope): description" or "emoji type: description"
      let typeMatch = subject.match(/^(?:[\p{Emoji}\u200d]+\s+)?(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/u);
      
      if (!typeMatch) {
        console.log(`Skipping non-conventional commit: ${subject}`);
        return; // Skip non-conventional commits
      }
      
      const [, type, scope, breaking, description] = typeMatch;
      
      // Handle breaking changes
      if (breaking) {
        breakingChanges.push({
          type,
          scope,
          description,
          hash,
          body
        });
      }
      
      // Check for BREAKING CHANGE: in body
      if (body && body.includes('BREAKING CHANGE:')) {
        const breakingMatch = body.match(/BREAKING CHANGE:(.*?)(?:\n\n|$)/s);
        if (breakingMatch) {
          const breakingBody = breakingMatch[1].trim()
            .replace(/(?:<\/commit-end>|--COMMIT--)/g, '');
          
          breakingChanges.push({
            type,
            scope,
            description,
            hash,
            breakingBody
          });
        }
      }
      
      // Format the commit message
      let formattedMessage = `- ${description} (${hash.substring(0, 7)})`;
      if (scope) {
        formattedMessage = `- **${scope}**: ${description} (${hash.substring(0, 7)})`;
      }
      
      // Add body details if present and not just whitespace
      if (body && body.trim()) {
        // Extract relevant parts of the body, ignoring BREAKING CHANGE sections
        const relevantBody = body
          .split('\n')
          .filter(line => !line.trim().startsWith('BREAKING CHANGE:'))
          .join('\n')
          .trim()
          // Remove any commit-end markers
          .replace(/(?:<\/commit-end>|--COMMIT--)/g, '');
          
        if (relevantBody) {
          formattedMessage += `\n  ${relevantBody.split('\n').join('\n  ')}`;
        }
      }
      
      // Add to the appropriate category
      const category = CATEGORIES[type] || CATEGORIES.chore;
      if (!categorizedCommits[category]) {
        categorizedCommits[category] = [];
      }
      categorizedCommits[category].push(formattedMessage);
      console.log(`Added commit to category ${category}: ${subject}`);
    });
    
    // Check if we have any categorized commits
    const hasCommits = Object.values(categorizedCommits).some(commits => commits && commits.length > 0);
    if (!hasCommits && breakingChanges.length === 0) {
      console.log('No categorizable commits found. No changelog generated.');
      return '';
    }
    
    // Generate the markdown
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let changelog = `## ${currentVersion} (${formattedDate})\n\n`;
    
    // Add breaking changes section if any
    if (breakingChanges.length > 0) {
      changelog += '### ⚠️ BREAKING CHANGES\n\n';
      breakingChanges.forEach(change => {
        let message = `- **${change.type}`;
        if (change.scope) message += `(${change.scope})`;
        message += `**: ${change.description} (${change.hash.substring(0, 7)})`;
        
        if (change.breakingBody) {
          message += `\n  ${change.breakingBody.split('\n').join('\n  ')}`;
        } else if (change.body) {
          const cleanBody = change.body.replace(/(?:<\/commit-end>|--COMMIT--)/g, '');
          message += `\n  ${cleanBody.split('\n').join('\n  ')}`;
        }
        
        changelog += message + '\n\n';
      });
    }
    
    // Add sections for each category with commits
    Object.keys(CATEGORIES).forEach(key => {
      const categoryName = CATEGORIES[key];
      const commits = categorizedCommits[categoryName];
      
      if (commits && commits.length > 0) {
        changelog += `### ${categoryName}\n\n`;
        commits.forEach(commit => {
          changelog += `${commit}\n\n`;
        });
      }
    });
    
    // Write to CHANGELOG.md if required
    const shouldWriteFile = process.argv.includes('--write');
    if (shouldWriteFile) {
      const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
      let existingContent = '';
      let headerContent = '';
      
      // Read existing changelog if it exists
      if (fs.existsSync(changelogPath)) {
        existingContent = fs.readFileSync(changelogPath, 'utf8');
        
        // Extract header (preserve the header and description)
        const headerMatch = existingContent.match(/^# Changelog\n\nThis file contains.*?\n\n/s);
        if (headerMatch) {
          headerContent = headerMatch[0];
          // Remove header from existing content
          existingContent = existingContent.substring(headerContent.length);
        } else {
          // If header format doesn't match, use default header
          headerContent = '# Changelog\n\nThis file contains the release history for @abd3lraouf/aicommit.\n\n';
        }
      } else {
        // Default header if file doesn't exist
        headerContent = '# Changelog\n\nThis file contains the release history for @abd3lraouf/aicommit.\n\n';
      }
      
      // Combine the content: header + new changelog + existing content
      const combinedChangelog = `${headerContent}${changelog}${existingContent}`;
      
      // Write the combined changelog
      fs.writeFileSync(changelogPath, combinedChangelog);
      
      // Verify the file was written correctly
      const writtenContent = fs.readFileSync(changelogPath, 'utf8');
      if (writtenContent === combinedChangelog) {
        console.log(`✅ Changelog successfully written to ${changelogPath}`);
      } else {
        console.error('❌ Error: Changelog wasn\'t written correctly');
      }
      
      // Write debug log for troubleshooting
      fs.writeFileSync(path.join(process.cwd(), 'changelog-debug.log'), 
        `Command: ${gitLogCommand}\n\nRaw commits:\n${commitsRaw}\n\nParsed changelog:\n${changelog}\n\nCombined changelog:\n${combinedChangelog}`);
    }
    
    return changelog;
  } catch (error) {
    console.error('Error generating changelog:', error.message);
    console.error(error.stack);
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
