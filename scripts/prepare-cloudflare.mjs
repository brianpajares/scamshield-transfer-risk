import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const output = ".cloudflare-pages";
if (existsSync(output)) rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const entry of ["index.html", "manifest.webmanifest", "src", "_headers", "_redirects"]) {
  cpSync(entry, join(output, entry), { recursive: true });
}

console.log(`Prepared Cloudflare Pages assets in ${output}`);
