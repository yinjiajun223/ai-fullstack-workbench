import { access } from "node:fs/promises";

const requiredFiles = [
  "package.json",
  ".env.example",
  "src/app/page.tsx",
  "src/app/layout.tsx",
];

await Promise.all(requiredFiles.map((file) => access(file)));

console.log("Smoke test passed: required project files exist.");
