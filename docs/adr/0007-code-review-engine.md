# 7. Built-in Code Review Engine Architecture

## Context
Providing a native, dual-axis code review capability without external plugins.

## Decision
1. Implement `src/review.ts` to inspect git diffs (uncommitted, branch, or commit targets) or specific file paths.
2. Execute two parallel sub-agent audits: Standards (bugs, type safety, security) and Architecture (code conventions & structure).
3. Expose via REPL `/review` command and CLI `kloudia review [target]` subcommand.

## Consequences
- Fast, deep code review leveraging sub-agent parallelism.
- Seamless CLI & REPL experience.
