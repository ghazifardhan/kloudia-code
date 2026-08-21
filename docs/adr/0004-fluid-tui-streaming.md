# 4. Fluid TUI & Real-Time Streaming Architecture

## Context
Standard CLI print methods cause layout flickering and slow user feedback loops.

## Decision
1. Implement real-time streaming LLM completion (`stream: true`) with stdout delta chunks.
2. Use clean collapsible status tree indicators for tool execution (`⠋ executing` -> `✔ done`).
3. Streamline interactive prompt input loop without terminal line pollution.

## Consequences
- Immediate visual response (sub-100ms first token latency).
- Smooth, non-flickering terminal UX mimicking Claude Code / OpenCode.
