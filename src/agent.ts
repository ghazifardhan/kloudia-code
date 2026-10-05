import OpenAI from "openai";
import pc from "picocolors";
import { loadSettings } from "./settings";
import { toolsDefinition, executeTool } from "./tools";
import { buildSystemPrompt } from "./prompts";
import { startToolProgress, stopToolProgress, renderMarkdown } from "./ui";
import { getTaggedFiles, isImageFile, fileToDataUri } from "./context";
import { saveSession } from "./session";

export async function runAgentLoop(
  userPrompt: string | any[],
  history: any[] = [],
  quiet: boolean = false,
  signal?: AbortSignal,
  mode: "build" | "plan" = "build",
  sessionId?: string
): Promise<{ response: string; updatedHistory: any[] }> {
  const settings = await loadSettings();
  const client = new OpenAI({
    apiKey: settings.apiKey || "dummy",
    baseURL: settings.baseUrl,
    timeout: 60000,
    maxRetries: 2,
  });

  const systemPrompt = await buildSystemPrompt(settings, mode);

  let activeTools = toolsDefinition;
  if (mode === "plan") {
    activeTools = toolsDefinition.filter(
      (t) => t.function.name !== "edit_file" && t.function.name !== "bash"
    );
  }

  let userContent: any = userPrompt;

  // Build multimodal payload if images are attached or tagged
  if (typeof userPrompt === "string") {
    const tagged = getTaggedFiles();
    const imageParts: any[] = [];

    for (const file of tagged) {
      if (isImageFile(file)) {
        try {
          const dataUri = await fileToDataUri(file);
          imageParts.push({
            type: "image_url",
            image_url: { url: dataUri },
          });
        } catch {}
      }
    }

    if (imageParts.length > 0) {
      userContent = [{ type: "text", text: userPrompt }, ...imageParts];
    }
  }

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userContent },
  ];

  // Save session immediately after adding user prompt
  if (sessionId) {
    await saveSession(sessionId, messages.filter((m) => m.role !== "system"));
  }

  let isHeaderPrinted = false;

  while (true) {
    if (signal?.aborted) {
      throw new Error("Prompt cancelled by user.");
    }

    if (!quiet) {
      startToolProgress("Thinking...");
    }

    let fullContent = "";
    let toolCallsBuffer: any[] = [];
    let spinnerStopped = false;

    try {
      const stream = await client.chat.completions.create(
        {
          model: settings.model || "gpt-4o",
          messages,
          tools: activeTools,
          stream: true,
        },
        { signal }
      );

      for await (const chunk of stream) {
        if (!spinnerStopped && !quiet) {
          stopToolProgress();
          spinnerStopped = true;
        }
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!toolCallsBuffer[idx]) {
              toolCallsBuffer[idx] = { id: tc.id || "", function: { name: "", arguments: "" } };
            }
            if (tc.id) toolCallsBuffer[idx].id = tc.id;
            if (tc.function?.name) toolCallsBuffer[idx].function.name = tc.function.name;
            if (tc.function?.arguments) toolCallsBuffer[idx].function.arguments += tc.function.arguments;
          }
        }
      }
    } catch (err: any) {
      if (!spinnerStopped && !quiet) {
        stopToolProgress();
        spinnerStopped = true;
      }
      throw err;
    }

    if (!spinnerStopped && !quiet) {
      stopToolProgress();
      spinnerStopped = true;
    }

    if (fullContent && !quiet) {
      if (!isHeaderPrinted) {
        console.log(`\n${pc.bold(pc.magenta("✦ Kloudia"))}`);
        isHeaderPrinted = true;
      }
      console.log(renderMarkdown(fullContent));
    }

    const validToolCalls = toolCallsBuffer.filter((t) => t && t.function);

    const assistantMsg: any = { role: "assistant", content: fullContent || null };
    if (validToolCalls.length > 0) {
      assistantMsg.tool_calls = validToolCalls.map((t) => ({
        id: t.id,
        type: "function",
        function: t.function,
      }));
    }
    messages.push(assistantMsg);

    // Save session incrementally after assistant response
    if (sessionId) {
      await saveSession(sessionId, messages.filter((m) => m.role !== "system"));
    }

    if (validToolCalls.length === 0) {
      const historyToSave = messages.filter((m) => m.role !== "system");
      return { response: fullContent, updatedHistory: historyToSave };
    }

    for (const call of validToolCalls) {
      if (signal?.aborted) {
        throw new Error("Prompt cancelled by user.");
      }
      const toolName = call.function.name;
      const rawArgs = call.function.arguments || "{}";
      let args = {};
      try {
        args = JSON.parse(rawArgs);
      } catch {}

      if (!quiet) {
        startToolProgress(toolName, rawArgs);
      }
      const result = await executeTool(toolName, args, async (subPrompt, role) => {
        return await runSubAgent(subPrompt, role);
      });
      if (!quiet) {
        stopToolProgress(toolName, rawArgs, !result.startsWith("Permission denied") && !result.startsWith("Tool error") && !result.startsWith("Error"));
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });

      // Save session incrementally after each tool execution
      if (sessionId) {
        await saveSession(sessionId, messages.filter((m) => m.role !== "system"));
      }
    }
  }
}

export async function runSubAgent(prompt: string, role?: string): Promise<string> {
  const settings = await loadSettings();
  const client = new OpenAI({
    apiKey: settings.apiKey || "dummy",
    baseURL: settings.baseUrl,
    timeout: 60000,
    maxRetries: 2,
  });

  const subAgentTools = toolsDefinition.filter((t) => t.function.name !== "task");

  const messages: any[] = [
    { role: "system", content: `You are a specialized Sub-Agent (${role || "Worker"}). Solve the task and return a clear summary.` },
    { role: "user", content: prompt },
  ];

  let steps = 0;
  while (steps < 10) {
    steps++;
    const res = await client.chat.completions.create({
      model: settings.model || "gpt-4o",
      messages,
      tools: subAgentTools,
    });

    const msg = res.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content || "Sub-agent finished task.";
    }

    for (const call of msg.tool_calls) {
      if (!call || !call.function) continue;
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {}
      const result = await executeTool(call.function.name, args);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  return "Sub-agent reached max steps limit.";
}
