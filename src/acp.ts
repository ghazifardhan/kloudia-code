import readline from "readline";
import { appendFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { runAgentLoop } from "./agent";

const LOG_FILE = join(homedir(), ".config", "kloudia", "acp-debug.log");
function debugLog(msg: string) {
  try {
    appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

function sendResponse(id: number | string | undefined, result: any) {
  const msg = {
    jsonrpc: "2.0",
    id,
    result,
  };
  debugLog(`SEND RESPONSE (${id}): ${JSON.stringify(msg)}`);
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function sendNotification(method: string, params: any) {
  const msg = {
    jsonrpc: "2.0",
    method,
    params,
  };
  debugLog(`SEND NOTIFICATION: ${JSON.stringify(msg)}`);
  process.stdout.write(JSON.stringify(msg) + "\n");
}

export async function startAcpServer(): Promise<void> {
  debugLog("ACP SERVER STARTED");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let history: any[] = [];

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    debugLog(`RECV: ${trimmed}`);

    try {
      const msg: JsonRpcMessage = JSON.parse(trimmed);

      if (msg.method === "initialize") {
        sendResponse(msg.id, {
          protocolVersion: 1,
          capabilities: {
            loadSession: false,
          },
          serverInfo: {
            name: "Kloudia ACP Server",
            version: "1.4.2",
          },
        });
        return;
      }

      if (msg.method === "session/new" || msg.method === "session/create") {
        history = [];
        sendResponse(msg.id, {
          session_id: `acp-${Date.now()}`,
          sessionId: `acp-${Date.now()}`,
        });
        return;
      }

      if (msg.method === "session/prompt" || msg.method === "prompt") {
        let userPrompt = "";
        if (typeof msg.params?.prompt === "string") {
          userPrompt = msg.params.prompt;
        } else if (Array.isArray(msg.params?.prompt)) {
          userPrompt = msg.params.prompt
            .filter((p: any) => p.type === "text" || p.text)
            .map((p: any) => p.text || p.content || "")
            .join("\n");
        } else if (msg.params?.message) {
          userPrompt = typeof msg.params.message === "string" ? msg.params.message : JSON.stringify(msg.params.message);
        } else if (msg.params?.text) {
          userPrompt = msg.params.text;
        }

        debugLog(`PARSED PROMPT: "${userPrompt}"`);

        // Send intermediate update notification if ACP requires streaming updates
        sendNotification("session/update", {
          session_id: msg.params?.session_id || msg.params?.sessionId,
          state: "thinking",
        });

        try {
          const { response, updatedHistory } = await runAgentLoop(userPrompt, history, true);
          history = updatedHistory;

          debugLog(`AGENT RESPONSE: "${response.slice(0, 100)}..."`);

          sendNotification("session/update", {
            session_id: msg.params?.session_id || msg.params?.sessionId,
            delta: {
              content: [
                {
                  type: "text",
                  text: response,
                },
              ],
            },
          });

          sendResponse(msg.id, {
            stop_reason: "end_turn",
            stopReason: "end_turn",
            content: [
              {
                type: "text",
                text: response,
              },
            ],
          });
        } catch (err: any) {
          debugLog(`AGENT ERROR: ${err.message}`);
          sendResponse(msg.id, {
            stop_reason: "end_turn",
            stopReason: "end_turn",
            content: [
              {
                type: "text",
                text: `Error: ${err.message}`,
              },
            ],
          });
        }
        return;
      }

      if (msg.id !== undefined) {
        sendResponse(msg.id, {});
      }
    } catch (err: any) {
      debugLog(`JSON PARSE ERROR: ${err.message}`);
    }
  });
}
