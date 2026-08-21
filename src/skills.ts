import { homedir } from "os";
import { join } from "path";
import { readdir, readFile } from "fs/promises";
import { existsSync } from "fs";

export interface SkillMeta {
  name: string;
  description: string;
  location: string;
}

function parseFrontmatter(text: string): { name?: string; description?: string; content: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { content: text };

  const yamlStr = match[1];
  const content = match[2];

  const nameMatch = yamlStr.match(/^name:\s*(.+)$/m);
  const descMatch = yamlStr.match(/^description:\s*(.+)$/m);

  return {
    name: nameMatch ? nameMatch[1].trim().replace(/^["']|["']$/g, "") : undefined,
    description: descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, "") : undefined,
    content,
  };
}

export async function discoverSkills(): Promise<SkillMeta[]> {
  const cwd = process.cwd();
  const searchDirs = [
    join(cwd, ".kloudia", "skills"),
    join(homedir(), ".config", "kloudia", "skills"),
    join(homedir(), ".agents", "skills"),
  ];

  const skillsMap = new Map<string, SkillMeta>();

  for (const dir of searchDirs) {
    try {
      const subdirs = await readdir(dir, { withFileTypes: true });
      for (const entry of subdirs) {
        if (entry.isDirectory()) {
          const skillFilePath = join(dir, entry.name, "SKILL.md");
          try {
            if (existsSync(skillFilePath)) {
              const text = await readFile(skillFilePath, "utf-8");
              const parsed = parseFrontmatter(text);
              const name = parsed.name || entry.name;
              const description = parsed.description || "No description provided.";
              if (!skillsMap.has(name)) {
                skillsMap.set(name, {
                  name,
                  description,
                  location: skillFilePath,
                });
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  return Array.from(skillsMap.values());
}

export async function loadSkillContent(skillName: string): Promise<string | null> {
  const skills = await discoverSkills();
  const target = skills.find((s) => s.name === skillName);
  if (!target) return null;

  try {
    if (existsSync(target.location)) {
      const text = await readFile(target.location, "utf-8");
      const { content } = parseFrontmatter(text);
      return content.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function buildAvailableSkillsPrompt(): Promise<string> {
  const skills = await discoverSkills();
  if (skills.length === 0) return "";

  let prompt = "\n\n<available_skills>\n";
  for (const s of skills) {
    prompt += `  <skill>\n    <name>${s.name}</name>\n    <description>${s.description}</description>\n    <location>${s.location}</location>\n  </skill>\n`;
  }
  prompt += "</available_skills>\nUse the 'skill' tool to load full instructions when a user task matches one of the skills.";
  return prompt;
}
