import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockAthleteFull } from "@/lib/mock-helpers";
import { getPublicAthlete } from "@/lib/athlete-public.functions";
import { recordProfileView, recordPublicProfileView } from "@/lib/analytics.functions";
import { contactWindows, NCAA_ELIGIBILITY_CENTER_URL } from "@/lib/compliance";
import { buildIcs, downloadFile, type IcsEvent } from "@/lib/ics";
import { MessageThread } from "@/components/MessageThread";
import { ProfileSkeleton } from "@/components/Skeletons";
import { VideoEmbed } from "@/components/VideoEmbed";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Download,
  GraduationCap,
  Instagram,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Ruler,
  ShieldCheck,
} from "lucide-react";


export const Route = createFileRoute("/a/$athleteId")({
  loader: async ({ params }) => getPublicAthlete({ data: { athleteId: params.athleteId } }),
  head: ({ loaderData }) => {
    const a = loaderData?.athlete;
    const name = a?.full_name ?? "Athlete profile";
    const title = a ? `${name} — Summit Hoops Recruiting Profile` : "Athlete profile — Summit Hoops";
    const description = a
      ? `${name}${a.position ? `, ${a.position}` : ""}${a.grad_year ? `, Class of ${a.grad_year}` : ""}${
          a.high_school ? ` at ${a.high_school}` : ""
        }. Verified measurements, academics, highlights and game schedule.`
      : "Youth basketball recruiting profile on the Summit Hoops circuit.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">
      Something went wrong loading this profile.
    </div>
  ),
  notFoundComponent: () => (
    <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">Athlete not found.</div>
  ),
  component: AthleteView,
});

