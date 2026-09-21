import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <span>&copy; {new Date().getFullYear()} The HUB — powered by Summit Hoops</span>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/support" className="inline-flex min-h-11 items-center px-1 hover:text-foreground">
            Support
          </Link>
          <Link to="/privacy" className="inline-flex min-h-11 items-center px-1 hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="inline-flex min-h-11 items-center px-1 hover:text-foreground">
            Terms
          </Link>
          <Link
            to="/age-suitability"
            className="inline-flex min-h-11 items-center px-1 hover:text-foreground"
          >
            Age suitability
          </Link>
          <Link
            to="/delete-account"
            className="inline-flex min-h-11 items-center px-1 hover:text-foreground"
          >
            Delete account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
