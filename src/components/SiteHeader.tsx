import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-hooks";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsBell } from "@/components/NotificationsBell";

import { LogOut, UserRound } from "lucide-react";
import summitLogo from "@/assets/summit-hoops-logo.png.asset.json";

export function SiteHeader() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const isCoach = roles.includes("coach");
  const isAdmin = roles.includes("admin");
  const isAthlete = roles.includes("athlete");
  const isParent = roles.includes("parent");

  const links: { to: string; label: string }[] = [];
  if (user && (isAthlete || isParent)) {
    links.push(
      { to: "/dashboard", label: "Dashboard" },
      { to: "/profile/edit", label: "My Profile" },
      { to: "/messages", label: "Messages" },
      { to: "/colleges", label: "Colleges" },
      { to: "/insights", label: "Insights" },
      { to: "/family", label: "Family" },
    );
  }
  if (user && (isCoach || isAdmin)) {
    links.push(
      { to: "/coaches", label: "Athletes" },
      { to: "/coaches/games", label: "Games" },
      { to: "/coaches/saved", label: "Saved" },
      { to: "/coaches/messages", label: "Inbox" },
    );
  }
  if (user && isAdmin) {
    links.push({ to: "/admin", label: "Admin" });
  }

  /** Destinations that don't have a bottom tab, surfaced in the account menu. */
  const secondary = links.filter(
    (l) => !["/dashboard", "/messages", "/colleges", "/insights", "/profile/edit", "/coaches", "/coaches/games", "/coaches/saved", "/coaches/messages", "/admin"].includes(l.to),
  );

  return (
    <header
      className="border-b bg-card text-card-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="container mx-auto grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-16">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={summitLogo.url} alt="Summit Hoops" className="h-8 w-auto shrink-0 sm:h-10" />
          <span className="truncate font-display text-base font-bold tracking-wide sm:text-xl">
            RECRUITING HUB
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user && <NotificationsBell />}
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Account menu">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <UserRound className="h-4 w-4" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {secondary.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link to={l.to}>{l.label}</Link>
                  </DropdownMenuItem>
                ))}
                {secondary.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : loading ? null : (
            <Button asChild variant="secondary" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
