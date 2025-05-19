# AICommit

A smart Git commit message generator that creates conventional commit messages with emojis.

![npm version](https://img.shields.io/npm/v/@abd3lraouf/aicommit)
![license](https://img.shields.io/npm/l/@abd3lraouf/aicommit)
![downloads](https://img.shields.io/npm/dm/@abd3lraouf/aicommit)

## Overview

AICommit analyzes your Git changes to automatically generate high-quality conventional commit messages. It follows best practices, adds appropriate emojis based on commit type, and streamlines your Git workflow.

> **Note**: This package is published under the scoped name `@abd3lraouf/aicommit` on npm.

## Prerequisites

- Node.js (v18 or higher)
- Git

## Installation

Install globally using npm:

```bash
npm install -g @abd3lraouf/aicommit
```

Or using pnpm:

```bash
pnpm add -g @abd3lraouf/aicommit
```

## API Server Setup

This tool requires a compatible AI API server to generate commit messages. See [API Server Setup](AI_SERVER_SETUP.md) for detailed instructions.

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

#### API Configuration Options

- `--api-host`: Set the API server hostname (overrides configuration files)
- `--api-port`: Set the API server port number
- `--api-endpoint`: Set the API endpoint path
- `--api-model`: Set the AI model name to use
- `--api-timeout`: Set the API request timeout in milliseconds

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

### Configuration

AICommit supports multiple ways to configure the tool to match your preferences:

#### Configuration Files

You can create a configuration file in JSON format:

- `.aicommitrc` or `.aicommitrc.json` in your project directory
- `.aicommitrc` or `.aicommitrc.json` in your home directory

Example `.aicommitrc.json`:

```json
{
  "api": {
    "host": "localhost",
    "port": 1234,
    "endpoint": "/v1/chat/completions",
    "model": "local-model",
    "timeout": 30000
  },
  "cli": {
    "dryRun": false,
    "interactive": true,
    "verbose": true,
    "debug": false
  }
}
```

#### Configuration Priority

AICommit loads configuration in the following order (highest priority first):

1. Command line arguments
2. Project directory `.aicommitrc` file
3. Home directory `.aicommitrc` file
4. Environment variables (from `.env` file)
5. Default values

This allows you to set global defaults in your home directory while having project-specific overrides.

### Debug Mode

Debug mode provides detailed logging to help troubleshoot issues and gain insights into how AICommit works.

To enable debug mode, use the `--debug` flag or set `debug: true` in your configuration file:

```bash
aicommit --debug
```

#### Token Counting

When running AICommit in debug mode, it will display token count information for API requests:

- **Estimated Token Count**: Before making the API request, AICommit estimates how many tokens will be used for the system prompt and user input.
- **Actual Token Usage**: After receiving the API response, AICommit displays the actual token usage reported by the API.

Example output:
```
→ [DefaultAI] Estimated token count: { system_prompt: 1243, user_prompt: 156, total: 1399 }
→ [DefaultAI] Token usage: { prompt_tokens: 1412, completion_tokens: 312, total_tokens: 1724 }
```

This feature is useful for:
- Monitoring token usage for API billing purposes
- Debugging API context limitations
- Optimizing prompts to reduce token usage

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

AICommit uses a local JSON API server for commit message generation. This allows you to:

1. Use your preferred LLM model for generating commit messages
2. Get consistent, well-formatted commit messages with conventional format and emojis
3. Customize the model and API parameters via environment variables

### Required AI Model

We recommend using the **[THUDM/GLM-4-32B-Base-0414](https://huggingface.co/THUDM/GLM-4-32B-Base-0414)** model from Hugging Face, which has been tested with our system and works well with the required JSON output format.

For details about server setup and model requirements, see:
- [AI_SERVER_SETUP.md](./AI_SERVER_SETUP.md) - Detailed server setup instructions and JSON schema

### Configuration

AICommit uses a `.env` file for configuration. The project now includes a pre-configured `.env` file with the following default settings:

```
AI_API_HOST=192.168.1.2  # The host where your AI API server is running
AI_API_PORT=1234         # The port your AI API server is listening on
AI_API_MODEL=local-model # The model name to use
```

You can modify these settings by editing the `.env` file directly:

```bash
# Edit the .env file to match your server configuration
nano .env
```

If you need to reset to the default configuration:

```bash
# Reset to the default configuration
npm run setup
```

Then edit the `.env` file to match your AI server configuration:

```
AI_API_HOST=localhost
AI_API_PORT=1234
AI_API_ENDPOINT=/v1/chat/completions
AI_API_MODEL=THUDM/GLM-4-32B-Base-0414
AI_API_TIMEOUT=30000
```

### Testing Your API Setup

You can test your API configuration with the provided test script:

```bash
node scripts/test-api.js
```

This will send a sample git diff to your API and display the generated commit message.

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