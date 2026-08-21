# Context: Coding Agent CLI Harness

## Terms

### Agent Harness
CLI runner responsible for execution loop, routing tasks between agents, executing tool calls, and managing prompt context.

### Semantic Versioning (SemVer)
Strict version specification `MAJOR.MINOR.PATCH` governing release cycles (`PATCH` for bug fixes, `MINOR` for backward-compatible features, `MAJOR` for breaking changes).

### Multi-Agent System
Architecture where an Orchestrator agent delegates specialized sub-tasks (e.g. exploration, editing, execution) to Sub-Agents.

### Skills Engine
Module responsible for discovering, indexing, and loading specialized instruction prompt files (`SKILL.md`) from global (`~/.agents/skills`, `~/.config/kloudia/skills`) and local (`.kloudia/skills`) paths.

### Available Skills System Injection
Pattern of injecting `<available_skills>` metadata list (names & descriptions) into Orchestrator system prompt.

### Skill Loader Tool
Built-in tool `skill({ name })` allowing agent to dynamically fetch full instructions from a selected `SKILL.md`.

### Slash Skill Trigger & Autocomplete
REPL command parser supporting `/<skill_name>` execution and real-time interactive slash completion list upon typing `/`.

### Interactive TUI Engine
Interactive terminal user interface with keyboard history navigation, slash commands (`/help`, `/clear`, `/quit`), streaming responses, and responsive prompt borders.

### Terminal Markdown Syntax Highlighter
Real-time ANSI syntax highlighting for codeblocks, markdown tables, lists, and bold text within the terminal output.

### Interactive Permission Modal
Interactive key-driven selection modal (`[Yes / Always Allow / No]`) for approving tool executions.

### Fluid TUI Engine
Interactive terminal user interface powered by streaming tokens, real-time spinners, and clean component rendering for frictionless UX.

### Streaming LLM Response
Token-by-token real-time rendering of assistant outputs instead of blocking until total completion.

### Collapsible Tool Progress
Minimalist live tree indicator showing tool activity in real-time (`⠋ Reading...` → `✔ Read file (42 lines)`).

### Task Delegation Tool
Custom tool call (`task`) used by Orchestrator to trigger sub-agent execution with isolated context window.

### Sub-Agent Context Isolation
Design pattern where Sub-Agents run in fresh context sessions and return concise summaries to Orchestrator to optimize token usage.

### Session Persistence
Saving and restoring conversation history per session ID in `~/.config/kloudia/sessions/<id>.json`.

### Project Memory Injection
Automatic loading of project instruction memory (`.kloudia/MEMORY.md`, `CLAUDE.md`, or `AGENTS.md`) into system prompt context.

### Core Toolset
Set of native built-in agent capabilities including `read_file`, `write_file`, `edit_file`, `glob`, `grep`, `bash`, `ls`, `cd`, `git`, `task`, and `skill`.

### Global Settings
JSON configuration stored at `~/.config/kloudia/settings.json` (overridable by env vars) containing base URL, API keys, and safety options.

### Tool Execution Safety
Interactive permission strategy asking user approval before executing dangerous operations (e.g. Bash/Write).
