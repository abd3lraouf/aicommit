This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Files are sorted by Git change count (files with more changes are at the bottom)

## Additional Info

# Directory Structure
```
.github/
  ISSUE_TEMPLATE/
    bug_report.md
    feature_request.md
  workflows/
    ci.yml
    publish.yml
  pull_request_template.md
src/
  core/
    entities/
      git.ts
    repositories/
      ai-repository.ts
      git-repository.ts
    use-cases/
      commit-changes.ts
      generate-commit-message.ts
  frameworks/
    amazon-q/
      amazon-q-repository-impl.ts
    cli/
      cli-presenter.ts
    git/
      git-repository-impl.ts
  app.ts
  index.ts
.gitignore
.npmignore
.npmrc
CODE_OF_CONDUCT.md
CONTRIBUTING.md
LICENSE
package.json
README.md
tsconfig.json
```

# Files

## File: .github/ISSUE_TEMPLATE/bug_report.md
````markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Describe the bug
A clear and concise description of what the bug is.

## To Reproduce
Steps to reproduce the behavior:
1. Run command '...'
2. See error

## Expected behavior
A clear and concise description of what you expected to happen.

## Screenshots/Terminal Output
If applicable, add screenshots or terminal output to help explain your problem.

## Environment
 - OS: [e.g. macOS 12.6, Ubuntu 22.04]
 - Node.js version: [e.g. 16.14.2]
 - AICommit version: [e.g. 1.0.0]
 - Amazon Q CLI version: [e.g. 1.0.0]

## Additional context
Add any other context about the problem here.
````

## File: .github/ISSUE_TEMPLATE/feature_request.md
````markdown
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Is your feature request related to a problem? Please describe.
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Describe the solution you'd like
A clear and concise description of what you want to happen.

## Describe alternatives you've considered
A clear and concise description of any alternative solutions or features you've considered.

## Additional context
Add any other context or screenshots about the feature request here.
````

## File: .github/workflows/ci.yml
````yaml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          run_install: false
      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
      - uses: actions/cache@v3
        name: Setup pnpm cache
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
      - name: Install dependencies
        run: pnpm install
      - name: Build
        run: pnpm run build
````

## File: .github/pull_request_template.md
````markdown
## Description
Please include a summary of the change and which issue is fixed. Please also include relevant motivation and context.

Fixes # (issue)

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## How Has This Been Tested?
Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce.

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
````

## File: src/core/entities/git.ts
````typescript
export interface GitStatus {
  staged: string;
  unstaged: string;
  untracked: string;
}
export interface FileChanges {
  staged_diff: string;
  unstaged_diff: string;
}
export const COMMIT_TYPE_EMOJIS: Record<string, string> = {
  'feat': '✨',
  'fix': '🐛',
  'docs': '📝',
  'style': '💄',
  'refactor': '♻️',
  'perf': '⚡️',
  'test': '✅',
  'chore': '🔧',
  'ci': '👷',
  'build': '🏗️',
  'revert': '⏪',
  'merge': '🔀',
  'deps': '📦',
  'breaking': '💥',
  'security': '🔒',
  'config': '🔧',
  'i18n': '🌐',
  'release': '🚀',
  'db': '🗃️',
  'a11y': '♿',
  'ux': '🎨',
  'init': '🎉',
};
````

## File: src/core/repositories/ai-repository.ts
````typescript
export interface AIRepository {
  generateCommitMessage(prompt: string): Promise<string>;
}
````

## File: src/core/repositories/git-repository.ts
````typescript
import { GitStatus, FileChanges } from '../entities/git';
export interface GitRepository {
  isGitRepository(): Promise<boolean>;
  getStatus(): Promise<GitStatus>;
  getFileChanges(): Promise<FileChanges>;
  commitChanges(message: string, stageAll?: boolean): Promise<boolean>;
}
````

## File: src/core/use-cases/commit-changes.ts
````typescript
import { GitRepository } from '../repositories/git-repository';
export class CommitChangesUseCase {
  constructor(
    private gitRepository: GitRepository
  ) {}
  async execute(commitMessage: string, dryRun: boolean = false): Promise<boolean> {
    return await this.gitRepository.commitChanges(commitMessage, !dryRun);
  }
}
````

