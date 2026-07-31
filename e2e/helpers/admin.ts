import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role helper used ONLY by the e2e suite to create/destroy throwaway
 * accounts and to grant the coach role (normally an admin-approved action).
 * Never import this from application code.
 */
export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "e2e requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type TestUser = { id: string; email: string; password: string; name: string };

const PASSWORD = "E2ePassw0rd!123";

export async function createUser(opts: {
  name: string;
  role: "athlete" | "coach" | "parent";
  slug: string;
}): Promise<TestUser> {
  const admin = adminClient();
  const email = `e2e-${opts.slug}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      role_intent: opts.role,
      full_name: opts.name,
      display_name: opts.name,
      college: opts.role === "coach" ? "E2E State University" : undefined,
    },
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  return { id: data.user.id, email, password: PASSWORD, name: opts.name };
}

/** Simulates the admin approval step for a coach account. */
export async function approveCoach(userId: string) {
  const admin = adminClient();
  const { error } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: "coach" }, { onConflict: "user_id,role" });
  if (error) throw error;
  await admin
    .from("coach_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("user_id", userId);
}

export async function deleteUser(userId: string) {
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId).catch(() => undefined);
}

export async function getAthleteId(userId: string): Promise<string | null> {
  const admin = adminClient();
  const { data } = await admin.from("athletes").select("id").eq("user_id", userId).maybeSingle();
  return data?.id ?? null;
}
