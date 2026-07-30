import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockMyAthlete } from "@/lib/mock-helpers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardListSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Recruiting Hub" }, { name: "robots", content: "noindex" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, roles, loading } = useAuth();
  const isCoach = roles.includes("coach");
  const isAdmin = roles.includes("admin");
  const isAthlete = roles.includes("athlete");

  const athleteQuery = useQuery({
    enabled: !!user?.id && isAthlete,
    queryKey: ["my-athlete", user?.id],
    queryFn: async () => {
      if (isMockMode()) return mockMyAthlete();
      const { data } = await supabase
        .from("athletes")
        .select("*, athlete_videos(id), athlete_events(id, event_date)")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const coachRequestQuery = useQuery({
    enabled: !!user?.id && !isAthlete && !isCoach && !isAdmin,
    queryKey: ["my-coach-request", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_requests")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">{user?.email}</p>

      {/* Pending coach */}
      {!isAthlete && !isCoach && !isAdmin && (
        <Card className="mt-6 p-6">
          <div className="flex items-start gap-3">
            <Clock className="mt-1 h-5 w-5 text-accent" />
            <div>
              <h2 className="font-display text-xl font-bold">Coach access pending</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {coachRequestQuery.data
                  ? "Your coach access request is being reviewed. You'll be able to browse athletes once it's approved."
                  : "Your account isn't linked to any role yet. Contact us if this looks wrong."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Coach view */}
      {isCoach && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-display text-2xl font-bold">Browse athletes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search the Midwest recruiting database.
            </p>
            <Button asChild className="mt-4">
              <Link to="/coaches">Open directory</Link>
            </Button>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-2xl font-bold">Saved athletes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your private shortlist.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/coaches/saved">View saved</Link>
            </Button>
          </Card>
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-2xl font-bold">Admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject pending coach access requests.
          </p>
          <Button asChild className="mt-4">
            <Link to="/admin/coach-requests">Review coach requests</Link>
          </Button>
        </Card>
      )}

      {/* Athlete profile completeness */}
      {isAthlete && (
        <div className="mt-6 space-y-6">
          {!athleteQuery.data ? (
            <Card className="p-6">
              <h2 className="font-display text-2xl font-bold">Build your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your basics, academics, videos, and schedule so coaches can find you.
              </p>
              <Button asChild className="mt-4">
                <Link to="/profile/edit">Create profile</Link>
              </Button>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold">
                    {athleteQuery.data.full_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {athleteQuery.data.high_school ?? "No school set"}
                    {athleteQuery.data.grad_year ? ` • Class of ${athleteQuery.data.grad_year}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/a/$athleteId" params={{ athleteId: athleteQuery.data.id }}>
                      View
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/profile/edit">Edit</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-2">
                <Row done={!!athleteQuery.data.full_name} label="Name" />
                <Row done={!!athleteQuery.data.high_school} label="School" />
                <Row done={!!athleteQuery.data.grad_year} label="Grad year" />
                <Row done={!!athleteQuery.data.position} label="Position" />
                <Row done={!!athleteQuery.data.height_inches} label="Height" />
                <Row done={!!athleteQuery.data.gpa} label="GPA" />
                <Row
                  done={(athleteQuery.data.athlete_videos as unknown[])?.length > 0}
                  label="At least one highlight video"
                />
                <Row
                  done={(athleteQuery.data.athlete_events as unknown[])?.length > 0}
                  label="Upcoming games / events"
                />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-primary" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={done ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
