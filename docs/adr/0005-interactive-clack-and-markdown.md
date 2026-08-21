# 5. Interactive Clack TUI, Markdown Highlighting & Permission Modals

## Context
Upgrading terminal interactivity with rich prompt elements, syntax-highlighted markdown, and arrow-key modal confirmation.

## Decision
1. Use `@clack/prompts` for interactive prompt boxes, slash commands, and arrow-key selection modals.
2. Render markdown output with syntax highlighting (`marked` + `marked-terminal`).
3. Maintain interactive history buffer for UP/DOWN arrow navigation.

## Consequences
- High-grade interactive terminal UX on par with Claude Code and OpenCode.
- Clear visual hierarchy for tool confirmations and syntax-highlighted code output.
