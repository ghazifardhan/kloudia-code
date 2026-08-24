# Task Summary: Add Tab Autocompletion for @ File Tagging and / Commands

## Task Overview
Added Tab key autocompletion functionality in Kloudia CLI prompt. Users can now type `@calcul` and press `Tab` to auto-complete it to `@calculator.cpp `, or type `/pl` and press `Tab` to auto-complete to `/plan `.

## Changes Made
- Modified `src/multiline-prompt.ts`:
  - Intercepted `Tab` key (`0x09`) press.
  - Added `@` file completion check using `fuzzy.filter` against `opts.projectFiles`. Replaces `@query` with `@bestMatch ` and advances cursor position.
  - Added `/` slash command completion check against `opts.commands`.
  - Kept fallback behavior (inserts 2 spaces) when no `@` or `/` autocomplete matches exist.
- Rebuilt distribution files and standalone binary via `bun run build`.

## Verification
- Built binary using `bun run build` cleanly without build errors.
