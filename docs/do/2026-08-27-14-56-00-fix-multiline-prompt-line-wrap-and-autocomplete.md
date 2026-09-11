# Task Overview
Fixed visual prompt duplication issue when pasting long wrapped text while keeping full `/` command autocompletion and `@` file tagging functionality active.

# Changes Made
- `src/multiline-prompt.ts`:
  - Combined exact visual row calculation (`Math.ceil(lineLen / cols)`) with accurate `lastCursorLine = targetCursorRowIndex` offset tracking.
  - Kept interactive autocompletion popups for `/` commands and `@` file tagging intact.
  - Recompiled binary artifacts `bin/kloudia` and `dist/index.js`.

# Technical Decisions
- Preserving both terminal line wrapping calculations and the native autocomplete renderer prevents visual prompt repetition when pasting text across long lines without removing prompt features.

# Verification
- Built binaries with `bun run build`.
- Verification succeeded with exit code 0.
