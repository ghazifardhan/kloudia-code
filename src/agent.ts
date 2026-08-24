import OpenAI from "openai";
import pc from "picocolors";
import { loadSettings } from "./settings";
import { toolsDefinition, executeTool } from "./tools";
import { buildSystemPrompt } from "./prompts";
import { startToolProgress, stopToolProgress, renderMarkdown } from "./ui";
import { getTaggedFiles, isImageFile, fileToDataUri } from "./context";

export async function runAgentLoop(
  userPrompt: string | any[],
  history: any[] = [],
  quiet: boolean = false,
  signal?: AbortSignal,
  mode: "build" | "plan" = "build"
): Promise<{ response: string; updatedHistory: any[] }> {
  const settings = await loadSettings();
  const client = new OpenAI({
    apiKey: settings.apiKey || "dummy",
    baseURL: settings.baseUrl,
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

  let isHeaderPrinted = false;

  while (true) {
    if (signal?.aborted) {
      throw new Error("Prompt cancelled by user.");
    }

    const stream = await client.chat.completions.create(
      {
        model: settings.model || "gpt-4o",
        messages,
        tools: activeTools,
        stream: true,
      },
      { signal }
    );

    let fullContent = "";
    let toolCallsBuffer: any[] = [];

    for await (const chunk of stream) {
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

    if (fullContent && !quiet) {
      if (!isHeaderPrinted) {
        console.log(`\n${pc.bold(pc.magenta("✦ Kloudia"))}`);
        isHeaderPrinted = true;
      }
      console.log(renderMarkdown(fullContent));
    }

    const assistantMsg: any = { role: "assistant", content: fullContent || null };
    if (toolCallsBuffer.length > 0) {
      assistantMsg.tool_calls = toolCallsBuffer.map((t) => ({
        id: t.id,
        type: "function",
        function: t.function,
      }));
    }
    messages.push(assistantMsg);

    if (toolCallsBuffer.length === 0) {
      const historyToSave = messages.filter((m) => m.role !== "system");
      return { response: fullContent, updatedHistory: historyToSave };
    }

    for (const call of toolCallsBuffer) {
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
    }
  }
}

export async function runSubAgent(prompt: string, role?: string): Promise<string> {
  const settings = await loadSettings();
  const client = new OpenAI({
    apiKey: settings.apiKey || "dummy",
    baseURL: settings.baseUrl,
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
      const result = await executeTool(call.function.name, JSON.parse(call.function.arguments));
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  return "Sub-agent reached max steps limit.";
}
