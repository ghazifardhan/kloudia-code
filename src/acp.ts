import readline from "readline";
import { runAgentLoop } from "./agent";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: any;
}

function sendJsonRpcResponse(id: number | string | undefined, result?: any, error?: any) {
  const payload: any = { jsonrpc: "2.0", id };
  if (error) payload.error = error;
  else payload.result = result;
  process.stdout.write(JSON.stringify(payload) + "\n");
}

function sendJsonRpcNotification(method: string, params?: any) {
  const payload = { jsonrpc: "2.0", method, params };
  process.stdout.write(JSON.stringify(payload) + "\n");
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
      const msg: JsonRpcRequest = JSON.parse(trimmed);

      switch (msg.method) {
        case "initialize": {
          sendJsonRpcResponse(msg.id, {
            protocolVersion: 1,
            capabilities: {
              streaming: true,
              tools: true,
            },
            serverInfo: {
              name: "Kloudia ACP Server",
              version: "1.3.7",
            },
          });
          break;
        }

        case "session/new":
        case "session/create": {
          history = [];
          sendJsonRpcResponse(msg.id, {
            sessionId: `acp-${Date.now()}`,
          });
          break;
        }

        case "prompt":
        case "session/prompt":
        case "chat/completions": {
          const userPrompt = msg.params?.prompt || msg.params?.message || msg.params?.text || "";

          // In ACP mode, quiet output printing to stdout to avoid corrupting JSON-RPC stream
          const isAcpMode = process.argv.includes("acp") || process.argv.includes("--acp");

          try {
            const { response, updatedHistory } = await runAgentLoop(userPrompt, history, isAcpMode);
            history = updatedHistory;

            sendJsonRpcResponse(msg.id, {
              stopReason: "end_turn",
              content: response,
            });
          } catch (err: any) {
            sendJsonRpcResponse(msg.id, {
              stopReason: "end_turn",
              error: err.message,
            });
          }
          break;
        }

        default: {
          if (msg.id !== undefined) {
            sendJsonRpcResponse(msg.id, {});
          }
          break;
        }
      }
    } catch (err: any) {
      // Ignore non-JSON RPC frames silently
    }
  });
}
