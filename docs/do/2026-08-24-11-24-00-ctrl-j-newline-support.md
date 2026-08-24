# Task: Growing Multiline Text Field for Kloudia CLI

## Task Overview
Replace the single-line `inquirer-autocomplete-prompt` input with a custom growing multiline text field. Pressing Ctrl+J visually inserts a new line and the input area expands in the terminal, similar to Claude Code / Cursor.

## Changes Made
- **`src/multiline-prompt.ts`** (new) — Custom multiline prompt built on raw stdin. Supports:
  - Ctrl+J → insert newline (text field grows)
  - Enter → submit
  - Arrow keys → navigate within text
  - Backspace / Delete → delete characters / merge lines
  - Ctrl+A/E → home / end of line
  - Ctrl+K → kill to end of line
  - Ctrl+U → clear to start of line
  - Ctrl+W → delete word backward
  - Tab → insert 2 spaces
  - Multiline paste support (detects paste vs keypress)
  - Slash command autocomplete via fuzzy matching
- **`index.ts`** — Replaced `inquirer.prompt()` + `setupCtrlJNewline` wrapper with `multilinePrompt()` call. Removed `inquirer-autocomplete-prompt`, `fuzzy`, and Ctrl+J interceptor imports. Removed the `\n` unescape logic since multiline prompt returns real newlines natively.
- **`src/ui.ts`** — Removed the now-unused `setupCtrlJNewline()` / `teardownCtrlJNewline()` functions.

## Technical Decisions
- **Raw stdin approach** — The only way to build a growing text field in the terminal is raw mode stdin with ANSI cursor control. `inquirer-autocomplete-prompt` is fundamentally single-line.
- **ANSI re-rendering** — Each keystroke triggers a full re-render: move cursor to first prompt line (`\x1B[nA`), clear to end of screen (`\x1B[J`), redraw all lines, reposition cursor. Fast enough for interactive use.
- **Paste detection** — Multi-byte data chunks that don't start with `\x1B` (escape sequences) are treated as paste. In paste mode, `\r` is skipped (letting `\n` handle newlines) to correctly handle Windows-style `\r\n` line endings.
- **Kept inquirer** — Still used for the `/editor` command which opens `$EDITOR`.

## Verification
- `bun run build` completed successfully (exit code 0, 956 modules bundled).
- Binary compiled to `bin/kloudia`.
