import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const [name, width] of [
  ["desktop", 1440],
  ["mobile", 390],
]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  for (const route of ["", "rosters", "schedule", "trades"]) {
    await page.goto(`http://localhost:3000/${route}`);
    await page.locator("[aria-busy=true]").waitFor({ state: "hidden" });
    await page.evaluate(() =>
      Promise.all([...document.images].map((i) => i.decode().catch(() => {}))),
    );
    await page.screenshot({
      path: `/private/tmp/nsl-${route || "home"}-${name}.png`,
      fullPage: true,
    });
  }
  await page.close();
}
await browser.close();
