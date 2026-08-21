# 3. Session Persistence and Project Memory Injection

## Context
Enabling multi-turn conversation memory and project-level custom rules/instructions.

## Decision
1. In-memory REPL state maintains full conversation context across turns.
2. Sessions are persisted to disk at `~/.config/kloudia/sessions/<id>.json`.
3. Project memory (`.kloudia/MEMORY.md`, `CLAUDE.md`, or `AGENTS.md`) is auto-loaded into System Prompt.

## Consequences
- Conversations can be resumed across restarts.
- Harness obeys custom project conventions dynamically.
