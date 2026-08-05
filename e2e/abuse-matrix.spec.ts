import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminClient, approveCoach, createUser, deleteUser, type TestUser } from "./helpers/admin";
import { seedAthlete } from "./helpers/seed";

/**
 * Abuse / permission matrix.
 *
 * These tests hit the Data API directly as each role, deliberately trying the
 * things a malicious client would try: reading other people's data, escalating
 * roles, impersonating senders, and bypassing product limits. Everything here
 * must FAIL (error or empty result) — the UI is not the security boundary.
 */

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signedIn(user: TestUser): Promise<SupabaseClient> {
  const c = client();
  const { error } = await c.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw error;
  return c;
}

let athleteA: TestUser;
let athleteB: TestUser;
let coach: TestUser;
let parent: TestUser;
let drafter: TestUser;
let athleteAId: string;
let athleteBId: string;
let draftId: string;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  athleteA = await createUser({ name: "Abuse Athlete A", role: "athlete", slug: "abuse-a" });
  athleteB = await createUser({ name: "Abuse Athlete B", role: "athlete", slug: "abuse-b" });
  coach = await createUser({ name: "Abuse Coach", role: "coach", slug: "abuse-coach" });
  parent = await createUser({ name: "Abuse Parent", role: "parent", slug: "abuse-parent" });
  drafter = await createUser({ name: "Abuse Drafter", role: "athlete", slug: "abuse-draft" });
  await approveCoach(coach.id);

  athleteAId = await seedAthlete({ userId: athleteA.id, name: athleteA.name });
  athleteBId = await seedAthlete({ userId: athleteB.id, name: athleteB.name });

  const admin = adminClient();
  // A draft (unpublished) profile plus private contact rows to probe.
  const { data: draft, error } = await admin
    .from("athletes")
    .insert({ user_id: drafter.id, full_name: "Abuse Draft", is_published: false })
    .select("id")
    .single();
  if (error) throw error;
  draftId = draft.id as string;

  await admin.from("athlete_contacts").insert([
    { athlete_id: athleteAId, athlete_email: "a@private.test", guardian_phone: "555-0100" },
    { athlete_id: athleteBId, athlete_email: "b@private.test", guardian_phone: "555-0200" },
  ]);
  await admin
    .from("athletes")
    .update({ date_of_birth: "2010-01-01", sat_score: 1400, ncaa_id: "NCAA-123" })
    .eq("id", athleteAId);
});

test.afterAll(async () => {
  for (const u of [athleteA, athleteB, coach, parent, drafter]) if (u) await deleteUser(u.id);
});

test("signed-out visitors cannot read sensitive athlete columns", async () => {
  const anon = client();
  for (const col of ["date_of_birth", "sat_score", "act_score", "ncaa_id", "guardian_consent_email"]) {
    const { data, error } = await anon.from("athletes").select(col).eq("id", athleteAId);
    expect(error, `anon read of ${col} should be rejected`).not.toBeNull();
    expect(data).toBeNull();
  }
});

test("signed-out visitors cannot read unpublished profiles or their media", async () => {
  const anon = client();
  const { data } = await anon.from("athletes").select("id, full_name").eq("id", draftId);
  expect(data ?? []).toHaveLength(0);

  const { data: photos } = await anon.from("athlete_photos").select("id").eq("athlete_id", draftId);
  expect(photos ?? []).toHaveLength(0);
});

test("signed-out visitors cannot read contact details", async () => {
  const anon = client();
  const { data, error } = await anon.from("athlete_contacts").select("*").eq("athlete_id", athleteAId);
  expect(error !== null || (data ?? []).length === 0).toBe(true);
});

test("an athlete cannot read or modify another athlete's profile", async () => {
  const c = await signedIn(athleteA);
  const { data: reads } = await c.from("athlete_contacts").select("*").eq("athlete_id", athleteBId);
  expect(reads ?? []).toHaveLength(0);

  const { data: updated } = await c
    .from("athletes")
    .update({ full_name: "HACKED" })
    .eq("id", athleteBId)
    .select("id");
  expect(updated ?? []).toHaveLength(0);

  const { data: after } = await adminClient()
    .from("athletes")
    .select("full_name")
    .eq("id", athleteBId)
    .single();
  expect(after?.full_name).toBe(athleteB.name);
});

test("an athlete cannot delete another athlete's media", async () => {
  const admin = adminClient();
  const { data: vid } = await admin
    .from("athlete_videos")
    .insert({ athlete_id: athleteBId, url: "https://youtu.be/abc123", title: "B highlight" })
    .select("id")
    .single();

  const c = await signedIn(athleteA);
  await c.from("athlete_videos").delete().eq("id", vid!.id);
  const { data: still } = await admin.from("athlete_videos").select("id").eq("id", vid!.id);
  expect(still ?? []).toHaveLength(1);
  await admin.from("athlete_videos").delete().eq("id", vid!.id);
});

