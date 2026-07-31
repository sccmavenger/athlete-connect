import { test, expect, type Page } from "@playwright/test";
import { approveCoach, createUser, deleteUser, type TestUser } from "./helpers/admin";
import { seedAthlete, seedEvent } from "./helpers/seed";
import { signIn, signOut } from "./helpers/ui";

/**
 * Covers the features added after the core recruiting flow:
 *  - athlete -> coach messaging (and the coach reply + athlete notification)
 *  - profile view insights
 *  - college interest list
 *  - parent/guardian invite + linking
 *  - coach games calendar (radius)
 *  - NCAA compliance fields on the profile editor
 */

let athlete: TestUser;
let coach: TestUser;
let parent: TestUser;
let athleteId: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const stamp = Date.now();
  athlete = await createUser({ name: `E2E Player ${stamp}`, role: "athlete", slug: "player" });
  coach = await createUser({ name: `E2E Recruiter ${stamp}`, role: "coach", slug: "recruiter" });
  parent = await createUser({ name: `E2E Parent ${stamp}`, role: "parent", slug: "parent" });
  await approveCoach(coach.id);
  athleteId = await seedAthlete({ userId: athlete.id, name: athlete.name });
  await seedEvent(athleteId, "E2E Rival Prep");
});

test.afterAll(async () => {
  for (const u of [athlete, coach, parent]) if (u) await deleteUser(u.id);
});

/** Picks an option from a Radix select rendered under the given label. */
async function pickSelect(page: Page, label: string, optionText: RegExp | string) {
  await page
    .locator(`xpath=//*[normalize-space(text())='${label}']/following::button[@role='combobox'][1]`)
    .first()
    .click();
  await page.getByRole("option", { name: optionText }).first().click();
}

test("athlete messages a coach and the coach replies", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();

  await pickSelect(page, "Start a conversation", new RegExp(coach.name, "i"));
  await page.getByPlaceholder(/Introduce yourself/i).fill("Hi coach — PG, 2027, 3.9 GPA. Tape attached.");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByText("Tape attached.").first()).toBeVisible({ timeout: 20_000 });

  // Coach sees it in the inbox and replies.
  await signOut(page);
  await signIn(page, coach);
  await page.goto("/coaches/messages");
  await expect(page.getByText(athlete.name).first()).toBeVisible({ timeout: 20_000 });
  await page.getByText(athlete.name).first().click();
  await expect(page.getByText("Tape attached.").first()).toBeVisible({ timeout: 20_000 });
  await page.getByPlaceholder(/Message this athlete/i).fill("Thanks — we'll come watch you play.");
  await page.getByRole("button", { name: /^Send$/ }).click();
  await expect(page.getByText("come watch you play").first()).toBeVisible({ timeout: 20_000 });
});

test("coach viewing the profile shows up in athlete insights", async ({ page }) => {
  await signIn(page, coach);
  await page.goto(`/a/${athleteId}`);
  await expect(page.getByRole("heading", { name: athlete.name })).toBeVisible();

  await signOut(page);
  await signIn(page, athlete);
  await page.goto("/insights");
  await expect(page.getByRole("heading", { name: "Profile insights" })).toBeVisible();
  await expect(page.getByText("E2E State University").first()).toBeVisible({ timeout: 30_000 });
});

test("athlete gets an in-app notification for the coach reply", async ({ page }) => {
  await signIn(page, athlete);
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText(/New message from a college coach/i)).toBeVisible({ timeout: 20_000 });
});

test("athlete builds a college interest list", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/colleges");
  await expect(page.getByRole("heading", { name: "My college list" })).toBeVisible();

  await page.getByPlaceholder("Wichita State").fill("Summit State University");
  await page.getByPlaceholder("KS").fill("KS");
  await page.getByRole("button", { name: /^Add$/ }).click();
  await expect(page.getByRole("heading", { name: "Summit State University" })).toBeVisible({
    timeout: 20_000,
  });
});

test("athlete invites a parent and the parent links to the profile", async ({ page }) => {
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

test("coach finds the athlete's upcoming game on the calendar", async ({ page }) => {
  await signIn(page, coach);
  await page.goto("/coaches/games");
  await expect(page.getByRole("heading", { name: "Games near me" })).toBeVisible();
  await page.locator("#g-zip").fill("67202");
  await expect(page.getByText("E2E Rival Prep").first()).toBeVisible({ timeout: 45_000 });
});

test("compliance fields save on the profile editor", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/profile/edit");
  await expect(page.getByRole("heading", { name: "Your athlete profile" })).toBeVisible();

  const ncaa = page.locator(
    "xpath=//label[span[1][contains(normalize-space(.),'NCAA')]]//input",
  );
  await ncaa.first().fill("2411223344");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText(/saved/i).first()).toBeVisible({ timeout: 30_000 });

  await page.reload();
  await expect(ncaa.first()).toHaveValue("2411223344", { timeout: 30_000 });
});
