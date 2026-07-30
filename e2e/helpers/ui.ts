import { expect, type Page } from "@playwright/test";
import type { TestUser } from "./admin";

export async function signIn(page: Page, user: TestUser) {
  await page.goto("/auth");
  await page.getByRole("tab", { name: "Sign in" }).click();
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
}

export async function signOut(page: Page) {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/** Fills a labelled field inside the profile editor. */
export async function fillField(page: Page, label: string, value: string) {
  const field = page.getByText(label, { exact: true }).locator("xpath=ancestor::label[1]");
  await field.locator("input, textarea").first().fill(value);
}

export async function expectVisible(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
}
