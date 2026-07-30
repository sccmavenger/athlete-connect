import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import heroImg from "@/assets/hero-basketball.jpg";
import { Trophy, Video, GraduationCap, Users, MapPin, Calendar } from "lucide-react";

const TITLE = "Recruiting Hub — Midwest youth basketball recruiting";
const DESC =
  "Build a recruiting profile with measurements, academics, highlights, and your Summit Hoops schedule so college coaches can find you.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://athletic-spark.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://athletic-spark.lovable.app/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

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
              Recruiting Hub is a regional recruiting database built for Summit Hoops athletes.
              Build your profile, share your highlights, and let college coaches find you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth" search={{ role: "athlete" }}>
                  Create athlete profile
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-foreground/40 bg-transparent text-foreground hover:bg-foreground/10"
              >
                <Link to="/auth" search={{ role: "coach" }}>
                  I'm a college coach
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">Everything you need on one profile</h2>
          <p className="mt-4 text-muted-foreground">
            The information college coaches actually want, in one place they can search.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users, title: "Player profiles", desc: "Basics, position, height, weight, and jersey number." },
            { icon: Trophy, title: "Verified measurements", desc: "Track camp results and combine numbers over time." },
            { icon: GraduationCap, title: "Academic info", desc: "GPA, test scores, and intended major front and center." },
            { icon: Video, title: "Highlight videos", desc: "Link Hudl, YouTube, and Vimeo reels straight to your page." },
            { icon: Calendar, title: "Summit Hoops schedule", desc: "Post upcoming games so coaches know when to watch." },
            { icon: MapPin, title: "Regional focus", desc: "Built for Midwest athletes and the coaches who scout them." },
          ].map((f) => (
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

      {/* CTA band */}
      <section className="bg-card text-card-foreground border-t">
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Playing Summit Hoops this season? Get on the map.
          </h2>
          <p className="max-w-2xl text-card-foreground/85">

            Free to start. Build your profile in minutes and share your link with coaches, family, and scouts.
          </p>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/auth" search={{ role: "athlete" }}>Get started</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Recruiting Hub</span>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <span>Built for Midwest athletes.</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
