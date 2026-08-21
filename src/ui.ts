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

export function logFooter(model: string) {
  const left = pc.gray("? for shortcuts");
  const right = pc.gray(`${model} · default`);
  const columns = Math.min(process.stdout.columns || 80, 80);
  const padding = Math.max(0, columns - 15 - (model.length + 10));
  console.log(`${left}${" ".repeat(padding)}${right}`);
}

function formatToolAction(name: string, rawArgs?: string): string {
  try {
    const args = JSON.parse(rawArgs || "{}");
    switch (name) {
      case "read_file":
        return `Read ${args.path || "file"}`;
      case "write_file":
        return `Wrote ${args.path || "file"}`;
      case "edit_file":
        return `Edited ${args.path || "file"}`;
      case "ls":
        return `Listed ${args.path || "current directory"}`;
      case "cd":
        return `Changed directory to ${args.path || "home"}`;
      case "bash":
        return `Ran command: ${args.command || ""}`;
      case "git":
        return `Ran git ${(args.args || []).join(" ")}`;
      case "task":
        return `Delegated sub-task: ${args.prompt || ""}`;
      case "skill":
        return `Loaded skill: ${args.name || ""}`;
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
    process.stdout.write(`\r  ${frame} ${pc.white(actionText)}\x1B[K`);
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
      console.log(`  ${icon} ${pc.gray(actionText)}`);
    }
  }
}
