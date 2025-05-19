# AI Server Setup for AICommit

To use AICommit with the local API server, you need to set up a server that implements the OpenAI-compatible chat completions API with a specific response format.

## 🌟 Required Model

**[THUDM/GLM-4-32B-Base-0414](https://huggingface.co/THUDM/GLM-4-32B-Base-0414)**

This specific model has been tested and proven to work well with the structured JSON output requirements of AICommit. The default configuration expects this model to be available at `http://192.168.1.2:1234/v1/chat/completions`.

You can modify the connection details in the `.env` file after installation.

## Server Requirements

Your AI server should:

1. Implement an OpenAI-compatible API endpoint at `/v1/chat/completions`
2. Accept POST requests with a JSON payload
3. Return responses in the OpenAI API format
4. Generate JSON output that conforms to our schema

## Response JSON Schema

The model's output **MUST** follow this schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ConventionalCommitMessageNoFooterRequiredExpandedTypes",
  "description": "Schema for a conventional Git commit message with emoji, all fields required except footer. Bullet points should appear with a dash in the final text.",
  "type": "object",
  "properties": {
    "emoji": {
      "description": "An emoji representing the type of change (e.g., ✨ for feat, 🐛 for fix).",
      "type": "string",
      "minLength": 1,
      "maxLength": 10
    },
    "type": {
      "description": "The type of change based on conventional commits.",
      "type": "string",
      "enum": [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "ci",
        "build",
        "revert",
        "merge",
        "deps",
        "breaking",
        "security",
        "config",
        "i18n",
        "release",
        "db",
        "a11y",
        "ux",
        "init"
      ],
      "minLength": 1
    },
    "scope": {
      "description": "The component or scope affected (e.g., parser, api, auth).",
      "type": "string",
      "minLength": 1
    },
    "subject": {
      "description": "A brief, imperative, present tense summary of the change (max 50 chars recommended but not enforced by schema).",
      "type": "string",
      "minLength": 5
    },
    "body": {
      "description": "The commit message body, providing more detail.",
      "type": "object",
      "properties": {
        "summary": {
          "description": "An extended summary in the body.",
          "type": "string",
          "minLength": 1
        },
        "bulletPoints": {
          "description": "Bullet points detailing changes. Each string item corresponds to a line that should be prefixed with a dash in the final text output.",
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 1
        }
      },
      "required": [
        "summary",
        "bulletPoints"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "emoji",
    "type",
    "scope",
    "subject",
    "body"
  ],
  "additionalProperties": false
}
```

## Server Setup

There are several ways to set up your server:

1. **LocalAI**: You can use [LocalAI](https://github.com/go-skynet/LocalAI) which provides OpenAI-compatible API endpoints for local models.

2. **Ollama**: [Ollama](https://github.com/ollama/ollama) with a compatible model and OpenAI API compatibility.

3. **LMStudio**: [LM Studio](https://lmstudio.ai/) provides an easy way to serve models with OpenAI compatibility.

4. **Custom Server**: Implement your own server using frameworks like FastAPI, Express, etc.

## Example Implementation with LocalAI

Here's an example of setting up a server with LocalAI:

```bash
# Install LocalAI (follow instructions from their repository)
git clone https://github.com/go-skynet/LocalAI
cd LocalAI

# Set up with the GLM-4 model
# (Follow model-specific instructions from LocalAI documentation)

# Start the server
docker-compose up -d
```

## Configuration

AICommit comes with a pre-configured `.env` file that uses these default settings:

```
AI_API_HOST=192.168.1.2
AI_API_PORT=1234
AI_API_ENDPOINT=/v1/chat/completions
AI_API_MODEL=local-model
AI_API_TIMEOUT=30000
```

You can modify these settings by editing the `.env` file to match your actual server configuration:

```bash
# Edit the .env file
nano .env
```

## Prompt Design and JSON Output

The system is configured to prompt the AI model to provide output in the required JSON format. Make sure your model is capable of following instructions to produce structured JSON responses.

## Output Format Requirements

Responses from the AI model must follow these specific requirements:

1. **Emoji**: A single emoji representing the type of change (e.g., ✨ for feat, 🐛 for fix)
2. **Type**: One of the conventional commit types (e.g., feat, fix, docs)
3. **Scope**: The component affected (e.g., api, auth)
4. **Subject**: A brief description in imperative tense
5. **Body**: Contains a summary paragraph and bullet points detailing specific changes

This structured format ensures consistent, high-quality commit messages that follow best practices.

Please note that the quality of commit messages depends on the capabilities of the LLM model you choose. We recommend THUDM/GLM-4-32B-Base-0414 because it has demonstrated good performance with our specific requirements.
