import { test, expect } from "@playwright/test";
test("home loads exact live standings and original logos", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  const first = page.locator("tbody tr").first();
  await expect(first).toContainText("Marlon FC");
  await expect(first.locator("td").last()).toHaveText("4");
  await expect(page.locator(".team-card")).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: "Open Google Drive" }),
  ).toHaveAttribute(
    "href",
    "https://drive.google.com/drive/u/0/folders/1w2Pc3aPZR53xY6oYEOmrMf8LV7RN0zR4",
  );
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every((i) => (i as HTMLImageElement).naturalWidth > 0),
        ),
    )
    .toBeTruthy();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("all rosters show exact field and goalkeeper ratings", async ({
  page,
}) => {
  await page.goto("/rosters");
  await expect(page.locator(".player-card")).toHaveCount(5);
  await expect(page.locator(".player-card").first()).toContainText("Pratheek");
  await expect(
    page.locator(".player-card").first().locator(".player-ovr strong"),
  ).toHaveText("85");
  await page.getByRole("tab", { name: "Dangerous Boys SC" }).click();
  await expect(page.locator(".player-card")).toHaveCount(5);
  await expect(
    page.locator(".player-card").filter({ hasText: "Madhava" }),
  ).toContainText("68");
  await expect(
    page.locator(".player-card").filter({ hasText: "Madhava" }),
  ).toContainText("GK OVR");
  await expect(
    page.locator(".player-card").filter({ hasText: "Wesley" }),
  ).toContainText("IR");
  await page.getByRole("tab", { name: "Marlon FC" }).click();
  await expect(page.locator(".player-card").first()).toContainText("Fardin");
  await page.getByRole("tab", { name: "Real Nathan" }).click();
  await expect(page.locator(".player-card").first()).toContainText("Sai G");
  await expect(page.getByRole("button", { name: "Edit Ratings" })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: `test-results/rosters-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("calendar changes month, week and list without fabricated fixtures", async ({
  page,
}) => {
  await page.goto("/schedule");
  await expect(page.locator(".calendar-day")).toHaveCount(42);
  const title = await page.locator(".calendar-toolbar h2").textContent();
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.locator(".calendar-toolbar h2")).not.toHaveText(title!);
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.locator(".calendar-day")).toHaveCount(7);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.locator(".calendar-day")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "New reservation" }),
  ).toHaveCount(0);
});
test("trade center protects private tabs and captain actions", async ({
  page,
}) => {
  await page.goto("/trades");
  await expect(
    page.getByRole("heading", { name: "The market is quiet." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Received Offers" }).click();
  await expect(
    page.getByRole("button", { name: "Sign In with Google" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Propose trade" })).toHaveCount(
    0,
  );
  await page.getByRole("tab", { name: "Trade History" }).click();
  await expect(
    page.getByText("Completed and closed offers will appear here."),
  ).toBeVisible();
});
test("all public pages fit viewport and navigation works", async ({
  page,
  isMobile,
}) => {
  for (const route of [
    "/",
    "/standings",
    "/rosters",
    "/schedule",
    "/trades",
    "/media",
    "/profile",
    "/captain",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await page.locator("[aria-busy=true]").waitFor({ state: "hidden" });
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll, route).toBeLessThanOrEqual(dimensions.width);
  }
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Standings" })
      .click();
  } else
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Standings" })
      .click();
  await expect(page).toHaveURL(/standings/);
});
test("Google OAuth generates PKCE request", async ({ page }) => {
  let authUrl = "";
  await page.route("**/auth/v1/authorize?**", async (route) => {
    authUrl = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "OAuth request verified",
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect.poll(() => authUrl).toContain("provider=google");
  expect(authUrl).toContain("code_challenge=");
  expect(decodeURIComponent(authUrl)).toContain(
    "redirect_to=http://localhost:3000/auth/callback",
  );
});
