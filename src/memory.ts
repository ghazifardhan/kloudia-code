import { join } from "path";

export async function loadProjectMemory(): Promise<string> {
  const cwd = process.cwd();
  const memoryCandidates = [
    join(cwd, ".kloudia", "MEMORY.md"),
    join(cwd, "CLAUDE.md"),
    join(cwd, "AGENTS.md"),
  ];

  for (const candidate of memoryCandidates) {
    try {
      const file = Bun.file(candidate);
      if (await file.exists()) {
        const text = await file.text();
        return `\nProject Memory (${candidate}):\n${text}`;
      }
    } catch {}
  }

  return "";
}
