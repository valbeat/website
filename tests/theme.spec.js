// @ts-check
// Functional tests for the theme switcher's interaction with the two
// <meta name="theme-color"> tags. The site renders correctly via CSS in all
// modes, but the meta tags drive the browser chrome (address bar, status
// bar) color. We need the meta values to stay consistent with what the user
// will actually see — even when the OS theme changes mid-session while the
// switcher is on "Auto".
const { test, expect } = require("@playwright/test");

function readMetas(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('meta[name="theme-color"]')).map(
      (m) => ({
        media: m.getAttribute("media"),
        content: m.getAttribute("content"),
      }),
    )
  );
}

test.describe("theme-color meta tracking", () => {
  test("Auto mode keeps media-gated defaults so the browser tracks OS changes", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(await readMetas(page)).toEqual([
      { media: "(prefers-color-scheme: light)", content: "#fdfdfd" },
      { media: "(prefers-color-scheme: dark)", content: "#141414" },
    ]);

    // The OS flips to dark. The browser will switch to the dark-media meta;
    // its content must already be the dark color.
    await page.emulateMedia({ colorScheme: "dark" });
    expect(await readMetas(page)).toEqual([
      { media: "(prefers-color-scheme: light)", content: "#fdfdfd" },
      { media: "(prefers-color-scheme: dark)", content: "#141414" },
    ]);
  });

  test("Forced Light in dark OS forces both meta tags to the light color", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.click('.theme-switcher [data-theme-value="light"]');

    expect(
      (await readMetas(page)).map((m) => m.content),
    ).toEqual(["#fdfdfd", "#fdfdfd"]);
  });

  test("Forced Dark in light OS forces both meta tags to the dark color", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.click('.theme-switcher [data-theme-value="dark"]');

    expect(
      (await readMetas(page)).map((m) => m.content),
    ).toEqual(["#141414", "#141414"]);
  });

  test("Auto after Dark restores the media-gated defaults", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.click('.theme-switcher [data-theme-value="dark"]');
    await page.click('.theme-switcher [data-theme-value="system"]');

    expect(await readMetas(page)).toEqual([
      { media: "(prefers-color-scheme: light)", content: "#fdfdfd" },
      { media: "(prefers-color-scheme: dark)", content: "#141414" },
    ]);
  });
});
