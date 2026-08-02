import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-hooks";
import { getAdminStats } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeaderSkeleton, CardListSkeleton } from "@/components/Skeletons";
import { Users, ShieldCheck, MessageSquare, IdCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin console — Summit Hoops Recruiting Hub" },
      { name: "description", content: "Manage users, roles and coach access for the recruiting hub." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { roles, loading } = useAuth();
  const isAdmin = roles.includes("admin");
  const stats = useServerFn(getAdminStats);

  const q = useQuery({
    enabled: isAdmin,
    queryKey: ["admin-stats"],
    queryFn: () => stats(),
  });

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

  const tiles = [
    { label: "Accounts", value: q.data?.users, icon: Users },
    { label: "Athlete profiles", value: q.data?.athletes, icon: IdCard },
    { label: "Published profiles", value: q.data?.published, icon: ShieldCheck },
    { label: "Approved coaches", value: q.data?.coaches, icon: ShieldCheck },
    { label: "Pending coach requests", value: q.data?.pendingCoaches, icon: ShieldCheck },
    { label: "Messages sent", value: q.data?.messages, icon: MessageSquare },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Admin console</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Site administration: accounts, roles and coach access.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <t.icon className="h-4 w-4 text-primary" />
            <p className="mt-2 font-display text-2xl font-bold">
              {q.isPending ? "—" : (t.value ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">{t.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Users &amp; roles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search accounts, change roles, and permanently remove users.
          </p>
          <Button asChild className="mt-4">
            <Link to="/admin/users">Manage users</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold">Coach requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject college coaches asking for directory access.
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/admin/coach-requests">Review requests</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
