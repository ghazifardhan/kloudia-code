# Task Overview
Restored `/` command shortcut autocompletion, `@` file tagging autocompletion, and bottom status footer bar in multiline prompt editor.

# Changes Made
- Restored original custom prompt engine in `src/multiline-prompt.ts`.
- Re-enabled interactive autocompletion popups for `/` commands and `@` file tagging.
- Retained bracketed paste support (`\x1b[?2004h`) for smooth pasting without missing prompt features.
- Recompiled binary artifacts `bin/kloudia` and `dist/index.js`.

# Technical Decisions
- External `@cli-prompts/multiline` package lacked custom popup completion triggers for `/` command suggestions, `@` project file autocomplete, and live status footer rendering.
- Reverting to the custom prompt implementation preserves all prompt features required for client demos.

# Verification
- Built binaries with `bun run build`.
- Verification succeeded with exit code 0.