## File: src/core/use-cases/generate-commit-message.ts
````typescript
import { GitStatus, FileChanges, COMMIT_TYPE_EMOJIS } from '../entities/git';
import { GitRepository } from '../repositories/git-repository';
import { AIRepository } from '../repositories/ai-repository';
export class GenerateCommitMessageUseCase {
  constructor(
    private gitRepository: GitRepository,
    private aiRepository: AIRepository
  ) {}
  private createPrompt(status: GitStatus, changes: FileChanges): string {
    return `Generate a concise, best-practice Git commit message based on these changes:
Staged files:
${status.staged}
Unstaged files:
${status.unstaged}
Untracked files:
${status.untracked}
Changes in staged files:
${changes.staged_diff.substring(0, 2000)}  # Limiting to 2000 chars to avoid overwhelming AI
Follow the Conventional Commits specification (conventionalcommits.org) with the following structure:
1. Format the message as: <type>[optional scope]: <description>
   [high-level overview paragraph]
   [detailed changes as bullet points]
   [optional footer(s)]
2. Type must be one of the following:
   - feat: A new feature
   - fix: A bug fix
   - docs: Documentation only changes
   - style: Changes that do not affect the meaning of the code
   - refactor: A code change that neither fixes a bug nor adds a feature
   - perf: A code change that improves performance
   - test: Adding missing or correcting existing tests
   - chore: Changes to the build process or auxiliary tools
3. Add an optional scope in parentheses for additional context: feat(api):
4. Description:
   - Use imperative, present tense (e.g., "add" not "added" or "adds")
   - Don't capitalize the first letter
   - No period at the end
   - Keep it under 50 characters
5. High-level overview paragraph:
   - Add a paragraph after the first line providing a high-level context about the change
   - Focus on "why" this change matters and its overall impact
   - Keep this short but informative (1-3 sentences)
6. Detailed changes:
   - List specific changes as bullet points with hyphens (-)
   - Be specific about what changed
   - Use imperative mood consistently
7. For breaking changes:
   - Add ! before the colon: feat!: or feat(scope)!:
   - Include "BREAKING CHANGE:" in the footer
8. Footer (if needed):
   - Reference issues: "Fixes #123" or "Refs #123"
   - Include metadata like "Reviewed-by: name"
Example:
\`\`\`
feat(auth): add OAuth2 authentication
This authentication implementation enhances security and follows modern industry standards, allowing users to sign in with popular providers without creating new credentials.
- Add login screen with provider selection
- Implement token management for Google auth
- Create secure token storage
- Add auto refresh for expired tokens
- Update user profile to display auth method
Fixes #42
\`\`\`
IMPORTANT: Output should contain ONLY the commit message itself without any other text.`;
  }
  private addEmojiToCommitMessage(commitMessage: string): string {
    const lines = commitMessage.split('\n');
    const firstLine = lines[0] || '';
    // Look for the conventional commit format: type(scope): description
    const match = firstLine.match(/^([\w]+)(?:\(.*?\))?(!)?:/);
    if (match) {
      const commitType = match[1].toLowerCase();
      const isBreaking = Boolean(match[2]);
      // Get the appropriate emoji
      let emoji = COMMIT_TYPE_EMOJIS[commitType] || '';
      // Add breaking change emoji if it's a breaking change
      if (isBreaking) {
        emoji = `${COMMIT_TYPE_EMOJIS['breaking'] || '💥'} ${emoji}`;
      }
      if (emoji) {
        return commitMessage.replace(firstLine, `${emoji} ${firstLine}`);
      }
    }
    return commitMessage;
  }
  private enhanceCommitMessage(commitMessage: string): string {
    let emojifiedMessage = this.addEmojiToCommitMessage(commitMessage);
    const lines = emojifiedMessage.split('\n');
    if (lines.length > 1 && lines[1].trim() !== '') {
      lines.splice(1, 0, '');
      emojifiedMessage = lines.join('\n');
    }
    return emojifiedMessage;
  }
  async execute(): Promise<string> {
    const isRepo = await this.gitRepository.isGitRepository();
    if (!isRepo) {
      throw new Error('Not in a git repository');
    }
    const status = await this.gitRepository.getStatus();
    if (!status.staged.trim() && !status.unstaged.trim() && !status.untracked.trim()) {
      throw new Error('No changes detected to commit');
    }
    const fileChanges = await this.gitRepository.getFileChanges();
    const prompt = this.createPrompt(status, fileChanges);
    const rawCommitMessage = await this.aiRepository.generateCommitMessage(prompt);
    return this.enhanceCommitMessage(rawCommitMessage);
  }
}
````

