# Task Overview
Complete rewrite of Kloudia CLI UI to achieve exact visual parity with Antigravity CLI.

# Changes Made
- Rewrote `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Added `renderPromptBox()` and `clearPromptBox()` functions that use ANSI save/restore cursor (`\x1B[s` / `\x1B[u`) to pre-render the bottom divider and footer below the prompt line before user input.
- Rewrote `index.ts` ([index.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/index.ts)): Updated ask loop to call `renderPromptBox()` before input and `clearPromptBox()` after Enter.
- Recompiled binary `./bin/kloudia`.

# Technical Decisions
- Previous approaches using `\x1B[nA` (move cursor up N lines) failed because different terminal emulators and readline handle cursor movement differently. The `\x1B[s` (save) / `\x1B[u` (restore) pair is universally supported and works reliably because it saves the exact cursor coordinates and restores them precisely.
- The `renderPromptBox()` function writes `> `, saves cursor, writes the lines below, then restores cursor — so readline receives input exactly at the saved position while the user sees the full framed layout.

# Verification
- Ran `./bin/kloudia` and confirmed output matches Antigravity CLI layout: top divider, `> ` prompt, bottom divider, footer status bar.
