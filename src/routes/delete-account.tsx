import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const TITLE = "Delete your account — The HUB";
const DESC =
  "How to permanently delete your HUB account and all associated profile data, photos, messages, and saved athletes.";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://recruit.gforcedigital.net/delete-account" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://recruit.gforcedigital.net/delete-account" }],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-14">
        <h1 className="font-display text-4xl font-bold">Delete your account</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You can delete your HUB account and all of its data at any time. Deletion is permanent and
          cannot be undone.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Delete from inside the app</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
            <li>Open The HUB and sign in.</li>
            <li>
              Tap <strong>More</strong> in the bottom tab bar.
            </li>
            <li>
              Tap <strong>Account</strong>.
            </li>
            <li>
              Scroll to <strong>Delete Account</strong>.
            </li>
            <li>
              Type <strong>DELETE</strong> to confirm, then tap the delete button.
            </li>
            <li>Your account is removed immediately and you are signed out.</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Request deletion by email</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            If you cannot sign in, email us from the address on your account at{" "}
            <a
              className="font-medium text-primary underline underline-offset-4"
              href="mailto:info@summithoops.net?subject=Account%20deletion%20request"
            >
              info@summithoops.net
            </a>{" "}
            with the subject "Account deletion request". We verify ownership of the email address and
            complete deletion within 7 days.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">What gets deleted</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
            <li>Your login and account record</li>
            <li>Athlete profile details: measurements, academics, bio, and contacts</li>
            <li>Uploaded photos and highlight video links</li>
            <li>Game schedule entries and target school lists</li>
            <li>Messages you sent and conversations you were part of</li>
            <li>Saved athletes, bookmarks, and notifications</li>
            <li>For parents: the child profiles you created and manage</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            We may retain limited records where required by law or to resolve an open safety report.
            Those records are not visible to other users.
          </p>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          See also our{" "}
          <Link className="text-primary underline underline-offset-4" to="/privacy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link className="text-primary underline underline-offset-4" to="/support">
            Support
          </Link>{" "}
          page.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
