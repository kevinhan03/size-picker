import { existsSync } from "node:fs";
import { IS_VERCEL, PRODUCT_METADATA_BROWSER_TIMEOUT_MS } from "../../config/env.js";

const getPlaywrightExecutablePath = () => {
  if (IS_VERCEL) return "";
  const candidates = [
    String(process.env.PLAYWRIGHT_EXECUTABLE_PATH || "").trim(),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      // no-op
    }
  }
  return "";
};

export const launchMetadataBrowser = async () => {
  if (IS_VERCEL) {
    const error = new Error("Browser-based scraping is not available on Vercel");
    error.statusCode = 503;
    throw error;
  }
  const { chromium } = await import("playwright");
  const executablePath = getPlaywrightExecutablePath();
  const options = {
    headless: true,
    timeout: PRODUCT_METADATA_BROWSER_TIMEOUT_MS,
  };
  if (executablePath) {
    return chromium.launch({ ...options, executablePath });
  }
  return chromium.launch(options);
};
