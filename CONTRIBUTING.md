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