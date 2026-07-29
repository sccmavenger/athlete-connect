import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

const TITLE = "Terms of Service — Recruiting Hub";
const DESC =
  "The terms that govern athlete, parent, and coach use of the Recruiting Hub recruiting platform for Summit Hoops.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://athletic-spark.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://athletic-spark.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 29, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-bold">1. About these terms</h2>
            <p className="mt-2">
              Recruiting Hub ("the Service") is a regional recruiting database operated by Summit
              Hoops. By creating an account or using the Service you agree to these terms. If you do
              not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">2. Who may use the Service</h2>
            <p className="mt-2">
              Athlete profiles may involve minors. If the athlete is under 18, a parent or legal
              guardian must create and manage the account and is responsible for all activity on it.
              College and club coaches must request coach access, which is reviewed and approved by
              an administrator before directory access is granted.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">3. Your content</h2>
            <p className="mt-2">
              You keep ownership of the information, photos, and video links you post. You grant
              Summit Hoops a non-exclusive license to display that content within the Service to
              approved coaches and administrators for recruiting purposes. You are responsible for
              the accuracy of measurements, academic information, and schedules you submit.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">4. Acceptable use</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Do not impersonate another athlete, parent, coach, or institution.</li>
              <li>Do not upload unlawful, harassing, or sexually explicit material.</li>
              <li>Do not scrape, resell, or redistribute athlete data from the directory.</li>
              <li>Do not attempt to gain access to accounts, roles, or data that are not yours.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">5. Coach access and recruiting rules</h2>
            <p className="mt-2">
              Approved coaches are responsible for complying with NCAA, NAIA, NJCAA, and state
              association contact rules. Recruiting Hub does not verify eligibility or monitor
              recruiting contact, and approval of a coach account is not an endorsement.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">6. Suspension and termination</h2>
            <p className="mt-2">
              We may suspend or remove accounts that violate these terms or that contain inaccurate
              or harmful content. You may delete your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">7. No guarantees</h2>
            <p className="mt-2">
              The Service is provided "as is." We do not guarantee exposure, scholarship offers,
              coach interest, or uninterrupted availability of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">8. Changes</h2>
            <p className="mt-2">
              We may update these terms. Material changes will be reflected by the "last updated"
              date above, and continued use of the Service means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">9. Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach out through the Summit Hoops contact channel used
              for your account. See also our{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
