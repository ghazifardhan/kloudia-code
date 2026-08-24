# 9. Plan and Build Operational Modes

## Context
Providing distinct operational phases: Read-Only Planning (`/plan`) and Implementation Execution (`/build`).

## Decision
1. In `/plan` mode, only read-only tools (`read_file`, `ls`, `cd`, `git`, `task`, `skill`) are active. Agent writes plan artifacts to `.kloudia/plans/plan-<timestamp>.md`.
2. In `/build` mode, all tools (including `write_file`, `edit_file`, `bash`) are unlocked to execute implementation plans.
3. Active mode is indicated visually in the CLI footer `[PLAN]` / `[BUILD]`.

## Consequences
- Safer codebase exploration and explicit plan verification before code modifications.
