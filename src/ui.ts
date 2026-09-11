import pc from "picocolors";
import os from "os";
import { marked } from "marked";
import markedTerminal from "marked-terminal";

marked.setOptions({
  // @ts-ignore
  renderer: new markedTerminal({
    tab: 2,
  }),
});

export function renderMarkdown(text: string): string {
  try {
    const raw = marked.parse(text) as string;
    // Trim excessive trailing/leading newlines and collapse multiple blank lines
    return raw
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return text.trim();
  }
}

export function logBanner(version: string, model: string) {
  const cwd = process.cwd().replace(os.homedir(), "~");

  console.log();
  console.log(`  ${pc.bold(pc.magenta("✦ Kloudia"))} ${pc.gray(`v${version}`)} ${pc.gray("·")} ${pc.gray(model)}`);
  console.log(`  ${pc.gray(cwd)}`);
  console.log();
}

export function logDivider() {
  const width = Math.min(process.stdout.columns || 80, 80);
  console.log(pc.gray("─".repeat(width)));
}

let prevCpuUsage = process.cpuUsage();
let prevCpuTime = Date.now();

export function getResourceStats(): string {
  const ramMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

  const currentCpuUsage = process.cpuUsage(prevCpuUsage);
  const currentTime = Date.now();
  const timeDiff = (currentTime - prevCpuTime) * 1000;

  prevCpuUsage = process.cpuUsage();
  prevCpuTime = currentTime;

  let cpuPercent = "0.0";
  if (timeDiff > 0) {
    const totalCpuMicros = currentCpuUsage.user + currentCpuUsage.system;
    cpuPercent = ((totalCpuMicros / timeDiff) * 100).toFixed(1);
  }

  return `${ramMB} MB · CPU ${cpuPercent}%`;
}

export function logFooter(model: string, mode: "build" | "plan" = "build") {
  const left = pc.gray("? for shortcuts");
  const stats = getResourceStats();
  const modeTag = mode === "plan" ? pc.bold(pc.yellow("[PLAN]")) : pc.bold(pc.green("[BUILD]"));
  const rightStr = `${modeTag} ${model} · ${stats}`;
  const rightPlain = `[${mode.toUpperCase()}] ${model} · ${stats}`;
  const columns = Math.min(process.stdout.columns || 80, 80);
  const padding = Math.max(0, columns - 15 - rightPlain.length);
  console.log(`${left}${" ".repeat(padding)}${rightStr}`);
}

function formatToolAction(name: string, rawArgs?: string): string {
  try {
    const args = JSON.parse(rawArgs || "{}");
    switch (name) {
      case "read_file":
        return `Read ${args.path || args.file || args.filename || "file"}`;
      case "write_file":
        return `Write ${args.path || "file"}`;
      case "edit_file":
        return `Edit ${args.path || "file"}`;
      case "ls":
        return `List ${args.path || "current directory"}`;
      case "cd":
        return `Change directory to ${args.path || "home"}`;
      case "bash":
        return `Bash ${args.command || ""}`;
      case "git":
        return `Git ${(args.args || []).join(" ")}`;
      case "task":
        return `Delegate task: ${args.prompt || ""}`;
      case "skill":
        return `Load skill: ${args.name || ""}`;
      default:
        return `${name} ${rawArgs || ""}`;
    }
  } catch {
    return `${name} ${rawArgs || ""}`;
  }
}

let activeSpinner: { timer: NodeJS.Timeout } | null = null;

export function startToolProgress(name: string, detail?: string) {
  stopToolProgress();
  const actionText = formatToolAction(name, detail);
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  process.stdout.write("\x1B[?25l");
  const timer = setInterval(() => {
    const frame = pc.cyan(frames[i % frames.length]);
    process.stdout.write(`\r  ${pc.magenta("●")} ${pc.bold(pc.white(actionText))} ${frame}\x1B[K`);
    i++;
  }, 80);
  activeSpinner = { timer };
}

export function stopToolProgress(name?: string, rawArgs?: string, success: boolean = true) {
  if (activeSpinner) {
    clearInterval(activeSpinner.timer);
    activeSpinner = null;
    process.stdout.write("\r\x1B[K");
    process.stdout.write("\x1B[?25h");
    if (name) {
      const actionText = formatToolAction(name, rawArgs);
      const icon = success ? pc.green("✔") : pc.red("✖");
      console.log(`  ${pc.magenta("●")} ${pc.bold(pc.white(actionText))}`);
      console.log(`    ${pc.gray("└─")} ${icon} ${pc.gray(success ? "Done" : "Failed")}`);
    }
  }
}
