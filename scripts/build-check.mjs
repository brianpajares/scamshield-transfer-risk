import { existsSync } from "node:fs";

const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/styles.css",
  "src/data/model-config.js",
  "src/data/monetization-config.js",
  "src/engine/risk-engine.js"
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Missing production files: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Production build check passed");
