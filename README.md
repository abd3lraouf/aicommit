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
- `--verbose` (`-v`): Enable detailed output with styled messages and emojis (default: true)
- `--debug`: Enable debug logging for troubleshooting message extraction issues
- `--help` (`-h`): Show help information

### Examples

```bash
# Interactive mode with confirmation before committing
aicommit --interactive

# Generate message only without committing (dry run)
aicommit --dry-run

# Disable verbose output (minimal output mode)
aicommit --no-verbose

# Enable debug mode for troubleshooting
aicommit --debug
```

## Features

- Analyzes Git changes (staged, unstaged, and untracked files)
- Generates conventional commit messages using Amazon Q's AI
- Automatically adds appropriate emojis based on commit type
- Wraps commit messages with `<commit-start>` and `<commit-end>` tags for precise extraction
- Follows the Conventional Commits specification
- Interactive mode for reviewing and editing messages
- Intelligently handles staged/unstaged changes
- Beautiful, colored terminal output with progress indicators
- Verbose mode with detailed, stylized process information
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
3. The generated message is specifically enclosed in `<commit-start>` and `<commit-end>` tags for reliable extraction
4. The extracted message is processed and enhanced with appropriate emojis
5. In interactive mode, you can edit the message before committing
6. The changes are committed with the generated/edited message

### Commit Message Extraction

AICommit uses a multi-layered approach to extract high-quality commit messages from Amazon Q's responses:

1. **Tag-based extraction**: The primary method looks for content between `<commit-start>` and `<commit-end>` tags for precise extraction
2. **Conventional commit pattern matching**: Identifies lines that match conventional commit format (e.g., "feat:", "fix:")
3. **AI response cleaning**: Removes common AI commentary like "Here's a commit message..." and code block markers
4. **Validation**: Ensures the extracted message follows conventional commit standards

This robust approach ensures reliable, clean commit messages even with varying model outputs.

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