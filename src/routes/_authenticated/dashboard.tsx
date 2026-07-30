import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { useManagedAthletes } from "@/lib/athlete-hooks";
import { isMockMode, mockMyAthlete } from "@/lib/mock-helpers";
import { CompletenessCard } from "@/components/CompletenessCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardListSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import { Clock } from "lucide-react";

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
  const isParent = roles.includes("parent");
  const family = isAthlete || isParent;

  const managed = useManagedAthletes();
  const primaryId = managed.data?.[0]?.id;

  const athleteQuery = useQuery({
    enabled: !!user?.id && family && !!primaryId,
    queryKey: ["my-athlete", primaryId],
    queryFn: async () => {
      if (isMockMode()) return mockMyAthlete();
      const { data } = await supabase
        .from("athletes")
        .select("*, athlete_videos(id), athlete_photos(id), athlete_events(id, event_date), athlete_contacts(id)")
        .eq("id", primaryId!)
        .maybeSingle();
      return data;
    },
  });

  const activity = useQuery({
    enabled: !!primaryId && family,
    queryKey: ["athlete-activity", primaryId],
    queryFn: async () => {
      const [{ count: views }, { count: saves }, { count: unread }] = await Promise.all([
        supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("athlete_id", primaryId!),
        supabase
          .from("coach_saved_athletes")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", primaryId!),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", primaryId!)
          .is("read_at", null),
      ]);
      return { views: views ?? 0, saves: saves ?? 0, unread: unread ?? 0 };
    },
  });

  const coachRequestQuery = useQuery({
    enabled: !!user?.id && !family && !isCoach && !isAdmin,
    queryKey: ["my-coach-request", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("coach_requests").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <PageHeaderSkeleton />
        <CardListSkeleton count={2} />
      </div>
    );
  }

  const a = athleteQuery.data as
    | (Record<string, any> & {
        athlete_videos?: unknown[];
        athlete_photos?: unknown[];
        athlete_events?: unknown[];
        athlete_contacts?: unknown[];
      })
    | null
    | undefined;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Dashboard</h1>
      <p className="mt-1 break-all text-muted-foreground">{user?.email}</p>

      {/* Pending coach */}
      {!family && !isCoach && !isAdmin && (
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
          <ShortcutCard
            title="Browse athletes"
            body="Search the Midwest recruiting database by position, GPA and distance."
            to="/coaches"
            cta="Open directory"
          />
          <ShortcutCard
            title="Games near me"
            body="See who's playing this weekend within driving distance."
            to="/coaches/games"
            cta="Plan a trip"
            variant="outline"
          />
          <ShortcutCard
            title="My pipeline"
            body="Your shortlist with stages, tags and private notes."
            to="/coaches/saved"
            cta="View pipeline"
            variant="outline"
          />
          <ShortcutCard
            title="Inbox"
            body="Conversations with athletes and families."
            to="/coaches/messages"
            cta="Open inbox"
            variant="outline"
          />
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <Card className="mt-6 p-6">
          <h2 className="font-display text-2xl font-bold">Admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">Approve or reject pending coach access requests.</p>
          <Button asChild className="mt-4">
            <Link to="/admin/coach-requests">Review coach requests</Link>
          </Button>
        </Card>
      )}

      {/* Athlete / parent */}
      {family && (
        <div className="mt-6 space-y-6">
          {managed.isPending || (primaryId && athleteQuery.isPending) ? (
            <Card className="space-y-3 p-6">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
              <div className="space-y-2 pt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-40" />
                ))}
              </div>
            </Card>
          ) : !a ? (
            <Card className="p-6">
              <h2 className="font-display text-2xl font-bold">
                {isParent && !isAthlete ? "Link your athlete" : "Build your profile"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isParent && !isAthlete
                  ? "Enter the invite code your athlete generated, or start a profile for them."
                  : "Add your basics, academics, videos, and schedule so coaches can find you."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/profile/edit">Create profile</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/family">Use an invite code</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl font-bold">{a.full_name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {a.high_school ?? "No school set"}
                      {a.grad_year ? ` • Class of ${a.grad_year}` : ""}
                      {a.is_published ? " • Public" : " • Unpublished"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Link to="/a/$athleteId" params={{ athleteId: a.id }}>
                        View
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1 sm:flex-none">
                      <Link to="/profile/edit">Edit</Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <Metric label="Profile views" value={activity.data?.views ?? 0} />
                  <Metric label="Coach bookmarks" value={activity.data?.saves ?? 0} />
                  <Metric label="Unread messages" value={activity.data?.unread ?? 0} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/insights">Insights</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/messages">Message a coach</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/colleges">My college list</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/family">Parents &amp; guardians</Link>
                  </Button>
                </div>
              </Card>

              <CompletenessCard
                athlete={{
                  ...(a as any),
                  videoCount: a.athlete_videos?.length ?? 0,
                  photoCount: a.athlete_photos?.length ?? 0,
                  eventCount: a.athlete_events?.length ?? 0,
                  hasContact: (a.athlete_contacts?.length ?? 0) > 0,
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ShortcutCard({
  title,
  body,
  to,
  cta,
  variant = "default",
}: {
  title: string;
  body: string;
  to: string;
  cta: string;
  variant?: "default" | "outline";
}) {
  return (
    <Card className="p-6">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild variant={variant} className="mt-4">
        <Link to={to}>{cta}</Link>
      </Button>
    </Card>
  );
}
