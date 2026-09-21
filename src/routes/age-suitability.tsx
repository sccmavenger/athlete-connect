import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const TITLE = "Age Suitability — The HUB";
const DESC =
  "Why The HUB uses a 13+ age rating for youth basketball recruiting, messaging, athlete profiles, and parent-managed accounts.";

export const Route = createFileRoute("/age-suitability")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://recruit.gforcedigital.net/age-suitability" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://recruit.gforcedigital.net/age-suitability" }],
  }),
  component: AgeSuitabilityPage,
});

function AgeSuitabilityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-14">
        <h1 className="font-display text-4xl font-bold">Age Suitability</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 21, 2026</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The HUB is intended for youth basketball recruiting and athlete exposure. Summit Hoops
          lists the app as 13+ to better match the audience, account model, and communication tools
          used in the app.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-bold">Why the app is rated 13+</h2>
            <p className="mt-2">
              The app is built for middle school and high school basketball recruiting. Athlete
              profiles may include a player name, school, city and state, class year, position,
              measurements, academics, highlight links, photos, schedules, and recruiting interests.
              Because that information often belongs to teen athletes, we use a 13+ rating even
              where a lower rating may be calculated automatically.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Under-13 athletes</h2>
            <p className="mt-2">
              Athletes under 13 cannot create their own account. A parent or legal guardian must
              create and manage the athlete profile, provide guardian consent before the profile is
              published, and control what information is shared.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Messaging and coach access</h2>
            <p className="mt-2">
              The HUB includes messaging between athlete or parent accounts and approved coach
              accounts. Coach directory access is not automatic: coaches must be reviewed and
              approved before they can search athlete profiles or start recruiting conversations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Safety controls</h2>
            <p className="mt-2">
              Message threads include Report and Block controls. Open a message thread and tap the
              menu in the top right, then choose Report or Block. Reports are reviewed by
              administrators, and blocking stops messages immediately.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">What the app does not include</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>No gambling, contests, or wagering.</li>
              <li>No unrestricted web browsing.</li>
              <li>No third-party advertising or sale of personal information.</li>
              <li>No medical, financial, or emergency-service functionality.</li>
              <li>No mature, sexual, or graphic content is permitted.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Related policies</h2>
            <p className="mt-2">
              For more detail, see our{" "}
              <Link className="text-primary underline underline-offset-4" to="/privacy">
                Privacy Policy
              </Link>
              ,{" "}
              <Link className="text-primary underline underline-offset-4" to="/terms">
                Terms of Use
              </Link>
              , and{" "}
              <Link className="text-primary underline underline-offset-4" to="/support">
                Support
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Contact</h2>
            <p className="mt-2">
              Questions about age suitability or parent-managed accounts? Email{" "}
              <a
                className="font-medium text-primary underline underline-offset-4"
                href="mailto:info@summithoops.net"
              >
                info@summithoops.net
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}