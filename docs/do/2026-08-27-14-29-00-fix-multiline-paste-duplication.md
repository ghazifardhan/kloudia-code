# Task Overview
Fixed input text field duplicated rendering bug when pasting text containing newlines or long text blocks into the CLI prompt.

# Changes Made
- `src/multiline-prompt.ts`:
  - Enabled terminal **Bracketed Paste Mode** (`\x1b[?2004h` / `\x1b[?2004l`).
  - Added paste state tracking (`inPasteMode`) to parse paste sequences (`\x1b[200~` and `\x1b[201~`).
  - Suppressed intermediate `render()` re-draws for every pasted character/newline until the paste sequence completes, preventing ANSI screen reset loops (`\x1B[A` / `\x1B[J`) from duplicating previous prompt output lines.
  - Recompiled binary at `bin/kloudia` and `dist/index.js`.

# Technical Decisions
- Standard terminals emit bracketed paste sequence `\x1b[200~ ... \x1b[201~` when text is pasted.
- Without bracketed paste handling, `onData` processed pasted input character by character and line by line while calling `render()` for each character, which cleared the screen and re-rendered existing text repeatedly when line wrapping or newlines occurred.
- Batching updates during paste mode fixes visual repetition and substantially speeds up long pastes.

# Verification
- Built binary using `bun run build`.
- Verified binary compilation succeeded with exit code 0.
