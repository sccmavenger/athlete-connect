import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockAthletesList } from "@/lib/mock-helpers";
import { geocodePlace, type PlaceResult } from "@/lib/geocode.functions";
import { formatMiles, milesBetween } from "@/lib/geo";
import {
  POSITION_GROUPS,
  POSITION_LABELS,
  codesForGroup,
  matchesPositions,
  type PositionCode,
} from "@/lib/positions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AthleteGridSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import {
  AlertCircle,
  Bookmark,
  CalendarDays,
  MapPin,
  SearchX,
  SlidersHorizontal,
  Star,
  Users,
} from "lucide-react";

type DirectorySearch = {
  where: string;
  radius: number;
  group: string;
  pos: string;
  when: string;
  grad: string;
  minHeight: string;
  minGpa: string;
  q: string;
};

function str(v: unknown, fb = ""): string {
  return typeof v === "string" ? v : fb;
}

function validateSearch(input: Record<string, unknown>): DirectorySearch {
  const radius = Number(input.radius);
  return {
    where: str(input.where),
    radius: Number.isFinite(radius) && radius > 0 ? radius : 30,
    group: str(input.group),
    pos: str(input.pos),
    when: str(input.when, "any") || "any",
    grad: str(input.grad),
    minHeight: str(input.minHeight),
    minGpa: str(input.minGpa),
    q: str(input.q),
  };
}

