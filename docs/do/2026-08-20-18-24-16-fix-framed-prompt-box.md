# Task Overview
Fixed input textfield framing so the prompt `> ` is rendered inside a bordered box (framed by top divider line and bottom divider line) with status footer directly underneath.

# Changes Made
- Modified `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Removed duplicate divider call from `logBanner`.
- Modified `index.ts` ([index.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/index.ts)): Drawn top divider, empty prompt space, bottom divider, status footer, and positioned cursor using `\x1B[3A\r`.

# Technical Decisions
- Using ANSI escape code positioning `\x1B[3A\r` positions the active readline input prompt directly in the empty line between the two horizontal lines.

# Verification
- Ran CLI test and verified the prompt structure matches the user's target screenshot perfectly.
