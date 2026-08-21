import { homedir } from "os";
import { join } from "path";

export interface Settings {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  systemPrompt?: string;
}

const SETTINGS_PATH = join(homedir(), ".config", "kloudia", "settings.json");

export async function loadSettings(): Promise<Settings> {
  let fileSettings: Settings = {};
  try {
    const file = Bun.file(SETTINGS_PATH);
    if (await file.exists()) {
      fileSettings = JSON.parse(await file.text());
    }
  } catch {}

  return {
    apiKey: process.env.OPENAI_API_KEY || fileSettings.apiKey,
    baseUrl: process.env.OPENAI_BASE_URL || fileSettings.baseUrl || "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL || fileSettings.model || "gpt-4o",
    systemPrompt: fileSettings.systemPrompt,
  };
}
