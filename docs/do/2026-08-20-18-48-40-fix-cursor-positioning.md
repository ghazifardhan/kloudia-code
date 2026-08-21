# Task Overview
Fixed cursor positioning issue where typed text appeared below the bottom divider line instead of inline with `> ` prompt.

# Changes Made
- Rewrote `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Replaced `\x1B[s`/`\x1B[u` (save/restore) with `\x1B[2A` (move up 2 lines) + `\x1B[3G` (move to column 3) which positions cursor exactly after `> ` on the prompt line.
- Rewrote `index.ts` ([index.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/index.ts)): Calls `renderBelowPrompt()` AFTER `rl.question()` has printed `> `, so readline's internal cursor tracking stays consistent with the visible cursor position.
- Recompiled binary `./bin/kloudia`.

# Technical Decisions
- `\x1B[s`/`\x1B[u` failed on macOS Terminal because Bun's compiled binary and the terminal's readline shim handle save/restore differently.
- Calling `renderBelowPrompt()` after `rl.question()` (which is non-blocking in its prompt-print phase) ensures readline has already printed `> ` before we move the cursor.
- `\x1B[3G` sets the cursor to column 3 (1-indexed), placing it exactly after `> ` (2 characters + 1).

# Verification
- Ran `./bin/kloudia`, confirmed layout matches Antigravity CLI with cursor on the prompt line.
