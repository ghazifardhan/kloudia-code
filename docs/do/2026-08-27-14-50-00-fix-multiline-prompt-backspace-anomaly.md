# Task Overview
Fixed visual anomaly where pressing Backspace or typing in empty multiline prompt caused the cursor to jump up into the previous output history and duplicate the input line.

# Changes Made
- `src/multiline-prompt.ts`:
  - Fixed `lastCursorLine` variable assignment inside `render()`.
  - Changed `lastCursorLine = totalRenderedRows` to `lastCursorLine = targetCursorRowIndex`.
  - Recompiled binary artifacts `bin/kloudia` and `dist/index.js`.

# Technical Decisions
- At the end of `render()`, the terminal cursor is left at `targetCursorRowIndex` (the prompt input line), NOT at the very bottom line (`totalRenderedRows` - footer/suggestions).
- Previously setting `lastCursorLine = totalRenderedRows` caused the next render pass (`\x1B[${lastCursorLine}A`) to move the terminal cursor **too far up** (past the top of the current prompt and into previous terminal output), resulting in duplicate lines and visual corruption on every keypress or backspace.

# Verification
- Built binaries with `bun run build`.
- Verification succeeded with exit code 0.
