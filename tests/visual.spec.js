// @ts-check
const { test, expect } = require("@playwright/test");

/** @type {{ name: 'light' | 'dark', colorScheme: 'light' | 'dark' }[]} */
const themes = [
  { name: "light", colorScheme: "light" },
  { name: "dark", colorScheme: "dark" },
];

for (const theme of themes) {
  test.describe(`theme=${theme.name}`, () => {
    test.use({ colorScheme: theme.colorScheme });

    test("top page", async ({ page }, testInfo) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);

      const fileName = `top-${theme.name}-${testInfo.project.name}.png`;

      // Save a fresh "current" PNG outside Playwright's test-results dir so we
      // can always show it in the PR comment, even when the diff check passes.
      await page.screenshot({
        path: `current-screenshots/${fileName}`,
        fullPage: true,
      });

      await expect(page).toHaveScreenshot(fileName, { fullPage: true });
    });

    test("404 page", async ({ page }, testInfo) => {
      await page.goto("/404.html");
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);

      const fileName = `404-${theme.name}-${testInfo.project.name}.png`;

      await page.screenshot({
        path: `current-screenshots/${fileName}`,
        fullPage: true,
      });

      await expect(page).toHaveScreenshot(fileName, { fullPage: true });
    });
  });
}
