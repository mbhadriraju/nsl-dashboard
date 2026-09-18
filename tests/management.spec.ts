import { test, expect, type Page } from "@playwright/test";
import type { Team, Player } from "../lib/types";
const url = "https://gfmublljsjwnsnymlvqt.supabase.co";
const key = "sb_publishable_rss9HT1XKTbF46Wcvo3enw_zURZtc8M";
const uid = "00000000-0000-4000-8000-000000000099";
let teams: Team[], players: Player[];
test.beforeAll(async ({ request }) => {
  const options = { headers: { apikey: key } };
  teams = await (
    await request.get(url + "/rest/v1/teams?select=*", options)
  ).json();
  players = await (
    await request.get(
      url + "/rest/v1/players?select=*,player_playstyles(name,is_plus)",
      options,
    )
  ).json();
});
// UI contract tests use read-only DB fixtures, a synthetic session, and intercepted writes.
// PostgreSQL authorization and transactions are tested separately in supabase/verify.sql.
async function captain(page: Page) {
  const own = teams.find((t) => t.slug === "villains")!;
  const user = {
    id: uid,
    aud: "authenticated",
    role: "authenticated",
    email: "ui-test@example.invalid",
    user_metadata: { full_name: "UI Test Captain" },
    app_metadata: { provider: "google" },
    created_at: new Date().toISOString(),
  };
  const payload = Buffer.from(
    JSON.stringify({
      sub: uid,
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
  const token = "eyJhbGciOiJIUzI1NiJ9." + payload + ".test";
  await page.addInitScript(
    ({ user, token }) =>
      localStorage.setItem(
        "sb-gfmublljsjwnsnymlvqt-auth-token",
        JSON.stringify({
          access_token: token,
          refresh_token: "ui-test-only",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          expires_in: 3600,
          token_type: "bearer",
          user,
        }),
      ),
    { user, token },
  );
  await page.route("**/rest/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.split("/").pop();
    const data =
      path === "teams"
        ? teams
        : path === "players"
          ? players
          : path === "profiles"
            ? {
                ...user,
                full_name: "UI Test Captain",
                role: "captain",
                team_id: own.id,
                player_id: players.find((p) => p.name === "Pratheek")!.id,
              }
            : [];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  return own;
}
test("captain rating edit requires review and exact RPC payload", async ({
  page,
}) => {
  await captain(page);
  let payload: { ratings: { overall: number }; p_id: string } | undefined;
  await page.route("**/rest/v1/rpc/update_ratings", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      body: "null",
      contentType: "application/json",
    });
  });
  await page.goto("/rosters");
  await page
    .locator(".player-card")
    .filter({ hasText: "Michael" })
    .getByRole("button", { name: "Edit Ratings" })
    .click();
  await page.getByLabel("OVR", { exact: true }).fill("84");
  await page.getByRole("button", { name: "Review changes" }).click();
  await expect(
    page.getByText("Update Michael’s OVR from 82 to 84?"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect.poll(() => payload?.ratings.overall).toBe(84);
  expect(payload?.p_id).toBe(players.find((p) => p.name === "Michael")!.id);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("tab", { name: "Marlon FC" }).click();
  await expect(page.getByRole("button", { name: "Edit Ratings" })).toHaveCount(
    0,
  );
});
test("reservation validates times and submits two-team game", async ({
  page,
}) => {
  const own = await captain(page);
  let saved: Record<string, unknown> | undefined;
  await page.route("**/rest/v1/reservations*", async (route) => {
    if (route.request().method() === "POST") {
      saved = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        body: JSON.stringify([{ id: "test-reservation", ...saved }]),
        contentType: "application/json",
      });
    } else
      await route.fulfill({
        status: 200,
        body: "[]",
        contentType: "application/json",
      });
  });
  await page.goto("/schedule");
  await page.getByRole("button", { name: "New reservation" }).click();
  await expect(page.getByLabel("Home team")).toHaveValue(own.id);
  await page.getByLabel("Start time").fill("18:00");
  await page.getByLabel("End time").fill("17:00");
  await page.getByLabel("Location").fill("Test field");
  await page.getByRole("button", { name: "Book reservation" }).click();
  await expect(
    page.getByText("End time must be after start time."),
  ).toBeVisible();
  await page.getByLabel("End time").fill("19:00");
  await page.getByRole("button", { name: "Book reservation" }).click();
  await expect.poll(() => saved?.type).toBe("game");
  expect(saved?.home_team_id).toBe(own.id);
  expect(saved?.away_team_id).not.toBe(own.id);
  expect(saved?.team_id).toBeNull();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("trade requires both sides and final review", async ({ page }) => {
  const own = await captain(page);
  let payload: Record<string, unknown> | undefined;
  await page.route("**/rest/v1/rpc/propose_trade", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      body: '"test-trade"',
      contentType: "application/json",
    });
  });
  await page.goto("/trades");
  await page.getByRole("button", { name: "Propose trade" }).click();
  await expect(
    page.getByRole("button", { name: "Review trade" }),
  ).toBeDisabled();
  await page
    .getByLabel("Trade with")
    .selectOption(teams.find((t) => t.slug === "marlon-fc")!.id);
  await page.getByLabel("Michael").check();
  await page.getByLabel("Safwat").check();
  await page.getByRole("button", { name: "Review trade" }).click();
  await expect(
    page.getByRole("heading", { name: "Review your trade" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send offer" }).click();
  await expect.poll(() => payload?.own_team).toBe(own.id);
  expect(payload?.outgoing).toEqual([
    players.find((p) => p.name === "Michael")!.id,
  ]);
  expect(payload?.incoming).toEqual([
    players.find((p) => p.name === "Safwat")!.id,
  ]);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
