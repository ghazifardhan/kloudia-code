# Task Overview
Migrated CLI multiline text input prompt to use `@cli-prompts/multiline` library for stable multiline input, native paste support, and clean key navigation.

# Changes Made
- Installed `@cli-prompts/multiline` (v1.0.0).
- `src/multiline-prompt.ts`:
  - Replaced custom terminal ANSI raw mode implementation with `@cli-prompts/multiline` package.
  - Configured prompt prefix (`✦ Kloudia`), input prefix (`>`), and submission instructions (`Press Enter to submit, Shift+Enter for a new line`).
  - Handled `AbortError` gracefully on Ctrl+C / exit.
  - Recompiled binary artifacts `bin/kloudia` and `dist/index.js`.

# Technical Decisions
- Standardizing on `@cli-prompts/multiline` provides robust built-in bracketed paste parsing, line wrapping, word deletion, and cross-terminal key-sequence event handling out of the box.

# Verification
- Installed dependency via `bun add @cli-prompts/multiline`.
- Built binaries using `bun run build`.
- Verification succeeded with exit code 0.
