#!/usr/bin/env node
import inquirer from "inquirer";
import pc from "picocolors";
import path from "path";
import { runAgentLoop } from "./src/agent";
import { loadSession, saveSession, listSessions } from "./src/session";
import { loadSettings } from "./src/settings";
import { discoverSkills, loadSkillContent } from "./src/skills";
import { runCodeReview } from "./src/review";
import { startAcpServer } from "./src/acp";
import { setupZedIntegration } from "./src/zed";
import { resetPermissions } from "./src/tools";
import { logBanner, logDivider, logFooter } from "./src/ui";
import { multilinePrompt } from "./src/multiline-prompt";
import { addTaggedFile, removeTaggedFile, getTaggedFiles, clearTaggedFiles, listProjectFiles } from "./src/context";

import pkg from "./package.json";

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "acp" || args[0] === "--acp") {
    await startAcpServer();
    return;
  }

  if (args[0] === "setup" && (args[1] === "zed" || args[1] === "--editor")) {
    await setupZedIntegration();
    process.exit(0);
  }

  if (args[0] === "review") {
    const target = args[1];
    const report = await runCodeReview(target);
    console.log(report);
    process.exit(0);
  }

  if (args[0] === "sessions" || args[0] === "session:list") {
    const sessions = await listSessions();
    console.log(pc.bold(pc.magenta("\nSaved Sessions:")));
    sessions.forEach((s) => console.log(`  ${pc.yellow("•")} ${pc.bold(s.id)} ${pc.gray(`(${s.updatedAt})`)}`));
    console.log();
    process.exit(0);
  }

  let sessionId = `session-${Date.now()}`;

  const resumeIdx = args.findIndex((a) => a === "--resume" || a === "-r" || a === "--session" || a === "-s");
  if (resumeIdx !== -1 && args[resumeIdx + 1]) {
    sessionId = args[resumeIdx + 1];
    args.splice(resumeIdx, 2);
  }

  let history = await loadSession(sessionId);

  if (args.length > 0) {
    const prompt = args.join(" ");
    const { updatedHistory } = await runAgentLoop(prompt, history);
    await saveSession(sessionId, updatedHistory);
    process.exit(0);
  }

  const settings = await loadSettings();
  const modelName = settings.model || "gpt-4o";

  logBanner(pkg.version || "1.0.0", modelName);

  let currentMode: "build" | "plan" = "build";

  while (true) {
    logDivider();
    const skills = await discoverSkills();
    const projectFiles = await listProjectFiles();
    const commandList = [
      { name: "/plan - Switch to Read-Only Plan mode (generate architectural spec)", value: "/plan" },
      { name: "/build - Switch to Implementation Build mode (full tool access)", value: "/build" },
      { name: "/tag <file> - Tag a file to include in LLM context", value: "/tag" },
      { name: "/untag <file> - Remove a tagged file from context", value: "/untag" },
      { name: "/context - List or clear currently tagged files", value: "/context" },
      { name: "/review - Run AI Code Review on uncommitted diff or file", value: "/review" },
      { name: "/reset-permissions - Reset session tool execution permissions", value: "/reset-permissions" },
      { name: "/quit - Exit Kloudia CLI", value: "/quit" },
      { name: "/clear - Clear terminal screen", value: "/clear" },
      { name: "/sessions - List saved sessions", value: "/sessions" },
      ...skills.map((s) => ({
        name: `/${s.name} - ${s.description.slice(0, 50)}`,
        value: `/${s.name}`,
      })),
    ];

    const input = await multilinePrompt({
      commands: commandList,
      projectFiles,
      model: modelName,
      mode: currentMode,
    });
    const trimmed = input.trim();
    if (!trimmed) continue;

    logDivider();

    // Auto-tag any @file mentioned in the input prompt
    const atMentions = trimmed.match(/@([^\s]+)/g);
    if (atMentions) {
      for (const m of atMentions) {
        const filePath = m.slice(1);
        const resolved = addTaggedFile(filePath);
        console.log(`${pc.gray("[Context]")} ${pc.green("✔ Auto-tagged file:")} ${pc.cyan(path.relative(process.cwd(), resolved))}`);
      }
    }



    if (trimmed === "/plan") {
      currentMode = "plan";
      console.log(`\n${pc.bold(pc.yellow("✔ Switched to PLAN mode"))} ${pc.gray("(Read-Only architectural planning + .kloudia/plans/ artifact generation)")}`);
      continue;
    }

    if (trimmed === "/build") {
      currentMode = "build";
      console.log(`\n${pc.bold(pc.green("✔ Switched to BUILD mode"))} ${pc.gray("(Full implementation & tool access unlocked)")}`);
      continue;
    }

    if (trimmed.startsWith("/tag")) {
      const targetPath = trimmed.replace(/^\/tag\s*/, "").trim();
      if (!targetPath) {
        console.log(pc.yellow("\nUsage: /tag <filepath> (e.g. /tag src/index.ts)"));
      } else {
        const added = addTaggedFile(targetPath);
        const rel = path.relative(process.cwd(), added);
        console.log(`\n${pc.bold(pc.green("✔ Tagged file for context:"))} ${pc.cyan(rel)}`);
      }
      continue;
    }

    if (trimmed.startsWith("/untag")) {
      const targetPath = trimmed.replace(/^\/untag\s*/, "").trim();
      if (!targetPath) {
        console.log(pc.yellow("\nUsage: /untag <filepath>"));
      } else {
        const removed = removeTaggedFile(targetPath);
        if (removed) {
          console.log(`\n${pc.bold(pc.green("✔ Untagged file:"))} ${pc.cyan(targetPath)}`);
        } else {
          console.log(`\n${pc.yellow("⚠ File was not tagged:")} ${pc.cyan(targetPath)}`);
        }
      }
      continue;
    }

    if (trimmed.startsWith("/context")) {
      const sub = trimmed.replace(/^\/context\s*/, "").trim();
      if (sub === "clear") {
        clearTaggedFiles();
        console.log(`\n${pc.bold(pc.green("✔ Cleared all tagged files from context."))}`);
      } else {
        const tagged = getTaggedFiles();
        if (tagged.length === 0) {
          console.log(`\n${pc.gray("No files tagged in context. Use /tag <filepath> to tag files.")}`);
        } else {
          console.log(`\n${pc.bold(pc.cyan("Currently Tagged Files in Context:"))}`);
          tagged.forEach((f) => {
            console.log(`  ${pc.green("•")} ${path.relative(process.cwd(), f)}`);
          });
        }
      }
      continue;
    }


    if (trimmed === "/quit" || trimmed === "exit" || trimmed === "quit") {
      console.log(`\n${pc.green("✔")} Session saved (${pc.bold(sessionId)}). Resume anytime using:`);
      console.log(pc.bold(pc.yellow(`  bin/kloudia --resume ${sessionId}\n`)));
      process.exit(0);
    }

    if (trimmed === "/clear") {
      console.clear();
      logBanner(pkg.version || "1.0.0", modelName);
      continue;
    }

    if (trimmed === "/editor") {
      const edAnswer = await inquirer.prompt([
        {
          type: "editor",
          name: "text",
          message: "Write your multi-line prompt:",
        },
      ]);
      const edTrimmed = (edAnswer.text || "").trim();
      if (!edTrimmed) continue;
      
      try {
        console.log(`\n${pc.bold(pc.white(edTrimmed))}`);
        const controller = new AbortController();
        let wasCancelled = false;
        const sigintHandler = () => {
          wasCancelled = true;
          controller.abort();
          console.log(pc.yellow("\n✖ Prompt cancelled by user (Ctrl+C)."));
        };
        process.on("SIGINT", sigintHandler);
        try {
          const { updatedHistory } = await runAgentLoop(edTrimmed, history, false, controller.signal);
          if (!wasCancelled) {
            history = updatedHistory;
            await saveSession(sessionId, history);
          }
        } catch (err: any) {
          if (!wasCancelled && !err.message?.includes("cancelled")) {
            console.error(pc.red(`Error: ${err.message}`));
          }
        } finally {
          process.off("SIGINT", sigintHandler);
        }
      } catch (err: any) {
        console.error(pc.red(`Error: ${err.message}`));
      }
      continue;
    }

    if (trimmed === "/reset-permissions") {
      resetPermissions();
      console.log(`\n${pc.green("✔")} Tool execution permissions cleared for this session.`);
      continue;
    }

    if (trimmed === "/sessions") {
      const sessions = await listSessions();
      console.log(pc.bold(pc.magenta("\nSaved Sessions:")));
      sessions.forEach((s) => console.log(`  ${pc.yellow("•")} ${pc.bold(s.id)} ${pc.gray(`(${s.updatedAt})`)}`));
      console.log();
      continue;
    }

    if (trimmed.startsWith("/review")) {
      const reviewTarget = trimmed.replace(/^\/review\s*/, "").trim();
      const report = await runCodeReview(reviewTarget);
      console.log(report);
      continue;
    }

    let promptToRun = trimmed;
    if (trimmed.startsWith("/")) {
      const targetSkillName = trimmed.slice(1);
      const skillContent = await loadSkillContent(targetSkillName);
      if (skillContent) {
        promptToRun = `Execute skill '${targetSkillName}':\n${skillContent}`;
      } else {
        console.log(pc.red(`\nUnknown command or skill: ${trimmed}`));
        continue;
      }
    }

    try {
      console.log(`\n${pc.bold(pc.white(trimmed))}`);

      const controller = new AbortController();
      let wasCancelled = false;

      const sigintHandler = () => {
        wasCancelled = true;
        controller.abort();
        console.log(pc.yellow("\n✖ Prompt cancelled by user (Ctrl+C)."));
      };

      process.on("SIGINT", sigintHandler);

      try {
        const { updatedHistory } = await runAgentLoop(promptToRun, history, false, controller.signal, currentMode);
        if (!wasCancelled) {
          history = updatedHistory;
          await saveSession(sessionId, history);
        }
      } catch (err: any) {
        if (!wasCancelled && !err.message?.includes("cancelled")) {
          console.error(pc.red(`Error: ${err.message}`));
        }
      } finally {
        process.off("SIGINT", sigintHandler);
      }
    } catch (err: any) {
      console.error(pc.red(`Error: ${err.message}`));
    }
  }
}

main();
