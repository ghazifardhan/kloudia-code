# Task Overview
Resolved long line-wrap calculation error causing multiline prompt duplication on paste and bumped CLI package version to v1.11.1.

# Changes Made
- `package.json`:
  - Bumped version from `1.11.0` to `1.11.1`.
- `src/multiline-prompt.ts`:
  - Fixed total rendered terminal line count calculation by incorporating `process.stdout.columns` text wrapping.
  - Calculated exact visual sub-rows for lines longer than terminal width (`Math.ceil(lineLen / cols)`).
  - Updated cursor repositioning movement (`\x1B[<moveUp>A` and `\x1B[<targetColIndex>G`) to move relative to visual terminal rows rather than un-wrapped logical line indices.
  - Recompiled binaries (`bin/kloudia` & `dist/index.js`).

# Technical Decisions
- Long single-line strings (such as long `console.log(...)` lines) wrap into multiple terminal visual rows when pasted.
- Previously, `lastCursorLine` and cursor positioning only counted logical `lines.length`. When a line wrapped into 3 visual rows, moving up by `lines.length` was insufficient to reach the top of the prompt prompt, leaving previous wrapped rows behind on screen when cleared via `\x1B[J`, resulting in duplicate text prints.
- Calculating `totalRenderedRows` based on actual terminal columns (`cols`) ensures full cleanup of all visual lines during `render()`.

# Verification
- Built binaries with `bun run build`.
- Verified binary compilation succeeded with exit code 0.