test("no user can grant themselves a role", async () => {
  const c = await signedIn(athleteA);
  const { error } = await c.from("user_roles").insert({ user_id: athleteA.id, role: "admin" });
  expect(error).not.toBeNull();

  const { data: roles } = await adminClient()
    .from("user_roles")
    .select("role")
    .eq("user_id", athleteA.id);
  expect((roles ?? []).map((r) => r.role)).not.toContain("admin");
});

test("no user can link themselves as a guardian without an invite", async () => {
  const c = await signedIn(parent);
  const { error } = await c
    .from("athlete_guardians")
    .insert({ athlete_id: athleteAId, user_id: parent.id, relationship: "father" });
  expect(error).not.toBeNull();
});

test("no user can forge notifications for someone else", async () => {
  const c = await signedIn(coach);
  const { error } = await c.from("notifications").insert({
    user_id: athleteA.id,
    type: "spam",
    title: "Click this link",
  });
  expect(error).not.toBeNull();
});

test("a coach cannot see unpublished profiles or unrelated contact info", async () => {
  const c = await signedIn(coach);
  const { data: draft } = await c.from("athletes").select("id").eq("id", draftId);
  expect(draft ?? []).toHaveLength(0);

  // Not saved to this coach's pipeline yet → no contact details.
  const { data: contacts } = await c.from("athlete_contacts").select("*").eq("athlete_id", athleteAId);
  expect(contacts ?? []).toHaveLength(0);
});

test("a coach cannot save an athlete on another coach's behalf", async () => {
  const c = await signedIn(coach);
  const { error } = await c
    .from("coach_saved_athletes")
    .insert({ coach_user_id: athleteA.id, athlete_id: athleteAId });
  expect(error).not.toBeNull();
});

test("messages cannot be forged or read by outsiders", async () => {
  const c = await signedIn(coach);
  // Impersonating another sender must fail.
  const { error: forged } = await c.from("messages").insert({
    athlete_id: athleteAId,
    coach_user_id: coach.id,
    sender_user_id: athleteA.id,
    body: "forged",
  });
  expect(forged).not.toBeNull();

  const { error: legit } = await c.from("messages").insert({
    athlete_id: athleteAId,
    coach_user_id: coach.id,
    sender_user_id: coach.id,
    body: "Hi from a coach",
  });
  expect(legit).toBeNull();

  // A third party (athlete B) must not see that thread.
  const other = await signedIn(athleteB);
  const { data: leaked } = await other.from("messages").select("id").eq("athlete_id", athleteAId);
  expect(leaked ?? []).toHaveLength(0);
});

test("profile view analytics are not readable by other users", async () => {
  const admin = adminClient();
  await admin.from("profile_views").insert({ athlete_id: athleteAId, viewer_role: "coach" });
  const other = await signedIn(athleteB);
  const { data } = await other.from("profile_views").select("id").eq("athlete_id", athleteAId);
  expect(data ?? []).toHaveLength(0);
});

test("the 10-college interest limit cannot be exceeded", async () => {
  const c = await signedIn(athleteA);
  const results: (string | null)[] = [];
  for (let i = 0; i < 12; i++) {
    const { error } = await c
      .from("athlete_college_interests")
      .insert({ athlete_id: athleteAId, college_name: `Limit Test U ${i}`, division: "D1" });
    results.push(error?.message ?? null);
  }
  expect(results.filter((r) => r === null).length).toBeLessThanOrEqual(10);
  const { count } = await adminClient()
    .from("athlete_college_interests")
    .select("id", { count: "exact", head: true })
    .eq("athlete_id", athleteAId);
  expect(count ?? 0).toBeLessThanOrEqual(10);
});

test("an under-13 profile cannot be published without recorded guardian consent", async () => {
  const admin = adminClient();
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - 11);
  const { data: kid } = await admin
    .from("athletes")
    .insert({
      user_id: parent.id,
      full_name: "Abuse Kid",
      date_of_birth: dob.toISOString().slice(0, 10),
      is_published: false,
    })
    .select("id")
    .single();

  const c = await signedIn(parent);
  const { error } = await c.from("athletes").update({ is_published: true }).eq("id", kid!.id);
  expect(error).not.toBeNull();

  const { data: after } = await admin
    .from("athletes")
    .select("is_published")
    .eq("id", kid!.id)
    .single();
  expect(after?.is_published).toBe(false);
});
