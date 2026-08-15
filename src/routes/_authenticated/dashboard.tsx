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
import {
  BarChart3,
  Bookmark,
  Clock,
  Eye,
  GraduationCap,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

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
        /** One-to-one embed: Supabase returns an object (or null), not an array. */
        athlete_contacts?: unknown[] | Record<string, unknown> | null;
      })
    | null
    | undefined;

  const firstName = (a?.full_name ?? user?.email ?? "").split(/[\s@]/)[0];

  return (
    <div className="container mx-auto max-w-4xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:py-10">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {family ? "My recruiting" : isCoach ? "Recruiting desk" : "Account"}
          </p>
          <h1 className="mt-0.5 truncate font-display text-[2rem] font-bold leading-none sm:text-4xl">
            {family && firstName ? `Hey, ${firstName}` : "Dashboard"}
          </h1>
        </div>
      </div>

      {/* Pending coach */}
      {!family && !isCoach && !isAdmin && (
        <Card className="mt-6 p-5">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
        <Card className="mt-5 p-5">
          <h2 className="font-display text-2xl font-bold">Admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">Approve or reject pending coach access requests.</p>
          <Button asChild className="mt-4 h-11 w-full sm:w-auto">
            <Link to="/admin/coach-requests">Review coach requests</Link>
          </Button>
        </Card>
      )}

      {/* Athlete / parent */}
      {family && (
        <div className="mt-5 space-y-4">
          {managed.isPending || (primaryId && athleteQuery.isPending) ? (
            <Card className="space-y-3 p-5">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
              <div className="space-y-2 pt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-40" />
                ))}
              </div>
            </Card>
          ) : !a ? (
            <Card className="p-5">
              <h2 className="font-display text-2xl font-bold">
                {isParent && !isAthlete ? "Link your athlete" : "Build your profile"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isParent && !isAthlete
                  ? "Enter the invite code your athlete generated, or start a profile for them."
                  : "Add your basics, academics, videos, and schedule so coaches can find you."}
              </p>
              <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                <Button asChild className="h-12">
                  <Link to="/profile/edit">Create profile</Link>
                </Button>
                <Button asChild variant="outline" className="h-12">
                  <Link to="/family">Use an invite code</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Athlete identity card */}
              <Card className="relative overflow-hidden p-5">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
                />
                <div className="relative flex items-center gap-4">
                  {a.profile_photo_url ? (
                    <img
                      src={a.profile_photo_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-2xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary font-display text-2xl font-bold">
                      {String(a.full_name ?? "?")
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-2xl font-bold leading-tight">{a.full_name}</h2>
                    <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {[a.position, a.grad_year ? `Class of ${a.grad_year}` : null].filter(Boolean).join(" • ") ||
                        "Profile started"}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        a.is_published ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${a.is_published ? "bg-primary" : "bg-muted-foreground"}`}
                      />
                      {a.is_published ? "Visible to coaches" : "Not published"}
                    </span>
                  </div>
                </div>

                <p className="relative mt-3 truncate text-xs text-muted-foreground">
                  {a.high_school ?? "No school set"}
                </p>

                <div className="relative mt-4 grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="h-12">
                    <Link to="/a/$athleteId" params={{ athleteId: a.id }}>
                      View profile
                    </Link>
                  </Button>
                  <Button asChild className="h-12">
                    <Link to="/profile/edit">Edit details</Link>
                  </Button>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Profile views" value={activity.data?.views ?? 0} icon={Eye} />
                <Metric label="Bookmarks" value={activity.data?.saves ?? 0} icon={Bookmark} />
                <Metric label="Unread" value={activity.data?.unread ?? 0} icon={MessageSquare} highlight />
              </div>

              <CompletenessCard
                athlete={{
                  ...(a as any),
                  videoCount: a.athlete_videos?.length ?? 0,
                  photoCount: a.athlete_photos?.length ?? 0,
                  eventCount: a.athlete_events?.length ?? 0,
                  hasContact: Array.isArray(a.athlete_contacts)
                    ? a.athlete_contacts.length > 0
                    : !!a.athlete_contacts,
                }}
              />

              {/* Quick actions */}
              <div>
                <h3 className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Quick actions
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <QuickAction to="/insights" label="Insights" icon={BarChart3} />
                  <QuickAction to="/messages" label="Message a coach" icon={MessageSquare} />
                  <QuickAction to="/colleges" label="My college list" icon={GraduationCap} />
                  <QuickAction to="/family" label="Parents & guardians" icon={Users} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  const active = highlight && value > 0;
  return (
    <div className="rounded-2xl border bg-card p-3">
      <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
      <p className={`mt-2 font-display text-2xl font-bold leading-none ${active ? "text-primary" : ""}`}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      to={to}
      className="flex min-h-[88px] flex-col justify-between rounded-2xl border bg-card p-4 transition-colors active:bg-secondary"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </Link>
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
    <Card className="p-5">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <Button asChild variant={variant} className="mt-4 h-11 w-full">
        <Link to={to}>{cta}</Link>
      </Button>
    </Card>
  );
}

