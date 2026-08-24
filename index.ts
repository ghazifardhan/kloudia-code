#!/usr/bin/env node
import readline from "readline";
import { select, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { runAgentLoop } from "./src/agent";
import { loadSession, saveSession, listSessions } from "./src/session";
import { loadSettings } from "./src/settings";
import { discoverSkills, loadSkillContent } from "./src/skills";
import { runCodeReview } from "./src/review";
import { startAcpServer } from "./src/acp";
import { setupZedIntegration } from "./src/zed";
import { resetPermissions } from "./src/tools";
import { logBanner, logDivider, logFooter } from "./src/ui";
import pkg from "./package.json";

function promptMultiLine(): Promise<string> {
  return new Promise((resolve) => {
    let buffer = "";

    const onData = async (charBuf: Buffer) => {
      const str = charBuf.toString();

      // Check Ctrl+C
      if (str === "\u0003") {
        cleanup();
        console.log();
        resolve("/quit");
        return;
      }

      // Check Alt+Enter / Shift+Enter / Ctrl+J -> Insert newline
      if (str === "\x1b\r" || str === "\x1b\n" || str === "\n" || str === "\x0a") {
        buffer += "\n";
        process.stdout.write("\n" + pc.bold(pc.gray("... ")));
        return;
      }

      // Plain Enter -> Submit prompt
      if (str === "\r") {
        cleanup();
        console.log();
        resolve(buffer);
        return;
      }

      // Handle Backspace
      if (str === "\u007f" || str === "\b") {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }

      // Handle '/' trigger for slash menu on empty input
      if (str === "/" && buffer.trim() === "") {
        cleanup();
        console.log("/");

        const skills = await discoverSkills();
        const options = [
          { value: "/review", label: "/review", hint: "Run AI Code Review on uncommitted diff or file" },
          { value: "/reset-permissions", label: "/reset-permissions", hint: "Reset session tool execution permissions" },
          { value: "/quit", label: "/quit", hint: "Exit Kloudia CLI" },
          { value: "/clear", label: "/clear", hint: "Clear terminal screen" },
          { value: "/sessions", label: "/sessions", hint: "List saved sessions" },
          ...skills.map((s) => ({
            value: `/${s.name}`,
            label: `/${s.name}`,
            hint: s.description.slice(0, 50),
          })),
        ];

        const selected = await select({
          message: "Select a command or skill:",
          options,
        });

        if (isCancel(selected)) {
          resolve("");
        } else {
          resolve(selected as string);
        }
        return;
      }

      // Printable characters
      if (str.length === 1 && str.charCodeAt(0) >= 32) {
        buffer += str;
        process.stdout.write(str);
      }
    };

    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.removeListener("data", onData);
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdout.write(pc.bold(pc.gray("> ")));
  });
}

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

  while (true) {
    logDivider();
    const input = await promptMultiLine();

    const trimmed = input.trim();
    if (!trimmed) continue;

    logDivider();
    logFooter(modelName);

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
        const { updatedHistory } = await runAgentLoop(promptToRun, history, false, controller.signal);
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
