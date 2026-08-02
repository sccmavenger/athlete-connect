import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockSavedAthletes } from "@/lib/mock-helpers";
import { PIPELINE_STAGES, stageClasses, stageLabel } from "@/lib/pipeline";
import { downloadFile, toCsv } from "@/lib/ics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AthleteGridSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Bookmark, X, Download, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coaches/saved")({
  head: () => ({
    meta: [
      { title: "My pipeline — Recruiting Hub" },
      { name: "description", content: "Your private recruiting shortlist with stages, tags and notes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedList,
});

type SavedRow = {
  id: string;
  notes: string | null;
  stage: string | null;
  tags: string[] | null;
  created_at?: string;
  athletes: {
    id: string;
    full_name: string;
    high_school: string | null;
    state: string | null;
    hometown: string | null;
    grad_year: number | null;
    position: string | null;
    gpa: number | null;
    height_inches: number | null;
    profile_photo_url: string | null;
  } | null;
};

function SavedList() {
  const { user, roles, loading } = useAuth();
  const isCoach = roles.includes("coach") || roles.includes("admin");
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftTags, setDraftTags] = useState("");

  const q = useQuery({
    enabled: !!user?.id && isCoach,
    queryKey: ["saved-athletes", user?.id],
    queryFn: async () => {
      if (isMockMode()) return mockSavedAthletes() as unknown as SavedRow[];
      const { data, error } = await supabase
        .from("coach_saved_athletes")
        .select(
          "id, notes, stage, tags, created_at, athletes(id, full_name, high_school, state, hometown, grad_year, position, gpa, height_inches, profile_photo_url)",
        )
        .eq("coach_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SavedRow[];
    },
  });

  const rows = useMemo(
    () => (q.data ?? []).filter((r) => r.athletes && (filter === "all" || (r.stage ?? "watching") === filter)),
    [q.data, filter],
  );

  async function unsave(id: string) {
    const { error } = await supabase.from("coach_saved_athletes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["saved-athletes"] });
    toast.success("Removed");
  }

  async function setStage(id: string, stage: string) {
    const { error } = await supabase.from("coach_saved_athletes").update({ stage }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["saved-athletes"] });
  }

  async function saveDetails(id: string) {
    const tags = draftTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
    const { error } = await supabase
      .from("coach_saved_athletes")
      .update({ notes: draftNotes.trim().slice(0, 2000) || null, tags })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["saved-athletes"] });
    toast.success("Saved");
  }

  function exportCsv() {
    const data = rows.map((r) => ({
      name: r.athletes!.full_name,
      stage: stageLabel(r.stage),
      position: r.athletes!.position ?? "",
      grad_year: r.athletes!.grad_year ?? "",
      high_school: r.athletes!.high_school ?? "",
      hometown: [r.athletes!.hometown, r.athletes!.state].filter(Boolean).join(", "),
      height_inches: r.athletes!.height_inches ?? "",
      gpa: r.athletes!.gpa ?? "",
      tags: (r.tags ?? []).join(" | "),
      notes: r.notes ?? "",
      profile_url: `${window.location.origin}/a/${r.athletes!.id}`,
    }));
    downloadFile(
      "recruiting-pipeline.csv",
      toCsv(data, [
        "name",
        "stage",
        "position",
        "grad_year",
        "high_school",
        "hometown",
        "height_inches",
        "gpa",
        "tags",
        "notes",
        "profile_url",
      ]),
      "text/csv",
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <PageHeaderSkeleton />
        <AthleteGridSkeleton count={3} />
      </div>
    );
  }
  if (!isCoach) {
    return <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">Coach access only.</div>;
  }

  const counts = PIPELINE_STAGES.map((s) => ({
    ...s,
    count: (q.data ?? []).filter((r) => (r.stage ?? "watching") === s.value).length,
  }));

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">My pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your private shortlist — stages, tags and notes are visible only to you.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All ({(q.data ?? []).length})
        </Button>
        {counts.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={filter === s.value ? "default" : "outline"}
            onClick={() => setFilter(s.value)}
          >
            {s.label} ({s.count})
          </Button>
        ))}
      </div>

      {q.isPending ? (
        <AthleteGridSkeleton count={3} />
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Bookmark}
            title={(q.data ?? []).length === 0 ? "No saved athletes yet" : "Nothing in this stage"}
            description="Tap Save on any athlete profile and they'll show up here for quick follow-up."
            action={
              <Button asChild variant="outline">
                <Link to="/coaches">Browse athletes</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const a = row.athletes!;
            const isEditing = editing === row.id;
            return (
              <Card key={row.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/a/$athleteId"
                    params={{ athleteId: a.id }}
                    className="flex min-w-0 items-center gap-3 hover:text-primary"
                  >
                    {a.profile_photo_url ? (
                      <img src={a.profile_photo_url} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-primary-foreground">
                        {a.full_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold">{a.full_name}</h3>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.high_school ?? "—"}
                        {a.state ? ` • ${a.state}` : ""}
                        {a.grad_year ? ` • '${String(a.grad_year).slice(2)}` : ""}
                      </p>
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" aria-label="Remove from shortlist" onClick={() => unsave(row.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stageClasses(row.stage)}`}>
                    {stageLabel(row.stage)}
                  </span>
                  <Select value={row.stage ?? "watching"} onValueChange={(v) => setStage(row.id, v)}>
                    <SelectTrigger className="h-8 flex-1 text-xs" aria-label={`Stage for ${a.full_name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(row.tags ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(row.tags ?? []).map((t) => (
                      <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={draftTags}
                      onChange={(e) => setDraftTags(e.target.value)}
                      placeholder="Tags, comma separated"
                    />
                    <Textarea
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      rows={3}
                      placeholder="Private notes — shooting form, film to re-watch, contact plan…"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveDetails(row.id)}>
                        <Save className="mr-1.5 h-4 w-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {row.notes && <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{row.notes}</p>}
                    <button
                      className="mt-3 self-start text-xs text-primary hover:underline"
                      onClick={() => {
                        setEditing(row.id);
                        setDraftNotes(row.notes ?? "");
                        setDraftTags((row.tags ?? []).join(", "));
                      }}
                    >
                      {row.notes || (row.tags ?? []).length ? "Edit notes & tags" : "Add notes & tags"}
                    </button>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
