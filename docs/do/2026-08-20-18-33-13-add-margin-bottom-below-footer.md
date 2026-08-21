# Task Overview
Moved the margin-bottom spacing directly underneath the status footer line (`? for shortcuts        gladiator-1.0 · default`).

# Changes Made
- Modified `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Added blank line inside `logFooter()` to create margin-bottom right under the status footer line.
- Recompiled binary `./bin/kloudia` via `bun build index.ts --compile --outfile bin/kloudia`.

# Technical Decisions
- Adding newline right after printing `logFooter()` provides exact spacing under the footer bar.

# Verification
- Recompiled binary successfully.
