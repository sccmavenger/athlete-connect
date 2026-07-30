import { expect, type Page } from "@playwright/test";
import type { TestUser } from "./admin";

export async function signIn(page: Page, user: TestUser) {
  await page.goto("/auth");
  const tab = page.getByRole("tab", { name: "Sign in" });
  await expect(tab).toBeVisible();
  // Retry until React has hydrated and the tab actually switches panels.
  await expect(async () => {
    await tab.click();
    await expect(page.locator("#si-email")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });

  await page.locator("#si-email").fill(user.email);
  await page.locator("#si-pass").fill(user.password);
  await page.locator("form").filter({ has: page.locator("#si-email") }).getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
}

export async function signOut(page: Page) {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/** Fills a labelled field inside the profile editor (label text sits in the first span). */
export async function fillField(page: Page, label: string, value: string) {
  const field = page.locator(
    `xpath=//label[span[1][normalize-space(.)='${label}' or normalize-space(.)='${label} *']]`,
  );
  await field.locator("input, textarea").first().fill(value);
}

export async function expectVisible(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
}
