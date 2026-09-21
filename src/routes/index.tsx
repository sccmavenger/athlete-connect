import { createFileRoute, Link } from "@tanstack/react-router";
import hubLogo from "@/assets/hub-wordmark-white.png.asset.json";

const TITLE = "The HUB — Midwest youth basketball recruiting app";
const DESC =
  "The HUB is an iOS app for Midwest youth basketball athletes and college coaches. Build a recruiting profile with measurements, academics, highlights, and your game schedule.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://recruit.gforcedigital.net/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://recruit.gforcedigital.net/" }],
  }),
  component: Landing,
});

const LINKS: { to: string; label: string; accent?: boolean }[] = [
  { to: "/support", label: "Support" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/age-suitability", label: "Age Suitability" },
  { to: "/delete-account", label: "Delete Account", accent: true },
];

function Landing() {
  return (
    <div
      className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-background px-8 py-10 text-foreground selection:bg-accent selection:text-accent-foreground sm:px-12 sm:py-14"
      style={{
        paddingTop: "calc(2.5rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))",
      }}
    >
      {/* Ambient accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/4 h-64 w-64 rounded-full bg-accent opacity-10 blur-[100px]"
      />

      {/* Brand */}
      <header className="relative z-10">
        <img
          src={hubLogo.url}
          alt="The HUB — powered by Summit Hoops"
          className="h-10 w-auto sm:h-12"
        />
      </header>

      {/* Hero */}
      <main className="relative z-10 mb-auto mt-14 max-w-md">
        <div className="mb-6 h-16 w-1 bg-accent" />
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight sm:text-6xl">
          Your Path
          <br />
          <span className="text-accent">To The Next</span>
          <br />
          Level
        </h1>
        <p className="mt-6 text-lg font-light leading-relaxed text-muted-foreground">
          The mobile platform for Midwest youth basketball recruiting and athlete exposure.
        </p>
      </main>

      {/* Status + required links */}
      <footer className="relative z-10 mt-14 space-y-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/80">
            Coming soon to the App Store
          </span>
        </div>

        <nav className="grid max-w-sm grid-cols-2 gap-x-8 gap-y-1 border-t border-border pt-8">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`inline-flex min-h-11 items-center text-xs uppercase tracking-widest transition-colors hover:text-accent ${
                l.accent ? "text-accent/70" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
