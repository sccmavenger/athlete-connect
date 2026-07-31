import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Records an anonymous (signed-out) view of a published athlete profile.
 * Public by design: it only ever writes a view row for a published profile and
 * returns nothing readable.
 */
export const recordPublicProfileView = createServerFn({ method: "POST" })
  .inputValidator((input: { athleteId: string }) => {
    if (!input?.athleteId || typeof input.athleteId !== "string") throw new Error("athleteId required");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: athlete } = await supabaseAdmin
      .from("athletes")
      .select("id")
      .eq("id", data.athleteId)
      .eq("is_published", true)
      .maybeSingle();
    if (!athlete) return { ok: false };
    await supabaseAdmin
      .from("profile_views")
      .insert({ athlete_id: data.athleteId, viewer_role: "public" });
    return { ok: true };
  });

/**
 * Records a signed-in view, attributing the viewer's role (and college, for a
 * coach) so the athlete sees "3 college coaches viewed you this week".
 * Views by the athlete or their own guardian are ignored.
 */
export const recordProfileView = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { athleteId: string }) => {
    if (!input?.athleteId || typeof input.athleteId !== "string") throw new Error("athleteId required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isManager } = await supabase.rpc("is_athlete_manager", {
      _athlete_id: data.athleteId,
      _user_id: userId,
    });
    if (isManager) return { ok: false, reason: "self" };

    const { data: isCoach } = await supabase.rpc("has_role", { _user_id: userId, _role: "coach" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let label: string | null = null;
    if (isCoach) {
      const { data: req } = await supabaseAdmin
        .from("coach_requests")
        .select("college")
        .eq("user_id", userId)
        .maybeSingle();
      label = req?.college ?? "College program";
    }

    // De-duplicate: one view per viewer per athlete per 6 hours.
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("profile_views")
      .select("id")
      .eq("athlete_id", data.athleteId)
      .eq("viewer_user_id", userId)
      .gte("created_at", since)
      .maybeSingle();
    if (recent) return { ok: false, reason: "duplicate" };

    await supabaseAdmin.from("profile_views").insert({
      athlete_id: data.athleteId,
      viewer_user_id: userId,
      viewer_role: isCoach ? "coach" : isAdmin ? "admin" : "athlete",
      viewer_label: label,
    });
    return { ok: true };
  });
