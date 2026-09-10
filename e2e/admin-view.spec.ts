import { test, expect } from "@playwright/test";
import {
  adminClient,
  createUser,
  deleteUser,
  grantRole,
  seedReport,
  type TestUser,
} from "./helpers/admin";
import { seedAthlete } from "./helpers/seed";
import { signIn } from "./helpers/ui";

/**
 * ADMIN / MODERATION VIEW — see docs/TEST-PLAN.md, suite D.
 *
 * D1 admin console shell
 * D2 coach request queue: approve grants the coach role
 * D3 users & roles: role toggle persists
 * D4 reported content queue lists an open report and resolves it
 * D5 "Hide profile" unpublishes the reported athlete
 * D6 a non-admin cannot reach the admin console
 */

let adminUser: TestUser;
let coach: TestUser;
let athlete: TestUser;
let athleteId: string;
let reportId: string;

/** The card that contains a given email (cards are the outer `p-4` container). */
function cardFor(page: import("@playwright/test").Page, email: string) {
  return page
    .getByText(email, { exact: true })
    .locator("xpath=ancestor::div[contains(@class,'p-4')][1]");
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const stamp = Date.now();
  adminUser = await createUser({ name: `E2E Admin ${stamp}`, role: "athlete", slug: "adm-admin" });
  await grantRole(adminUser.id, "admin");
  coach = await createUser({ name: `E2E Pending Coach ${stamp}`, role: "coach", slug: "adm-coach" });
  athlete = await createUser({ name: `E2E Flagged ${stamp}`, role: "athlete", slug: "adm-athlete" });
  athleteId = await seedAthlete({ userId: athlete.id, name: athlete.name });
  reportId = await seedReport({
    reporterUserId: coach.id,
    reportedUserId: athlete.id,
    athleteId,
  });
});

test.afterAll(async () => {
  const admin = adminClient();
  await admin.from("content_reports").delete().eq("id", reportId);
  for (const u of [adminUser, coach, athlete]) if (u) await deleteUser(u.id);
});

test("D1 admin signs in and opens the admin console", async ({ page }) => {
  await signIn(page, adminUser);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin console" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review reports" })).toBeVisible();
});

test("D2 admin approves a pending coach request", async ({ page }) => {
  await signIn(page, adminUser);
  await page.goto("/admin/coach-requests");
  await expect(page.getByRole("heading", { name: "Coach requests" })).toBeVisible();
  const row = cardFor(page, coach.email);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Approve" }).click();

  const admin = adminClient();
  await expect(async () => {
    const { data } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", coach.id)
      .eq("role", "coach")
      .maybeSingle();
    expect(data?.role).toBe("coach");
  }).toPass({ timeout: 20_000 });
});

test("D3 admin finds a user and toggles a role", async ({ page }) => {
  await signIn(page, adminUser);
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Users & roles" })).toBeVisible();
  await page.getByPlaceholder("Search by email, name or role").fill(athlete.email);
  await expect(page.getByText(athlete.email, { exact: false }).first()).toBeVisible();

  const admin = adminClient();
  const row = cardFor(page, athlete.email);
  await row.getByRole("button", { name: "parent", exact: true }).click();
  await expect(async () => {
    const { data } = await admin.from("user_roles").select("role").eq("user_id", athlete.id);
    expect((data ?? []).map((r) => r.role)).toContain("parent");
  }).toPass({ timeout: 20_000 });

  // Put it back so the account ends the run as it started.
  await row.getByRole("button", { name: "parent", exact: true }).click();
  await expect(async () => {
    const { data } = await admin.from("user_roles").select("role").eq("user_id", athlete.id);
    expect((data ?? []).map((r) => r.role)).not.toContain("parent");
  }).toPass({ timeout: 20_000 });
});

test("D4 admin reviews and resolves an open report", async ({ page }) => {
  await signIn(page, adminUser);
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "Reported content" })).toBeVisible();
  await expect(page.getByText("Fake or misleading profile").first()).toBeVisible();
  await expect(page.getByText("E2E seeded report").first()).toBeVisible();

  await page.getByPlaceholder("Add a review note (optional)").first().fill("Reviewed by e2e");
  await page.getByRole("button", { name: "Mark reviewed" }).first().click();

  const admin = adminClient();
  await expect(async () => {
    const { data } = await admin
      .from("content_reports")
      .select("status, resolution_note")
      .eq("id", reportId)
      .single();
    expect(data?.status).toBe("reviewed");
    expect(data?.resolution_note).toContain("Reviewed by e2e");
  }).toPass({ timeout: 20_000 });
});

test("D5 admin hides the reported profile", async ({ page }) => {
  await signIn(page, adminUser);
  await page.goto("/admin/reports");
  await page.getByRole("button", { name: "Hide profile" }).first().click();

  const admin = adminClient();
  await expect(async () => {
    const { data } = await admin
      .from("athletes")
      .select("is_published")
      .eq("id", athleteId)
      .single();
    expect(data?.is_published).toBe(false);
  }).toPass({ timeout: 20_000 });

  // The hidden profile is no longer publicly readable.
  await page.context().clearCookies();
});

test("D6 a non-admin cannot use the admin console", async ({ page }) => {
  await signIn(page, athlete);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin console" })).toHaveCount(0);
  await page.goto("/admin/reports");
  await expect(page.getByText("Fake or misleading profile")).toHaveCount(0);
});
