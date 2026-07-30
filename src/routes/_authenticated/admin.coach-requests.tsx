import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockCoachRequests } from "@/lib/mock-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardListSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { reviewCoachRequest } from "@/lib/coach-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/coach-requests")({
  head: () => ({
    meta: [{ title: "Coach requests — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: CoachRequests,
});

function CoachRequests() {
  const { roles, loading } = useAuth();
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();

  const q = useQuery({
    enabled: isAdmin,
    queryKey: ["coach-requests"],
    queryFn: async () => {
      if (isMockMode()) return mockCoachRequests();
      const { data, error } = await supabase
        .from("coach_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const review = useServerFn(reviewCoachRequest);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function decide(reqId: string, decision: "approved" | "rejected") {
    setBusyId(reqId);
    try {
      await review({ data: { requestId: reqId, decision } });
      qc.invalidateQueries({ queryKey: ["coach-requests"] });
      toast.success(decision === "approved" ? "Coach approved" : "Request rejected");
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
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
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">
        Admins only.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Coach requests</h1>
      {q.isPending ? (
        <CardListSkeleton />
      ) : q.data && q.data.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="No coach requests yet"
            description="When a college coach signs up and asks for directory access, their request lands here for review."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {q.data?.map((r: any) => (
            <Card key={r.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold">{r.full_name}</h3>
                  <p className="break-all text-sm text-muted-foreground">{r.email}</p>
                  <p className="mt-1 text-sm">
                    {r.title ? `${r.title}, ` : ""}
                    <span className="font-medium">{r.college ?? "—"}</span>
                  </p>
                  {r.message && <p className="mt-2 text-sm text-muted-foreground">"{r.message}"</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Requested {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                      r.status === "pending"
                        ? "bg-accent/20 text-accent-foreground"
                        : r.status === "approved"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => decide(r.id, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button size="sm" disabled={busyId === r.id} onClick={() => decide(r.id, "approved")}>
                        {busyId === r.id ? "Saving..." : "Approve"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
