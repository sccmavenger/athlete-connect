import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockCoachRequests } from "@/lib/mock-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  async function approve(userId: string, reqId: string) {
    // Grant coach role
    const { error: e1 } = await supabase.from("user_roles").insert({ user_id: userId, role: "coach" });
    if (e1 && !e1.message.includes("duplicate")) return toast.error(e1.message);
    const { error: e2 } = await supabase
      .from("coach_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", reqId);
    if (e2) return toast.error(e2.message);
    qc.invalidateQueries({ queryKey: ["coach-requests"] });
    toast.success("Coach approved");
  }

  async function reject(reqId: string) {
    const { error } = await supabase
      .from("coach_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", reqId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["coach-requests"] });
    toast.success("Rejected");
  }

  if (loading) return <div className="container mx-auto px-4 py-12">Loading...</div>;
  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">
        Admins only.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Coach requests</h1>
      <div className="mt-6 space-y-4">
        {q.data?.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold">{r.full_name}</h3>
                <p className="text-sm text-muted-foreground">{r.email}</p>
                <p className="mt-1 text-sm">
                  {r.title ? `${r.title}, ` : ""}
                  <span className="font-medium">{r.college ?? "—"}</span>
                </p>
                {r.message && <p className="mt-2 text-sm text-muted-foreground">"{r.message}"</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  Requested {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
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
                    <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => approve(r.user_id, r.id)}>
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {q.data && q.data.length === 0 && (
          <p className="text-center text-muted-foreground">No coach requests yet.</p>
        )}
      </div>
    </div>
  );
}
