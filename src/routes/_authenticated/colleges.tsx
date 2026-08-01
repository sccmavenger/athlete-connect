import { CollegeCrest } from "@/components/CollegeCrest";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useManagedAthletes } from "@/lib/athlete-hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import {
  ATHLETE_OUTREACH_NOTE,
  contactWindows,
  NCAA_ELIGIBILITY_CENTER_URL,
  NCAA_RECRUITING_CALENDAR_URL,
} from "@/lib/compliance";
import { COLLEGE_DIVISIONS, MAX_COLLEGE_INTERESTS, searchColleges } from "@/lib/colleges";
import { GraduationCap, Plus, Trash2, Info, ExternalLink } from "lucide-react";


export const Route = createFileRoute("/_authenticated/colleges")({
  head: () => ({
    meta: [
      { title: "My college list — Recruiting Hub" },
      { name: "description", content: "Track the college programs you're targeting and where each stands." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CollegeList,
});

const STATUSES = [
  { value: "interested", label: "Interested" },
  { value: "contacted", label: "I reached out" },
  { value: "replied", label: "They replied" },
  { value: "visit", label: "Visit scheduled" },
  { value: "offer", label: "Offer" },
  { value: "closed", label: "No longer a fit" },
];

type Interest = {
  id: string;
  athlete_id: string;
  college_name: string;
  division: string | null;
  state: string | null;
  status: string;
  notes: string | null;
};

function CollegeList() {
  const athletes = useManagedAthletes();
  const qc = useQueryClient();
  const [athleteId, setAthleteId] = useState("");
  const [name, setName] = useState("");
  const [division, setDivision] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [state, setState] = useState("");
  const [adding, setAdding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const active = useMemo(() => {
    const list = athletes.data ?? [];
    return list.find((a) => a.id === athleteId) ?? list[0] ?? null;
  }, [athletes.data, athleteId]);

  const q = useQuery({
    enabled: !!active?.id,
    queryKey: ["college-interests", active?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_college_interests")
        .select("*")
        .eq("athlete_id", active!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Interest[];
    },
  });

  const count = (q.data ?? []).length;
  const atLimit = count >= MAX_COLLEGE_INTERESTS;
  const suggestions = useMemo(
    () => searchColleges(name, { division: levelFilter, limit: 12 }),
    [name, levelFilter],
  );

  const effectiveDivision = division || (levelFilter !== "all" ? levelFilter : "D1");

  const windows = contactWindows(active?.grad_year ?? null);

  function pick(c: { name: string; state: string; division: string }) {
    setName(c.name);
    setState(c.state);
    setDivision(c.division);
    setShowSuggestions(false);
  }


  async function add() {
    if (!active || !name.trim()) return;
    if (atLimit) {
      return toast.error(`You can track up to ${MAX_COLLEGE_INTERESTS} colleges. Remove one first.`);
    }
    const trimmed = name.trim().slice(0, 120);
    if ((q.data ?? []).some((r) => r.college_name.toLowerCase() === trimmed.toLowerCase())) {
      return toast.error("That school is already on your list.");
    }
    setAdding(true);
    const { error } = await supabase.from("athlete_college_interests").insert({
      athlete_id: active.id,
      college_name: trimmed,
      division: effectiveDivision,
      state: state.trim().toUpperCase().slice(0, 2) || null,
    });
    setAdding(false);
    if (error) return toast.error(error.message);
    setName("");
    setState("");
    qc.invalidateQueries({ queryKey: ["college-interests", active.id] });
    toast.success(
      active.is_published
        ? "Added — coaches from that program get notified."
        : "Added. Publish your profile so coaches from that program get notified.",
    );
  }


  async function patch(id: string, fields: Partial<Interest>) {
    const { error } = await supabase.from("athlete_college_interests").update(fields).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["college-interests", active?.id] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("athlete_college_interests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["college-interests", active?.id] });
  }

  if (athletes.isPending) {
    return <div className="container mx-auto px-4 py-10 text-muted-foreground">Loading…</div>;
  }
  if ((athletes.data ?? []).length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={GraduationCap}
          title="Create a profile first"
          description="Build your athlete profile, then start tracking the colleges you're targeting."
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
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">My college list</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track the programs you're targeting and where each conversation stands.
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

      {/* Contact-rule guidance (compliance) */}
      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold">When can coaches contact you?</h2>
            <p className="mt-1 text-xs text-muted-foreground">{ATHLETE_OUTREACH_NOTE}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {windows.map((w) => (
                <div key={w.division} className="rounded-lg border border-border/70 p-3">
                  <p className="text-sm font-semibold">
                    {w.division}{" "}
                    <span className={w.open ? "text-primary" : "text-accent"}>
                      {w.open ? "open" : "not yet"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{w.summary}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Informational summary of the published NCAA basketball calendar — not compliance advice. Confirm with{" "}
              <a className="text-primary hover:underline" href={NCAA_RECRUITING_CALENDAR_URL} target="_blank" rel="noreferrer">
                the NCAA calendar
              </a>{" "}
              and register at the{" "}
              <a className="text-primary hover:underline" href={NCAA_ELIGIBILITY_CENTER_URL} target="_blank" rel="noreferrer">
                Eligibility Center <ExternalLink className="inline h-3 w-3" />
              </a>
              .
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Add a target school</h2>
          <span className={`text-xs ${atLimit ? "text-accent" : "text-muted-foreground"}`}>
            {count} of {MAX_COLLEGE_INTERESTS} picked
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick up to {MAX_COLLEGE_INTERESTS} schools anywhere in the country — every NCAA D1, D2, D3, NAIA and
          Midwest JUCO program is searchable. Type a full name, a short name or an acronym (LSU, UNC). If a coach
          from that program is registered here, they get notified that you're interested.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)_auto]">
          <div>
            <Label className="text-xs">Level</Label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {COLLEGE_DIVISIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Label className="text-xs">College</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDivision("");
                setState("");
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
              placeholder="Search any school in the U.S. — e.g. LSU, Duke, Wichita State"
              maxLength={120}
              autoComplete="off"
              disabled={atLimit}
            />
            {showSuggestions && !atLimit && suggestions.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
                {suggestions.map((c) => (
                  <li key={`${c.name}-${c.state}`}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(c)}
                    >
                      <span className="truncate">
                        {c.name}
                        {c.alt ? <span className="text-muted-foreground"> ({c.alt})</span> : null}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.division} • {c.state}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {name.trim().length > 1 && suggestions.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                No match at this level — switch to "All levels", or just add the school as typed.
              </p>
            )}
            {name.trim() && (
              <p className="mt-1 text-xs text-muted-foreground">
                Adding as <span className="text-foreground">{effectiveDivision}</span>
                {state ? ` • ${state.toUpperCase()}` : ""}
              </p>
            )}
          </div>

          <div className="flex items-end">
            <Button onClick={add} disabled={adding || atLimit || !name.trim()} className="w-full sm:w-auto">
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
        {atLimit && (
          <p className="mt-2 text-xs text-accent">
            You've hit the {MAX_COLLEGE_INTERESTS}-school limit. Remove one below to add another.
          </p>
        )}
      </Card>


      <div className="mt-6">
        {q.isPending ? (
          <p className="text-sm text-muted-foreground">Loading your list…</p>
        ) : (q.data ?? []).length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No colleges yet"
            description="Add the programs you'd love to play for. Coaches on the platform can see this list, which tells them you're genuinely interested."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((row) => (
            <CollegeTile
              key={row.id}
              row={row}
              onNotes={(v) => patch(row.id, { notes: v })}
              onRemove={() => remove(row.id)}
            />
          ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Initials crest used when no school mark is available. */
function CollegeTile({
  row,
  onNotes,
  onRemove,
}: {
  row: Interest;
  onNotes: (v: string | null) => void;
  onRemove: () => void;
}) {
  const [showNotes, setShowNotes] = useState(!!row.notes);

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <CollegeCrest name={row.college_name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-bold leading-snug">{row.college_name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.division ?? "—"}
            {row.state ? ` • ${row.state}` : ""}
          </p>
          <p className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">
            {statusLabel}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 shrink-0"
          aria-label={`Remove ${row.college_name}`}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3">
        <Select value={row.status} onValueChange={onStatus}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showNotes ? (
        <Textarea
          className="mt-2"
          rows={2}
          defaultValue={row.notes ?? ""}
          maxLength={1000}
          placeholder="Notes — who you spoke to, camp dates, next step…"
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (row.notes ?? "")) onNotes(v || null);
          }}
        />
      ) : (
        <button
          type="button"
          className="mt-2 self-start text-xs text-primary hover:underline"
          onClick={() => setShowNotes(true)}
        >
          + Add notes
        </button>
      )}
    </Card>
  );
}

