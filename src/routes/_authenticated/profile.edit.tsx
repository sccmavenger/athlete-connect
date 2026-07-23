import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({
    meta: [{ title: "Edit profile — Recruiting Hub" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfileEdit,
});

type AthleteForm = {
  id?: string;
  full_name: string;
  hometown: string;
  state: string;
  high_school: string;
  grad_year: string;
  position: string;
  height_inches: string;
  weight_lbs: string;
  jersey_number: string;
  gpa: string;
  sat_score: string;
  act_score: string;
  intended_major: string;
  instagram_handle: string;
  tiktok_handle: string;
  bio: string;
  profile_photo_url: string;
};

const empty: AthleteForm = {
  full_name: "",
  hometown: "",
  state: "",
  high_school: "",
  grad_year: "",
  position: "",
  height_inches: "",
  weight_lbs: "",
  jersey_number: "",
  gpa: "",
  sat_score: "",
  act_score: "",
  intended_major: "",
  instagram_handle: "",
  tiktok_handle: "",
  bio: "",
  profile_photo_url: "",
};

type Video = { id?: string; url: string; title: string; _new?: boolean };
type Event = {
  id?: string;
  event_date: string;
  event_time: string;
  opponent: string;
  location: string;
  is_mayb: boolean;
  _new?: boolean;
};

function ProfileEdit() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<AthleteForm>(empty);
  const [videos, setVideos] = useState<Video[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: athlete } = await supabase
        .from("athletes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (athlete) {
        setForm({
          id: athlete.id,
          full_name: athlete.full_name ?? "",
          hometown: athlete.hometown ?? "",
          state: athlete.state ?? "",
          high_school: athlete.high_school ?? "",
          grad_year: athlete.grad_year?.toString() ?? "",
          position: athlete.position ?? "",
          height_inches: athlete.height_inches?.toString() ?? "",
          weight_lbs: athlete.weight_lbs?.toString() ?? "",
          jersey_number: athlete.jersey_number ?? "",
          gpa: athlete.gpa?.toString() ?? "",
          sat_score: athlete.sat_score?.toString() ?? "",
          act_score: athlete.act_score?.toString() ?? "",
          intended_major: athlete.intended_major ?? "",
          instagram_handle: athlete.instagram_handle ?? "",
          tiktok_handle: athlete.tiktok_handle ?? "",
          bio: athlete.bio ?? "",
          profile_photo_url: athlete.profile_photo_url ?? "",
        });
        const [{ data: v }, { data: ev }] = await Promise.all([
          supabase.from("athlete_videos").select("*").eq("athlete_id", athlete.id),
          supabase
            .from("athlete_events")
            .select("*")
            .eq("athlete_id", athlete.id)
            .order("event_date"),
        ]);
        setVideos((v ?? []).map((r) => ({ id: r.id, url: r.url, title: r.title ?? "" })));
        setEvents(
          (ev ?? []).map((r) => ({
            id: r.id,
            event_date: r.event_date,
            event_time: r.event_time ?? "",
            opponent: r.opponent ?? "",
            location: r.location ?? "",
            is_mayb: r.is_mayb,
          }))
        );
      }
      setLoading(false);
    })();
  }, [user]);

  function update<K extends keyof AthleteForm>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadPhoto(file: File) {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/profile-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("athlete-media").upload(path, file, {
      upsert: true,
    });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: signed } = await supabase.storage
      .from("athlete-media")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signed?.signedUrl) update("profile_photo_url", signed.signedUrl);
    setUploading(false);
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: form.full_name.trim(),
        hometown: form.hometown || null,
        state: form.state || null,
        high_school: form.high_school || null,
        grad_year: form.grad_year ? parseInt(form.grad_year) : null,
        position: form.position || null,
        height_inches: form.height_inches ? parseInt(form.height_inches) : null,
        weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
        jersey_number: form.jersey_number || null,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        sat_score: form.sat_score ? parseInt(form.sat_score) : null,
        act_score: form.act_score ? parseInt(form.act_score) : null,
        intended_major: form.intended_major || null,
        instagram_handle: form.instagram_handle || null,
        tiktok_handle: form.tiktok_handle || null,
        bio: form.bio || null,
        profile_photo_url: form.profile_photo_url || null,
      };

      let athleteId = form.id;
      if (athleteId) {
        const { error } = await supabase.from("athletes").update(payload).eq("id", athleteId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("athletes")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        athleteId = data.id;
        setForm((f) => ({ ...f, id: athleteId }));
      }

      // Videos: replace-all strategy
      await supabase.from("athlete_videos").delete().eq("athlete_id", athleteId);
      const cleanVideos = videos.filter((v) => v.url.trim());
      if (cleanVideos.length > 0) {
        const { error } = await supabase.from("athlete_videos").insert(
          cleanVideos.map((v) => ({
            athlete_id: athleteId!,
            url: v.url.trim(),
            title: v.title || null,
          }))
        );
        if (error) throw error;
      }

      // Events
      await supabase.from("athlete_events").delete().eq("athlete_id", athleteId);
      const cleanEvents = events.filter((e) => e.event_date);
      if (cleanEvents.length > 0) {
        const { error } = await supabase.from("athlete_events").insert(
          cleanEvents.map((e) => ({
            athlete_id: athleteId!,
            event_date: e.event_date,
            event_time: e.event_time || null,
            opponent: e.opponent || null,
            location: e.location || null,
            is_mayb: e.is_mayb,
          }))
        );
        if (error) throw error;
      }

      toast.success("Profile saved");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Your athlete profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The more you fill out, the more coaches can find you.
      </p>

      {/* Basics */}
      <Card className="mt-6 space-y-4 p-6">
        <h2 className="font-display text-xl font-bold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} maxLength={100} />
          </Field>
          <Field label="Profile photo">
            <div className="flex items-center gap-3">
              {form.profile_photo_url && (
                <img src={form.profile_photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                }}
                disabled={uploading}
              />
            </div>
          </Field>
          <Field label="Hometown">
            <Input value={form.hometown} onChange={(e) => update("hometown", e.target.value)} maxLength={100} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => update("state", e.target.value)} maxLength={2} placeholder="KS" />
          </Field>
          <Field label="High school">
            <Input value={form.high_school} onChange={(e) => update("high_school", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Grad year">
            <Input type="number" value={form.grad_year} onChange={(e) => update("grad_year", e.target.value)} placeholder="2027" />
          </Field>
          <Field label="Position">
            <Input value={form.position} onChange={(e) => update("position", e.target.value)} placeholder="PG / SG / SF / PF / C" maxLength={20} />
          </Field>
          <Field label="Height (inches)">
            <Input type="number" value={form.height_inches} onChange={(e) => update("height_inches", e.target.value)} placeholder="72" />
          </Field>
          <Field label="Weight (lbs)">
            <Input type="number" value={form.weight_lbs} onChange={(e) => update("weight_lbs", e.target.value)} />
          </Field>
          <Field label="Jersey #">
            <Input value={form.jersey_number} onChange={(e) => update("jersey_number", e.target.value)} maxLength={5} />
          </Field>
        </div>
        <Field label="Bio">
          <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} maxLength={1000} rows={3} />
        </Field>
      </Card>

      {/* Academics */}
      <Card className="mt-6 space-y-4 p-6">
        <h2 className="font-display text-xl font-bold">Academics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GPA">
            <Input type="number" step="0.01" value={form.gpa} onChange={(e) => update("gpa", e.target.value)} placeholder="3.75" />
          </Field>
          <Field label="Intended major">
            <Input value={form.intended_major} onChange={(e) => update("intended_major", e.target.value)} maxLength={100} />
          </Field>
          <Field label="SAT">
            <Input type="number" value={form.sat_score} onChange={(e) => update("sat_score", e.target.value)} />
          </Field>
          <Field label="ACT">
            <Input type="number" value={form.act_score} onChange={(e) => update("act_score", e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Socials */}
      <Card className="mt-6 space-y-4 p-6">
        <h2 className="font-display text-xl font-bold">Socials</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram handle">
            <Input value={form.instagram_handle} onChange={(e) => update("instagram_handle", e.target.value)} placeholder="@yourname" maxLength={50} />
          </Field>
          <Field label="TikTok handle">
            <Input value={form.tiktok_handle} onChange={(e) => update("tiktok_handle", e.target.value)} placeholder="@yourname" maxLength={50} />
          </Field>
        </div>
      </Card>

      {/* Videos */}
      <Card className="mt-6 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Highlight videos</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={videos.length >= 5}
            onClick={() => setVideos((v) => [...v, { url: "", title: "", _new: true }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
        {videos.length === 0 && (
          <p className="text-sm text-muted-foreground">No videos yet. YouTube, Hudl, Vimeo links work great.</p>
        )}
        {videos.map((v, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="https://..."
              value={v.url}
              onChange={(e) =>
                setVideos((vs) => vs.map((row, idx) => (idx === i ? { ...row, url: e.target.value } : row)))
              }
            />
            <Input
              placeholder="Title (optional)"
              value={v.title}
              onChange={(e) =>
                setVideos((vs) => vs.map((row, idx) => (idx === i ? { ...row, title: e.target.value } : row)))
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setVideos((vs) => vs.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </Card>

      {/* Events */}
      <Card className="mt-6 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Upcoming games / events</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setEvents((e) => [
                ...e,
                { event_date: "", event_time: "", opponent: "", location: "", is_mayb: false, _new: true },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
        {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
        {events.map((ev, i) => (
          <div key={i} className="rounded-lg border p-3">
            <div className="grid gap-2 sm:grid-cols-4">
              <Input
                type="date"
                value={ev.event_date}
                onChange={(e) =>
                  setEvents((all) => all.map((r, idx) => (idx === i ? { ...r, event_date: e.target.value } : r)))
                }
              />
              <Input
                placeholder="Time"
                value={ev.event_time}
                onChange={(e) =>
                  setEvents((all) => all.map((r, idx) => (idx === i ? { ...r, event_time: e.target.value } : r)))
                }
              />
              <Input
                placeholder="Opponent"
                value={ev.opponent}
                onChange={(e) =>
                  setEvents((all) => all.map((r, idx) => (idx === i ? { ...r, opponent: e.target.value } : r)))
                }
              />
              <Input
                placeholder="Location"
                value={ev.location}
                onChange={(e) =>
                  setEvents((all) => all.map((r, idx) => (idx === i ? { ...r, location: e.target.value } : r)))
                }
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ev.is_mayb}
                  onChange={(e) =>
                    setEvents((all) =>
                      all.map((r, idx) => (idx === i ? { ...r, is_mayb: e.target.checked } : r))
                    )
                  }
                />
                Summit Hoops event
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEvents((all) => all.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving || !form.full_name.trim()}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
