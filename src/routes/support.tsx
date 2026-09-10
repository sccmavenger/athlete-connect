import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

const TITLE = "Support — The HUB";
const DESC =
  "Get help with your HUB account, athlete profile, coach access, or privacy requests. Contact the Summit Hoops support team.";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const FAQ = [
  {
    q: "How do I create an athlete profile?",
    a: "Sign up with the athlete role, then open Profile to add measurements, academics, highlight links, and your game schedule. Publish your profile when you are ready for coaches to see it.",
  },
  {
    q: "My child is under 13 — can they have a profile?",
    a: "Yes, but a parent or guardian must create and manage it. Sign up with the parent role, add your child, and provide guardian consent before the profile can be published.",
  },
  {
    q: "How do coaches find athletes?",
    a: "Approved college coaches can search by position, GPA, graduation year, and distance from their location, then bookmark athletes and message them.",
  },
  {
    q: "How do I delete my account or data?",
    a: "Email us from the address on your account and ask for deletion. We remove your profile, media, and messages from the platform.",
  },
];

function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-4xl font-bold">Support</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Questions about your account, profile, or coach access? We are happy to help.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Contact us</h2>
          <p className="mt-2 text-sm text-foreground/90">
            Email:{" "}
            <a
              className="inline-flex min-h-11 items-center font-medium text-primary underline"
              href="mailto:support@gforcedigital.net"
            >
              support@gforcedigital.net
            </a>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We respond to most requests within two business days. Include your account email and a
            short description of the issue.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-6 text-sm leading-relaxed text-foreground/90">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1 text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          See also our{" "}
          <Link className="inline-flex min-h-11 items-center text-primary underline" to="/privacy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link className="inline-flex min-h-11 items-center text-primary underline" to="/terms">
            Terms of Service
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
