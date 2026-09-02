import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AccountSummary {
  email: string | null;
  roles: string[];
  athletes: { id: string; full_name: string; is_published: boolean }[];
  created_at: string | null;
}

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountSummary> => {
    const userId = context.userId;
    const [{ data: profile }, { data: roles }, { data: owned }, { data: guardianOf }] =
      await Promise.all([
        context.supabase.from("profiles").select("email, created_at").eq("id", userId).maybeSingle(),
        context.supabase.from("user_roles").select("role").eq("user_id", userId),
        context.supabase.from("athletes").select("id, full_name, is_published").eq("user_id", userId),
        context.supabase.from("athlete_guardians").select("athlete_id").eq("user_id", userId),
      ]);

    const guardianIds = (guardianOf ?? []).map((g: any) => g.athlete_id);
    let guardianAthletes: any[] = [];
    if (guardianIds.length) {
      const { data } = await context.supabase
        .from("athletes")
        .select("id, full_name, is_published")
        .in("id", guardianIds);
      guardianAthletes = data ?? [];
    }

    const all = [...(owned ?? []), ...guardianAthletes];
    const seen = new Set<string>();
    const athletes = all.filter((a: any) => !seen.has(a.id) && seen.add(a.id));

    return {
      email: profile?.email ?? null,
      roles: (roles ?? []).map((r: any) => r.role),
      athletes: athletes as AccountSummary["athletes"],
      created_at: profile?.created_at ?? null,
    };
  });

/**
 * Permanently deletes the signed-in user's own account and all data derived
 * from it. Required by App Store guideline 5.1.1(v).
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { confirm: string }) => {
    if (!data || data.confirm !== "DELETE") throw new Error("Confirmation text does not match");
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Athlete profiles this user owns outright (guardian-linked profiles owned by
    // someone else are only unlinked, never deleted).
    const { data: ownedAthletes } = await supabaseAdmin
      .from("athletes")
      .select("id")
      .eq("user_id", userId);
    const athleteIds = (ownedAthletes ?? []).map((a) => a.id);

    if (athleteIds.length) {
      for (const table of [
        "athlete_college_interests",
        "athlete_contacts",
        "athlete_events",
        "athlete_photos",
        "athlete_videos",
        "athlete_guardians",
        "athlete_invites",
        "profile_views",
        "coach_saved_athletes",
        "messages",
      ] as const) {
        await supabaseAdmin.from(table).delete().in("athlete_id", athleteIds);
      }
    }

    // Rows keyed directly to this user.
    await supabaseAdmin.from("athlete_guardians").delete().eq("user_id", userId);
    await supabaseAdmin.from("coach_saved_athletes").delete().eq("coach_user_id", userId);
    await supabaseAdmin.from("coach_saved_searches").delete().eq("coach_user_id", userId);
    await supabaseAdmin.from("messages").delete().eq("coach_user_id", userId);
    await supabaseAdmin.from("messages").delete().eq("sender_user_id", userId);
    await supabaseAdmin.from("profile_views").delete().eq("viewer_user_id", userId);
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    await supabaseAdmin.from("coach_requests").delete().eq("user_id", userId);

    if (athleteIds.length) {
      await supabaseAdmin.from("athletes").delete().in("id", athleteIds);
    }
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Uploaded media lives under a folder named after the user id.
    try {
      const { data: files } = await supabaseAdmin.storage.from("athlete-media").list(userId, {
        limit: 1000,
      });
      const paths = (files ?? []).map((f) => `${userId}/${f.name}`);
      if (paths.length) await supabaseAdmin.storage.from("athlete-media").remove(paths);
    } catch {
      /* media cleanup is best-effort; the account still gets deleted */
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { deleted: true };
  });
