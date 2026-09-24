import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const TITLE = "Email confirmed — The HUB";
const DESC =
  "Your email is confirmed. Open The HUB app on your iPhone and sign in with your email and password.";

export const Route = createFileRoute("/confirmed")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://recruit.gforcedigital.net/confirmed" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://recruit.gforcedigital.net/confirmed" }],
  }),
  component: ConfirmedPage,
});

function ConfirmedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center sm:p-10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2EC773"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="mx-auto h-16 w-16"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m8 12.5 2.5 2.5L16 9.5" />
          </svg>
          <h1 className="mt-6 font-display text-3xl font-bold">Email confirmed</h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            You're all set. Open The HUB app on your iPhone and sign in with your email and
            password.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Don't have the app yet? Download The HUB by SummitHoops from the App Store.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
