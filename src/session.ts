import { homedir } from "os";
import { join } from "path";
import { mkdir, readdir } from "fs/promises";

const SESSIONS_DIR = join(homedir(), ".config", "kloudia", "sessions");

export interface SessionData {
  id: string;
  updatedAt: string;
  messages: any[];
}

export async function getSessionPath(sessionId: string): Promise<string> {
  await mkdir(SESSIONS_DIR, { recursive: true });
  return join(SESSIONS_DIR, `${sessionId}.json`);
}

export async function listSessions(): Promise<SessionData[]> {
  try {
    await mkdir(SESSIONS_DIR, { recursive: true });
    const files = await readdir(SESSIONS_DIR);
    const sessions: SessionData[] = [];
    for (const f of files) {
      if (f.endsWith(".json")) {
        try {
          const content = await Bun.file(join(SESSIONS_DIR, f)).text();
          sessions.push(JSON.parse(content));
        } catch {}
      }
    }
    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

export async function loadSession(sessionId: string): Promise<any[]> {
  try {
    const path = await getSessionPath(sessionId);
    const file = Bun.file(path);
    if (await file.exists()) {
      const data: SessionData = JSON.parse(await file.text());
      return data.messages || [];
    }
  } catch {}
  return [];
}

export async function saveSession(sessionId: string, messages: any[]): Promise<void> {
  try {
    const path = await getSessionPath(sessionId);
    const data: SessionData = {
      id: sessionId,
      updatedAt: new Date().toISOString(),
      messages,
    };
    await Bun.write(path, JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error(`Failed to save session ${sessionId}: ${err.message}`);
  }
}
