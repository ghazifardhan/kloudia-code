# Task Overview
Added an animated braille spinner loading indicator (`Thinking...` / `Executing <tool>...`) while the AI model is generating responses or running tools.

# Changes Made
- Modified `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Added `startSpinner` and `stopSpinner` functions using cyan braille frames (`⠋`, `⠙`, `⠹`, etc.) and cursor toggling.
- Modified `src/agent.ts` ([src/agent.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/agent.ts)): Wrapped LLM API calls and tool executions with `startSpinner()` and `stopSpinner()` in `try...finally` blocks.

# Technical Decisions
- Used `try...finally` blocks around async API requests and tool execution to guarantee that the cursor is restored and line is cleared even if an error occurs.
- Set interval to 80ms for smooth animation matching standard terminal spinners.

# Verification
- Verified spinner helper functions compile without TypeScript errors and integrate seamlessly with `runAgentLoop`.
