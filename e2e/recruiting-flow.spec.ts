import { test, expect, type Page } from "@playwright/test";
import {
  approveCoach,
  createUser,
  deleteUser,
  getAthleteId,
  type TestUser,
} from "./helpers/admin";
import { fillField, signIn, signOut } from "./helpers/ui";

/**
 * End-to-end recruiting flow:
 *  1. Athlete builds and publishes a profile (with ZIP for radius search)
 *  2. The public profile page is reachable while signed out
 *  3. Coach searches by position + GPA + radius and finds the athlete
 *  4. Coach bookmarks the athlete; shortlist reflects it
 *  5. Athlete sees the bookmark notification in the in-app bell
 */

const ATHLETE_ZIP = "67207"; // Wichita, KS
const COACH_ZIP = "67202"; // Wichita downtown, ~5 mi away

let athlete: TestUser;
let coach: TestUser;
let athleteId: string | null = null;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  athlete = await createUser({ name: `E2E Guard ${Date.now()}`, role: "athlete", slug: "athlete" });
  coach = await createUser({ name: "E2E Coach", role: "coach", slug: "coach" });
  await approveCoach(coach.id);
});

test.afterAll(async () => {
  if (athlete) await deleteUser(athlete.id);
  if (coach) await deleteUser(coach.id);
});

/** Fills one of the coach-directory filter inputs (label sits above the input). */
async function setFilter(page: Page, label: string, value: string) {
  await page
    .locator(
      `xpath=//label[normalize-space(.)='${label}']/following-sibling::input | //label[normalize-space(.)='${label}']/following-sibling::*//input`,
    )
    .first()
    .fill(value);
}

test("athlete completes and publishes a profile", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/profile/edit");
  await expect(page.getByRole("heading", { name: "Your athlete profile" })).toBeVisible();

  await fillField(page, "Full name", athlete.name);
  await fillField(page, "Hometown", "Wichita");
  await fillField(page, "State", "KS");
  await fillField(page, "ZIP code", ATHLETE_ZIP);
  await fillField(page, "High school", "Summit Prep");
  await fillField(page, "Grad year", "2027");
  await fillField(page, "Position", "PG");
  await fillField(page, "Height (inches)", "74");
  await fillField(page, "GPA", "3.9");

  await page.getByText("Publish this profile publicly").click();

  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(async () => (athleteId = await getAthleteId(athlete.id)), { timeout: 30_000 })
    .not.toBeNull();
});

test("published profile is publicly viewable when signed out", async ({ page }) => {
  await page.goto("/");
  await signOut(page);
  await page.goto(`/a/${athleteId}`);
  await expect(page.getByRole("heading", { name: athlete.name })).toBeVisible();
  await expect(page.getByText("Summit Prep").first()).toBeVisible();
});

test("coach finds the athlete by position, GPA and radius, then bookmarks", async ({ page }) => {
  await signIn(page, coach);
  await page.goto("/coaches");
  await expect(page.getByRole("heading", { name: "Athlete search" })).toBeVisible();

  await page.getByRole("button", { name: "PG", exact: true }).click();
  await setFilter(page, "Min GPA", "3.5");
  await setFilter(page, "Where", COACH_ZIP);
  await page.getByRole("button", { name: "Go" }).click();

  const card = page.getByRole("link", { name: new RegExp(athlete.name, "i") });
  await expect(card).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/mi away/).first()).toBeVisible();

  // A high GPA filter the athlete fails should exclude them.
  await setFilter(page, "Min GPA", "4.0");
  await expect(card).toHaveCount(0, { timeout: 20_000 });
  await setFilter(page, "Min GPA", "3.5");
  await expect(card).toBeVisible({ timeout: 20_000 });

  await card.click();
  await expect(page.getByRole("heading", { name: athlete.name })).toBeVisible();

  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByRole("button", { name: /Saved/ })).toBeVisible({ timeout: 20_000 });

  await page.goto("/coaches/saved");
  await expect(page.getByText(athlete.name).first()).toBeVisible({ timeout: 20_000 });
});

test("athlete is notified in-app that a coach bookmarked them", async ({ page }) => {
  await signIn(page, athlete);
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText("A coach bookmarked your profile")).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Mark all read" }).click();
  await expect(page.getByText("Mark all read")).toHaveCount(0, { timeout: 20_000 });
});
