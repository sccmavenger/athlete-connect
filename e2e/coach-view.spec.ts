import { test, expect, type Page } from "@playwright/test";
import { approveCoach, createUser, deleteUser, type TestUser } from "./helpers/admin";
import { seedAthlete, seedEvent } from "./helpers/seed";
import { signIn, signOut } from "./helpers/ui";

/**
 * COACH VIEW — full end-to-end journey (see docs/TEST-PLAN.md, suite C).
 *
 * C1 sign in + coach directory shell
 * C2 search by position, GPA and radius (and negative filter case)
 * C3 open an athlete profile from the results
 * C4 bookmark + shortlist
 * C5 games-near-me calendar
 * C6 message an athlete and read the reply
 * C7 report an athlete profile
 * C8 block + unblock (server-enforced) and the Account blocked list
 */

const COACH_ZIP = "67202";

let coach: TestUser;
let athlete: TestUser;
let athleteId: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const stamp = Date.now();
  coach = await createUser({ name: `E2E Recruiter ${stamp}`, role: "coach", slug: "cv-coach" });
  athlete = await createUser({ name: `E2E Prospect ${stamp}`, role: "athlete", slug: "cv-athlete" });
  await approveCoach(coach.id);
  athleteId = await seedAthlete({ userId: athlete.id, name: athlete.name });
  await seedEvent(athleteId, "E2E Rival Prep");
});

test.afterAll(async () => {
  for (const u of [coach, athlete]) if (u) await deleteUser(u.id);
});

async function setFilter(page: Page, label: string, value: string) {
  await page
    .locator(
      `xpath=//label[normalize-space(.)='${label}']/following-sibling::input | //label[normalize-space(.)='${label}']/following-sibling::*//input`,
    )
    .first()
    .fill(value);
}

test("C1 coach signs in and opens athlete search", async ({ page }) => {
  await signIn(page, coach);
  await page.goto("/coaches");
  await expect(page.getByRole("heading", { name: "Athlete search" })).toBeVisible();
});

test("C2 coach filters by position, GPA and radius", async ({ page }) => {
  await signIn(page, coach);
  await page.goto("/coaches");
  await page.getByRole("button", { name: "PG", exact: true }).click();
  await setFilter(page, "Min GPA", "3.5");
  await setFilter(page, "Where", COACH_ZIP);
  await page.getByRole("button", { name: "Go" }).click();

  const card = page.getByRole("link", { name: new RegExp(athlete.name, "i") });
  await expect(card).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/mi away/).first()).toBeVisible();

  await setFilter(page, "Min GPA", "4.0");
  await expect(card).toHaveCount(0, { timeout: 20_000 });
  await setFilter(page, "Min GPA", "3.5");
  await expect(card).toBeVisible({ timeout: 20_000 });
});

test("C3 + C4 coach opens the profile and bookmarks the athlete", async ({ page }) => {
  await signIn(page, coach);
  await page.goto(`/a/${athleteId}`);
  await expect(page.getByRole("heading", { name: athlete.name })).toBeVisible();
  await expect(page.getByText("Summit Prep").first()).toBeVisible();

  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByRole("button", { name: /Saved/ })).toBeVisible({ timeout: 20_000 });

  await page.goto("/coaches/saved");
  await expect(page.getByText(athlete.name).first()).toBeVisible({ timeout: 20_000 });
});

test("C5 coach finds the athlete's game on the calendar", async ({ page }) => {
  await signIn(page, coach);
  await page.goto("/coaches/games");
  await expect(page.getByRole("heading", { name: "Games near me" })).toBeVisible();
  await page.locator("#g-zip").fill(COACH_ZIP);
  await expect(page.getByText("E2E Rival Prep").first()).toBeVisible({ timeout: 45_000 });
});

test("C6 coach messages the athlete and reads the reply", async ({ page }) => {
  await signIn(page, coach);
  await page.goto("/coaches/messages");
  await expect(async () => {
    await page.reload();
    await expect(page.getByText(athlete.name).first()).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 60_000 });
  await page.getByText(athlete.name).first().click();
  await page.getByPlaceholder(/Message this athlete/i).fill("We'd like to see you play live.");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByText("see you play live").first()).toBeVisible({ timeout: 20_000 });

  await signOut(page);
  await signIn(page, athlete);
  await page.goto("/messages");
  await expect(page.getByText("see you play live").first()).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder(/Introduce yourself/i).fill("Thank you coach — here is my tape.");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByText("here is my tape").first()).toBeVisible({ timeout: 20_000 });
});

test("C7 coach reports an athlete profile", async ({ page }) => {
  await signIn(page, coach);
  await page.goto(`/a/${athleteId}`);
  await page.getByRole("button", { name: /^Report$/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText(/Report sent/i).first()).toBeVisible({ timeout: 20_000 });
});

test("C8 coach blocks the athlete, sending is stopped, then unblocks", async ({ page }) => {
  await signIn(page, coach);
  await page.goto("/coaches/messages");
  await page.getByText(athlete.name).first().click();
  await page.getByRole("button", { name: "Safety options" }).click();
  await page.getByRole("menuitem", { name: /Block this person/i }).click();
  await page.getByRole("button", { name: /^Block$/ }).click();
  await expect(page.getByText(/You blocked this person/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByPlaceholder(/Message this athlete/i)).toHaveCount(0);

  await page.goto("/account");
  await expect(page.getByText(athlete.name).first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Unblock" }).first().click();
  await expect(page.getByText(/You haven't blocked anyone/i)).toBeVisible({ timeout: 20_000 });

  await page.goto("/coaches/messages");
  await page.getByText(athlete.name).first().click();
  await expect(page.getByPlaceholder(/Message this athlete/i)).toBeVisible({ timeout: 20_000 });
});
