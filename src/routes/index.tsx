import { createFileRoute, Link } from "@tanstack/react-router";
import appStoreBadge from "@/assets/download-on-the-app-store.svg.asset.json";
import hubLogo from "@/assets/hub-wordmark-white.png.asset.json";

const APP_IS_LIVE = true;
const APP_STORE_URL = "https://apps.apple.com/app/id6813542102";

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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 text-foreground selection:bg-accent selection:text-accent-foreground sm:px-12"
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

      {/* App-style column: phone-width everywhere, so no dead space at any size */}
      <div className="relative z-10 flex min-h-[640px] w-full max-w-[390px] flex-col justify-between">
        {/* Brand */}
        <header>
          <img
            src={hubLogo.url}
            alt="The HUB — powered by Summit Hoops"
            className="h-10 w-auto"
          />
        </header>

        {/* Hero */}
        <main className="flex flex-col justify-center py-10">
          <div className="flex gap-5">
            <div aria-hidden className="w-1 shrink-0 bg-accent" />
            <div className="flex flex-col gap-6">
              <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.9] tracking-tight">
                Your Path
                <br />
                <span className="text-accent">To The Next</span>
                <br />
                Level
              </h1>
              <p className="max-w-[300px] text-base leading-relaxed text-muted-foreground">
                The mobile platform for Midwest youth basketball recruiting and athlete
                exposure.
              </p>
            </div>
          </div>

          {/* Download */}
          <div className="mt-10">
            {APP_IS_LIVE ? (
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Download The HUB on the App Store"
                className="inline-flex p-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <img
                  src={appStoreBadge.url}
                  alt="Download on the App Store"
                  className="h-12 w-auto sm:h-[52px]"
                />
              </a>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/80">
                  Coming soon to the App Store
                </span>
              </div>
            )}
          </div>
        </main>

        {/* Required links */}
        <footer className="border-t border-border pt-8">
          <nav className="grid grid-cols-2 gap-x-8 gap-y-3">
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
          <p className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground/60">
            © 2026 Summit Hoops. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
