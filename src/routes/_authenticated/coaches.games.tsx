import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { geocodeZip } from "@/lib/geocode.functions";
import { milesBetween, formatMiles, isValidZip } from "@/lib/geo";
import { buildIcs, downloadFile, type IcsEvent } from "@/lib/ics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { CalendarDays, MapPin, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coaches/games")({
  head: () => ({
    meta: [
      { title: "Games near me — Recruiting Hub" },
      { name: "description", content: "Find games this weekend near you and see which recruits are playing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoachGames,
});

const RADII = [25, 50, 100, 250];

type GameRow = {
  id: string;
  athlete_id: string;
  event_date: string;
  event_time: string | null;
  opponent: string | null;
  location: string | null;
  is_mayb: boolean;
};

function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function CoachGames() {
  const { roles, loading } = useAuth();
  const isCoach = roles.includes("coach") || roles.includes("admin");
  const geo = useServerFn(geocodeZip);

  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(100);
  const [span, setSpan] = useState<"weekend" | "7" | "30">("7");
  const [maybOnly, setMaybOnly] = useState(false);

  const origin = useQuery({
    enabled: isValidZip(zip),
    queryKey: ["zip", zip],
    staleTime: 60 * 60_000,
    queryFn: () => geo({ data: { zip: zip.trim() } }),
  });

  const range = useMemo(() => {
    if (span === "weekend") {
      const now = new Date();
      const day = now.getDay(); // 0 Sun … 6 Sat
      const toFri = (5 - day + 7) % 7;
      const fri = new Date(now);
      fri.setDate(now.getDate() + toFri);
      const sun = new Date(fri);
      sun.setDate(fri.getDate() + 2);
      return { from: fri.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
    }
    return { from: isoDay(0), to: isoDay(span === "7" ? 7 : 30) };
  }, [span]);

  const games = useQuery({
    enabled: isCoach,
    queryKey: ["coach-games", range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_events")
        .select("id, athlete_id, event_date, event_time, opponent, location, is_mayb")
        .gte("event_date", range.from)
        .lte("event_date", range.to)
        .order("event_date");
      if (error) throw error;
      const rows = (data ?? []) as GameRow[];
      const ids = Array.from(new Set(rows.map((r) => r.athlete_id)));
      if (ids.length === 0) return { rows, athletes: new Map() };
      const { data: athletes } = await supabase
        .from("athletes")
        .select("id, full_name, position, grad_year, high_school, latitude, longitude, hometown, state")
        .in("id", ids);
      return { rows, athletes: new Map((athletes ?? []).map((a) => [a.id, a])) };
    },
  });

  const results = useMemo(() => {
    const rows = games.data?.rows ?? [];
    const byId = games.data?.athletes ?? new Map();
    const o = origin.data;
    const list = rows
      .map((r) => {
        const a = byId.get(r.athlete_id) as
          | { full_name: string; position: string | null; grad_year: number | null; high_school: string | null; latitude: number | null; longitude: number | null; hometown: string | null; state: string | null }
          | undefined;
        const distance =
          o && a?.latitude != null && a?.longitude != null
            ? milesBetween(o.latitude, o.longitude, a.latitude, a.longitude)
            : null;
        return { ...r, athlete: a, distance };
      })
      .filter((r) => !!r.athlete)
      .filter((r) => (maybOnly ? r.is_mayb : true))
      .filter((r) => (o ? r.distance != null && r.distance <= radius : true));

    // group by date
    const groups = new Map<string, typeof list>();
    for (const g of list) {
      const arr = groups.get(g.event_date) ?? [];
      arr.push(g);
      groups.set(g.event_date, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [games.data, origin.data, radius, maybOnly]);

  function exportCalendar() {
    const events: IcsEvent[] = results.flatMap(([, items]) =>
      items.map((i) => ({
        uid: i.id,
        date: i.event_date,
        time: i.event_time,
        title: `${i.athlete?.full_name}${i.opponent ? ` vs ${i.opponent}` : ""}`,
        location: i.location,
        description: [i.athlete?.position, i.athlete?.high_school, i.athlete?.grad_year]
          .filter(Boolean)
          .join(" • "),
      })),
    );
    if (events.length === 0) return;
    downloadFile("summit-hoops-games.ics", buildIcs(events, "Recruiting visits"), "text/calendar");
  }

  if (loading) return <div className="container mx-auto px-4 py-10 text-muted-foreground">Loading…</div>;
  if (!isCoach) {
    return <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">Coach access only.</div>;
  }

  const total = results.reduce((n, [, items]) => n + items.length, 0);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Games near me</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Who's playing, when and where — so you can plan an evaluation trip.
          </p>
        </div>
        <Button variant="outline" onClick={exportCalendar} disabled={total === 0}>
          <Download className="mr-1.5 h-4 w-4" />
          Add to calendar
        </Button>
      </div>

      <Card className="mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs" htmlFor="g-zip">
            Near ZIP
          </Label>
          <Input
            id="g-zip"
            inputMode="numeric"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
            placeholder="67202"
          />
        </div>
        <div>
          <Label className="text-xs">Radius</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {RADII.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={radius === r ? "default" : "outline"}
                onClick={() => setRadius(r)}
              >
                {r} mi
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">When</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {([
              ["weekend", "This weekend"],
              ["7", "Next 7 days"],
              ["30", "Next 30 days"],
            ] as const).map(([v, label]) => (
              <Button
                key={v}
                type="button"
                size="sm"
                variant={span === v ? "default" : "outline"}
                onClick={() => setSpan(v)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Event type</Label>
          <div className="mt-1">
            <Button
              type="button"
              size="sm"
              variant={maybOnly ? "default" : "outline"}
              onClick={() => setMaybOnly((v) => !v)}
            >
              MAYB / circuit only
            </Button>
          </div>
        </div>
      </Card>

      {zip && !isValidZip(zip) && (
        <p className="mt-2 text-xs text-muted-foreground">Enter a 5-digit ZIP to filter by distance.</p>
      )}

      {games.isPending ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading schedule…</p>
      ) : total === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDays}
            title="No games in this window"
            description="Try a wider date range or a bigger radius — athletes add their schedules from their profile editor."
            action={
              <Button asChild variant="outline">
                <Link to="/coaches" search={{ where: "", radius: 30, group: "", pos: "", when: "any", grad: "", minHeight: "", minGpa: "", q: "" }}>Browse athletes</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {results.map(([date, items]) => (
            <div key={date}>
              <h2 className="font-display text-lg font-bold">
                {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {items.map((i) => (
                  <Card key={i.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to="/a/$athleteId"
                          params={{ athleteId: i.athlete_id }}
                          className="font-display text-lg font-bold hover:text-primary"
                        >
                          {i.athlete?.full_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {[i.athlete?.position, i.athlete?.high_school, i.athlete?.grad_year && `Class of ${i.athlete.grad_year}`]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                      {i.is_mayb && (
                        <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                          MAYB
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm">
                      {i.event_time ? `${i.event_time} • ` : ""}
                      {i.opponent ? `vs ${i.opponent}` : "Game"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {i.location ?? i.athlete?.hometown ?? "Location TBD"}
                      {i.distance != null ? ` • ${formatMiles(i.distance)} away` : ""}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
