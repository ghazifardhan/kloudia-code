import { confirm, select } from "@clack/prompts";
import { readFile, writeFile } from "fs/promises";
import { execSync, spawnSync } from "child_process";
import { startToolProgress, stopToolProgress } from "./ui";
import { loadSkillContent } from "./skills";

let alwaysAllowMap: Set<string> = new Set();

export function resetPermissions(): void {
  alwaysAllowMap.clear();
}

async function askPermission(action: string): Promise<boolean> {
  const baseAction = action.split(" ")[0];
  if (alwaysAllowMap.has(baseAction)) return true;

  stopToolProgress();

  const decision = await select({
    message: `[SAFETY] Allow action: ${action}?`,
    options: [
      { value: "yes", label: "Yes, allow once" },
      { value: "always", label: "Always allow for this session" },
      { value: "no", label: "No, deny" },
    ],
  });

  if (decision === "always") {
    alwaysAllowMap.add(baseAction);
    startToolProgress(`Executing ${action}...`);
    return true;
  }

  const allowed = decision === "yes";
  if (allowed) {
    startToolProgress(`Executing ${action}...`);
  }
  return allowed;
}

export const toolsDefinition = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read contents of a file",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Write content to a file",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "edit_file",
      description: "Replace target string with new string in a file",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, oldString: { type: "string" }, newString: { type: "string" } },
        required: ["path", "oldString", "newString"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bash",
      description: "Execute bash command",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ls",
      description: "List directory contents",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cd",
      description: "Change working directory",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "git",
      description: "Run git subcommand",
      parameters: {
        type: "object",
        properties: { args: { type: "array", items: { type: "string" } } },
        required: ["args"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "task",
      description: "Delegate sub-task to isolated sub-agent",
      parameters: {
        type: "object",
        properties: { prompt: { type: "string" }, role: { type: "string" } },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "skill",
      description: "Load instructions of a specific skill",
      parameters: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  },
];

export async function executeTool(name: string, args: Record<string, any>, runSubAgent?: (prompt: string, role?: string) => Promise<string>): Promise<string> {
  try {
    switch (name) {
      case "read_file": {
        const filePath = args.path || args.file || args.filename || args.filePath || args.target;
        if (!filePath) return "Error: path argument is required for read_file";
        try {
          return await readFile(filePath, "utf-8");
        } catch (e: any) {
          return `Error reading file ${filePath}: ${e.message}`;
        }
      }
      case "write_file": {
        if (!(await askPermission(`write_file ${args.path}`))) return "Permission denied by user.";
        await writeFile(args.path, args.content, "utf-8");
        return `Successfully wrote to ${args.path}`;
      }
      case "edit_file": {
        if (!(await askPermission(`edit_file ${args.path}`))) return "Permission denied by user.";
        const text = await readFile(args.path, "utf-8");
        if (!text.includes(args.oldString)) return "Error: oldString not found";
        const updated = text.replace(args.oldString, args.newString);
        await writeFile(args.path, updated, "utf-8");
        return `Successfully edited ${args.path}`;
      }
      case "ls": {
        const target = args.path || ".";
        const res = execSync(`ls -la "${target}"`, { encoding: "utf-8" });
        return res;
      }
      case "cd": {
        process.chdir(args.path);
        return `Changed directory to ${process.cwd()}`;
      }
      case "bash": {
        if (!(await askPermission(`bash: ${args.command}`))) return "Permission denied by user.";
        const proc = spawnSync("sh", ["-c", args.command], { encoding: "utf-8" });
        const stdout = proc.stdout || "";
        const stderr = proc.stderr || "";
        return stderr ? `${stdout}\nSTDERR:\n${stderr}` : stdout;
      }
      case "git": {
        const proc = spawnSync("git", args.args || [], { encoding: "utf-8" });
        return proc.stdout || proc.stderr || "";
      }
      case "task": {
        if (!runSubAgent) return "Task delegation handler unavailable";
        return await runSubAgent(args.prompt, args.role);
      }
      case "skill": {
        const content = await loadSkillContent(args.name);
        if (!content) return `Skill '${args.name}' not found.`;
        return `Skill content for '${args.name}':\n${content}`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err: any) {
    return `Tool error (${name}): ${err.message}`;
  }
}
