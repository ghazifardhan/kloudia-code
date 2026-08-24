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
            loadSession: true,
            load_session: true,
          },
          serverInfo: {
            name: "Kloudia ACP Server",
            version: "1.5.3",
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
        let userPromptPayload: any = "";

        if (Array.isArray(msg.params?.prompt)) {
          const parts: any[] = [];
          for (const item of msg.params.prompt) {
            if (item.type === "text" || item.text) {
              parts.push({ type: "text", text: item.text || item.content || "" });
            } else if (item.type === "image" && item.data) {
              const mime = item.mimeType || item.mime_type || "image/png";
              parts.push({
                type: "image_url",
                image_url: { url: `data:${mime};base64,${item.data}` },
              });
            }
          }
          userPromptPayload = parts.length > 0 ? parts : "";
        } else if (typeof msg.params?.prompt === "string") {
          userPromptPayload = msg.params.prompt;
        } else if (msg.params?.message) {
          userPromptPayload = typeof msg.params.message === "string" ? msg.params.message : JSON.stringify(msg.params.message);
        } else if (msg.params?.text) {
          userPromptPayload = msg.params.text;
        }

        debugLog(`PARSED ACP PROMPT PAYLOAD: ${JSON.stringify(userPromptPayload).slice(0, 150)}...`);

        const currentSessionId = msg.params?.sessionId || msg.params?.session_id || "acp-session";

        try {
          const { response, updatedHistory } = await runAgentLoop(userPromptPayload, history, true);
          history = updatedHistory;

          debugLog(`AGENT RESPONSE: "${response.slice(0, 100)}..."`);

          // Send official Zed ACP AgentMessageChunk notification
          sendNotification("session/update", {
            sessionId: currentSessionId,
            session_id: currentSessionId,
            update: {
              sessionUpdate: "agent_message_chunk",
              session_update: "agent_message_chunk",
              content: {
                type: "text",
                text: response,
              },
            },
          });

          sendResponse(msg.id, {
            stopReason: "end_turn",
            stop_reason: "end_turn",
          });
        } catch (err: any) {
          debugLog(`AGENT ERROR: ${err.message}`);
          sendNotification("session/update", {
            sessionId: currentSessionId,
            session_id: currentSessionId,
            update: {
              sessionUpdate: "agent_message_chunk",
              session_update: "agent_message_chunk",
              content: {
                type: "text",
                text: `Error: ${err.message}`,
              },
            },
          });

          sendResponse(msg.id, {
            stopReason: "end_turn",
            stop_reason: "end_turn",
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
