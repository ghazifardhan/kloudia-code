# Task Overview
Fixed hidden user prompt `[SAFETY] Allow action: ...? (y/N):` issue when tools require interactive user permission.

# Changes Made
- Modified `src/tools.ts` ([src/tools.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/tools.ts)): Called `stopSpinner()` before displaying `askPermission` readline question to clear the spinner line and make cursor visible, then resumed `startSpinner()` if allowed.

# Technical Decisions
- Stopping the spinner timer and clearing the terminal line before readline prompt ensures prompt text is clearly visible and user input is captured properly without line overwrite glitch.

# Verification
- Code updated and verified.
