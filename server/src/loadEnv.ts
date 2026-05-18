import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/** Load `.env` from project root (walks up from server/src or server/dist). */
export function loadEnv(): void {
  let dir = path.dirname(fileURLToPath(import.meta.url));

  for (let i = 0; i < 6; i++) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
      return;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // npm run dev --prefix server → cwd is server/
  dotenv.config({ path: path.resolve(process.cwd(), "../.env"), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });
}
