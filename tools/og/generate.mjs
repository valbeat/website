// Generate images/og.png (1200x630, 8-bit sRGB) from tools/og/template.html.
// Usage: pnpm og:generate
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, "template.html");
const out = path.join(here, "..", "..", "images", "og.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(`file://${template}`);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: out });
await browser.close();
console.log(`wrote ${path.relative(process.cwd(), out)}`);
