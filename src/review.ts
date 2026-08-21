import { execSync } from "child_process";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import pc from "picocolors";
import { runSubAgent } from "./agent";
import { startToolProgress, stopToolProgress, renderMarkdown } from "./ui";

export async function fetchCodeDiffOrContent(target?: string): Promise<{ title: string; content: string }> {
  if (!target || target.trim() === "") {
    try {
      let diff = execSync("git diff HEAD 2>/dev/null", { encoding: "utf-8" }).trim();
      if (!diff) {
        diff = execSync("git diff HEAD~1 2>/dev/null", { encoding: "utf-8" }).trim();
      }
      if (diff) {
        return { title: "Git Diff (Uncommitted / Recent)", content: diff };
      }
    } catch {}
  } else if (existsSync(target)) {
    try {
      const stats = await stat(target);
      if (stats.isFile()) {
        const text = await readFile(target, "utf-8");
        return { title: `File: ${target}`, content: text };
      }
    } catch {}
  } else {
    try {
      const diff = execSync(`git diff ${target} 2>/dev/null`, { encoding: "utf-8" }).trim();
      if (diff) {
        return { title: `Git Diff (${target})`, content: diff };
      }
    } catch {}
  }

  return { title: "Target", content: "No code diff or content found to review." };
}

export async function runCodeReview(target?: string): Promise<string> {
  const { title, content } = await fetchCodeDiffOrContent(target);

  if (content === "No code diff or content found to review.") {
    return pc.yellow("No changes or file content found to review.");
  }

  console.log(`\n${pc.bold(pc.magenta("✦ Kloudia Code Review"))} ${pc.gray(`[${title}]`)}\n`);

  startToolProgress("Standards Auditor", "Checking bugs, security & type-safety");
  const standardsTask = runSubAgent(
    `Perform a rigorous Standards Code Review on the following code/diff. Focus on:
1. Potential bugs, edge cases, and runtime exceptions.
2. Security vulnerabilities and data exposure risks.
3. Type safety, resource leaks, and performance bottlenecks.

Code/Diff:
\`\`\`
${content.slice(0, 15000)}
\`\`\`
Keep the report concise, structured with Markdown headings and bullet points.`,
    "Standards Auditor"
  );

  startToolProgress("Architecture Auditor", "Checking conventions & modularity");
  const architectureTask = runSubAgent(
    `Perform a rigorous Architecture & Conventions Review on the following code/diff. Focus on:
1. Adherence to project conventions, naming styles, and cleanliness.
2. Code modularity, abstraction quality, and maintainability.
3. Recommendations for refactoring or simplification.

Code/Diff:
\`\`\`
${content.slice(0, 15000)}
\`\`\`
Keep the report concise, structured with Markdown headings and bullet points.`,
    "Architecture Auditor"
  );

  const [standardsReport, architectureReport] = await Promise.all([standardsTask, architectureTask]);
  stopToolProgress("Code Review", "", true);

  const fullReport = `
## 🛡️ Standards & Quality Audit
${standardsReport}

---

## 📐 Architecture & Conventions Audit
${architectureReport}
`;

  return renderMarkdown(fullReport);
}
