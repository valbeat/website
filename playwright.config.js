// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  webServer: {
    // Astro のビルド出力 (dist/) を配信する。Workers 本番と同じ静的ファイルを
    // 撮影するため、素の静的サーバーで dist/ をそのまま配る。
    command: `pnpm build && python3 -m http.server ${PORT} --directory dist`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      // Pixel 5 device descriptor defaults to chromium so we don't need to
      // install webkit just for mobile emulation.
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
