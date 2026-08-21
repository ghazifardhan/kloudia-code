# Kloudia Code (`kloudia`)

An AI Coding Agent CLI Harness featuring multi-agent orchestration, real-time streaming completions, skills discovery engine, interactive TUI, session persistence, and project instruction memory injection.

---

## ⚡ Quick Start

### Installation via NPM

```bash
npm i -g kloudia-code
```

After installation, launch the CLI harness from any project directory:

```bash
kloudia
```

---

## 🚀 Features

- **Multi-Agent Orchestration**: Orchestrator agent delegates complex tasks to isolated sub-agents via dynamic `task` calls.
- **Custom OpenAI-Compatible Endpoints**: Works with OpenAI, Ollama, LocalAI, vLLM, or any OpenAI-compatible provider.
- **Real-Time Streaming & Formatting**: Token-by-token streaming response rendered with ANSI Markdown syntax highlighting.
- **Interactive TUI**: Non-blocking real-time slash (`/`) command autocomplete, custom spinners, and keyboard-driven permission modals (`[Yes / Always Allow / No]`).
- **Skills Engine Integration**: Auto-discovers `SKILL.md` instruction files globally (`~/.agents/skills`, `~/.config/kloudia/skills`) and locally (`.kloudia/skills`).
- **Session Persistence**: Auto-saves conversation turns to disk per session ID. Easily list and resume sessions anytime.
- **Project Memory Injection**: Auto-loads `.kloudia/MEMORY.md`, `CLAUDE.md`, or `AGENTS.md` into the system prompt context.
- **Core Native Toolset**: Integrated capabilities for `read_file`, `write_file`, `edit_file`, `bash`, `ls`, `cd`, `git`, `task`, and `skill`.

---

## ⚙️ Configuration

Create or update your global settings file at `~/.config/kloudia/settings.json`:

```json
{
  "apiKey": "your-openai-api-key",
  "baseUrl": "https://api.openai.com/v1",
  "model": "gpt-4o"
}
```

*Note: Environment variables (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`) override settings file values.*

---

## 💻 Usage & Commands

### Interactive REPL Mode
```bash
kloudia
```

### Direct Single-Shot Execution
```bash
kloudia "Inspect index.ts and fix failing tests"
```

### Resume Session
```bash
kloudia --resume <session_id>
# or
kloudia -r <session_id>
```

### List Saved Sessions
```bash
kloudia sessions
```

### REPL Slash Commands
Type `/` inside REPL to trigger the interactive completion menu:
- `/quit`: Save session and exit.
- `/clear`: Clear terminal screen.
- `/sessions`: List saved session IDs.
- `/<skill_name>`: Execute a specific loaded skill (e.g. `/grill-with-docs`, `/code-review`).

---

## 🛠️ Built With

- **Runtime**: [Bun](https://bun.sh)
- **UI Frameworks**: `@clack/prompts`, `inquirer`, `picocolors`
- **Markdown Renderer**: `marked`, `marked-terminal`
- **LLM Engine**: `openai` SDK

---

## 📄 License

MIT
