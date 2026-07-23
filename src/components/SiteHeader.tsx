import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-hooks";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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

  return (
    <header className="border-b bg-card text-card-foreground">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={summitLogo.url} alt="Summit Hoops" className="h-10 w-auto" />
          <span className="font-display text-xl font-bold tracking-wide">
            RECRUITING HUB
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {user && isAthlete && (
            <>
              <Link to="/dashboard" className="text-sm hover:text-accent">Dashboard</Link>
              <Link to="/profile/edit" className="text-sm hover:text-accent">My Profile</Link>
            </>
          )}
          {user && isCoach && (
            <>
              <Link to="/coaches" className="text-sm hover:text-accent">Athletes</Link>
              <Link to="/coaches/saved" className="text-sm hover:text-accent">Saved</Link>
            </>
          )}
          {user && isAdmin && (
            <Link to="/admin/coach-requests" className="text-sm hover:text-accent">Coach Requests</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
