import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

const TITLE = "Privacy Policy — Recruiting Hub";
const DESC =
  "How Recruiting Hub collects, uses, and protects athlete, parent, and coach information on the Summit Hoops recruiting platform.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://athletic-spark.lovable.app/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://athletic-spark.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 29, 2026</p>
        <p className="mt-4 text-sm text-muted-foreground">
          This page is maintained by Summit Hoops to explain how Recruiting Hub handles personal
          information. It describes current practices in the app and is not an independent
          certification or audit.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-bold">Information we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Account details:</strong> name, email address, and the role you sign up
                with (athlete, parent, coach, or admin).
              </li>
              <li>
                <strong>Athlete profile details you enter:</strong> school, graduation year,
                position, height and weight, jersey number, GPA and test scores, bio, social links,
                highlight video links, and upcoming game schedule.
              </li>
              <li>
                <strong>Uploaded media:</strong> profile and action photos you choose to upload.
              </li>
              <li>
                <strong>Coach activity:</strong> coach access requests and the athletes a coach
                saves to their shortlist.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">How we use it</h2>
            <p className="mt-2">
              We use this information to operate the recruiting directory: to display athlete
              profiles to approved coaches, to let athletes and parents manage their own profile, to
              review coach access requests, and to keep accounts secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Children and parent control</h2>
            <p className="mt-2">
              Athlete profiles frequently belong to minors. Accounts for athletes under 18 must be
              created and managed by a parent or legal guardian, who controls what information is
              published and may request removal at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Who can see athlete information</h2>
            <p className="mt-2">
              Athlete profiles are visible to signed-in, administrator-approved coaches and to
              administrators. Coach access is not granted automatically on sign-up. Uploaded media
              is stored in a private bucket and served through time-limited links rather than public
              URLs.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Access controls</h2>
            <p className="mt-2">
              Accounts are authenticated by email and password. Database access is scoped per user
              so a signed-in account can only read and edit records its role permits, and
              privileged actions such as approving a coach are verified on the server.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Service providers</h2>
            <p className="mt-2">
              We use third-party infrastructure providers for application hosting, database,
              authentication, and file storage. Highlight videos are hosted on the platforms you
              link to (such as Hudl, YouTube, or Vimeo), and those platforms have their own privacy
              policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Retention and deletion</h2>
            <p className="mt-2">
              We keep profile information while the account is active. You may request deletion of a
              profile and its uploaded media by contacting us, and we will remove it from the
              directory.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Your choices</h2>
            <p className="mt-2">
              You decide what goes on a profile. Fields such as academics, social links, and
              schedule are optional and can be edited or cleared at any time from the profile
              editor.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Contact</h2>
            <p className="mt-2">
              For privacy questions or deletion requests, reach out through the Summit Hoops contact
              channel used for your account. See also our{" "}
              <Link to="/terms" className="text-primary underline underline-offset-4">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
