import { homedir } from "os";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import pc from "picocolors";

export async function setupZedIntegration(): Promise<void> {
  const zedConfigDir = join(homedir(), ".config", "zed");
  const zedSettingsPath = join(zedConfigDir, "settings.json");

  try {
    await mkdir(zedConfigDir, { recursive: true });
    let settings: any = {};

    if (existsSync(zedSettingsPath)) {
      try {
        const text = await readFile(zedSettingsPath, "utf-8");
        // Strip single line & multiline JSON comments commonly used in Zed settings.jsonc
        const cleanedText = text
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*/g, "");
        settings = JSON.parse(cleanedText);
      } catch {}
    }

    if (!settings.agent_servers) {
      settings.agent_servers = {};
    }

    settings.agent_servers["Kloudia"] = {
      type: "custom",
      command: "kloudia",
      args: ["acp"],
      env: {},
    };

    await writeFile(zedSettingsPath, JSON.stringify(settings, null, 2), "utf-8");
    console.log(pc.green(`\n✔ Kloudia ACP Agent registered successfully in Zed Editor settings!`));
    console.log(pc.gray(`  Config written to: ${zedSettingsPath}`));
    console.log(pc.bold(pc.yellow(`\nHow to use in Zed Editor:`)));
    console.log(`  1. Open Zed Editor.`);
    console.log(`  2. Open Agent Panel / Threads Sidebar (Cmd+Alt+J or Ctrl+Alt+J).`);
    console.log(`  3. Select 'Kloudia' from the agent dropdown list.\n`);
  } catch (err: any) {
    console.error(pc.red(`Failed to setup Zed integration: ${err.message}`));
  }
}
