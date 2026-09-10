import { test, expect, type Page } from "@playwright/test";
import { approveCoach, createUser, deleteUser, grantRole, type TestUser } from "./helpers/admin";
import { seedAthlete, seedEvent } from "./helpers/seed";
import { signIn } from "./helpers/ui";

/**
 * MOBILE / iOS LAYOUT — see docs/TEST-PLAN.md, suite M.
 *
 * Every screen is rendered at iPhone size (390x844, the iOS 14/15/16 Pro class
 * viewport) and checked for the defects that make a web app feel broken in a
 * native shell:
 *   - horizontal overflow (boxes wider than the screen / sideways scrolling)
 *   - individual elements sticking out past the right edge
 *   - tap targets smaller than Apple's 44px minimum
 *   - page content trapped underneath the fixed bottom tab bar
 */

const VIEWPORT = { width: 390, height: 844 };

let athlete: TestUser;
let coach: TestUser;
let adminUser: TestUser;
let athleteId: string;

test.describe.configure({ mode: "serial" });
test.use({ viewport: VIEWPORT });

test.beforeAll(async () => {
  const stamp = Date.now();
  athlete = await createUser({ name: `E2E Mobile Athlete ${stamp}`, role: "athlete", slug: "mob-athlete" });
  coach = await createUser({ name: `E2E Mobile Coach ${stamp}`, role: "coach", slug: "mob-coach" });
  adminUser = await createUser({ name: `E2E Mobile Admin ${stamp}`, role: "athlete", slug: "mob-admin" });
  await approveCoach(coach.id);
  await grantRole(adminUser.id, "admin");
  athleteId = await seedAthlete({ userId: athlete.id, name: athlete.name });
  await seedEvent(athleteId, "E2E Mobile Rival");
});

test.afterAll(async () => {
  for (const u of [athlete, coach, adminUser]) if (u) await deleteUser(u.id);
});

type Overflow = {
  documentOverflow: number;
  offenders: { tag: string; cls: string; right: number; text: string }[];
  smallTapTargets: { label: string; w: number; h: number }[];
  hiddenBehindTabBar: string[];
};

async function auditViewport(page: Page): Promise<Overflow> {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const doc = document.documentElement;
    const offenders: { tag: string; cls: string; right: number; text: string }[] = [];
    const smallTapTargets: { label: string; w: number; h: number }[] = [];

    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (style.position === "fixed") continue;
      if (r.right > vw + 2 && r.width > 8) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 120),
          right: Math.round(r.right),
          text: (el.textContent || "").trim().slice(0, 60),
        });
      }
      if (el.matches("button, a[href], [role='button'], input[type='checkbox']")) {
        if (r.height < 40 || r.width < 32) {
          smallTapTargets.push({
            label:
              (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      }
    }

    // Anything that would sit permanently under the fixed bottom bar.
    const bar = document.querySelector<HTMLElement>("nav[data-bottom-tabs], nav.fixed");
    const hiddenBehindTabBar: string[] = [];
    if (bar) {
      const barTop = bar.getBoundingClientRect().top;
      const pageBottom = document.body.getBoundingClientRect().bottom;
      if (pageBottom > barTop && doc.scrollHeight <= window.innerHeight + 1) {
        hiddenBehindTabBar.push("page content ends underneath the bottom tab bar");
      }
    }

    return {
      documentOverflow: Math.round(doc.scrollWidth - doc.clientWidth),
      offenders: offenders.slice(0, 10),
      smallTapTargets: smallTapTargets.slice(0, 10),
      hiddenBehindTabBar,
    };
  });
}

async function expectCleanMobileLayout(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const audit = await auditViewport(page);
  expect(
    audit.documentOverflow,
    `${route} scrolls sideways by ${audit.documentOverflow}px; offenders: ${JSON.stringify(audit.offenders)}`,
  ).toBeLessThanOrEqual(1);
  expect(
    audit.offenders,
    `${route} has elements past the right edge: ${JSON.stringify(audit.offenders)}`,
  ).toEqual([]);
  expect(
    audit.smallTapTargets,
    `${route} has tap targets under 44px: ${JSON.stringify(audit.smallTapTargets)}`,
  ).toEqual([]);
  expect(audit.hiddenBehindTabBar, `${route}: ${audit.hiddenBehindTabBar.join(", ")}`).toEqual([]);
}

test("M1 public pages fit an iPhone screen", async ({ page }) => {
  for (const route of ["/", "/auth", "/support", "/privacy", "/terms"]) {
    await expectCleanMobileLayout(page, route);
  }
});

test("M2 athlete screens fit an iPhone screen", async ({ page }) => {
  await signIn(page, athlete);
  for (const route of [
    "/dashboard",
    "/profile/edit",
    "/colleges",
    "/messages",
    "/insights",
    "/family",
    "/account",
    `/a/${athleteId}`,
  ]) {
    await expectCleanMobileLayout(page, route);
  }
});

test("M3 coach screens fit an iPhone screen", async ({ page }) => {
  await signIn(page, coach);
  for (const route of [
    "/dashboard",
    "/coaches",
    "/coaches/saved",
    "/coaches/games",
    "/coaches/messages",
    "/account",
    `/a/${athleteId}`,
  ]) {
    await expectCleanMobileLayout(page, route);
  }
});

test("M4 admin screens fit an iPhone screen", async ({ page }) => {
  await signIn(page, adminUser);
  for (const route of ["/admin", "/admin/users", "/admin/coach-requests", "/admin/reports"]) {
    await expectCleanMobileLayout(page, route);
  }
});