## File: src/frameworks/amazon-q/amazon-q-repository-impl.ts
````typescript
import * as child_process from 'child_process';
import { AIRepository } from '../../core/repositories/ai-repository';
export class AmazonQRepositoryImpl implements AIRepository {
  private extractCommitMessage(output: string): string {
    output = output.replace(/To learn more about MCP safety.*?\n/s, '');
    // Remove the help line with commands and shortcuts
    output = output.replace(/\/help.*?fuzzy search\n/s, '');
    // Remove the separator line (horizontal dash line)
    output = output.replace(/━+/g, '');
    // Remove any ANSI color/formatting codes
    output = output.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
    // Remove any leading/trailing whitespace and empty lines
    output = output.trim();
    // Remove any potential duplicate newlines
    output = output.replace(/\n{3,}/g, '\n\n');
    output = output.replace(/^\s*\n/, '');
    return output;
  }
  /**
   * Generate a commit message using Amazon Q based on provided content
   * @param prompt - The prompt containing git status and diff information
   */
  async generateCommitMessage(prompt: string): Promise<string> {
    try {
      // Use spawn to send the prompt via stdin
      const process = child_process.spawnSync('q', ['chat', '--trust-all-tools', '--no-interactive'], {
        input: prompt,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      if (process.status !== 0) {
        throw new Error(`Amazon Q error: ${process.stderr}`);
      }
      const cleanMessage = this.extractCommitMessage(process.stdout);
      if (!cleanMessage || cleanMessage.trim() === '') {
        throw new Error("Amazon Q returned an empty or invalid commit message");
      }
      return cleanMessage;
    } catch (e) {
      throw new Error(`Error calling Amazon Q: ${e}`);
    }
  }
}
````

## File: src/frameworks/cli/cli-presenter.ts
````typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
export interface CliOptions {
  dryRun: boolean;
  interactive: boolean;
}
export class CliPresenter {
  parseArguments(args: string[] = process.argv.slice(2)): CliOptions {
    const parsedArgs = yargs(args)
      .option('dry-run', {
        alias: 'd',
        type: 'boolean',
        description: 'Show the commit message without committing',
        default: false
      })
      .option('interactive', {
        alias: 'i',
        type: 'boolean',
        description: 'Edit the commit message before committing',
        default: false
      })
      .help()
      .alias('help', 'h')
      .parseSync();
    return {
      dryRun: parsedArgs['dry-run'] || false,
      interactive: parsedArgs['interactive'] || false
    };
  }
  editCommitMessage(commitMessage: string): string {
    const editFile = path.join(os.tmpdir(), `commit-msg-${Date.now()}.txt`);
    fs.writeFileSync(editFile, commitMessage, 'utf8');
    const editor = process.env.EDITOR || 'vim';
    child_process.spawnSync(editor, [editFile], { stdio: 'inherit' });
    const editedMessage = fs.readFileSync(editFile, 'utf8');
    fs.unlinkSync(editFile);
    return editedMessage;
  }
  showSuccess(message: string): void {
    console.log(message);
  }
  showError(message: string): void {
    console.error(message);
  }
  showDryRunMessage(message: string): void {
    console.log('Dry run mode. The commit message would be:');
    console.log('\n' + message + '\n');
  }
}
````

## File: src/frameworks/git/git-repository-impl.ts
````typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import { GitRepository } from '../../core/repositories/git-repository';
import { GitStatus, FileChanges } from '../../core/entities/git';
export class GitRepositoryImpl implements GitRepository {
  async isGitRepository(): Promise<boolean> {
    try {
      child_process.execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' });
      return true;
    } catch (e) {
      return false;
    }
  }
  async getStatus(): Promise<GitStatus> {
    try {
      const staged = child_process.execSync('git diff --name-status --staged', { encoding: 'utf8' });
      const unstaged = child_process.execSync('git diff --name-status', { encoding: 'utf8' });
      const untracked = child_process.execSync('git ls-files --others --exclude-standard', { encoding: 'utf8' });
      return { staged, unstaged, untracked };
    } catch (e) {
      throw new Error(`Error getting git status: ${e}`);
    }
  }
  async getFileChanges(): Promise<FileChanges> {
    try {
      const staged_diff = child_process.execSync('git diff --staged', { encoding: 'utf8' });
      const unstaged_diff = child_process.execSync('git diff', { encoding: 'utf8' });
      return { staged_diff, unstaged_diff };
    } catch (e) {
      throw new Error(`Error getting file changes: ${e}`);
    }
  }
  async commitChanges(message: string, stageAll: boolean = false): Promise<boolean> {
    try {
      const stagedFiles = child_process.execSync('git diff --staged --name-only', { encoding: 'utf8' });
      if (!stagedFiles.trim() && stageAll) {
        console.log('No staged changes. Staging all changes...');
        child_process.execSync('git add .');
      }
      const tempFile = path.join(os.tmpdir(), `commit-msg-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, message);
      try {
        child_process.execSync(`git commit -F ${tempFile}`, { stdio: 'inherit' });
        return true;
      } finally {
        fs.unlinkSync(tempFile);
      }
    } catch (error) {
      console.error(`Failed to commit: ${error}`);
      return false;
    }
  }
}
````

## File: src/app.ts
````typescript
import { GenerateCommitMessageUseCase } from './core/use-cases/generate-commit-message';
import { CommitChangesUseCase } from './core/use-cases/commit-changes';
import { GitRepository } from './core/repositories/git-repository';
import { AIRepository } from './core/repositories/ai-repository';
import { GitRepositoryImpl } from './frameworks/git/git-repository-impl';
import { AmazonQRepositoryImpl } from './frameworks/amazon-q/amazon-q-repository-impl';
import { CliPresenter, CliOptions } from './frameworks/cli/cli-presenter';
export class App {
  private gitRepository: GitRepository;
  private aiRepository: AIRepository;
  private generateCommitMessageUseCase: GenerateCommitMessageUseCase;
  private commitChangesUseCase: CommitChangesUseCase;
  private cliPresenter: CliPresenter;
  constructor() {
    this.gitRepository = new GitRepositoryImpl();
    this.aiRepository = new AmazonQRepositoryImpl();
    this.generateCommitMessageUseCase = new GenerateCommitMessageUseCase(
      this.gitRepository,
      this.aiRepository
    );
    this.commitChangesUseCase = new CommitChangesUseCase(
      this.gitRepository
    );
    this.cliPresenter = new CliPresenter();
  }
  async run(options?: CliOptions): Promise<number> {
    try {
      const cliOptions = options || this.cliPresenter.parseArguments();
      let commitMessage = await this.generateCommitMessageUseCase.execute();
      if (cliOptions.interactive) {
        commitMessage = this.cliPresenter.editCommitMessage(commitMessage);
      }
      if (cliOptions.dryRun) {
        this.cliPresenter.showDryRunMessage(commitMessage);
        return 0;
      }
      const success = await this.commitChangesUseCase.execute(commitMessage, true);
      if (success) {
        this.cliPresenter.showSuccess('Successfully committed!');
        return 0;
      } else {
        this.cliPresenter.showError('Failed to commit changes.');
        return 1;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.cliPresenter.showError(`Error: ${errorMessage}`);
      return 1;
    }
  }
}
````

## File: src/index.ts
````typescript
#!/usr/bin/env node
import { App } from './app';
async function main(): Promise<number> {
  const app = new App();
  return await app.run();
}
main().then(process.exit).catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
````

## File: .gitignore
````
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
dev-debug.log
pnpm-debug.log*

# Dependency directories
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local
.env.*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS specific
.DS_Store
Thumbs.db

# Task files
tasks.json
tasks/
````

## File: .npmignore
````
# Source
src/

# Development files
.git/
.github/
.gitignore
tsconfig.json
repomix-output.md

# Test files
__tests__/
*.test.ts
*.spec.ts
jest.config.js

# Editor directories and files
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Other
.DS_Store
````

## File: .npmrc
````
shamefully-hoist=true
engine-strict=true
save-exact=true
````

## File: CODE_OF_CONDUCT.md
````markdown
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity
and orientation.

We pledge to act and interact in ways that contribute to an open, welcoming,
diverse, inclusive, and healthy community.

## Our Standards

Examples of behavior that contributes to a positive environment for our
community include:

* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes,
  and learning from the experience
* Focusing on what is best not just for us as individuals, but for the
  overall community

Examples of unacceptable behavior include:

* The use of sexualized language or imagery, and sexual attention or
  advances of any kind
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or email
  address, without their explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

Community leaders have the right and responsibility to remove, edit, or reject
comments, commits, code, wiki edits, issues, and other contributions that are
not aligned to this Code of Conduct, and will communicate reasons for moderation
decisions when appropriate.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.
Examples of representing our community include using an official e-mail address,
posting via an official social media account, or acting as an appointed
representative at an online or offline event.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
[hello@abd3lraouf.dev](mailto:hello@abd3lraouf.dev).
All complaints will be reviewed and investigated promptly and fairly.

All community leaders are obligated to respect the privacy and security of the
reporter of any incident.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org),
version 2.0, available at
https://www.contributor-covenant.org/version/2/0/code_of_conduct.html.
````

## File: CONTRIBUTING.md
````markdown
# Contributing to AICommit

Thank you for your interest in contributing to AICommit! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Process

We use GitHub to host code, track issues and feature requests, as well as accept pull requests.

### Issues

Feel free to submit issues for:
- Bug reports
- Feature requests
- Documentation improvements

Please use the appropriate issue templates when available.

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```
3. Build the project:
   ```bash
   pnpm build
   # or
   npm run build
   ```

## Project Structure

AICommit follows clean architecture principles with the following structure:

```
src/
  core/
    entities/       # Domain entities and models
    repositories/   # Interface definitions for external services
    use-cases/      # Application business rules
  frameworks/
    amazon-q/       # Amazon Q implementation
    cli/            # Command-line interface
    git/            # Git operations implementation
  app.ts            # Application coordinator
  index.ts          # Entry point
```

## Coding Standards

- Follow the TypeScript and JavaScript best practices
- Use meaningful variable and function names
- Write descriptive comments for complex logic
- Write unit tests for new features
- Follow clean architecture principles

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This helps with automatic versioning and changelog generation. The basic format is:

```
type(scope): description

[optional body]

[optional footer(s)]
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
````

## File: LICENSE
````
MIT License

Copyright (c) 2025 Abdelraouf Sabri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
````

## File: .github/workflows/publish.yml
````yaml
name: Publish Package to npmjs
on:
  release:
    types: [created]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          registry-url: 'https://registry.npmjs.org'
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          run_install: false
      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
      - uses: actions/cache@v3
        name: Setup pnpm cache
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
      - name: Install dependencies
        run: pnpm install
      - name: Build
        run: pnpm run build
      - name: Publish to npm
        run: pnpm publish --no-git-checks --access=public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
````

## File: package.json
````json
{
  "name": "@abd3lraouf/aicommit",
  "version": "1.0.0",
  "description": "Amazon Q Git Commit Script - Generate AI-powered commit messages with emojis",
  "main": "dist/index.js",
  "bin": {
    "aicommit": "./dist/index.js"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch",
    "prepublishOnly": "npm run build",
    "clean": "rm -rf dist",
    "prebuild": "npm run clean",
    "postinstall": "npm run build",
    "postbuild": "chmod +x dist/index.js"
  },
  "keywords": [
    "git",
    "commit",
    "amazon-q",
    "ai",
    "conventional-commits",
    "emoji",
    "commit-message"
  ],
  "author": "Abdelraouf Sabri <hello@abd3lraouf.dev> (https://abd3lraouf.dev)",
  "homepage": "https://github.com/abd3lraouf/aicommit#readme",
  "repository": {
    "type": "git",
    "url": "https://github.com/abd3lraouf/aicommit"
  },
  "bugs": {
    "url": "https://github.com/abd3lraouf/aicommit/issues"
  },
  "license": "MIT",
  "dependencies": {
    "yargs": "^17.7.2"
  },
  "devDependencies": {
    "@types/jest": "29.5.14",
    "@types/node": "22.15.18",
    "@types/yargs": "^17.0.33",
    "typescript": "^5.8.3"
  },
  "packageManager": "pnpm@8.15.5"
}
````

## File: README.md
````markdown
# AICommit

A smart Git commit message generator that uses Amazon Q to create conventional commit messages with emojis.

![npm version](https://img.shields.io/npm/v/@abd3lraouf/aicommit)
![license](https://img.shields.io/npm/l/@abd3lraouf/aicommit)
![downloads](https://img.shields.io/npm/dm/@abd3lraouf/aicommit)

## Overview

AICommit analyzes your Git changes and leverages Amazon Q to automatically generate high-quality conventional commit messages. It follows best practices, adds appropriate emojis based on commit type, and streamlines your Git workflow.

> **Note**: This package is published under the scoped name `@abd3lraouf/aicommit` on npm.

## Prerequisites

- Node.js (v14 or higher)
- Git
- [Amazon Q CLI](https://aws.amazon.com/q/) installed and authenticated

## Installation

### Global Installation (Recommended)

Install globally to use `aicommit` as a command from anywhere:

```bash
npm install -g @abd3lraouf/aicommit
# or 
pnpm install -g @abd3lraouf/aicommit
# or
yarn global add @abd3lraouf/aicommit
```

### Local Installation

```bash
npm install @abd3lraouf/aicommit
# or
pnpm install @abd3lraouf/aicommit
# or
yarn add @abd3lraouf/aicommit
```

### Verifying Installation

After installation, verify that the command is available:

```bash
aicommit --help
```

This should display the available command options. If you encounter any issues, ensure that:

1. Node.js binaries are in your PATH
2. Global npm/pnpm/yarn packages are properly linked
3. Amazon Q CLI is installed and properly configured

## Usage

### Basic Usage

```bash
# If installed globally
aicommit

# If installed locally
npx aicommit
```

### Command Options

- `--dry-run` (`-d`): Generate a commit message without actually committing changes
- `--interactive` (`-i`): Enable interactive mode to edit the commit message before committing
- `--help` (`-h`): Show help information

### Examples

```bash
# Interactive mode with confirmation before committing
aicommit --interactive

# Generate message only without committing (dry run)
aicommit --dry-run
```

## Features

- Analyzes Git changes (staged, unstaged, and untracked files)
- Generates conventional commit messages using Amazon Q's AI
- Automatically adds appropriate emojis based on commit type
- Follows the Conventional Commits specification
- Interactive mode for reviewing and editing messages
- Intelligently handles staged/unstaged changes
- Enhanced with clean architecture for maintainability and extensibility

## Commit Type Emojis

The tool automatically adds emojis based on commit types:

| Type     | Emoji | Description                |
|----------|-------|----------------------------|
| feat     | ✨    | A new feature              |
| fix      | 🐛    | A bug fix                  |
| docs     | 📝    | Documentation changes      |
| style    | 💄    | Style/UI changes           |
| refactor | ♻️    | Code refactoring           |
| perf     | ⚡️    | Performance improvements   |
| test     | ✅    | Adding or updating tests   |
| chore    | 🔧    | Maintenance tasks          |
| ci       | 👷    | CI/CD changes              |
| build    | 🏗️    | Build system changes       |
| revert   | ⏪    | Revert changes             |
| merge    | 🔀    | Merge branches             |
| deps     | 📦    | Dependency updates         |
| breaking | 💥    | Breaking changes           |
| security | 🔒    | Security improvements      |
| config   | 🔧    | Configuration changes      |
| i18n     | 🌐    | Internationalization       |
| release  | 🚀    | Release new version        |
| db       | 🗃️    | Database related changes   |
| a11y     | ♿    | Accessibility improvements |
| ux       | 🎨    | User experience changes    |
| init     | 🎉    | Initial commit             |

## Architecture

AICommit is built using clean architecture principles for better maintainability and extensibility:

### Core Layer
- **Entities**: Contains domain models like GitStatus and FileChanges
- **Use Cases**: Implements application business rules:
  - `GenerateCommitMessageUseCase`: Handles the process of generating commit messages
  - `CommitChangesUseCase`: Handles the actual commit process
- **Repository Interfaces**: Defines contracts for external services:
  - `GitRepository`: Interface for Git operations
  - `AIRepository`: Interface for AI service operations

### Frameworks Layer
- **Git Implementation**: Implements GitRepository using Node.js child_process
- **Amazon Q Implementation**: Implements AIRepository for Amazon Q
- **CLI Interface**: Handles command-line interactions and user prompts

### App Layer
- Orchestrates the flow between use cases and repositories
- Handles dependency injection and initialization
- Manages application lifecycle

This architecture makes it easy to:
- Replace Amazon Q with another AI service if needed
- Add new features without changing existing code
- Test components in isolation
- Maintain clear separation of concerns

## How It Works

1. AICommit captures your current git status (staged, unstaged, and untracked files)
2. It sends the changes to Amazon Q with a prompt for generating a best practice commit message
3. The generated message is processed and enhanced with appropriate emojis
4. In interactive mode, you can edit the message before committing
5. The changes are committed with the generated/edited message

## File Permissions (Unix/Linux/macOS)

If you're using a Unix-like system and installed globally, you might need to ensure the executable has the right permissions:

```bash
# If encountering permission issues
chmod +x $(which aicommit)
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT

## Author

Abdelraouf Sabri
- Email: hello@abd3lraouf.dev
- Website: https://abd3lraouf.dev
- Repository: https://github.com/abd3lraouf/aicommit
- NPM Package: https://www.npmjs.com/package/@abd3lraouf/aicommit
````
