import { Link } from "@tanstack/react-router";
import hubLogo from "@/assets/hub-wordmark-white.png.asset.json";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/support", label: "Support" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
] as const;

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b bg-card/95 text-card-foreground backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16">
        <Link to="/" className="flex min-h-11 min-w-0 items-center">
          <img
            src={hubLogo.url}
            alt="The HUB — powered by Summit Hoops"
            className="h-7 w-auto shrink-0 sm:h-9"
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
          {NAV.slice(1).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="inline-flex min-h-11 items-center px-2 text-sm text-card-foreground/80 transition-colors hover:text-accent"
              activeProps={{ className: "text-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
