import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { getCoachDirectoryNames } from "@/lib/guardian.functions";
import { MessageThread } from "@/components/MessageThread";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coaches/messages")({
  head: () => ({
    meta: [
      { title: "Coach inbox — Recruiting Hub" },
      { name: "description", content: "Conversations with athletes and families in your recruiting pipeline." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoachInbox,
});

function CoachInbox() {
  const { user, roles, loading } = useAuth();
  const isCoach = roles.includes("coach") || roles.includes("admin");
  const [athleteId, setAthleteId] = useState("");
  const names = useServerFn(getCoachDirectoryNames);

  const threads = useQuery({
    enabled: !!user?.id && isCoach,
    queryKey: ["message-threads", "coach", user?.id],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("athlete_id, body, created_at, read_at, sender_user_id")
        .eq("coach_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map = new Map<string, { last: string; at: string; unread: number }>();
      for (const m of data ?? []) {
        const unreadInc = !m.read_at && m.sender_user_id !== user!.id ? 1 : 0;
        const cur = map.get(m.athlete_id);
        if (!cur) map.set(m.athlete_id, { last: m.body, at: m.created_at, unread: unreadInc });
        else cur.unread += unreadInc;
      }
      const ids = Array.from(map.keys());
      if (ids.length === 0) return [];
      const { data: athletes } = await supabase
        .from("athletes")
        .select("id, full_name, high_school, grad_year, position")
        .in("id", ids);
      const byId = new Map((athletes ?? []).map((a) => [a.id, a]));
      return ids.map((id) => ({ athlete_id: id, athlete: byId.get(id) ?? null, ...map.get(id)! }));
    },
  });

  // Warm the coach's own display name (used by athletes' inbox) — cheap and
  // keeps the server function exercised in one place.
  useQuery({
    enabled: !!user?.id && isCoach,
    queryKey: ["coach-self-name", user?.id],
    staleTime: 10 * 60_000,
    queryFn: () => names({ data: { userIds: [user!.id] } }),
  });

  const list = threads.data ?? [];
  const activeId = athleteId || list[0]?.athlete_id || "";
  const active = useMemo(() => list.find((t) => t.athlete_id === activeId), [list, activeId]);

  if (loading) return <div className="container mx-auto px-4 py-10 text-muted-foreground">Loading…</div>;
  if (!isCoach) {
    return <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">Coach access only.</div>;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Inbox</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conversations with athletes and their families. Start one from any athlete profile.
      </p>

      {threads.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading conversations…</p>
      ) : list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Open an athlete profile and tap Message to start one — athletes can also message you first."
            action={
              <Button asChild variant="outline">
                <Link to="/coaches" search={{}}>Browse athletes</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="space-y-1 p-3">
            {list.map((t) => (
              <button
                key={t.athlete_id}
                onClick={() => setAthleteId(t.athlete_id)}
                className={`w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary/60 ${
                  t.athlete_id === activeId ? "bg-secondary" : ""
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{t.athlete?.full_name ?? "Athlete"}</span>
                  {t.unread > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {t.unread}
                    </span>
                  )}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{t.last}</span>
              </button>
            ))}
          </Card>

          <Card className="overflow-hidden p-0">
            {activeId && user ? (
              <MessageThread
                athleteId={activeId}
                coachUserId={user.id}
                currentUserId={user.id}
                side="coach"
                title={active?.athlete?.full_name ?? "Athlete"}
                subtitle={
                  active?.athlete
                    ? [active.athlete.position, active.athlete.high_school, active.athlete.grad_year]
                        .filter(Boolean)
                        .join(" • ")
                    : null
                }
              />
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
