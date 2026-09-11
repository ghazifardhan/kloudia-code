# Task Overview
Fixed terminal prompt text duplication when pasting text in terminals without bracketed paste sequence support.

# Changes Made
- `src/multiline-prompt.ts`:
  - Added chunk paste detection (`isChunkPaste = str.length > 1 && !str.startsWith("\x1b")`).
  - Combined `inPasteMode` and `isChunkPaste` into `activePaste`.
  - Deferred line/character level `render()` calls during active paste processing, triggering a single atomic `render()` call at the end of the data chunk event loop.
  - Recompiled binary artifacts `bin/kloudia` and `dist/index.js`.

# Technical Decisions
- Some terminal emulators or stdin configurations pass pasted text in multi-character chunks without bracketed paste escape sequences.
- Deferring re-renders until the entire chunk is inserted avoids per-character cursor reset loops and guarantees clean single-pass text rendering.

# Verification
- Built binaries with `bun run build`.
- Verification succeeded with exit code 0.
