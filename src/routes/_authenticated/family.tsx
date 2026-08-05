import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { useManagedAthletes } from "@/lib/athlete-hooks";
import { createGuardianInvite, redeemGuardianInvite } from "@/lib/guardian.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { Users, Copy, Trash2, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/family")({
  head: () => ({
    meta: [
      { title: "Parents & guardians — Recruiting Hub" },
      {
        name: "description",
        content: "Link a parent or guardian so they can help manage an athlete profile and see coach interest.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Family,
});

type GuardianLink = { id: string; athlete_id: string; user_id: string; relationship: string | null };
type Invite = { id: string; athlete_id: string; code: string; invited_email: string | null; expires_at: string; redeemed_at: string | null };

function Family() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const athletes = useManagedAthletes();
  const createInvite = useServerFn(createGuardianInvite);
  const redeem = useServerFn(redeemGuardianInvite);

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [busy, setBusy] = useState(false);

  const owned = (athletes.data ?? []).filter((a) => a.user_id === user?.id);
  const guarded = (athletes.data ?? []).filter((a) => a.user_id !== user?.id);

  const links = useQuery({
    enabled: !!user?.id,
    queryKey: ["guardian-links", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_guardians")
        .select("id, athlete_id, user_id, relationship");
      if (error) throw error;
      return (data ?? []) as GuardianLink[];
    },
  });

  const invites = useQuery({
    enabled: owned.length > 0,
    queryKey: ["guardian-invites", owned.map((a) => a.id).join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_invites")
        .select("id, athlete_id, code, invited_email, expires_at, redeemed_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
  });

  async function generate(athleteId: string) {
    setBusy(true);
    try {
      await createInvite({ data: { athleteId, email: email.trim() || undefined, relationship } });
      setEmail("");
      qc.invalidateQueries({ queryKey: ["guardian-invites"] });
      toast.success("Invite code created — share it with your parent/guardian");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the invite");
    } finally {
      setBusy(false);
    }
  }

  async function useCode() {
    setBusy(true);
    try {
      const res = await redeem({ data: { code } });
      setCode("");
      qc.invalidateQueries();
      toast.success(`You're now linked to ${res.athleteName}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not redeem that code");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("athlete_guardians").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success("Access removed");
  }

  async function cancelInvite(id: string) {
    const { error } = await supabase.from("athlete_invites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["guardian-invites"] });
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Parents &amp; guardians</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A parent can manage the profile, message coaches and see who's looking — from their own login.
      </p>

      {/* Parent side: athletes I manage */}
      <Card className="mt-6 p-4 sm:p-6">
        <h2 className="font-display text-xl font-bold">Athletes I manage</h2>
        {athletes.isPending ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
        ) : (athletes.data ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No athletes yet. Create a profile for your child below, or enter an invite code to join one that already
            exists.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(athletes.data ?? []).map((a) => (
              <div key={a.id} className="rounded-lg border p-3">
                <p className="font-display text-lg font-bold">{a.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.high_school ?? "—"}
                  {a.grad_year ? ` • Class of ${a.grad_year}` : ""}
                  {a.user_id === user?.id ? "" : " • linked as guardian"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/profile/edit" search={{ athleteId: a.id }}>
                      Edit profile
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/insights">Insights</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/a/$athleteId" params={{ athleteId: a.id }}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}


        <div className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <Label className="text-xs">Have an invite code?</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={8}
              placeholder="8-character code"
            />
          </div>
          <Button onClick={useCode} disabled={busy || code.length < 6}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Link my account
          </Button>
        </div>
      </Card>

      {/* Athlete side: invite my parent */}
      {owned.length > 0 ? (
        owned.map((a) => {
          const myLinks = (links.data ?? []).filter((l) => l.athlete_id === a.id);
          const myInvites = (invites.data ?? []).filter((i) => i.athlete_id === a.id && !i.redeemed_at);
          return (
            <Card key={a.id} className="mt-6 p-4 sm:p-6">
              <h2 className="font-display text-xl font-bold">Invite a parent to {a.full_name}'s profile</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
                <div>
                  <Label className="text-xs">Their email (optional, for your records)</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" />
                </div>
                <div>
                  <Label className="text-xs">Relationship</Label>
                  <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} maxLength={40} />
                </div>
                <Button onClick={() => generate(a.id)} disabled={busy}>
                  Create invite code
                </Button>
              </div>

              {myInvites.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Unused invite codes</p>
                  {myInvites.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="font-mono text-lg font-bold tracking-widest">{i.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {i.invited_email ? `${i.invited_email} • ` : ""}expires{" "}
                          {new Date(i.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Copy code"
                          onClick={() => {
                            navigator.clipboard?.writeText(i.code);
                            toast.success("Code copied");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Cancel invite" onClick={() => cancelInvite(i.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Your parent signs up (choosing "Parent / guardian"), opens this page and enters the code.
                  </p>
                </div>
              )}

              <div className="mt-5 border-t pt-4">
                <p className="text-xs font-semibold text-muted-foreground">People with access</p>
                {myLinks.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">Just you right now.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {myLinks.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                        <span>{l.relationship ?? "Guardian"}</span>
                        <Button variant="ghost" size="sm" onClick={() => revoke(l.id)}>
                          Remove access
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No athlete profile on this account"
            description="Parents don't need their own profile — link to your child's with an invite code above. If you're the athlete, build your profile first."
            action={
              <Button asChild variant="outline">
                <Link to="/profile/edit">Build a profile</Link>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
