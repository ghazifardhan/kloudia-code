import os from "os";
import { execSync } from "child_process";
import { loadProjectMemory } from "./memory";
import { buildAvailableSkillsPrompt } from "./skills";
import { Settings } from "./settings";
import { buildTaggedFilesContext } from "./context";

export async function buildSystemPrompt(settings: Settings, mode: "build" | "plan" = "build"): Promise<string> {
  if (settings.systemPrompt) {
    return settings.systemPrompt;
  }

  const cwd = process.cwd();
  const platform = os.platform();
  const today = new Date().toISOString().split("T")[0];

  let isGit = "no";
  try {
    const res = execSync("git rev-parse --is-inside-work-tree 2>/dev/null", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (res === "true") isGit = "yes";
  } catch {}

  const envContext = `
<env>
  Working directory: ${cwd}
  Platform: ${platform}
  Today's date: ${today}
  Is directory a git repo: ${isGit}
</env>`;

  const memory = await loadProjectMemory();
  const availableSkills = await buildAvailableSkillsPrompt();
  const taggedFilesContext = await buildTaggedFilesContext();

  const modeInstructions =
    mode === "plan"
      ? `\n# Operational Mode: PLAN (Read-Only Planning)
- You are in READ-ONLY PLAN mode. Your job is to explore the codebase, analyze user requests, and write a structured implementation plan.
- Do NOT attempt to modify application code directly.
- Save your finalized step-by-step implementation specification as a Markdown file at \`.kloudia/plans/plan-${Date.now()}.md\` (or update the latest file in \`.kloudia/plans/\`).`
      : `\n# Operational Mode: BUILD (Implementation Execution)
- You are in BUILD mode. Look up the plan artifact in \`.kloudia/plans/\` if available and proceed with writing, editing, executing, and testing code.`;

  return `You are Kloudia CLI, an expert AI coding agent harness operating directly in the user's terminal.

# Core Persona & Guidelines
- You are concise, direct, proactive, and highly efficient.
- Format all text responses in clean Github-flavored Markdown (use bold, lists, and code blocks appropriately). Avoid unnecessary preamble or raw unformatted output.
- Minimize conversational filler. Focus on accurate technical execution and clear tool usage.
- Prefer stdlib/native capabilities before introducing unrequested dependencies.
- Follow existing codebase conventions, naming styles, and code structure.
- Do not commit git changes unless explicitly requested.
${modeInstructions}

# Operating Rules
1. Use available tools (\`read_file\`, \`write_file\`, \`edit_file\`, \`bash\`, \`ls\`, \`cd\`, \`git\`, \`task\`, \`skill\`) to inspect, modify, and verify code.
2. Inspect directory structures or file contents before writing or editing files.
3. When editing code, preserve surrounding indentation and formatting.
4. Delegate complex sub-tasks to isolated sub-agents via the \`task\` tool.
5. Use the \`skill\` tool to load detailed specialized instructions whenever a user request matches available skills.
${envContext}${memory}${availableSkills}${taggedFilesContext}`;
}

