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

      // Playwright auto-suffixes toHaveScreenshot with -{project}-{platform},
      // so keep the explicit name short and add the project to the current
      // screenshot path manually to keep desktop/mobile separate.
      const baseName = `top-${theme.name}`;
      await page.screenshot({
        path: `current-screenshots/${baseName}-${testInfo.project.name}.png`,
        fullPage: true,
      });

      await expect(page).toHaveScreenshot(`${baseName}.png`, {
        fullPage: true,
      });
    });

    test("404 page", async ({ page }, testInfo) => {
      await page.goto("/404.html");
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);

      const baseName = `404-${theme.name}`;
      await page.screenshot({
        path: `current-screenshots/${baseName}-${testInfo.project.name}.png`,
        fullPage: true,
      });

      await expect(page).toHaveScreenshot(`${baseName}.png`, {
        fullPage: true,
      });
    });
  });
}
