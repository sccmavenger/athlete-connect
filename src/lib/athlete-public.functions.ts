import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const getPublicAthlete = createServerFn({ method: "GET" })
  .inputValidator((input: { athleteId: string }) => {
    if (!input?.athleteId || typeof input.athleteId !== "string") throw new Error("athleteId required");
    return input;
  })
  .handler(async ({ data }) => {
    const supabasePublic = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    // Only recruiting-safe columns: no date of birth, guardian consent details,
    // NCAA ID or standardized test scores are exposed publicly.
    const { data: athlete } = await supabasePublic
      .from("athletes")
      .select(
        "id, full_name, hometown, state, high_school, grad_year, position, height_inches, weight_lbs, jersey_number, gpa, intended_major, instagram_handle, tiktok_handle, profile_photo_url, bio, created_at, updated_at, is_published, zip_code, latitude, longitude, sport_gender",
      )
      .eq("id", data.athleteId)
      .eq("is_published", true)
      .maybeSingle();


    if (!athlete) return { athlete: null, videos: [], events: [], photos: [] };

    const [{ data: videos }, { data: events }, { data: photos }] = await Promise.all([
      supabasePublic.from("athlete_videos").select("*").eq("athlete_id", data.athleteId),
      supabasePublic.from("athlete_events").select("*").eq("athlete_id", data.athleteId).order("event_date"),
      supabasePublic.from("athlete_photos").select("*").eq("athlete_id", data.athleteId).order("created_at"),
    ]);

    return { athlete, videos: videos ?? [], events: events ?? [], photos: photos ?? [] };
  });
