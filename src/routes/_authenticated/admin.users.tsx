import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-hooks";
import {
  listAdminUsers,
  deleteAdminUser,
  setAdminUserRoles,
  type AdminRole,
  type AdminUserRow,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CardListSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES: AdminRole[] = ["admin", "coach", "athlete", "parent"];

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & roles — Admin" },
      { name: "description", content: "Manage accounts, roles and removals for the recruiting hub." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const { roles, loading, user } = useAuth();
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);

  const fetchUsers = useServerFn(listAdminUsers);
  const removeUser = useServerFn(deleteAdminUser);
  const saveRoles = useServerFn(setAdminUserRoles);

  const q = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = q.data ?? [];
    if (!term) return list;
    return list.filter(
      (u) =>
        (u.email ?? "").toLowerCase().includes(term) ||
        (u.display_name ?? "").toLowerCase().includes(term) ||
        u.roles.join(",").includes(term),
    );
  }, [q.data, search]);

  async function toggleRole(row: AdminUserRow, role: AdminRole) {
    const next = row.roles.includes(role)
      ? row.roles.filter((r) => r !== role)
      : [...row.roles, role];
    setBusy(row.id);
    try {
      await saveRoles({ data: { userId: row.id, roles: next } });
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Roles updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update roles");
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    setBusy(target.id);
    try {
      await removeUser({ data: { userId: target.id } });
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      await qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`${target.email ?? "User"} removed`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not remove user");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <PageHeaderSkeleton />
        <CardListSkeleton />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">Admins only.</div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Users &amp; roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.data?.length ?? 0} accounts. Removing an account deletes its profile and athlete data.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/admin">Admin home</Link>
        </Button>
      </div>

      <Input
        className="mt-6"
        placeholder="Search by email, name or role"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {q.isPending ? (
        <CardListSkeleton />
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Users} title="No accounts match" description="Try a different search." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <Card key={row.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold">
                    {row.display_name ?? "(no name)"}
                  </h3>
                  <p className="break-all text-sm text-muted-foreground">{row.email ?? "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {new Date(row.created_at).toLocaleDateString()}
                    {row.last_sign_in_at
                      ? ` · last sign-in ${new Date(row.last_sign_in_at).toLocaleDateString()}`
                      : " · never signed in"}
                    {row.athlete_count > 0
                      ? ` · ${row.athlete_count} athlete profile${row.athlete_count > 1 ? "s" : ""}${
                          row.is_published ? " (published)" : ""
                        }`
                      : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ALL_ROLES.map((role) => {
                      const on = row.roles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          disabled={busy === row.id}
                          onClick={() => toggleRole(row, role)}
                          className="disabled:opacity-50"
                        >
                          <Badge variant={on ? "default" : "outline"}>{role}</Badge>
                        </button>
                      );
                    })}
                    {row.roles.length === 0 && (
                      <span className="text-xs text-muted-foreground">no roles</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row.id === user?.id ? (
                    <span className="text-xs text-muted-foreground">You</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === row.id}
                      onClick={() => setPendingDelete(row)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.email ?? "This user"} will be permanently deleted, along with their
              profile, athlete data, messages and saved lists. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove user</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
