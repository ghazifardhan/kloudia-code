# 8. Agent Client Protocol (ACP) & Zed Editor Integration

## Context
Providing native editor integration with Zed Editor via the Agent Client Protocol (ACP).

## Decision
1. Implement `kloudia acp` (ACP Server Mode) communicating over stdio JSON-RPC.
2. Provide `kloudia setup zed` command to automatically register Kloudia in `~/.config/zed/settings.json`.
3. Support ACP streaming responses and native tool execution requests.

## Consequences
- Kloudia can be selected natively inside Zed Editor's Agent Panel and Threads Sidebar.
