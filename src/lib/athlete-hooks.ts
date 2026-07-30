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
  position: string | null;
  profile_photo_url: string | null;
  is_published: boolean;
};

/**
 * Athlete profiles the signed-in user can manage: their own profile plus any
 * profile they're linked to as a parent/guardian. RLS already scopes the rows.
 */
export function useManagedAthletes() {
  const { user } = useAuth();
  return useQuery({
    enabled: !!user?.id,
    queryKey: ["managed-athletes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select(
          "id, user_id, full_name, high_school, state, grad_year, position, profile_photo_url, is_published",
        )
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as ManagedAthlete[];
    },
  });
}
