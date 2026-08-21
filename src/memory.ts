import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function loadProjectMemory(): Promise<string> {
  const cwd = process.cwd();
  const memoryCandidates = [
    join(cwd, ".kloudia", "MEMORY.md"),
    join(cwd, "CLAUDE.md"),
    join(cwd, "AGENTS.md"),
  ];

  for (const candidate of memoryCandidates) {
    try {
      if (existsSync(candidate)) {
        const text = await readFile(candidate, "utf-8");
        return `\nProject Memory (${candidate}):\n${text}`;
      }
    } catch {}
  }

  return "";
}
