import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const viteArgs = process.argv.slice(2);
if (viteArgs.length === 0) {
  console.error("Usage: node scripts/run-vite.mjs <vite args>");
  process.exit(1);
}

const env = { ...process.env };
env.ROLLUP_USE_WASM = "1";

if (process.platform === "win32") {
  const esbuildBinary = path.join(
    process.cwd(),
    "node_modules",
    "@esbuild",
    "win32-x64",
    "esbuild.exe",
  );

  if (existsSync(esbuildBinary)) {
    env.ESBUILD_BINARY_PATH = esbuildBinary;
  }
}

const viteBin = path.join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
const result = spawnSync(process.execPath, [viteBin, ...viteArgs], {
  stdio: "inherit",
  env,
});

if (result.error || typeof result.status !== "number" || result.status !== 0) {
  console.error("run-vite diagnostics:", {
    status: result.status,
    signal: result.signal,
    error: result.error?.message,
  });
}

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
