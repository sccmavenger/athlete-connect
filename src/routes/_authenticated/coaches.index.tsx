import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockAthletesList } from "@/lib/mock-helpers";
import { geocodeZip } from "@/lib/geocode.functions";
import { formatMiles, isValidZip, milesBetween } from "@/lib/geo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AthleteGridSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { AlertCircle, MapPin, SearchX, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coaches/")({
  head: () => ({
    meta: [{ title: "Athletes directory — Recruiting Hub" }, { name: "robots", content: "noindex" }],
  }),
  component: CoachesDirectory,
});

const RADIUS_OPTIONS = ["25", "50", "100", "250"];

function CoachesDirectory() {
  const { roles, loading } = useAuth();
  const isCoach = roles.includes("coach");
  const isAdmin = roles.includes("admin");
  const geocode = useServerFn(geocodeZip);

  const [state, setState] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [position, setPosition] = useState("");
  const [minHeight, setMinHeight] = useState("");
  const [minGpa, setMinGpa] = useState("");
  const [search, setSearch] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("50");

  const origin = useQuery({
    enabled: isValidZip(zip),
    queryKey: ["zip-origin", zip],
    staleTime: 1000 * 60 * 60,
    queryFn: () => geocode({ data: { zip: zip.trim() } }),
  });

  const q = useQuery({
    enabled: !loading && (isCoach || isAdmin),
    queryKey: ["athletes-directory", { state, gradYear, position, minHeight, minGpa, search }],
    queryFn: async () => {
      if (isMockMode()) return mockAthletesList();
      let query = supabase
        .from("athletes")
        .select(
          "id, full_name, hometown, state, high_school, grad_year, position, height_inches, weight_lbs, gpa, profile_photo_url, zip_code, latitude, longitude",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (state) query = query.ilike("state", state);
      if (gradYear) query = query.eq("grad_year", parseInt(gradYear));
      if (position) query = query.ilike("position", `%${position}%`);
      if (minHeight) query = query.gte("height_inches", parseInt(minHeight));
      if (minGpa) query = query.gte("gpa", parseFloat(minGpa));
      if (search) query = query.ilike("full_name", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <PageHeaderSkeleton />
        <AthleteGridSkeleton />
      </div>
    );
  }

  if (!isCoach && !isAdmin) {
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

  const hasFilters = !!(search || state || gradYear || position || minHeight || minGpa || zip);

  function clearFilters() {
    setSearch("");
    setState("");
    setGradYear("");
    setPosition("");
    setMinHeight("");
    setMinGpa("");
    setZip("");
  }

  const originCoords = origin.data;
  const radiusMiles = Number.parseInt(radius, 10);

  const results: any[] = (() => {
    const rows = (q.data as any[]) ?? [];
    if (!originCoords) return rows;
    return rows
      .map((a) => ({
        ...a,
        _miles:
          a.latitude != null && a.longitude != null
            ? milesBetween(originCoords.latitude, originCoords.longitude, a.latitude, a.longitude)
            : null,
      }))
      .filter((a) => a._miles != null && a._miles <= radiusMiles)
      .sort((a, b) => (a._miles ?? 0) - (b._miles ?? 0));
  })();


  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Athletes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search the Midwest recruiting database.
      </p>

      <Card className="mt-6 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs">Search</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name" />
          </div>
          <div>
            <Label className="text-xs">State</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="KS" maxLength={2} />
          </div>
          <div>
            <Label className="text-xs">Grad year</Label>
            <Input type="number" inputMode="numeric" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="2027" />
          </div>
          <div>
            <Label className="text-xs">Position</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="PG" />
          </div>
          <div>
            <Label className="text-xs">Min height (in)</Label>
            <Input type="number" inputMode="numeric" value={minHeight} onChange={(e) => setMinHeight(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Min GPA</Label>
            <Input type="number" step="0.01" inputMode="decimal" value={minGpa} onChange={(e) => setMinGpa(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Near ZIP</Label>
            <Input
              value={zip}
              inputMode="numeric"
              maxLength={5}
              placeholder="67207"
              onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <div>
            <Label className="text-xs">Within</Label>
            <Select value={radius} onValueChange={setRadius}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r} miles
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {isValidZip(zip) && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {origin.isPending
              ? "Looking up that ZIP…"
              : origin.data
                ? `Showing athletes within ${radius} miles of ${origin.data.place}. Athletes without a ZIP on file are hidden.`
                : "We couldn't find that ZIP code."}
          </p>
        )}
        {hasFilters && (

          <Button variant="ghost" size="sm" className="mt-3" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </Card>

      {q.isPending ? (
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
      ) : q.data && q.data.length === 0 ? (
        <div className="mt-6">
          {hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No athletes match your filters"
              description="Try widening the grad year, height or GPA range."
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data?.map((a: any) => (
            <Link
              key={a.id}
              to="/a/$athleteId"
              params={{ athleteId: a.id }}
              className="group rounded-xl border bg-card p-4 shadow-sm transition hover:border-primary"
            >
              <div className="flex items-center gap-3">
                {a.profile_photo_url ? (
                  <img src={a.profile_photo_url} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl text-primary-foreground">
                    {a.full_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold group-hover:text-primary">{a.full_name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.high_school ?? "—"}
                    {a.state ? ` • ${a.state}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {a.position && <span className="rounded-full bg-secondary px-2 py-0.5">{a.position}</span>}
                {a.grad_year && <span className="rounded-full bg-secondary px-2 py-0.5">'{String(a.grad_year).slice(2)}</span>}
                {a.height_inches && (
                  <span className="rounded-full bg-secondary px-2 py-0.5">
                    {Math.floor(a.height_inches / 12)}'{a.height_inches % 12}"
                  </span>
                )}
                {a.gpa && <span className="rounded-full bg-secondary px-2 py-0.5">GPA {a.gpa}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