function AthleteView() {
  const { athleteId } = Route.useParams();
  const publicData = Route.useLoaderData();
  const { user, roles, loading: authLoading } = useAuth();
  const isCoach = roles.includes("coach");
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();
  const [showThread, setShowThread] = useState(false);
  const trackAuthed = useServerFn(recordProfileView);
  const trackPublic = useServerFn(recordPublicProfileView);
  const tracked = useRef(false);

  // Record the view once per mount, attributed when the viewer is signed in.
  useEffect(() => {
    if (tracked.current || authLoading || isMockMode()) return;
    tracked.current = true;
    const fn = user ? trackAuthed({ data: { athleteId } }) : trackPublic({ data: { athleteId } });
    Promise.resolve(fn).catch(() => undefined);
  }, [athleteId, user, authLoading, trackAuthed, trackPublic]);



  const q = useQuery({
    queryKey: ["athlete-view", athleteId, user?.id ?? "anon"],
    initialData: publicData?.athlete ? publicData : undefined,
    queryFn: async () => {
      if (isMockMode()) return mockAthleteFull(athleteId);
      const [{ data: a }, { data: videos }, { data: events }, { data: photos }] = await Promise.all([
        supabase.from("athletes").select("*").eq("id", athleteId).maybeSingle(),
        supabase.from("athlete_videos").select("*").eq("athlete_id", athleteId),
        supabase.from("athlete_events").select("*").eq("athlete_id", athleteId).order("event_date"),
        supabase.from("athlete_photos").select("*").eq("athlete_id", athleteId).order("created_at"),
      ]);
      if (!a) return publicData ?? { athlete: null, videos: [], events: [], photos: [] };
      return { athlete: a, videos: videos ?? [], events: events ?? [], photos: photos ?? [] };
    },
  });

  const contactQ = useQuery({
    enabled: !!user?.id && (isCoach || isAdmin) && !isMockMode(),
    queryKey: ["athlete-contact", athleteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("athlete_contacts")
        .select("*")
        .eq("athlete_id", athleteId)
        .maybeSingle();
      return data;
    },
  });

  const savedQ = useQuery({
    enabled: !!user?.id && isCoach,
    queryKey: ["saved-flag", user?.id, athleteId],
    queryFn: async () => {
      const { data } = await supabase
        .from("coach_saved_athletes")
        .select("id")
        .eq("coach_user_id", user!.id)
        .eq("athlete_id", athleteId)
        .maybeSingle();
      return data;
    },
  });

  async function toggleSave() {
    if (!user) return;
    if (savedQ.data) {
      const { error } = await supabase.from("coach_saved_athletes").delete().eq("id", savedQ.data.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("coach_saved_athletes")
        .insert({ coach_user_id: user.id, athlete_id: athleteId });
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["saved-flag"] });
    qc.invalidateQueries({ queryKey: ["saved-athletes"] });
  }

  if (q.isLoading) return <ProfileSkeleton />;
  const a = q.data?.athlete;
  if (!a) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Lock className="h-6 w-6 text-primary" />
          </span>
          <h1 className="font-display text-xl font-bold">This profile isn't public</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            The athlete hasn't published it yet, or you don't have access. Approved coaches can view it after signing
            in.
          </p>
          <Button asChild variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const height = a.height_inches
    ? `${Math.floor(a.height_inches / 12)}'${a.height_inches % 12}"`
    : null;
  const contact = contactQ.data;
  const hasContact =
    !!contact &&
    !!(
      contact.athlete_email ||
      contact.athlete_phone ||
      contact.guardian_name ||
      contact.guardian_email ||
      contact.guardian_phone ||
      contact.club_coach_name ||
      contact.club_coach_phone
    );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        {a.profile_photo_url ? (
          <img
            src={a.profile_photo_url}
            alt={`${a.full_name} profile photo`}
            className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-3xl text-primary-foreground sm:h-32 sm:w-32">
            {a.full_name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{a.full_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {a.high_school ?? "—"}
            {a.hometown ? ` • ${a.hometown}` : ""}
            {a.state ? `, ${a.state}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.position && <Tag>{a.position}</Tag>}
            {a.grad_year && <Tag>Class of {a.grad_year}</Tag>}
            {height && <Tag>{height}</Tag>}
            {a.weight_lbs && <Tag>{a.weight_lbs} lbs</Tag>}
            {a.jersey_number && <Tag>#{a.jersey_number}</Tag>}
          </div>
          {a.bio && <p className="mt-4 text-sm">{a.bio}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isCoach && (
            <Button
              variant={savedQ.data ? "default" : "outline"}
              className="flex-1 sm:flex-none"
              onClick={toggleSave}
            >
              {savedQ.data ? (
                <>
                  <BookmarkCheck className="mr-1 h-4 w-4" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="mr-1 h-4 w-4" /> Save
                </>
              )}
            </Button>
          )}
          {isCoach && (
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setShowThread((v) => !v)}>
              <MessageSquare className="mr-1 h-4 w-4" /> Message
            </Button>
          )}
          {user?.id === a.user_id && (
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <Link to="/profile/edit">Edit</Link>
            </Button>
          )}

        </div>
      </div>

      {(isCoach || isAdmin) && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Lock className="h-5 w-5 text-primary" /> Contact information
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Coaches only
            </span>
          </h2>
          {contactQ.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading contact details…</p>
          ) : hasContact ? (
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <ContactRow icon={Mail} label="Athlete email" value={contact!.athlete_email} href={contact!.athlete_email ? `mailto:${contact!.athlete_email}` : undefined} />
              <ContactRow icon={Phone} label="Athlete phone" value={contact!.athlete_phone} href={contact!.athlete_phone ? `tel:${contact!.athlete_phone}` : undefined} />
              <ContactRow label="Parent / guardian" value={contact!.guardian_name} />
              <ContactRow icon={Mail} label="Guardian email" value={contact!.guardian_email} href={contact!.guardian_email ? `mailto:${contact!.guardian_email}` : undefined} />
              <ContactRow icon={Phone} label="Guardian phone" value={contact!.guardian_phone} href={contact!.guardian_phone ? `tel:${contact!.guardian_phone}` : undefined} />
              <ContactRow label="Club / HS coach" value={contact!.club_coach_name} />
              <ContactRow icon={Phone} label="Coach phone" value={contact!.club_coach_phone} href={contact!.club_coach_phone ? `tel:${contact!.club_coach_phone}` : undefined} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              This athlete hasn't added contact details yet.
            </p>
          )}
          <div className="mt-4 rounded-lg border border-border/70 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> NCAA contact windows
              {a.ncaa_id && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  NCAA ID on file
                </span>
              )}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {contactWindows(a.grad_year).map((w) => (
                <li key={w.division} className="flex items-start gap-2">
                  <span className={`font-semibold ${w.open ? "text-primary" : ""}`}>{w.division}</span>
                  <span>{w.summary}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Informational only — confirm current rules with your compliance office and the{" "}
              <a
                href={NCAA_ELIGIBILITY_CENTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NCAA Eligibility Center
              </a>
              .
            </p>
          </div>
        </Card>
      )}

      {isCoach && showThread && user && (
        <Card className="mt-6 overflow-hidden p-0">
          <MessageThread
            athleteId={athleteId}
            coachUserId={user.id}
            currentUserId={user.id}
            side="coach"
            title={`Message ${a.full_name}`}
            subtitle="The athlete and their linked parent/guardian both see this thread."
          />
        </Card>
      )}


      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <GraduationCap className="h-5 w-5 text-primary" /> Academics
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">GPA</dt>
            <dd>{a.gpa ?? "—"}</dd>
            <dt className="text-muted-foreground">SAT</dt>
            <dd>{a.sat_score ?? "—"}</dd>
            <dt className="text-muted-foreground">ACT</dt>
            <dd>{a.act_score ?? "—"}</dd>
            <dt className="text-muted-foreground">Major</dt>
            <dd>{a.intended_major ?? "—"}</dd>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Ruler className="h-5 w-5 text-primary" /> Measurements
          </h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Height</dt>
            <dd>{height ?? "—"}</dd>
            <dt className="text-muted-foreground">Weight</dt>
            <dd>{a.weight_lbs ? `${a.weight_lbs} lbs` : "—"}</dd>
            <dt className="text-muted-foreground">Position</dt>
            <dd>{a.position ?? "—"}</dd>
          </dl>
          {(a.instagram_handle || a.tiktok_handle) && (
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {a.instagram_handle && (
                <a
                  href={`https://instagram.com/${a.instagram_handle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" /> {a.instagram_handle}
                </a>
              )}
              {a.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${a.tiktok_handle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  TikTok {a.tiktok_handle}
                </a>
              )}
            </div>
          )}
        </Card>
      </div>

      {q.data && (q.data.photos ?? []).length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Action photos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(q.data.photos ?? []).map((p: any) => (
              <figure key={p.id}>
                <img
                  src={p.url}
                  alt={p.caption || `${a.full_name} action photo`}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
                {p.caption && (
                  <figcaption className="mt-1 text-xs text-muted-foreground">{p.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </Card>
      )}

      {q.data && q.data.videos.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Highlight videos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {q.data.videos.map((v: any) => (
              <VideoEmbed key={v.id} url={v.url} title={v.title} />
            ))}
          </div>
        </Card>
      )}


      {q.data && q.data.events.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming schedule
          </h2>
          <ul className="divide-y">
            {q.data.events.map((ev: any) => (
              <li key={ev.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">
                    {new Date(ev.event_date).toLocaleDateString()}{" "}
                    {ev.event_time && <span className="text-muted-foreground">• {ev.event_time}</span>}
                  </div>
                  <div className="text-muted-foreground">
                    {ev.opponent ? `vs ${ev.opponent}` : ""}
                    {ev.location && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                </div>
                {ev.is_mayb && (
                  <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    Summit Hoops
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-1 last:border-0">
      <dt className="flex items-center gap-1 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right">
        {href ? (
          <a href={href} className="text-primary hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">{children}</span>
  );
}
