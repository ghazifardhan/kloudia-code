# Task Overview
Removed ANSI cursor manipulation code that caused visual glitches when launching `./bin/kloudia` in terminal emulator.

# Changes Made
- Modified `index.ts` ([index.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/index.ts)): Updated readline loop to reliably display the top divider, prompt line, bottom divider, and footer status sequentially.
- Recompiled binary `./bin/kloudia` using `bun build index.ts --compile --outfile bin/kloudia`.

# Technical Decisions
- Removing terminal cursor manipulation ANSI sequences prevents terminal emulators (iTerm2, macOS Terminal, VSCode Terminal) from suppressing or collapsing the rendered divider lines.

# Verification
- Tested and compiled successfully.
