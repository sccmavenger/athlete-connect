import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useManagedAthletes } from "@/lib/athlete-hooks";
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
import { CompletenessCard } from "@/components/CompletenessCard";
import { BarChart3, Eye, Bookmark, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Profile insights — Recruiting Hub" },
      { name: "description", content: "See who is viewing your recruiting profile and how strong it looks." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Insights,
});

type ViewRow = {
  id: string;
  viewer_role: string;
  viewer_label: string | null;
  created_at: string;
};

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function Insights() {
  const athletes = useManagedAthletes();
  const [athleteId, setAthleteId] = useState("");

  const active = useMemo(() => {
    const list = athletes.data ?? [];
    return list.find((a) => a.id === athleteId) ?? list[0] ?? null;
  }, [athletes.data, athleteId]);

  const views = useQuery({
    enabled: !!active?.id,
    queryKey: ["profile-views", active?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_views")
        .select("id, viewer_role, viewer_label, created_at")
        .eq("athlete_id", active!.id)
        .gte("created_at", since(90).toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ViewRow[];
    },
  });

  const detail = useQuery({
    enabled: !!active?.id,
    queryKey: ["insight-detail", active?.id],
    queryFn: async () => {
      const [{ count: saves }, { data: videos }, { data: photos }, { data: events }, { data: contact }, { data: a }] =
        await Promise.all([
          supabase
            .from("coach_saved_athletes")
            .select("id", { count: "exact", head: true })
            .eq("athlete_id", active!.id),
          supabase.from("athlete_videos").select("id").eq("athlete_id", active!.id),
          supabase.from("athlete_photos").select("id").eq("athlete_id", active!.id),
          supabase.from("athlete_events").select("id").eq("athlete_id", active!.id),
          supabase.from("athlete_contacts").select("id").eq("athlete_id", active!.id).maybeSingle(),
          supabase.from("athletes").select("*").eq("id", active!.id).maybeSingle(),
        ]);
      return {
        saves: saves ?? 0,
        videoCount: videos?.length ?? 0,
        photoCount: photos?.length ?? 0,
        eventCount: events?.length ?? 0,
        hasContact: !!contact,
        athlete: a,
      };
    },
  });

  if (athletes.isPending) {
    return <div className="container mx-auto px-4 py-10 text-muted-foreground">Loading…</div>;
  }
  if ((athletes.data ?? []).length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={BarChart3}
          title="No profile yet"
          description="Once you build and publish a profile, you'll see who's looking at it here."
          action={
            <Button asChild>
              <Link to="/profile/edit">Build my profile</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const rows = views.data ?? [];
  const in7 = rows.filter((r) => new Date(r.created_at) >= since(7));
  const in30 = rows.filter((r) => new Date(r.created_at) >= since(30));
  const coachViews7 = in7.filter((r) => r.viewer_role === "coach");
  const uniqueCoachPrograms = new Set(
    in30.filter((r) => r.viewer_role === "coach").map((r) => r.viewer_label ?? "College program"),
  );

  // 8-week sparkline buckets
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = since(i * 7);
    const start = since((i + 1) * 7);
    return rows.filter((r) => {
      const d = new Date(r.created_at);
      return d > start && d <= end;
    }).length;
  }).reverse();
  const peak = Math.max(1, ...weeks);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Profile insights</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Who's looking at {active?.full_name ?? "your profile"}, and how strong the profile looks to them.
      </p>

      {(athletes.data ?? []).length > 1 && (
        <div className="mt-4 max-w-xs">
          <Label className="text-xs">Athlete</Label>
          <Select value={active?.id ?? ""} onValueChange={setAthleteId}>
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Eye} label="Views this week" value={in7.length} />
        <Stat icon={Users} label="Coach views this week" value={coachViews7.length} />
        <Stat icon={BarChart3} label="Views (30 days)" value={in30.length} />
        <Stat icon={Bookmark} label="Coach bookmarks" value={detail.data?.saves ?? 0} />
      </div>

      <Card className="mt-4 p-6">
        <h2 className="font-display text-lg font-bold">Last 8 weeks</h2>
        <div className="mt-4 flex h-28 items-end gap-2">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(4, (w / peak) * 100)}%` }}
                title={`${w} views`}
              />
              <span className="text-[10px] text-muted-foreground">{w}</span>
            </div>
          ))}
        </div>
        {uniqueCoachPrograms.size > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {uniqueCoachPrograms.size} college program{uniqueCoachPrograms.size === 1 ? "" : "s"} viewed this profile in
            the last 30 days: {Array.from(uniqueCoachPrograms).slice(0, 6).join(", ")}
            {uniqueCoachPrograms.size > 6 ? "…" : ""}
          </p>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold">Recent views</h2>
          {views.isPending ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No views yet. Publish your profile and share the link — views from coaches, and anyone else, show up here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {rows.slice(0, 12).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    {r.viewer_role === "coach"
                      ? `College coach — ${r.viewer_label ?? "program not listed"}`
                      : r.viewer_role === "admin"
                        ? "Summit Hoops staff"
                        : r.viewer_role === "athlete"
                          ? "Another athlete"
                          : "Public visitor"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {detail.data?.athlete && (
          <CompletenessCard
            athlete={{
              ...detail.data.athlete,
              videoCount: detail.data.videoCount,
              photoCount: detail.data.photoCount,
              eventCount: detail.data.eventCount,
              hasContact: detail.data.hasContact,
            }}
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </Card>
  );
}
