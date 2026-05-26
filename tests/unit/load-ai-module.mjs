import { createRequire } from "node:module";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);

const sourceRoot = join(process.cwd(), "src", "server", "ai");
const outputRoot = join(process.cwd(), ".test-tmp", "server", "ai");

const moduleFiles = [
  "config.ts",
  "errors.ts",
  "types.ts",
  "providers/openai-compatible.ts",
  "providers/index.ts",
  "index.ts",
];

export async function loadAiModule(modulePath) {
  await rm(join(process.cwd(), ".test-tmp"), { recursive: true, force: true });

  for (const file of moduleFiles) {
    const sourcePath = join(sourceRoot, file);
    const outputPath = join(outputRoot, file.replace(/\.ts$/, ".js"));
    const source = await readFile(sourcePath, "utf8");
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    });

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, transpiled.outputText);
  }

  const resolved = join(outputRoot, modulePath.replace(/\.ts$/, ".js"));
  const relativePath = `./${relative(process.cwd(), resolved).replaceAll("\\", "/")}`;

  return require(relativePath);
}
