# AICommit

> Smart Git commit messages with AI - automatically generates conventional commits with emojis

[![npm version](https://img.shields.io/npm/v/@abd3lraouf/aicommit)](https://www.npmjs.com/package/@abd3lraouf/aicommit)
[![license](https://img.shields.io/npm/l/@abd3lraouf/aicommit)](LICENSE)
[![downloads](https://img.shields.io/npm/dm/@abd3lraouf/aicommit)](https://www.npmjs.com/package/@abd3lraouf/aicommit)

## What is AICommit?

AICommit analyzes your code changes and automatically writes professional commit messages following the [Conventional Commits](https://conventionalcommits.org/) standard. It uses the **[LM Studio JavaScript SDK](https://github.com/lmstudio-ai/lmstudio-js)** to communicate with **[LM Studio](https://lmstudio.ai/)** and run AI models locally on your machine - no cloud services or API keys required!

**Before AICommit:**
```bash
git commit -m "fix stuff"
git commit -m "update files"
git commit -m "changes"
```

**After AICommit:**
```bash
aicommit
# ✨ feat(auth): add user authentication system
# 
# Implement secure login functionality with JWT tokens and password hashing.
# 
# - Add login and registration endpoints
# - Implement JWT token generation and validation
# - Add password hashing with bcrypt
# - Create user authentication middleware
```

## Quick Start

### 1. Install

```bash
npm install -g @abd3lraouf/aicommit
```

### 2. Set up AI Server (LM Studio)

AICommit works with **[LM Studio](https://lmstudio.ai/)** - a user-friendly local AI server. Here's how to set it up:

1. **Download LM Studio**: Visit [lmstudio.ai](https://lmstudio.ai/) and install for your OS
2. **Download Model**: Search for and download `qwen3-4b-teen-emo` 
3. **Load Model**: Click "Load Model" and select `qwen3-4b-teen-emo`
4. **Start Server**: Click "Start Server" (runs on `http://localhost:1234` by default)

### 3. Configure AICommit

```bash
aicommit config
```

This will guide you through setting up your configuration.

### 4. Use it!

```bash
# Make your changes
git add .

# Generate and commit with AI
aicommit
```

## Features

- **🤖 Smart Analysis**: Understands your code changes and writes appropriate messages
- **🏠 Local AI**: Powered by LM Studio SDK - runs entirely on your machine, no cloud required
- **📏 Adaptive Detail**: Small changes get short messages, big changes get detailed ones
- **😊 Emoji Support**: Automatically adds relevant emojis to your commits
- **🔄 Interactive Mode**: Review and edit messages before committing
- **⚙️ Configurable**: Customize everything to match your workflow
- **🔒 Privacy First**: Your code never leaves your machine
- **🎯 Structured Output**: Uses Zod schemas for reliable, type-safe AI responses

## Installation

### Global Installation (Recommended)

```bash
npm install -g @abd3lraouf/aicommit
```

### Local Installation

```bash
npm install @abd3lraouf/aicommit
npx aicommit
```

## Setup

### AI Server Setup

AICommit requires a local AI server to generate commit messages. We **strongly recommend LM Studio** for the best experience:

#### LM Studio (Recommended) 🌟

**Why LM Studio?**
- Easy-to-use graphical interface
- Built-in model management
- Optimized for local inference
- Compatible with AICommit out of the box
- Supports GBNF grammar for structured output

**Setup Steps:**
1. **Download LM Studio**: Visit [lmstudio.ai](https://lmstudio.ai/) and download for your OS
2. **Install a Model**: Search for and download `qwen3-4b-teen-emo`
3. **Load Model**: Click "Load Model" and select the downloaded model
4. **Start Server**: Click "Start Server" in LM Studio (default: `localhost:1234`)

#### Alternative Servers

Other servers that implement the OpenAI chat completions API:
- [Ollama](https://ollama.ai/) with OpenAI compatibility mode
- [LocalAI](https://github.com/go-skynet/LocalAI)
- Custom llama.cpp servers with grammar support

> **Note**: For best results with structured output and GBNF grammar support, we recommend LM Studio.

### Configuration

Run the setup wizard:

```bash
aicommit config
```

Or create a `.aicommitrc.json` file manually:

```json
{
  "api": {
    "host": "localhost",
    "port": 1234,
    "model": "qwen3-4b-teen-emo"
  },
  "cli": {
    "interactive": false,
    "verbose": true
  }
}
```

## Usage

### Basic Usage

```bash
# Stage your changes
git add .

# Generate and commit
aicommit
```

### Interactive Mode

Review and edit the message before committing:

```bash
aicommit --interactive
```

### Dry Run

See what message would be generated without committing:

```bash
aicommit --dry-run
```

### Command Options

| Option | Description |
|--------|-------------|
| `--interactive`, `-i` | Review message before committing |
| `--dry-run`, `-d` | Generate message without committing |
| `--verbose`, `-v` | Show detailed output |
| `--debug` | Show debug information |
| `--help`, `-h` | Show help |

## Examples

### Small Change (1-2 files)
```
🐛 fix(ui): correct button alignment issue

Fix misaligned submit button on the login form.

- Adjust CSS flexbox properties for proper centering
```

### Medium Change (3-5 files)
```
✨ feat(auth): implement user registration

Add complete user registration system with validation and email confirmation.

- Create registration form with input validation
- Add email confirmation workflow
- Implement password strength requirements
- Add user account activation process
```

### Large Change (6+ files)
```
♻️ refactor(api): restructure authentication system

Modernize authentication architecture for better security and maintainability.

- Replace JWT with session-based authentication
- Add OAuth2 integration for social login
- Implement role-based access control (RBAC)
- Create authentication middleware pipeline
- Add comprehensive security headers
- Update API documentation for auth endpoints
- Add integration tests for auth flows
```

## Configuration Options

### API Settings

```json
{
  "api": {
    "host": "localhost",        // AI server hostname
    "port": 1234,              // AI server port
    "endpoint": "/v1/chat/completions", // API endpoint
    "model": "qwen3-4b-teen-emo",       // Model name
    "timeout": 30000           // Request timeout (ms)
  }
}
```

### CLI Settings

```json
{
  "cli": {
    "interactive": false,      // Always review before commit
    "verbose": true,          // Show detailed output
    "debug": false,           // Show debug information
    "dryRun": false          // Never actually commit
  }
}
```

### Configuration Priority

Settings are loaded in this order (highest priority first):

1. Command line arguments (`--api-host=localhost`)
2. Local `.aicommitrc.json` (in your project)
3. Global `.aicommitrc.json` (in your home directory)
4. Environment variables (`AI_API_HOST=localhost`)
5. Default values

## Troubleshooting

### Common Issues

**"No changes detected"**
- Make sure you've staged your changes with `git add`

**"API connection failed"**
- Check that your AI server is running
- Verify the host and port in your configuration
- Test with: `curl http://localhost:1234/v1/models`

**"Not in a git repository"**
- Make sure you're in a Git repository
- Initialize one with `git init` if needed

**Permission errors**
- On Unix systems, run: `chmod +x $(which aicommit)`

### Debug Mode

Get detailed information about what's happening:

```bash
aicommit --debug
```

This shows:
- How your changes are analyzed
- What prompt is sent to the AI
- The raw AI response
- How the final message is formatted

### Test Your Setup

Verify everything is working:

```bash
# Test LM Studio SDK integration
npm run test:lmstudio

# Test AICommit with dry run
aicommit --dry-run --debug

# Legacy API test (for comparison)
npm run test:api
```

## How It Works

1. **Analyzes Changes**: Examines your staged Git changes
2. **Determines Scope**: Counts files and types of changes
3. **Generates Prompt**: Creates a detailed prompt for the AI
4. **Calls AI**: Sends the prompt to your local AI server
5. **Formats Message**: Converts the AI response into a proper commit message
6. **Commits**: Applies the message to your Git repository

## Commit Types & Emojis

AICommit automatically chooses the right type and emoji:

| Type | Emoji | When to use |
|------|-------|-------------|
| feat | ✨ | New features |
| fix | 🐛 | Bug fixes |
| docs | 📝 | Documentation |
| style | 💄 | UI/styling changes |
| refactor | ♻️ | Code restructuring |
| perf | ⚡ | Performance improvements |
| test | ✅ | Adding tests |
| chore | 🔧 | Maintenance tasks |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Abdelraouf Sabri](https://abd3lraouf.dev)

## Support

- 📧 Email: [hello@abd3lraouf.dev](mailto:hello@abd3lraouf.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/abd3lraouf/aicommit/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/abd3lraouf/aicommit/discussions)