export const Route = createFileRoute("/_authenticated/coaches/")({
  validateSearch,

  head: () => ({
    meta: [
      { title: "Athlete search — Recruiting Hub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CoachesDirectory,
});

const RADIUS_OPTIONS = [10, 20, 30, 40, 50, 100, 250];
const ALL_POSITIONS: PositionCode[] = ["PG", "SG", "SF", "PF", "C"];
const WHEN_OPTIONS = [
  ["any", "Any time"],
  ["weekend", "This weekend"],
  ["7", "Next 7 days"],
  ["30", "Next 30 days"],
] as const;

function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function whenRange(when: string): { from: string; to: string } | null {
  if (when === "weekend") {
    const now = new Date();
    const toFri = (5 - now.getDay() + 7) % 7;
    const fri = new Date(now);
    fri.setDate(now.getDate() + toFri);
    const sun = new Date(fri);
    sun.setDate(fri.getDate() + 2);
    return { from: fri.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
  }
  if (when === "7") return { from: isoDay(0), to: isoDay(7) };
  if (when === "30") return { from: isoDay(0), to: isoDay(30) };
  return null;
}

type GameRow = {
  athlete_id: string;
  event_date: string;
  event_time: string | null;
  opponent: string | null;
  location: string | null;
};

function CoachesDirectory() {
  const { user, roles, loading } = useAuth();
  const isCoach = roles.includes("coach");
  const isAdmin = roles.includes("admin");
  const canSearch = isCoach || isAdmin;
  const geocode = useServerFn(geocodePlace);
  const navigate = useNavigate({ from: Route.fullPath });
  const s = Route.useSearch();
  const [whereDraft, setWhereDraft] = useState(s.where);
  const [savingIds, setSavingIds] = useState<string[]>([]);

  function set(patch: Partial<DirectorySearch>) {
    navigate({ search: (prev: DirectorySearch) => ({ ...prev, ...patch }) });
  }


  const place = useQuery({
    enabled: s.where.trim().length >= 2,
    queryKey: ["place", s.where],
    staleTime: 60 * 60_000,
    queryFn: () => geocode({ data: { query: s.where.trim() } }),
  });

  const stateFilter = place.data?.kind === "state" ? place.data.state : "";
  const range = whenRange(s.when);

  const wantedCodes: PositionCode[] = useMemo(() => {
    if (s.group) return codesForGroup(s.group as any);
    const parts: string[] = s.pos ? String(s.pos).split(",") : [];
    return parts.filter((p: string): p is PositionCode =>
      ALL_POSITIONS.includes(p as PositionCode),
    );
  }, [s.group, s.pos]);


  const q = useQuery({
    enabled: !loading && canSearch,
    queryKey: [
      "athletes-directory",
      { stateFilter, grad: s.grad, minHeight: s.minHeight, minGpa: s.minGpa, q: s.q },
    ],
    queryFn: async () => {
      if (isMockMode()) return mockAthletesList();
      let query = supabase
        .from("athletes")
        .select(
          "id, full_name, hometown, state, high_school, grad_year, position, height_inches, weight_lbs, gpa, profile_photo_url, zip_code, latitude, longitude",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (stateFilter) query = query.ilike("state", stateFilter);
      if (s.grad) query = query.eq("grad_year", parseInt(s.grad));
      if (s.minHeight) query = query.gte("height_inches", parseInt(s.minHeight));
      if (s.minGpa) query = query.gte("gpa", parseFloat(s.minGpa));
      if (s.q) query = query.ilike("full_name", `%${s.q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const games = useQuery({
    enabled: !!range && canSearch,
    queryKey: ["directory-games", range?.from, range?.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_events")
        .select("athlete_id, event_date, event_time, opponent, location")
        .gte("event_date", range!.from)
        .lte("event_date", range!.to)
        .order("event_date");
      if (error) throw error;
      const byAthlete = new Map<string, GameRow>();
      for (const row of (data ?? []) as GameRow[]) {
        if (!byAthlete.has(row.athlete_id)) byAthlete.set(row.athlete_id, row);
      }
      return byAthlete;
    },
  });

  const results: any[] = useMemo(() => {
    let rows = ((q.data as any[]) ?? []).slice();

    if (wantedCodes.length > 0) {
      rows = rows.filter((a) => matchesPositions(a.position, wantedCodes));
    }

    if (range) {
      const map = games.data;
      if (!map) return [];
      rows = rows
        .filter((a) => map.has(a.id))
        .map((a) => ({ ...a, _game: map.get(a.id) }));
    }

    const pd = place.data as PlaceResult | undefined;
    const center = pd && pd.kind === "point" ? pd : null;

    if (center) {
      rows = rows
        .map((a) => ({
          ...a,
          _miles:
            a.latitude != null && a.longitude != null
              ? milesBetween(center.latitude, center.longitude, a.latitude, a.longitude)
              : null,
        }))
        .filter((a) => a._miles != null && a._miles <= s.radius)
        .sort((a, b) => (a._miles ?? 0) - (b._miles ?? 0));
    }
    return rows;
  }, [q.data, games.data, place.data, wantedCodes, range, s.radius]);

  async function bookmark(athleteId: string) {
    if (!user?.id) return;
    setSavingIds((ids) => [...ids, athleteId]);
    const { error } = await supabase
      .from("coach_saved_athletes")
      .insert({ coach_user_id: user.id, athlete_id: athleteId });
    if (error && !/duplicate|unique/i.test(error.message)) {
      setSavingIds((ids) => ids.filter((i) => i !== athleteId));
      toast.error("Couldn't save that athlete");
      return;
    }
    toast.success("Added to your pipeline");
  }

  async function saveSearch() {
    if (!user?.id) return;
    const name =
      [
        s.where || "Anywhere",
        s.group ? POSITION_GROUPS.find((g) => g.id === s.group)?.label : s.pos,
        s.when !== "any" ? WHEN_OPTIONS.find(([v]) => v === s.when)?.[1] : null,
      ]
        .filter(Boolean)
        .join(" • ") || "Athlete search";
    const { error } = await supabase
      .from("coach_saved_searches")
      .insert({ coach_user_id: user.id, name, filters: s as any });
    if (error) toast.error("Couldn't save this search");
    else toast.success(`Saved "${name}"`);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <PageHeaderSkeleton />
        <AthleteGridSkeleton />
      </div>
    );
  }

  if (!canSearch) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-5 w-5 text-accent" />
            <div>
              <h2 className="font-display text-xl font-bold">Coach access only</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The athlete directory is available to approved coaches. If you signed up as a coach,
                your account is being reviewed.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const hasFilters = !!(
    s.where ||
    s.group ||
    s.pos ||
    s.grad ||
    s.minHeight ||
    s.minGpa ||
    s.q ||
    s.when !== "any"
  );

  function clearFilters() {
    setWhereDraft("");
    navigate({
      search: {
        where: "",
        radius: 30,
        group: "",
        pos: "",
        when: "any",
        grad: "",
        minHeight: "",
        minGpa: "",
        q: "",
      },
    });
  }

  function togglePosition(code: PositionCode) {
    const current: string[] = s.pos ? String(s.pos).split(",") : [];
    const next = current.includes(code)
      ? current.filter((c: string) => c !== code)
      : [...current, code];

    set({ pos: next.join(","), group: "" });
  }

  const filtersContent = (
    <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label className="text-xs" htmlFor="where">
              Where
            </Label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                set({ where: whereDraft.trim() });
              }}
              className="flex gap-2"
            >
              <Input
                id="where"
                value={whereDraft}
                onChange={(e) => setWhereDraft(e.target.value)}
                onBlur={() => set({ where: whereDraft.trim() })}
                placeholder="San Francisco, CA · Virginia · 63103"
              />
              <Button type="submit" variant="secondary">
                Go
              </Button>
            </form>
          </div>
          <div>
            <Label className="text-xs">Search</Label>
            <Input
              value={s.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Athlete name"
            />
          </div>
          <div>
            <Label className="text-xs">Grad year</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={s.grad}
              onChange={(e) => set({ grad: e.target.value })}
              placeholder="2027"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Within</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {RADIUS_OPTIONS.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={s.radius === r ? "default" : "outline"}
                onClick={() => set({ radius: r })}
              >
                {r} mi
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Position</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {POSITION_GROUPS.map((g) => (
              <Button
                key={g.id}
                type="button"
                size="sm"
                variant={s.group === g.id ? "default" : "outline"}
                onClick={() => set({ group: s.group === g.id ? "" : g.id, pos: "" })}
              >
                {g.label}
              </Button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {ALL_POSITIONS.map((code) => (
              <Button
                key={code}
                type="button"
                size="sm"
                variant={s.pos.split(",").includes(code) ? "default" : "outline"}
                onClick={() => togglePosition(code)}
                title={POSITION_LABELS[code]}
              >
                {code}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label className="text-xs">Playing</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {WHEN_OPTIONS.map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={s.when === value ? "default" : "outline"}
                  onClick={() => set({ when: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Min height (in)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={s.minHeight}
                onChange={(e) => set({ minHeight: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Min GPA</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={s.minGpa}
                onChange={(e) => set({ minGpa: e.target.value })}
              />
            </div>
          </div>
        </div>

        {s.where.trim().length >= 2 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {place.isPending
              ? "Looking up that location…"
              : place.data?.kind === "state"
                ? `Showing athletes in ${place.data.label}.`
                : place.data?.kind === "point"
                  ? `Showing athletes within ${s.radius} miles of ${place.data.label}. Athletes without a ZIP on file are hidden.`
                  : "We couldn't find that place — try a city and state, or a ZIP code."}
          </p>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 pt-5 pb-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] font-bold leading-none sm:text-4xl">
            Athlete search
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Search anywhere in the country — city, metro, state or ZIP — then draw a radius.
          </p>
        </div>
        <Button variant="outline" className="hidden sm:inline-flex" onClick={saveSearch} disabled={!hasFilters}>
          <Star className="mr-1.5 h-4 w-4" />
          Save this search
        </Button>
      </div>

      {/* Mobile: filters live in a sheet */}
      <div className="mt-4 flex gap-2 md:hidden">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" className="h-12 flex-1">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters{hasFilters ? " • on" : ""}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetTitle className="font-display text-lg">Filters</SheetTitle>
            <div className="mt-4">{filtersContent}</div>
            <Button className="mt-5 h-12 w-full" onClick={() => setFiltersOpen(false)}>
              Show {results.length} athlete{results.length === 1 ? "" : "s"}
            </Button>
          </SheetContent>
        </Sheet>
        <Button variant="outline" className="h-12" onClick={saveSearch} disabled={!hasFilters} aria-label="Save this search">
          <Star className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop: inline filter card */}
      <Card className="mt-6 hidden p-4 md:block">{filtersContent}</Card>


      {q.isPending || (!!range && games.isPending) ? (
        <AthleteGridSkeleton />
      ) : q.isError ? (
        <div className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load athletes"
            description="Something went wrong fetching the directory. Try again in a moment."
            action={
              <Button variant="outline" onClick={() => q.refetch()}>
                Retry
              </Button>
            }
          />
        </div>
      ) : results.length === 0 ? (
        <div className="mt-6">
          {hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No athletes match your search"
              description="Try a wider radius, a different position group, or a longer date window."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No athletes yet"
              description="Athlete profiles will appear here as players join the Summit Hoops circuit."
            />
          )}
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {results.length} athlete{results.length === 1 ? "" : "s"} match
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((a: any) => (
              <Card key={a.id} className="p-4 transition hover:border-primary">
                <Link to="/a/$athleteId" params={{ athleteId: a.id }} className="group block">
                  <div className="flex items-center gap-3">
                    {a.profile_photo_url ? (
                      <img
                        src={a.profile_photo_url}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl text-primary-foreground">
                        {a.full_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold group-hover:text-primary">
                        {a.full_name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.high_school ?? "—"}
                        {a.state ? ` • ${a.state}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {a.position && (
                      <span className="rounded-full bg-secondary px-2 py-0.5">{a.position}</span>
                    )}
                    {a.grad_year && (
                      <span className="rounded-full bg-secondary px-2 py-0.5">
                        '{String(a.grad_year).slice(2)}
                      </span>
                    )}
                    {a.height_inches && (
                      <span className="rounded-full bg-secondary px-2 py-0.5">
                        {Math.floor(a.height_inches / 12)}'{a.height_inches % 12}"
                      </span>
                    )}
                    {a.gpa && <span className="rounded-full bg-secondary px-2 py-0.5">GPA {a.gpa}</span>}
                    {a._miles != null && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                        {formatMiles(a._miles)} away
                      </span>
                    )}
                  </div>
                  {a._game && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(`${a._game.event_date}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {a._game.event_time ? ` ${a._game.event_time}` : ""}
                      {a._game.opponent ? ` vs ${a._game.opponent}` : ""}
                      {a._game.location ? ` • ${a._game.location}` : ""}
                    </p>
                  )}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={savingIds.includes(a.id)}
                  onClick={() => bookmark(a.id)}
                >
                  <Bookmark className="mr-1.5 h-4 w-4" />
                  {savingIds.includes(a.id) ? "Saved" : "Save to pipeline"}
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
