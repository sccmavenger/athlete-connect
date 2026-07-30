import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** Athlete (or an existing guardian) generates an invite code for a parent. */
export const createGuardianInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { athleteId: string; email?: string; relationship?: string }) => {
    if (!input?.athleteId) throw new Error("athleteId required");
    const email = (input.email ?? "").trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address");
    return {
      athleteId: input.athleteId,
      email: email || null,
      relationship: (input.relationship ?? "").trim().slice(0, 40) || null,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isManager } = await supabase.rpc("is_athlete_manager", {
      _athlete_id: data.athleteId,
      _user_id: userId,
    });
    if (!isManager) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newCode();
      const { data: row, error } = await supabaseAdmin
        .from("athlete_invites")
        .insert({
          athlete_id: data.athleteId,
          code,
          invited_email: data.email,
          relationship: data.relationship,
        })
        .select("id, code, expires_at")
        .single();
      if (!error && row) return row;
      if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Could not generate an invite code, please try again");
  });

/** A signed-in parent redeems an invite code and is linked to the athlete. */
export const redeemGuardianInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    const code = String(input?.code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6,12}$/.test(code)) throw new Error("Enter the 8-character invite code");
    return { code };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invite } = await supabaseAdmin
      .from("athlete_invites")
      .select("id, athlete_id, relationship, expires_at, redeemed_by")
      .eq("code", data.code)
      .maybeSingle();

    if (!invite) throw new Error("That invite code isn't valid");
    if (invite.redeemed_by) throw new Error("That invite code has already been used");
    if (new Date(invite.expires_at) < new Date()) throw new Error("That invite code has expired");

    const { data: athlete } = await supabaseAdmin
      .from("athletes")
      .select("id, full_name, user_id")
      .eq("id", invite.athlete_id)
      .maybeSingle();
    if (!athlete) throw new Error("That athlete profile no longer exists");
    if (athlete.user_id === userId) throw new Error("This is your own athlete profile");

    const { error: linkError } = await supabaseAdmin
      .from("athlete_guardians")
      .upsert(
        { athlete_id: invite.athlete_id, user_id: userId, relationship: invite.relationship },
        { onConflict: "athlete_id,user_id" },
      );
    if (linkError) throw new Error(linkError.message);

    await supabaseAdmin
      .from("athlete_invites")
      .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
      .eq("id", invite.id);

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "parent" }, { onConflict: "user_id,role" });

    await supabaseAdmin.from("notifications").insert({
      user_id: athlete.user_id,
      type: "guardian",
      title: "A parent/guardian joined your profile",
      body: "They can now help manage your profile and see coach interest.",
      link: "/family",
    });

    return { ok: true, athleteId: athlete.id, athleteName: athlete.full_name };
  });

/**
 * Names/colleges of approved coaches, so an athlete can start outreach.
 * Deliberately returns no contact details — messaging happens in-app.
 */
export const listApprovedCoaches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];

    const [{ data: profiles }, { data: requests }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name").in("id", ids),
      supabaseAdmin.from("coach_requests").select("user_id, full_name, college, title").in("user_id", ids),
    ]);

    const byId = new Map((requests ?? []).map((r) => [r.user_id, r]));
    return (profiles ?? [])
      .map((p) => {
        const r = byId.get(p.id);
        return {
          user_id: p.id,
          name: r?.full_name ?? p.display_name ?? "College coach",
          college: r?.college ?? null,
          title: r?.title ?? null,
        };
      })
      .sort((a, b) => (a.college ?? "zzz").localeCompare(b.college ?? "zzz"));
  });

/** Coach-facing display names for the message inbox. */
export const getCoachDirectoryNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userIds: string[] }) => {
    if (!Array.isArray(input?.userIds)) throw new Error("userIds required");
    return { userIds: input.userIds.filter((id) => typeof id === "string").slice(0, 200) };
  })
  .handler(async ({ data }) => {
    if (data.userIds.length === 0) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: requests }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name").in("id", data.userIds),
      supabaseAdmin.from("coach_requests").select("user_id, full_name, college").in("user_id", data.userIds),
    ]);
    const byId = new Map((requests ?? []).map((r) => [r.user_id, r]));
    return (profiles ?? []).map((p) => ({
      user_id: p.id,
      name: byId.get(p.id)?.full_name ?? p.display_name ?? "Coach",
      college: byId.get(p.id)?.college ?? null,
    }));
  });
