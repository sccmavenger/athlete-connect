import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { useManagedAthletes } from "@/lib/athlete-hooks";
import { listApprovedCoaches } from "@/lib/guardian.functions";
import { MessageThread } from "@/components/MessageThread";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { ATHLETE_OUTREACH_NOTE } from "@/lib/compliance";
import { MessageSquare, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Recruiting Hub" },
      { name: "description", content: "Message college coaches directly from your recruiting profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AthleteMessages,
});

function AthleteMessages() {
  const { user } = useAuth();
  const athletes = useManagedAthletes();
  const loadCoaches = useServerFn(listApprovedCoaches);

  const [athleteId, setAthleteId] = useState<string>("");
  const [coachId, setCoachId] = useState<string>("");

  const activeAthlete = useMemo(() => {
    const list = athletes.data ?? [];
    return list.find((a) => a.id === athleteId) ?? list[0] ?? null;
  }, [athletes.data, athleteId]);

  const coaches = useQuery({
    enabled: !!user?.id,
    queryKey: ["approved-coaches"],
    staleTime: 5 * 60_000,
    queryFn: () => loadCoaches({}),
  });

  const threads = useQuery({
    enabled: !!activeAthlete?.id,
    queryKey: ["message-threads", activeAthlete?.id],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("coach_user_id, body, created_at, read_at, sender_user_id")
        .eq("athlete_id", activeAthlete!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const byCoach = new Map<string, { last: string; at: string; unread: number }>();
      for (const m of data ?? []) {
        const cur = byCoach.get(m.coach_user_id);
        const unreadInc = !m.read_at && m.sender_user_id === m.coach_user_id ? 1 : 0;
        if (!cur) byCoach.set(m.coach_user_id, { last: m.body, at: m.created_at, unread: unreadInc });
        else cur.unread += unreadInc;
      }
      return Array.from(byCoach.entries()).map(([coach_user_id, v]) => ({ coach_user_id, ...v }));
    },
  });

  const coachList = coaches.data ?? [];
  const coachById = new Map(coachList.map((c) => [c.user_id, c]));
  const activeCoachId = coachId || threads.data?.[0]?.coach_user_id || "";
  const activeCoach = coachById.get(activeCoachId);

  if (!user) return null;

  if (athletes.isPending) {
    return <div className="container mx-auto px-4 py-10 text-muted-foreground">Loading…</div>;
  }

  if ((athletes.data ?? []).length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={MessageSquare}
          title="Create a profile first"
          description="Coaches need a profile to look at before you reach out. Build yours, then message programs from here."
          action={
            <Button asChild>
              <Link to="/profile/edit">Build my profile</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reach out to college coaches directly, and pick up replies here.
      </p>

      <Card className="mt-4 flex items-start gap-3 border-primary/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-muted-foreground">{ATHLETE_OUTREACH_NOTE}</p>
      </Card>

      {(athletes.data ?? []).length > 1 && (
        <div className="mt-4 max-w-xs">
          <Label className="text-xs">Athlete</Label>
          <Select value={activeAthlete?.id ?? ""} onValueChange={setAthleteId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(athletes.data ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="p-3">
          <Label className="text-xs">Start a conversation</Label>
          <Select value={activeCoachId} onValueChange={setCoachId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={coaches.isPending ? "Loading coaches…" : "Choose a coach"} />
            </SelectTrigger>
            <SelectContent>
              {coachList.map((c) => (
                <SelectItem key={c.user_id} value={c.user_id}>
                  {c.college ? `${c.college} — ${c.name}` : c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {coachList.length === 0 && !coaches.isPending && (
            <p className="mt-2 text-xs text-muted-foreground">
              No approved college coaches on the platform yet. Check back soon.
            </p>
          )}

          <div className="mt-4 space-y-1">
            <p className="px-1 text-xs font-semibold text-muted-foreground">Conversations</p>
            {(threads.data ?? []).length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">Nothing yet.</p>
            ) : (
              (threads.data ?? []).map((t) => {
                const c = coachById.get(t.coach_user_id);
                return (
                  <button
                    key={t.coach_user_id}
                    onClick={() => setCoachId(t.coach_user_id)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary/60 ${
                      t.coach_user_id === activeCoachId ? "bg-secondary" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{c?.college ?? c?.name ?? "Coach"}</span>
                      {t.unread > 0 && (
                        <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {t.unread}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{t.last}</span>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {activeAthlete && activeCoachId ? (
            <MessageThread
              athleteId={activeAthlete.id}
              coachUserId={activeCoachId}
              currentUserId={user.id}
              side="athlete"
              title={activeCoach?.college ?? activeCoach?.name ?? "College coach"}
              subtitle={activeCoach ? `${activeCoach.name}${activeCoach.title ? ` • ${activeCoach.title}` : ""}` : null}
              hint="Introduce yourself — who you are, your class year, GPA, and a link to your tape."
            />
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Pick a coach on the left to start a conversation.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
