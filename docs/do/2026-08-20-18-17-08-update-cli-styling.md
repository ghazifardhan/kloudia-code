# Task Overview
Updated Kloudia CLI visual interface to mirror Antigravity CLI prompt style, including rainbow gradient logo art, metadata layout, horizontal line separator, and minimal prompt styling.

# Changes Made
- Modified `src/ui.ts` ([src/ui.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/src/ui.ts)): Added rainbow block art for 'K' logo, formatted account/model/directory header block, added horizontal line divider, and updated response prefix styling.
- Modified `index.ts` ([index.ts](file:///Users/ghazifadil/Documents/Programming/Projects/linkar/kloudia-cli/index.ts)): Updated input prompt format to standard minimalist `> ` prompt and updated banner invocation arguments.

# Technical Decisions
- Used `picocolors` ANSI helpers to cycle through red, yellow, green, cyan, blue, and magenta for the ASCII block logo row by row.
- Formatted working directory path dynamically with `~` shortcut using `os.homedir()`.

# Verification
- Executed `bun run index.ts` and validated terminal layout rendering.
