import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";

export type ManagedAthlete = {
  id: string;
  user_id: string;
  full_name: string;
  high_school: string | null;
  state: string | null;
  grad_year: number | null;
  sport_gender: "mens" | "womens" | null;
  position: string | null;
  profile_photo_url: string | null;
  is_published: boolean;
};

const COLUMNS =
  "id, user_id, full_name, high_school, state, grad_year, sport_gender, position, profile_photo_url, is_published";

/**
 * Athlete profiles the signed-in user can manage: their own profile plus any
 * profile they're linked to as a parent/guardian.
 *
 * NOTE: this must filter explicitly. Published athletes are world-readable, so
 * relying on RLS alone would return every public profile here.
 */
export function useManagedAthletes() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["managed-athletes", user?.id],
    queryFn: async () => {
      const uid = user!.id;
      const [own, links] = await Promise.all([
        supabase.from("athletes").select(COLUMNS).eq("user_id", uid).order("created_at"),
        supabase.from("athlete_guardians").select("athlete_id").eq("user_id", uid),
      ]);
      if (own.error) throw own.error;
      if (links.error) throw links.error;

      const rows = [...((own.data ?? []) as ManagedAthlete[])];
      const linkedIds = (links.data ?? [])
        .map((l) => l.athlete_id)
        .filter((id) => !rows.some((r) => r.id === id));

      if (linkedIds.length > 0) {
        const { data, error } = await supabase
          .from("athletes")
          .select(COLUMNS)
          .in("id", linkedIds)
          .order("created_at");
        if (error) throw error;
        rows.push(...((data ?? []) as ManagedAthlete[]));
      }
      return rows;
    },
  });
}
