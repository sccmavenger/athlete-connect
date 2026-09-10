import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, deleteMyAccount } from "@/lib/account.functions";
import { listMyBlocks, setBlock } from "@/lib/safety.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Ban, ShieldCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account settings — The HUB" },
      {
        name: "description",
        content: "Manage your HUB account, review your data, or permanently delete your account.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchAccount = useServerFn(getMyAccount);
  const runDelete = useServerFn(deleteMyAccount);

  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-account"],
    queryFn: () => fetchAccount({} as never),
  });

  const loadBlocks = useServerFn(listMyBlocks);
  const changeBlock = useServerFn(setBlock);
  const blocks = useQuery({ queryKey: ["my-blocks"], queryFn: () => loadBlocks() });

  async function unblock(userId: string) {
    try {
      await changeBlock({ data: { targetUserId: userId, blocked: false } });
      await qc.invalidateQueries({ queryKey: ["my-blocks"] });
      toast.success("Unblocked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That didn't work");
    }
  }

  async function handleDelete() {
    if (confirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Type DELETE to confirm');
      return;
    }
    setBusy(true);
    try {
      await runDelete({ data: { confirm: "DELETE" } });
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Your account and all of its data have been permanently deleted.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We couldn't delete your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 pb-28">
      <h1 className="font-display text-2xl font-bold tracking-wide">ACCOUNT</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your sign-in details and permanent account controls.
      </p>

      <Card className="mt-5 p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
              <div className="mt-0.5 break-all font-medium">{data?.email ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Account type</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(data?.roles?.length ? data.roles : ["member"]).map((r) => (
                  <Badge key={r} variant="secondary" className="capitalize">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
            {!!data?.athletes?.length && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Athlete profiles
                </div>
                <ul className="mt-1 space-y-1">
                  {data.athletes.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{a.full_name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {a.is_published ? "Published" : "Private"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="mt-4 p-4">
        <div className="flex items-start gap-3">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-wide">BLOCKED PEOPLE</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Blocked people can't message you and their messages stay hidden.
            </p>
            {blocks.isPending ? (
              <Skeleton className="mt-3 h-4 w-40" />
            ) : (blocks.data ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                You haven't blocked anyone. You can block someone from any conversation.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(blocks.data ?? []).map((b) => (
                  <li key={b.user_id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{b.name}</span>
                    <Button size="sm" variant="secondary" className="h-9" onClick={() => unblock(b.user_id)}>
                      Unblock
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-4 border-accent/30 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p className="text-sm text-muted-foreground">
            You control who can see your profile. Unpublishing hides you from college coaches while
            keeping your data. Deleting removes everything permanently.
          </p>
        </div>
      </Card>

      <Card className="mt-4 border-destructive/40 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-wide">DELETE ACCOUNT</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This permanently deletes your HUB account and cannot be undone. Removed
              immediately:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Your sign-in and login credentials</li>
              <li>Athlete profile, measurements, and academics</li>
              <li>Uploaded photos and highlight links</li>
              <li>Game schedule and target school list</li>
              <li>Messages, bookmarks, and notifications</li>
            </ul>
            {!!data?.athletes?.length && (
              <p className="mt-2 text-sm text-muted-foreground">
                Athlete profiles you manage are deleted along with your account.
              </p>
            )}

            {step === "idle" ? (
              <Button
                variant="destructive"
                className="mt-4 h-11 w-full"
                onClick={() => setStep("confirm")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete my account
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <Label htmlFor="confirm-delete" className="text-sm">
                  Type <span className="font-semibold text-foreground">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="h-11"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="destructive"
                    className="h-11 flex-1"
                    disabled={busy || confirm.trim().toUpperCase() !== "DELETE"}
                    onClick={handleDelete}
                  >
                    {busy ? "Deleting…" : "Permanently delete"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-11 flex-1"
                    disabled={busy}
                    onClick={() => {
                      setStep("idle");
                      setConfirm("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
