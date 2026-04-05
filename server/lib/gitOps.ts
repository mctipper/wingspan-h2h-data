import { exec } from "child_process";
import { promisify } from "util";
import { resolve } from "path";

const execAsync = promisify(exec);
const REPO_ROOT = resolve(import.meta.dirname, "../..");

export async function gitPush(message: string): Promise<void> {
  await execAsync("git add src/assets/games.json", { cwd: REPO_ROOT });
  await execAsync(
    `git commit -m "${message.replace(/"/g, "'")}"`,
    { cwd: REPO_ROOT }
  );
  await execAsync("git push", { cwd: REPO_ROOT });
}
