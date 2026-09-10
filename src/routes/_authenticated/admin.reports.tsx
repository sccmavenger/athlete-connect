import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-hooks";
import {
  listContentReports,
  resolveReport,
  unpublishReportedAthlete,
  type ContentReportRow,
} from "@/lib/safety.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { PageHeaderSkeleton, CardListSkeleton } from "@/components/Skeletons";
import { Flag, EyeOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reported content — The HUB" },
      { name: "description", content: "Review reported profiles, messages and members." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReports,
});

const STATUS_LABEL: Record<ContentReportRow["status"], string> = {
  open: "Open",
  reviewed: "Reviewed",
  actioned: "Action taken",
  dismissed: "Dismissed",
};

function AdminReports() {
  const { roles, loading } = useAuth();
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();
  const load = useServerFn(listContentReports);
  const resolve = useServerFn(resolveReport);
  const unpublish = useServerFn(unpublishReportedAthlete);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const q = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-reports"],
    queryFn: () => load(),
  });

  async function act(id: string, status: ContentReportRow["status"]) {
    setBusyId(id);
    try {
      await resolve({ data: { id, status, note: notes[id] } });
      await qc.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That didn't work");
    } finally {
      setBusyId(null);
    }
  }

  async function hideProfile(reportId: string, athleteId: string) {
    setBusyId(reportId);
    try {
      await unpublish({ data: { athleteId } });
      toast.success("Profile hidden from the public directory");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That didn't work");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <PageHeaderSkeleton />
        <CardListSkeleton />
      </div>
    );
  }
  if (!isAdmin) {
    return <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">Admins only.</div>;
  }

  const reports = q.data ?? [];
  const open = reports.filter((r) => r.status === "open").length;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Reported content</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {open} open {open === 1 ? "report" : "reports"} • reports should be reviewed within 24 hours.
      </p>

      {q.isPending ? (
        <div className="mt-6">
          <CardListSkeleton />
        </div>
      ) : reports.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Flag}
            title="Nothing reported"
            description="When someone reports a message, a profile, or another member, it shows up here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={r.status === "open" ? "default" : "secondary"}>
                  {STATUS_LABEL[r.status]}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {r.target_type.replace("_", " ")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>

              <p className="mt-2 font-medium">{r.reason}</p>
              {r.details && <p className="mt-1 text-sm text-muted-foreground">{r.details}</p>}

              <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div>Reported by: {r.reporter_email ?? "—"}</div>
                <div>Person reported: {r.reported_email ?? "—"}</div>
                {r.athlete_name && <div>Athlete profile: {r.athlete_name}</div>}
              </dl>

              {r.message_body && (
                <p className="mt-3 rounded-lg bg-secondary p-3 text-sm break-words">{r.message_body}</p>
              )}

              {r.resolution_note && (
                <p className="mt-3 text-xs text-muted-foreground">Note: {r.resolution_note}</p>
              )}

              <Input
                value={notes[r.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                placeholder="Add a review note (optional)"
                className="mt-3 h-11"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="h-11" disabled={busyId === r.id} onClick={() => act(r.id, "actioned")}>
                  Action taken
                </Button>
                <Button size="sm" variant="secondary" className="h-11" disabled={busyId === r.id} onClick={() => act(r.id, "reviewed")}>
                  Mark reviewed
                </Button>
                <Button size="sm" variant="ghost" className="h-11" disabled={busyId === r.id} onClick={() => act(r.id, "dismissed")}>
                  Dismiss
                </Button>
                {r.athlete_id && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-11"
                    disabled={busyId === r.id}
                    onClick={() => hideProfile(r.id, r.athlete_id!)}
                  >
                    <EyeOff className="mr-1.5 h-4 w-4" />
                    Hide profile
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
