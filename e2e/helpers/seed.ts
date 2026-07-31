import { adminClient } from "./admin";

/** Creates a published athlete row directly (bypasses the editor UI). */
export async function seedAthlete(opts: {
  userId: string;
  name: string;
  zip?: string;
  lat?: number;
  lng?: number;
}) {
  const admin = adminClient();
  const { data, error } = await admin
    .from("athletes")
    .insert({
      user_id: opts.userId,
      full_name: opts.name,
      hometown: "Wichita",
      state: "KS",
      high_school: "Summit Prep",
      grad_year: 2027,
      position: "PG",
      height_inches: 74,
      weight_lbs: 175,
      gpa: 3.9,
      zip_code: opts.zip ?? "67207",
      latitude: opts.lat ?? 37.6689,
      longitude: opts.lng ?? -97.2411,
      is_published: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Seeds an upcoming game so the coach games calendar has something to find. */
export async function seedEvent(athleteId: string, opponent: string) {
  const admin = adminClient();
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { error } = await admin.from("athlete_events").insert({
    athlete_id: athleteId,
    event_date: date,
    event_time: "6:00 PM",
    opponent,
    location: "Summit Fieldhouse, Wichita KS",
    is_mayb: true,
  });
  if (error) throw error;
  return date;
}
