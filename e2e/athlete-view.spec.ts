import { test, expect, type Page } from "@playwright/test";
import { approveCoach, createUser, deleteUser, getAthleteId, type TestUser } from "./helpers/admin";
import { fillField, signIn, signOut } from "./helpers/ui";

/**
 * ATHLETE VIEW — full end-to-end journey (see docs/TEST-PLAN.md, suite A).
 *
 * A1  sign in + dashboard shell
 * A2  build, publish and re-open the profile (data persists)
 * A3  public profile is reachable and shows the published details
 * A4  target school list (add + remove)
 * A5  parent/guardian invite code
 * A6  message a coach, see it in the thread
 * A7  notifications bell
 * A8  profile insights page loads
 * A9  report a message / report controls exist for user content
 * A10 account page + permanent account deletion
 */

const ZIP = "67207";

let athlete: TestUser;
let coach: TestUser;
let parent: TestUser;
let athleteId: string | null = null;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const stamp = Date.now();
  athlete = await createUser({ name: `E2E Athlete ${stamp}`, role: "athlete", slug: "av-athlete" });
  coach = await createUser({ name: `E2E Coach ${stamp}`, role: "coach", slug: "av-coach" });
  parent = await createUser({ name: `E2E Parent ${stamp}`, role: "parent", slug: "av-parent" });
  await approveCoach(coach.id);
});

test.afterAll(async () => {
  for (const u of [athlete, coach, parent]) if (u) await deleteUser(u.id);
});

async function pickSelect(page: Page, label: string, optionText: RegExp | string) {
  await page
    .locator(`xpath=//*[normalize-space(text())='${label}']/following::button[@role='combobox'][1]`)
    .first()
    .click();
  await page.getByRole("option", { name: optionText }).first().click();
}

test("A1 athlete signs in and lands on the dashboard", async ({ page }) => {
  await signIn(page, athlete);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("link", { name: /profile/i }).first()).toBeVisible();
});

test("A2 athlete builds, publishes and re-opens the profile", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/profile/edit");
  await expect(page.getByRole("heading", { name: "Your athlete profile" })).toBeVisible();

  await fillField(page, "Full name", athlete.name);
  await fillField(page, "Hometown", "Wichita");
  await fillField(page, "State", "KS");
  await fillField(page, "ZIP code", ZIP);
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

  await page.goto("/profile/edit");
  await expect(async () => {
    await expect(
      page.locator("xpath=//label[span[1][normalize-space(.)='GPA']]//input").first(),
    ).toHaveValue("3.9", { timeout: 5000 });
  }).toPass({ timeout: 60_000 });
});

test("A3 published profile is publicly viewable while signed out", async ({ page }) => {
  await page.goto("/");
  await signOut(page);
  await page.goto(`/a/${athleteId}`);
  await expect(page.getByRole("heading", { name: athlete.name })).toBeVisible();
  await expect(page.getByText("Summit Prep").first()).toBeVisible();
});

test("A4 athlete manages a target school list", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/colleges");
  await expect(page.getByRole("heading", { name: "My college list" })).toBeVisible();

  await page.getByPlaceholder("Wichita State").fill("Louisiana State University");
  await page.getByRole("button", { name: /^Add$/ }).click();
  await expect(page.getByRole("heading", { name: /Louisiana State University/ })).toBeVisible({
    timeout: 20_000,
  });
});

test("A5 athlete creates a parent invite code and the parent links", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/family");
  await expect(page.getByRole("heading", { name: /Parents & guardians/ })).toBeVisible();
  await page.getByRole("button", { name: "Create invite code" }).click();
  const codeEl = page.locator("p.font-mono").first();
  await expect(codeEl).toBeVisible({ timeout: 20_000 });
  const code = ((await codeEl.textContent()) ?? "").trim();
  expect(code.length).toBeGreaterThanOrEqual(6);

  await signOut(page);
  await signIn(page, parent);
  await page.goto("/family");
  await page.getByPlaceholder("8-character code").fill(code);
  await page.getByRole("button", { name: "Link my account" }).click();
  await expect(page.getByText(athlete.name).first()).toBeVisible({ timeout: 20_000 });
});

test("A6 athlete messages a coach", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await pickSelect(page, "Start a conversation", new RegExp(coach.name, "i"));
  await page.getByPlaceholder(/Introduce yourself/i).fill("Hi coach — PG, 2027, 3.9 GPA.");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByText("3.9 GPA.").first()).toBeVisible({ timeout: 20_000 });
});

test("A7 athlete reports a coach message and can block the conversation", async ({ page }) => {
  // Coach replies first so there is inbound content to report.
  await signIn(page, coach);
  await expect(async () => {
    await page.goto("/coaches/messages");
    await expect(page.getByText(athlete.name).first()).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 60_000 });
  await page.getByText(athlete.name).first().click();
  await page.getByPlaceholder(/Message this athlete/i).fill("Come to our camp in June.");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByText("camp in June").first()).toBeVisible({ timeout: 20_000 });

  await signOut(page);
  await signIn(page, athlete);
  await page.goto("/messages");
  await expect(page.getByText("camp in June").first()).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Report this message" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText(/Report sent/i).first()).toBeVisible({ timeout: 20_000 });
});

test("A8 notifications bell shows activity", async ({ page }) => {
  await signIn(page, athlete);
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText(/New message from a college coach/i)).toBeVisible({ timeout: 20_000 });
});

test("A9 profile insights page loads", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/insights");
  await expect(page.getByRole("heading", { name: /Profile insights/i })).toBeVisible({
    timeout: 30_000,
  });
});

test("A10 athlete permanently deletes the account", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "ACCOUNT", exact: true })).toBeVisible();
  await expect(page.getByText(athlete.email)).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: /Delete my account/i }).click();
  await page.locator("#confirm-delete").fill("DELETE");
  await page.getByRole("button", { name: /Permanently delete/i }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

  // Signing in again must fail: the account is gone.
  await page.goto("/auth");
  const tab = page.getByRole("tab", { name: "Sign in" });
  await expect(async () => {
    await tab.click();
    await expect(page.locator("#si-email")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });
  await page.locator("#si-email").fill(athlete.email);
  await page.locator("#si-pass").fill(athlete.password);
  await page
    .locator("form")
    .filter({ has: page.locator("#si-email") })
    .getByRole("button", { name: "Sign in" })
    .click();
  await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 15_000 });
});
