import readline from "readline";
import { runAgentLoop } from "./agent";

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
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function sendError(id: number | string | undefined, code: number, message: string) {
  const msg = {
    jsonrpc: "2.0",
    id,
    error: { code, message },
  };
  process.stdout.write(JSON.stringify(msg) + "\n");
}

export async function startAcpServer(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let history: any[] = [];

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

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
            version: "1.3.9",
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
        const userPrompt = msg.params?.prompt || msg.params?.message || msg.params?.text || "";

        try {
          const { response, updatedHistory } = await runAgentLoop(userPrompt, history, true);
          history = updatedHistory;

          sendResponse(msg.id, {
            stopReason: "end_turn",
            content: [
              {
                type: "text",
                text: response,
              },
            ],
          });
        } catch (err: any) {
          sendResponse(msg.id, {
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

      // Default fallback for any other method
      if (msg.id !== undefined) {
        sendResponse(msg.id, {});
      }
    } catch (err: any) {
      // Ignore unparseable frames
    }
  });
}
