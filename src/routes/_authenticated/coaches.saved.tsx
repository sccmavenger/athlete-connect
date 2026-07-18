import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockSavedAthletes } from "@/lib/mock-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coaches/saved")({
  head: () => ({
    meta: [{ title: "Saved athletes — Recruiting Hub" }, { name: "robots", content: "noindex" }],
  }),
  component: SavedList,
});

function SavedList() {
  const { user, roles, loading } = useAuth();
  const isCoach = roles.includes("coach");
  const qc = useQueryClient();

  const q = useQuery({
    enabled: !!user?.id && isCoach,
    queryKey: ["saved-athletes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_saved_athletes")
        .select("id, notes, athletes(id, full_name, high_school, state, grad_year, position, profile_photo_url)")
        .eq("coach_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function unsave(id: string) {
    const { error } = await supabase.from("coach_saved_athletes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["saved-athletes"] });
    toast.success("Removed");
  }

  if (loading) return <div className="container mx-auto px-4 py-12">Loading...</div>;
  if (!isCoach) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">
        Coach access only.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Saved athletes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your private shortlist.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((row) => {
          const a = row.athletes as {
            id: string;
            full_name: string;
            high_school: string | null;
            state: string | null;
            grad_year: number | null;
            position: string | null;
            profile_photo_url: string | null;
          } | null;
          if (!a) return null;
          return (
            <Card key={row.id} className="p-4">
              <div className="flex items-start justify-between">
                <Link to="/a/$athleteId" params={{ athleteId: a.id }} className="flex items-center gap-3 hover:text-primary">
                  {a.profile_photo_url ? (
                    <img src={a.profile_photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-display">
                      {a.full_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold">{a.full_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {a.high_school ?? "—"}
                      {a.state ? ` • ${a.state}` : ""}
                      {a.grad_year ? ` • '${String(a.grad_year).slice(2)}` : ""}
                    </p>
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => unsave(row.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      {q.data && q.data.length === 0 && (
        <p className="mt-6 text-center text-muted-foreground">You haven't saved any athletes yet.</p>
      )}
    </div>
  );
}
