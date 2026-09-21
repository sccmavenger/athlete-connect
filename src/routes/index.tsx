import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroImg from "@/assets/hero-basketball.jpg";
import { Trophy, Video, GraduationCap, Users, MapPin, Calendar } from "lucide-react";

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

const FEATURES = [
  { icon: Users, title: "Player profiles", desc: "Basics, position, height, weight, and jersey number." },
  { icon: Trophy, title: "Measurements", desc: "Track camp results and combine numbers over time." },
  { icon: GraduationCap, title: "Academic info", desc: "GPA, test scores, and intended major front and center." },
  { icon: Video, title: "Highlight videos", desc: "Link Hudl, YouTube, and Vimeo reels straight to your page." },
  { icon: Calendar, title: "Game schedule", desc: "Post upcoming games so coaches know when to watch." },
  { icon: MapPin, title: "Regional focus", desc: "Built for Midwest athletes and the coaches who scout them." },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-background text-foreground">
          <img
            src={heroImg}
            alt="Youth basketball player driving to the hoop"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            width={1600}
            height={1000}
          />
          <div className="relative container mx-auto px-4 py-16 sm:py-24 md:py-32">
            <div className="max-w-3xl">
              <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-foreground">
                Midwest youth basketball
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-7xl">
                Get seen by the coaches who matter.
              </h1>
              <p className="mt-5 max-w-xl text-base text-foreground/85 sm:mt-6 sm:text-lg">
                The HUB is a regional recruiting app built for Summit Hoops athletes. Build your
                profile, share your highlights, and let college coaches find you — all from your
                iPhone.
              </p>
              <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-accent">
                Coming soon to the App Store
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
              Everything you need on one profile
            </h2>
            <p className="mt-4 text-muted-foreground">
              The information college coaches actually want, in one place they can search.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-t bg-card text-card-foreground">
          <div className="container mx-auto grid gap-8 px-4 py-14 sm:py-16 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">For athletes and families</h2>
              <p className="mt-3 text-sm leading-relaxed text-card-foreground/85">
                Athletes 13 and older can build their own profile. For younger players, a parent or
                guardian creates and manages the profile and decides when it is published. Families
                control what is shared and can unpublish or delete at any time.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">For college coaches</h2>
              <p className="mt-3 text-sm leading-relaxed text-card-foreground/85">
                Coach accounts are reviewed and approved by an administrator before any athlete
                information is visible. Approved coaches can search by position, academics, and
                distance, save athletes, and message families.
              </p>
            </div>
          </div>
        </section>

        {/* Help band */}
        <section className="container mx-auto px-4 py-14 text-center sm:py-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Need help?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Visit our support page for answers and contact details, or review how we handle your
            information.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              to="/support"
              className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 font-medium text-accent-foreground hover:bg-accent/90"
            >
              Get support
            </Link>
            <Link
              to="/privacy"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-5 font-medium hover:bg-secondary"
            >
              Privacy Policy
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
