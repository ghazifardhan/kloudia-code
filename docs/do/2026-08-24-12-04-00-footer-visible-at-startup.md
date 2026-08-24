# Task: Show Footer at Startup

## Task Overview
The footer line (`? for shortcuts ... [BUILD] model · RAM · CPU`) was only visible after submitting the first input. Make it visible at startup before the prompt.

## Changes Made
- **`index.ts`** — Added `logFooter(modelName, currentMode)` call before `multilinePrompt()` so the footer renders at the start of each loop iteration (including the first one), not just after input submission.

## Technical Decisions
- Kept the existing `logFooter` call after submission as well (line 92), so it also shows updated stats between prompts.

## Verification
- `bun run build` completed successfully (exit code 0).
