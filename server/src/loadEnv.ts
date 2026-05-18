import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function isProjectRoot(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "package.json")) &&
    fs.existsSync(path.join(dir, "client")) &&
    fs.existsSync(path.join(dir, "server"))
  );
}

/** Load `.env` only from this monorepo root — never from parent folders. */
export function loadEnv(): void {
  let dir = path.dirname(fileURLToPath(import.meta.url));

  for (let i = 0; i < 6; i++) {
    if (isProjectRoot(dir)) {
      const envPath = path.join(dir, ".env");
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
      }
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback when running from server/ cwd
  const fromCwd = path.resolve(process.cwd(), "../.env");
  if (fs.existsSync(fromCwd)) {
    dotenv.config({ path: fromCwd, override: true });
  }
}
