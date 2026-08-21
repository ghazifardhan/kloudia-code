# 2. Standalone Binary Build and Core Toolset Selection

## Context
Defining distribution strategy and baseline capabilities for `kloudia-cli`.

## Decision
1. Package management: Bun.
2. Binary distribution: Standalone executable compiled via `bun build --compile`.
3. Execution interface: Dual-mode REPL + single-shot CLI command.
4. Core toolset: `read_file`, `write_file`, `edit_file`, `glob`, `grep`, `bash`, `ls`, `cd`, `git`, `task`.

## Consequences
- Fast startup and single binary dependency-free runtime.
- Rich shell/file manipulation features built natively.
