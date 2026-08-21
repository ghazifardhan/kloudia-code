# Task Overview
Removed email/account info line from the Kloudia CLI banner display per user request.

# Changes Made
- Modified `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Removed `accountInfo` argument and line from header array.
- Modified `index.ts` ([index.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/index.ts)): Updated `logBanner` call site to omit account info.

# Technical Decisions
- Keeps the header minimal with only App Title & Version, Active Model, and Current Working Directory.

# Verification
- Tested via `bun run index.ts` and confirmed output layout matches expectations.
