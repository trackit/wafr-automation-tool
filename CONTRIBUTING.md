# Contributing to WAFR Automation Tool

Thank you for your interest in contributing to WAFR Automation Tool! We welcome your PRs, issues, feedback, and other contributions to this open source repository. To keep things moving smoothly, please use the following guidelines when working with the WAFR Automation Tool source code.

## License

By contributing code to WAFR Automation Tool, you warrant that you either have the rights to your contributions or have obtained the necessary permissions to license them under the [repository license](./LICENSE), ensuring that your code can be legally distributed under these terms.

## Getting Started

Please read our [README](./README.md#getting-started) for information on getting setup to use and develop WAFR Automation Tool locally.

## Development Setup

- Install dependencies with `pnpm install`
- Use `pnpm run start:webui` for the frontend dev server
- Use `pnpm run test:backend:init` to initialize backend test settings

## Code Style

- Run `pnpm run lint` to check linting issues
- Run `pnpm run format:check` to validate formatting
- Run `pnpm run format` to apply formatting changes

## Testing

- Backend tests: `pnpm run test:backend`
- Frontend tests: `pnpm run test:webui`
- Full test suite: `pnpm run test`

## Commit Messages

Use concise, present-tense commit messages that describe the change. Example: `feat: add validation for assessment payload`.

## Questions?

Please ask all questions in the form of GitHub issues.
