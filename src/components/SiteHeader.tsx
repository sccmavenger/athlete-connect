import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-hooks";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationsBell } from "@/components/NotificationsBell";

import { Menu } from "lucide-react";
import summitLogo from "@/assets/summit-hoops-logo.png.asset.json";

export function SiteHeader() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    setOpen(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isCoach = roles.includes("coach");
  const isAdmin = roles.includes("admin");
  const isAthlete = roles.includes("athlete");

  const links: { to: string; label: string }[] = [];
  if (user && isAthlete) {
    links.push({ to: "/dashboard", label: "Dashboard" }, { to: "/profile/edit", label: "My Profile" });
  }
  if (user && isCoach) {
    links.push({ to: "/coaches", label: "Athletes" }, { to: "/coaches/saved", label: "Saved" });
  }
  if (user && isAdmin) {
    links.push({ to: "/admin/coach-requests", label: "Coach Requests" });
  }

  return (
    <header className="border-b bg-card text-card-foreground">
      <div className="container mx-auto grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={summitLogo.url} alt="Summit Hoops" className="h-9 w-auto shrink-0 sm:h-10" />
          <span className="truncate font-display text-base font-bold tracking-wide sm:text-xl">
            RECRUITING HUB
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {user && <NotificationsBell />}
          <nav className="hidden items-center gap-6 md:flex">

            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>

          {loading ? null : user ? (
            <Button variant="secondary" size="sm" className="hidden md:inline-flex" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button asChild variant="secondary" size="sm" className="hidden md:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          {/* Mobile */}
          {links.length > 0 ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="font-display text-lg">Menu</SheetTitle>
                <nav className="mt-6 flex flex-col">
                  {links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className={`border-b border-border/60 py-3 text-base ${
                        pathname === l.to ? "text-primary" : "hover:text-accent"
                      }`}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>
                <Button variant="secondary" className="mt-6 w-full" onClick={signOut}>
                  Sign out
                </Button>
              </SheetContent>
            </Sheet>
          ) : (
            !loading &&
            (user ? (
              <Button variant="secondary" size="sm" className="md:hidden" onClick={signOut}>
                Sign out
              </Button>
            ) : (
              <Button asChild variant="secondary" size="sm" className="md:hidden">
                <Link to="/auth">Sign in</Link>
              </Button>
            ))
          )}
        </div>
      </div>
    </header>
  );
}
