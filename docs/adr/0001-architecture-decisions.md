# 1. Multi-Agent CLI Harness Architecture with TypeScript

## Context
Building a custom CLI agent harness using TypeScript and OpenAI SDK with custom endpoint configuration.

## Decision
1. Use Node.js/TypeScript for harness implementation.
2. Support custom API endpoints via `~/.config/kloudia/settings.json` with env var overrides.
3. Use Multi-Agent architecture: Orchestrator delegates via custom tool calls (`task`) to isolated Sub-Agents.
4. Enforce interactive permission prompts for write/shell execution tools.

## Consequences
- Flexible LLM provider selection (any OpenAI-compatible endpoint).
- Lower token consumption due to sub-agent context isolation.
- Safer CLI tool execution via explicit user consent.
