# AICommit

A smart Git commit message generator that creates conventional commit messages with emojis.

![npm version](https://img.shields.io/npm/v/@abd3lraouf/aicommit)
![license](https://img.shields.io/npm/l/@abd3lraouf/aicommit)
![downloads](https://img.shields.io/npm/dm/@abd3lraouf/aicommit)

## Overview

AICommit analyzes your Git changes to automatically generate high-quality conventional commit messages. It follows best practices, adds appropriate emojis based on commit type, and streamlines your Git workflow.

> **Note**: This package is published under the scoped name `@abd3lraouf/aicommit` on npm.

## Prerequisites

- Node.js (v14 or higher)
- Git

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
- Generates conventional commit messages based on file changes
- Automatically adds appropriate emojis based on commit type
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
- **Default AI Implementation**: Implements AIRepository with local text generation
- **CLI Interface**: Handles command-line interactions and user prompts

### App Layer
- Orchestrates the flow between use cases and repositories
- Handles dependency injection and initialization
- Manages application lifecycle

This architecture makes it easy to:
- Replace the AI implementation with another service if needed
- Add new features without changing existing code
- Test components in isolation
- Maintain clear separation of concerns

## How It Works

1. AICommit captures your current git status (staged, unstaged, and untracked files)
2. It analyzes the changes to generate a best practice commit message
3. The generated message is formatted following conventional commit standards
4. The message is enhanced with appropriate emojis based on commit type
5. In interactive mode, you can edit the message before committing
6. The changes are committed with the generated/edited message

### Commit Message Generation

AICommit uses a multi-layered approach to generate high-quality commit messages:

1. **Change analysis**: Examines Git diffs to understand what was modified
2. **Conventional commit formatting**: Creates structured messages following "type(scope): description" format
3. **Emoji enhancement**: Adds appropriate emojis based on the commit type
4. **Message validation**: Ensures the generated message follows conventional commit standards

This robust approach ensures reliable, clean commit messages that follow best practices.

## File Permissions (Unix/Linux/macOS)

If you're using a Unix-like system and installed globally, you might need to ensure the executable has the right permissions:

```bash
# If encountering permission issues
chmod +x $(which aicommit)
```

## API-Based Commit Message Generation

AICommit now supports using a local JSON API server for commit message generation. This allows you to:

1. Use your preferred LLM server instead of Amazon Q
2. Get consistent, well-formatted commit messages in JSON format
3. Customize the prompt and model parameters

### Setting Up a Local API Server

To use the API-based commit message generation, you need to set up a local API server that implements the OpenAI-compatible chat completions API endpoint. The server should:

1. Listen on a configurable host and port (default: http://192.168.1.2:1234)
2. Implement the `/v1/chat/completions` endpoint
3. Accept POST requests with a JSON payload containing a model name and messages array
4. Return a response in OpenAI API format with the commit message JSON in the content field

#### Sample JSON Response Format

The API should return JSON content that follows this structure:

```json
{
  "emoji": "✨", 
  "type": "feat",
  "scope": "api",
  "subject": "add oauth authentication",
  "body": {
    "summary": "Enhances security and follows industry standards",
    "bulletPoints": [
      "Add login screen with provider selection",
      "Implement token management for Google auth",
      "Create secure token storage"
    ]
  }
}
```

### Testing the API Integration

You can test the API integration using the provided test script:

```bash
node scripts/test-api.js
```

Make sure to update the API endpoint in `src/frameworks/default-ai/default-ai-repository-impl.ts` to match your local server configuration.

### Customizing the API Endpoint

By default, AICommit connects to a server at `http://192.168.1.2:1234`. You can modify this in the code or add configuration options to specify a different endpoint.

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