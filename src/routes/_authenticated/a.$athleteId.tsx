import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { isMockMode, mockAthleteFull } from "@/lib/mock-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, Calendar, ExternalLink, GraduationCap, Instagram, MapPin, Ruler } from "lucide-react";

export const Route = createFileRoute("/_authenticated/a/$athleteId")({
  head: () => ({
    meta: [{ title: "Athlete profile — Recruiting Hub" }, { name: "robots", content: "noindex" }],
  }),
  component: AthleteView,
});

function AthleteView() {
  const { athleteId } = Route.useParams();
  const { user, roles } = useAuth();
  const isCoach = roles.includes("coach");
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["athlete-view", athleteId],
    queryFn: async () => {
      if (isMockMode()) return mockAthleteFull(athleteId);
      const [{ data: a }, { data: videos }, { data: events }] = await Promise.all([
        supabase.from("athletes").select("*").eq("id", athleteId).maybeSingle(),
        supabase.from("athlete_videos").select("*").eq("athlete_id", athleteId),
        supabase.from("athlete_events").select("*").eq("athlete_id", athleteId).order("event_date"),
      ]);
      return { athlete: a, videos: videos ?? [], events: events ?? [] };
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

  if (q.isLoading) return <div className="container mx-auto px-4 py-12">Loading...</div>;
  const a = q.data?.athlete;
  if (!a) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-muted-foreground">
        Athlete not found or you don't have access.
      </div>
    );
  }

  const height = a.height_inches
    ? `${Math.floor(a.height_inches / 12)}'${a.height_inches % 12}"`
    : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {a.profile_photo_url ? (
          <img src={a.profile_photo_url} alt="" className="h-32 w-32 rounded-xl object-cover" />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display text-3xl">
            {a.full_name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-display text-4xl font-bold">{a.full_name}</h1>
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
        {isCoach && (
          <Button variant={savedQ.data ? "default" : "outline"} onClick={toggleSave}>
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
        {user?.id === a.user_id && (
          <Button asChild variant="outline">
            <Link to="/profile/edit">Edit</Link>
          </Button>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
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
            <div className="mt-4 flex gap-3 text-sm">
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

      {q.data && q.data.videos.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Highlight videos</h2>
          <ul className="space-y-2">
            {q.data.videos.map((v: any) => (
              <li key={v.id}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {v.title || v.url}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {q.data && q.data.events.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming schedule
          </h2>
          <ul className="divide-y">
            {q.data.events.map((ev: any) => (
              <li key={ev.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">
                    {new Date(ev.event_date).toLocaleDateString()}{" "}
                    {ev.event_time && <span className="text-muted-foreground">• {ev.event_time}</span>}
                  </div>
                  <div className="text-muted-foreground">
                    {ev.opponent ? `vs ${ev.opponent}` : ""}
                    {ev.location && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                </div>
                {ev.is_mayb && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    MAYB
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{children}</span>
  );
}
