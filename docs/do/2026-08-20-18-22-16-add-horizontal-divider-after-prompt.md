# Task Overview
Added horizontal line separator directly below the input prompt (`> `) after user submits input.

# Changes Made
- Modified `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Added `logDivider()` export function.
- Modified `index.ts` ([index.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/index.ts)): Added `logDivider()` call immediately after `rl.question` callback is triggered.

# Technical Decisions
- Ensures visual section separation between prompt input area and response/spinner area exactly like Antigravity CLI.

# Verification
- Code updated and verified.
