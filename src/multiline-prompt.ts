import pc from "picocolors";
import fuzzy from "fuzzy";
import { getResourceStats } from "./ui";

// ── Types ───────────────────────────────────────────────────────────
interface Command {
  name: string;
  value: string;
}

interface MultilinePromptOptions {
  commands?: Command[];
  projectFiles?: string[];
  model?: string;
  mode?: "build" | "plan";
}

// ── Multiline Prompt ────────────────────────────────────────────────
// A growing text field for terminal input.
//   • Enter  (0x0D) → submit
//   • Ctrl+J (0x0A) → insert newline (field grows)
//   • Arrow keys     → navigate within text
//   • Backspace      → delete / merge lines
//   • Ctrl+A / Ctrl+E → home / end of line
//   • Ctrl+K         → kill to end of line
//   • Ctrl+U         → clear to start of line
//   • Ctrl+W         → delete word backward
//   • Delete          → forward-delete
//   • Tab             → insert 2 spaces
//   • Paste support   → multiline paste inserts newlines
//   • Autocomplete    → when first line starts with /, shows matching commands or @ file tagging
export async function multilinePrompt(
  opts: MultilinePromptOptions = {},
): Promise<string> {
  return new Promise((resolve) => {
    const lines: string[] = [""];
    let cursorLine = 0;
    let cursorCol = 0;
    let lastCursorLine = 0; // tracks terminal cursor row after last render

    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write("\x1B[?25h"); // ensure cursor visible

    // ── Helpers ───────────────────────────────────────────────────
    function insertNewline() {
      const curr = lines[cursorLine];
      lines[cursorLine] = curr.slice(0, cursorCol);
      lines.splice(cursorLine + 1, 0, curr.slice(cursorCol));
      cursorLine++;
      cursorCol = 0;
    }

    function cleanup() {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(wasRaw ?? false);
    }

    function submit() {
      cleanup();
      // Re-render final input cleanly (no suggestions, no status bar, cursor at end)
      if (lastCursorLine > 0) {
        process.stdout.write(`\x1B[${lastCursorLine}A`);
      }
      process.stdout.write("\r\x1B[J");
      for (let i = 0; i < lines.length; i++) {
        const prefix = i === 0 ? `${pc.green(">")} ` : "  ";
        process.stdout.write(`${prefix}${lines[i]}\n`);
      }
      resolve(lines.join("\n"));
    }

    // ── Render ────────────────────────────────────────────────────
    function render() {
      // Move up to the first prompt line from wherever the cursor was
      if (lastCursorLine > 0) {
        process.stdout.write(`\x1B[${lastCursorLine}A`);
      }
      process.stdout.write("\r\x1B[J"); // go to col 1, clear to end of screen

      // Draw prompt lines
      for (let i = 0; i < lines.length; i++) {
        const prefix = i === 0 ? `${pc.green(">")} ` : "  ";
        process.stdout.write(`${prefix}${lines[i]}\n`);
      }

      let totalRendered = lines.length;

      // Autocomplete suggestions for / commands
      if (
        lines.length === 1 &&
        lines[0].startsWith("/") &&
        lines[0].length > 1 &&
        opts.commands
      ) {
        const input = lines[0];
        const results = fuzzy.filter(input, opts.commands, {
          extract: (el) => el.value,
        });
        const shown = results.slice(0, 5);
        if (shown.length > 0) {
          for (const r of shown) {
            process.stdout.write(`  ${pc.gray(r.original.name)}\n`);
            totalRendered++;
          }
        }
      }

      // Autocomplete suggestions for @ file tagging
      const currentLineText = lines[cursorLine];
      const textBeforeCursor = currentLineText.slice(0, cursorCol);
      const atMatch = textBeforeCursor.match(/@([^\s]*)$/);
      if (atMatch && opts.projectFiles && opts.projectFiles.length > 0) {
        const query = atMatch[1];
        const results = query
          ? fuzzy.filter(query, opts.projectFiles)
          : opts.projectFiles.slice(0, 5).map((f) => ({ original: f }));

        const shown = results.slice(0, 5);
        if (shown.length > 0) {
          for (const r of shown) {
            process.stdout.write(`  ${pc.cyan("@" + r.original)}\n`);
            totalRendered++;
          }
        }
      }

      // Render footer status bar right below prompt/suggestions
      if (opts.model) {
        const mode = opts.mode || "build";
        const left = pc.gray("? for shortcuts");
        const stats = getResourceStats();
        const modeTag = mode === "plan" ? pc.bold(pc.yellow("[PLAN]")) : pc.bold(pc.green("[BUILD]"));
        const rightStr = `${modeTag} ${opts.model} · ${stats}`;
        const rightPlain = `[${mode.toUpperCase()}] ${opts.model} · ${stats}`;
        const columns = Math.min(process.stdout.columns || 80, 80);
        const padding = Math.max(0, columns - 15 - rightPlain.length);
        process.stdout.write(`${left}${" ".repeat(padding)}${rightStr}\n`);
        totalRendered++;
      }

      // Position terminal cursor at (cursorLine, cursorCol)
      const moveUp = totalRendered - cursorLine;
      if (moveUp > 0) {
        process.stdout.write(`\x1B[${moveUp}A`);
      }
      // +3: prefix is 2 visual chars (">" or "  ") + 1 for 1-indexed column
      process.stdout.write(`\x1B[${cursorCol + 3}G`);

      lastCursorLine = cursorLine;
    }



    // ── Input handler ─────────────────────────────────────────────
    function onData(buf: Buffer) {
      const str = buf.toString("utf8");
      // If multiple chars arrive at once and it's not an escape seq, it's a paste
      const isPaste = str.length > 1 && !str.startsWith("\x1B");

      let i = 0;
      while (i < str.length) {
        const code = str.charCodeAt(i);

        // Ctrl+C → exit
        if (code === 0x03) {
          cleanup();
          console.log();
          process.exit(0);
        }

        // Ctrl+D → exit if empty
        if (code === 0x04) {
          if (lines.length === 1 && lines[0] === "") {
            cleanup();
            console.log();
            process.exit(0);
          }
          i++;
          continue;
        }

        // Enter / CR (0x0D)
        if (code === 0x0d) {
          if (isPaste) {
            // In paste, \r is followed by \n – skip \r, let \n handle newline
            i++;
            continue;
          }
          submit();
          return;
        }

        // LF (0x0A) → Ctrl+J or paste newline
        if (code === 0x0a) {
          insertNewline();
          render();
          i++;
          continue;
        }

        // Backspace (0x7F) or Ctrl+H (0x08)
        if (code === 0x7f || code === 0x08) {
          if (cursorCol > 0) {
            const curr = lines[cursorLine];
            lines[cursorLine] =
              curr.slice(0, cursorCol - 1) + curr.slice(cursorCol);
            cursorCol--;
          } else if (cursorLine > 0) {
            const prev = lines[cursorLine - 1];
            const curr = lines[cursorLine];
            cursorCol = prev.length;
            lines[cursorLine - 1] = prev + curr;
            lines.splice(cursorLine, 1);
            cursorLine--;
          }
          render();
          i++;
          continue;
        }

        // Ctrl+A → beginning of line
        if (code === 0x01) {
          cursorCol = 0;
          render();
          i++;
          continue;
        }

        // Ctrl+E → end of line
        if (code === 0x05) {
          cursorCol = lines[cursorLine].length;
          render();
          i++;
          continue;
        }

        // Ctrl+K → kill to end of line
        if (code === 0x0b) {
          if (cursorCol === lines[cursorLine].length && cursorLine < lines.length - 1) {
            // At end of line: merge with next line
            lines[cursorLine] += lines[cursorLine + 1];
            lines.splice(cursorLine + 1, 1);
          } else {
            lines[cursorLine] = lines[cursorLine].slice(0, cursorCol);
          }
          render();
          i++;
          continue;
        }

        // Ctrl+U → clear to start of line
        if (code === 0x15) {
          lines[cursorLine] = lines[cursorLine].slice(cursorCol);
          cursorCol = 0;
          render();
          i++;
          continue;
        }

        // Ctrl+W → delete word backward
        if (code === 0x17) {
          const curr = lines[cursorLine];
          const before = curr.slice(0, cursorCol);
          const after = curr.slice(cursorCol);
          let j = before.length - 1;
          while (j >= 0 && before[j] === " ") j--;
          while (j >= 0 && before[j] !== " ") j--;
          lines[cursorLine] = before.slice(0, j + 1) + after;
          cursorCol = j + 1;
          render();
          i++;
          continue;
        }

        // Escape sequences (arrows, home, end, delete, etc.)
        if (code === 0x1b) {
          if (i + 1 < str.length && str[i + 1] === "[") {
            let seqEnd = i + 2;
            // Read parameter bytes (digits, semicolons)
            while (
              seqEnd < str.length &&
              ((str.charCodeAt(seqEnd) >= 0x30 &&
                str.charCodeAt(seqEnd) <= 0x39) ||
                str[seqEnd] === ";")
            ) {
              seqEnd++;
            }
            if (seqEnd < str.length) {
              const param = str.slice(i + 2, seqEnd);
              const fin = str[seqEnd];

              if (fin === "A" && cursorLine > 0) {
                // ↑
                cursorLine--;
                cursorCol = Math.min(cursorCol, lines[cursorLine].length);
                render();
              } else if (fin === "B" && cursorLine < lines.length - 1) {
                // ↓
                cursorLine++;
                cursorCol = Math.min(cursorCol, lines[cursorLine].length);
                render();
              } else if (fin === "C") {
                // →
                if (cursorCol < lines[cursorLine].length) {
                  cursorCol++;
                } else if (cursorLine < lines.length - 1) {
                  cursorLine++;
                  cursorCol = 0;
                }
                render();
              } else if (fin === "D") {
                // ←
                if (cursorCol > 0) {
                  cursorCol--;
                } else if (cursorLine > 0) {
                  cursorLine--;
                  cursorCol = lines[cursorLine].length;
                }
                render();
              } else if (fin === "H") {
                // Home
                cursorCol = 0;
                render();
              } else if (fin === "F") {
                // End
                cursorCol = lines[cursorLine].length;
                render();
              } else if (fin === "~" && param === "3") {
                // Delete key (CSI 3 ~)
                if (cursorCol < lines[cursorLine].length) {
                  const curr = lines[cursorLine];
                  lines[cursorLine] =
                    curr.slice(0, cursorCol) + curr.slice(cursorCol + 1);
                } else if (cursorLine < lines.length - 1) {
                  lines[cursorLine] += lines[cursorLine + 1];
                  lines.splice(cursorLine + 1, 1);
                }
                render();
              }

              i = seqEnd + 1;
              continue;
            }
          }
          // Unknown escape – skip the byte
          i++;
          continue;
        }

        // Tab → autocomplete @ file or / command, or insert 2 spaces
        if (code === 0x09) {
          const currentLineText = lines[cursorLine];
          const textBeforeCursor = currentLineText.slice(0, cursorCol);
          const textAfterCursor = currentLineText.slice(cursorCol);

          // 1. Check for @ file completion
          const atMatch = textBeforeCursor.match(/@([^\s]*)$/);
          if (atMatch && opts.projectFiles && opts.projectFiles.length > 0) {
            const query = atMatch[1];
            const results = query
              ? fuzzy.filter(query, opts.projectFiles)
              : opts.projectFiles.map((f) => ({ original: f }));

            if (results.length > 0) {
              const bestMatch = results[0].original;
              const matchIndex = atMatch.index ?? (textBeforeCursor.length - atMatch[0].length);
              const beforeAt = textBeforeCursor.slice(0, matchIndex);
              const completed = `@${bestMatch} `;
              lines[cursorLine] = beforeAt + completed + textAfterCursor;
              cursorCol = beforeAt.length + completed.length;
              render();
              i++;
              continue;
            }
          }

          // 2. Check for / command completion (single line starting with /)
          if (
            lines.length === 1 &&
            lines[0].startsWith("/") &&
            opts.commands
          ) {
            const results = fuzzy.filter(lines[0], opts.commands, {
              extract: (el) => el.value,
            });
            if (results.length > 0) {
              const bestCmd = results[0].original.value;
              lines[0] = bestCmd + " ";
              cursorCol = lines[0].length;
              render();
              i++;
              continue;
            }
          }

          // Default Tab behavior: insert 2 spaces
          lines[cursorLine] =
            textBeforeCursor + "  " + textAfterCursor;
          cursorCol += 2;
          render();
          i++;
          continue;
        }


        // Regular printable character (>= space)
        if (code >= 0x20) {
          const curr = lines[cursorLine];
          lines[cursorLine] =
            curr.slice(0, cursorCol) + str[i] + curr.slice(cursorCol);
          cursorCol++;
          render();
        }

        i++;
      }
    }

    // Initial render (shows empty prompt)
    render();
    process.stdin.on("data", onData);
  });
}
