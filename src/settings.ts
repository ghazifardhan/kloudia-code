import { homedir } from "os";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

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
    if (existsSync(SETTINGS_PATH)) {
      fileSettings = JSON.parse(await readFile(SETTINGS_PATH, "utf-8"));
    }
  } catch {}

  return {
    apiKey: process.env.OPENAI_API_KEY || fileSettings.apiKey,
    baseUrl: process.env.OPENAI_BASE_URL || fileSettings.baseUrl || "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL || fileSettings.model || "gpt-4o",
    systemPrompt: fileSettings.systemPrompt,
  };
}
