import { readFile, readdir, stat } from "fs/promises";
import path from "path";

const taggedFiles: Set<string> = new Set();

export function addTaggedFile(filePath: string): string {
  const resolved = path.resolve(process.cwd(), filePath);
  taggedFiles.add(resolved);
  return resolved;
}

export function removeTaggedFile(filePath: string): boolean {
  const resolved = path.resolve(process.cwd(), filePath);
  return taggedFiles.delete(resolved);
}

export function getTaggedFiles(): string[] {
  return Array.from(taggedFiles);
}

export function clearTaggedFiles(): void {
  taggedFiles.clear();
}

export async function buildTaggedFilesContext(): Promise<string> {
  if (taggedFiles.size === 0) return "";

  let context = "\n# Tagged Context Files\n";
  context += "The user has explicitly tagged the following files to be attached to your context:\n\n";

  for (const filePath of taggedFiles) {
    try {
      const relativePath = path.relative(process.cwd(), filePath);
      const content = await readFile(filePath, "utf-8");
      context += `\`\`\`${relativePath}\n${content}\n\`\`\`\n\n`;
    } catch (err: any) {
      context += `[Error reading tagged file ${filePath}: ${err.message}]\n\n`;
    }
  }

  return context;
}

const ignoredDirs = new Set(["node_modules", ".git", "dist", "build", ".next", ".kloudia", ".gemini", "bin"]);

export async function listProjectFiles(dir: string = process.cwd(), depth: number = 0): Promise<string[]> {
  if (depth > 4) return [];
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".env") continue;
      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) continue;
        const subFiles = await listProjectFiles(path.join(dir, entry.name), depth + 1);
        results.push(...subFiles);
      } else if (entry.isFile()) {
        const rel = path.relative(process.cwd(), path.join(dir, entry.name));
        results.push(rel);
      }
    }
  } catch {}
  return results;
}

