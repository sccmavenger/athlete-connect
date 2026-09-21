import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const TITLE = "Privacy Policy — The HUB";
const DESC =
  "How The HUB collects, uses, and protects athlete, parent, and coach information on the Summit Hoops recruiting app.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://recruit.gforcedigital.net/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://recruit.gforcedigital.net/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-14">
        <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 21, 2026</p>
        <p className="mt-4 text-sm text-muted-foreground">
          This policy explains how Summit Hoops handles personal information in The HUB mobile app
          and on this website.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-bold">Information we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Account details:</strong> name, email address, and the role you sign up with
                (athlete, parent, coach, or admin).
              </li>
              <li>
                <strong>Athlete profile details you enter:</strong> school, city and state,
                graduation year, position, height and weight, jersey number, GPA and test scores,
                bio, highlight video links, upcoming game schedule, and target schools.
              </li>
              <li>
                <strong>Uploaded media:</strong> profile and action photos you choose to upload.
              </li>
              <li>
                <strong>Contact details:</strong> guardian and high school coach contact information
                entered on a profile, shown only to approved college coaches.
              </li>
              <li>
                <strong>Messages:</strong> the content of messages exchanged between coaches and
                athlete or parent accounts.
              </li>
              <li>
                <strong>Approximate location:</strong> the city or postal code you enter, used to
                calculate distance for coach searches. We do not collect continuous device GPS.
              </li>
              <li>
                <strong>Safety records:</strong> reports and blocks you submit, so administrators can
                review them.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">How we use it</h2>
            <p className="mt-2">
              We use this information to operate the recruiting directory: to display athlete
              profiles to approved coaches, to let athletes and parents manage their own profile, to
              deliver messages and notifications, to review coach access requests and safety
              reports, and to keep accounts secure. We do not sell personal information and we do
              not use it for third-party advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Children and parent control</h2>
            <p className="mt-2">
              Athlete profiles frequently belong to minors. Athletes under 13 cannot create their own
              account — a parent or legal guardian must create and manage the profile, and the
              profile cannot be published without recorded guardian consent. Parents control what is
              published and may unpublish or delete a profile at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Who can see athlete information</h2>
            <p className="mt-2">
              Athlete profiles are visible to signed-in, administrator-approved college coaches and
              to administrators. Coach access is not granted automatically on sign-up. Uploaded media
              is stored privately and served through time-limited links rather than public URLs.
              Sensitive contact details are limited to approved coaches.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Reporting and blocking</h2>
            <p className="mt-2">
              Any user can report a profile or conversation and block another user. Blocking stops
              messages immediately. Reports are reviewed by administrators, who may hide content or
              remove accounts. The person reported is not told who reported them.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Service providers</h2>
            <p className="mt-2">
              We use third-party infrastructure providers for application hosting, database,
              authentication, email, and file storage. Highlight videos are hosted on the platforms
              you link to (such as Hudl, YouTube, or Vimeo), and those platforms have their own
              privacy policies. We use a public mapping service to convert a city or postal code into
              approximate coordinates for distance search.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Retention and deletion</h2>
            <p className="mt-2">
              We keep profile information while the account is active. You can delete your account
              and its data from inside the app at any time, or request deletion by email. See our{" "}
              <Link className="text-primary underline underline-offset-4" to="/delete-account">
                Delete account
              </Link>{" "}
              page for the exact steps and what is removed.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Security</h2>
            <p className="mt-2">
              Accounts are authenticated by email and password. Database access is scoped per user so
              a signed-in account can only read and edit records its role permits, and privileged
              actions such as approving a coach or resolving a report are verified on the server.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Your choices</h2>
            <p className="mt-2">
              You decide what goes on a profile. Fields such as academics, contacts, and schedule are
              optional and can be edited or cleared at any time, and a profile can be unpublished so
              coaches can no longer see it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold">Contact</h2>
            <p className="mt-2">
              For privacy questions or deletion requests, email{" "}
              <a
                className="font-medium text-primary underline underline-offset-4"
                href="mailto:informed@summithoops.net"
              >
                informed@summithoops.net
              </a>
              . See also our{" "}
              <Link to="/terms" className="text-primary underline underline-offset-4">
                Terms of Use
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
