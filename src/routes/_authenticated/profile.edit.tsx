import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { geocodeZip } from "@/lib/geocode.functions";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FormSkeleton } from "@/components/Skeletons";
import {
  athleteSchema,
  contactSchema,
  collectErrors,
  isValidHttpUrl,
  type FieldErrors,
} from "@/lib/validation";
import { isUnder18 } from "@/lib/compliance";
import { MAX_COLLEGE_INTERESTS } from "@/lib/colleges";
import { toast } from "sonner";
import { Trash2, Plus, Upload, GraduationCap } from "lucide-react";


export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({
    meta: [{ title: "Edit profile — Recruiting Hub" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfileEdit,
});

const MAX_PHOTOS = 6;

type AthleteForm = {
  id?: string;
  owner_user_id?: string;
  full_name: string;
  hometown: string;
  state: string;
  high_school: string;
  grad_year: string;
  sport_gender: string;
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
  zip_code: string;
  ncaa_id: string;
  date_of_birth: string;
  guardian_consent_name: string;
  guardian_consent_email: string;
  guardian_consent_at: string | null;
  is_published: boolean;
};

const empty: AthleteForm = {
  full_name: "",
  hometown: "",
  state: "",
  high_school: "",
  grad_year: "",
  sport_gender: "",
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
  zip_code: "",
  ncaa_id: "",
  date_of_birth: "",
  guardian_consent_name: "",
  guardian_consent_email: "",
  guardian_consent_at: null,
  is_published: false,
};


type ContactForm = {
  athlete_email: string;
  athlete_phone: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string;
  club_coach_name: string;
  club_coach_phone: string;
};

const emptyContact: ContactForm = {
  athlete_email: "",
  athlete_phone: "",
  guardian_name: "",
  guardian_email: "",
  guardian_phone: "",
  club_coach_name: "",
  club_coach_phone: "",
};

type Video = { id?: string; url: string; title: string };
type Photo = { id?: string; url: string; caption: string };
type Event = {
  id?: string;
  event_date: string;
  event_time: string;
  opponent: string;
  location: string;
  is_mayb: boolean;
};

function ProfileEdit() {
  const { user, loading: authLoading } = useAuth();
  const geocode = useServerFn(geocodeZip);
  const navigate = useNavigate();

  const [form, setForm] = useState<AthleteForm>(empty);
  const [contact, setContact] = useState<ContactForm>(emptyContact);
  const [videos, setVideos] = useState<Video[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const wanted =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("athleteId")
          : null;
      // Published athletes are world-readable, so scope this explicitly to
      // profiles the user owns or manages as a guardian.
      const { data: links } = await supabase
        .from("athlete_guardians")
        .select("athlete_id")
        .eq("user_id", user.id);
      const managedIds = (links ?? []).map((l) => l.athlete_id);
      const { data: own } = await supabase
        .from("athletes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      const { data: linked } = managedIds.length
        ? await supabase.from("athletes").select("*").in("id", managedIds).order("created_at")
        : { data: [] as NonNullable<typeof own> };
      const rows = [...(own ?? []), ...(linked ?? []).filter((l) => !(own ?? []).some((o) => o.id === l.id))];
      const athlete =
        (wanted ? rows.find((r) => r.id === wanted) : null) ??
        rows.find((r) => r.user_id === user.id) ??
        rows[0] ??
        null;
      if (athlete) {
        setForm({
          id: athlete.id,
          owner_user_id: athlete.user_id,
          full_name: athlete.full_name ?? "",
          hometown: athlete.hometown ?? "",
          state: athlete.state ?? "",
          high_school: athlete.high_school ?? "",
          grad_year: athlete.grad_year?.toString() ?? "",
          sport_gender: athlete.sport_gender ?? "",
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
          zip_code: athlete.zip_code ?? "",
          ncaa_id: athlete.ncaa_id ?? "",
          date_of_birth: athlete.date_of_birth ?? "",
          guardian_consent_name: athlete.guardian_consent_name ?? "",
          guardian_consent_email: athlete.guardian_consent_email ?? "",
          guardian_consent_at: athlete.guardian_consent_at ?? null,
          is_published: athlete.is_published ?? false,
        });

        const [{ data: v }, { data: ev }, { data: ph }, { data: c }] = await Promise.all([
          supabase.from("athlete_videos").select("*").eq("athlete_id", athlete.id),
          supabase
            .from("athlete_events")
            .select("*")
            .eq("athlete_id", athlete.id)
            .order("event_date"),
          supabase
            .from("athlete_photos")
            .select("*")
            .eq("athlete_id", athlete.id)
            .order("created_at"),
          supabase
            .from("athlete_contacts")
            .select("*")
            .eq("athlete_id", athlete.id)
            .maybeSingle(),
        ]);
        setVideos((v ?? []).map((r) => ({ id: r.id, url: r.url, title: r.title ?? "" })));
        setPhotos((ph ?? []).map((r) => ({ id: r.id, url: r.url, caption: r.caption ?? "" })));
        setEvents(
          (ev ?? []).map((r) => ({
            id: r.id,
            event_date: r.event_date,
            event_time: r.event_time ?? "",
            opponent: r.opponent ?? "",
            location: r.location ?? "",
            is_mayb: r.is_mayb,
          })),
        );
        if (c) {
          setContact({
            athlete_email: c.athlete_email ?? "",
            athlete_phone: c.athlete_phone ?? "",
            guardian_name: c.guardian_name ?? "",
            guardian_email: c.guardian_email ?? "",
            guardian_phone: c.guardian_phone ?? "",
            club_coach_name: c.club_coach_name ?? "",
            club_coach_phone: c.club_coach_phone ?? "",
          });
        }
      }
      setLoading(false);
    })();
  }, [user]);

  function update<K extends keyof AthleteForm>(k: K, v: AthleteForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      if (!e[k as string]) return e;
      const next = { ...e };
      delete next[k as string];
      return next;
    });
  }

  function updateContact<K extends keyof ContactForm>(k: K, v: string) {
    setContact((c) => ({ ...c, [k]: v }));
    setErrors((e) => {
      const key = `contact.${k}`;
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  async function uploadToStorage(file: File, prefix: string) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user!.id}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from("athlete-media").upload(path, file, {
      upsert: true,
    });
    if (error) throw error;
    const { data: signed } = await supabase.storage
      .from("athlete-media")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl ?? null;
  }

  async function uploadPhoto(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 8 * 1024 * 1024) return toast.error("Images must be under 8 MB");
    setUploading(true);
    try {
      const url = await uploadToStorage(file, "profile");
      if (url) update("profile_photo_url", url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function uploadActionPhotos(files: FileList) {
    if (!user) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return toast.error(`You can upload up to ${MAX_PHOTOS} action photos`);
    const chosen = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Only ${remaining} more photo${remaining === 1 ? "" : "s"} can be added`);
    }
    setUploadingPhotos(true);
    try {
      for (const file of chosen) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} is over 8 MB`);
          continue;
        }
        const url = await uploadToStorage(file, "action");
        if (url) setPhotos((p) => [...p, { url, caption: "" }]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingPhotos(false);
    }
  }

  function validate(): boolean {
    const next: FieldErrors = {
      ...collectErrors(athleteSchema.safeParse(form)),
      ...collectErrors(contactSchema.safeParse(contact), "contact."),
    };

    videos.forEach((v, i) => {
      if (v.url.trim() && !isValidHttpUrl(v.url)) {
        next[`video.${i}`] = "Enter a full link starting with https://";
      }
    });

    events.forEach((ev, i) => {
      if (!ev.event_date && (ev.opponent || ev.location || ev.event_time)) {
        next[`event.${i}`] = "Add a date for this event";
      }
    });

    if (
      form.is_published &&
      isUnder18(form.date_of_birth || null) &&
      !(form.guardian_consent_name.trim() && form.guardian_consent_email.trim())
    ) {
      next.guardian_consent_name = "A parent or guardian is required to publish a profile for a minor";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Please fix the highlighted fields");
      return false;
    }
    return true;
  }

  async function save() {
    if (!user) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const zip = form.zip_code.trim();
      let coords: { latitude: number; longitude: number } | null = null;
      if (zip) {
        try {
          coords = await geocode({ data: { zip } });
        } catch {
          coords = null;
        }
        if (!coords) toast.warning("We couldn't locate that ZIP code — distance search may not find you.");
      }

      const consentName = form.guardian_consent_name.trim();
      const consentEmail = form.guardian_consent_email.trim();
      const hasConsent = !!(consentName && consentEmail);

      const payload = {
        user_id: form.owner_user_id ?? user.id,
        full_name: form.full_name.trim(),
        hometown: form.hometown.trim() || null,
        state: form.state.trim().toUpperCase() || null,
        high_school: form.high_school.trim() || null,
        grad_year: form.grad_year ? parseInt(form.grad_year) : null,
        sport_gender: form.sport_gender || null,
        position: form.position.trim() || null,
        height_inches: form.height_inches ? parseInt(form.height_inches) : null,
        weight_lbs: form.weight_lbs ? parseInt(form.weight_lbs) : null,
        jersey_number: form.jersey_number.trim() || null,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        sat_score: form.sat_score ? parseInt(form.sat_score) : null,
        act_score: form.act_score ? parseInt(form.act_score) : null,
        intended_major: form.intended_major.trim() || null,
        instagram_handle: form.instagram_handle.trim() || null,
        tiktok_handle: form.tiktok_handle.trim() || null,
        bio: form.bio.trim() || null,
        profile_photo_url: form.profile_photo_url || null,
        zip_code: zip || null,
        ncaa_id: form.ncaa_id.trim() || null,
        date_of_birth: form.date_of_birth || null,
        guardian_consent_name: consentName || null,
        guardian_consent_email: consentEmail || null,
        guardian_consent_at: hasConsent
          ? (form.guardian_consent_at ?? new Date().toISOString())
          : null,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
        ...(zip ? {} : { latitude: null, longitude: null }),
        is_published: form.is_published,
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

      // Contact details (private — coaches and admins only)
      const contactPayload = {
        athlete_id: athleteId!,
        athlete_email: contact.athlete_email.trim() || null,
        athlete_phone: contact.athlete_phone.trim() || null,
        guardian_name: contact.guardian_name.trim() || null,
        guardian_email: contact.guardian_email.trim() || null,
        guardian_phone: contact.guardian_phone.trim() || null,
        club_coach_name: contact.club_coach_name.trim() || null,
        club_coach_phone: contact.club_coach_phone.trim() || null,
      };
      {
        const { error } = await supabase
          .from("athlete_contacts")
          .upsert(contactPayload, { onConflict: "athlete_id" });
        if (error) throw error;
      }

      // Videos: replace-all strategy
      await supabase.from("athlete_videos").delete().eq("athlete_id", athleteId);
      const cleanVideos = videos.filter((v) => v.url.trim());
      if (cleanVideos.length > 0) {
        const { error } = await supabase.from("athlete_videos").insert(
          cleanVideos.map((v) => ({
            athlete_id: athleteId!,
            url: v.url.trim(),
            title: v.title.trim() || null,
          })),
        );
        if (error) throw error;
      }

      // Action photos
      await supabase.from("athlete_photos").delete().eq("athlete_id", athleteId);
      const cleanPhotos = photos.filter((p) => p.url.trim()).slice(0, MAX_PHOTOS);
      if (cleanPhotos.length > 0) {
        const { error } = await supabase.from("athlete_photos").insert(
          cleanPhotos.map((p) => ({
            athlete_id: athleteId!,
            url: p.url,
            caption: p.caption.trim() || null,
          })),
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
            event_time: e.event_time.trim() || null,
            opponent: e.opponent.trim() || null,
            location: e.location.trim() || null,
            is_mayb: e.is_mayb,
          })),
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

  if (authLoading || loading) return <FormSkeleton />;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Your athlete profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The more you fill out, the more coaches can find you.
      </p>

      {/* Basics */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <h2 className="font-display text-xl font-bold">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.full_name}>
            <Input
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              maxLength={100}
              autoComplete="name"
            />
          </Field>
          <Field label="Profile photo">
            <div className="flex items-center gap-3">
              {form.profile_photo_url && (
                <img
                  src={form.profile_photo_url}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                className="min-w-0"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                }}
                disabled={uploading}
              />
            </div>
          </Field>
          <Field label="Hometown" error={errors.hometown}>
            <Input value={form.hometown} onChange={(e) => update("hometown", e.target.value)} maxLength={100} />
          </Field>
          <Field label="State" error={errors.state}>
            <Input
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              maxLength={2}
              placeholder="KS"
            />
          </Field>
          <Field
            label="ZIP code"
            error={errors.zip_code}
            hint="Used so coaches can find players within driving distance."
          >
            <Input
              value={form.zip_code}
              onChange={(e) => update("zip_code", e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={5}
              inputMode="numeric"
              placeholder="67207"
              autoComplete="postal-code"
            />
          </Field>

          <Field label="High school" error={errors.high_school}>
            <Input value={form.high_school} onChange={(e) => update("high_school", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Grad year" error={errors.grad_year}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.grad_year}
              onChange={(e) => update("grad_year", e.target.value)}
              placeholder="2027"
            />
          </Field>
          <Field label="Boys / girls basketball" error={errors.sport_gender}>
            <Select
              value={form.sport_gender}
              onValueChange={(v) => update("sport_gender", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mens">Boys / men's basketball</SelectItem>
                <SelectItem value="womens">Girls / women's basketball</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Used to show you the correct NCAA recruiting calendar — the dates differ between
              men's and women's basketball.
            </p>
          </Field>
          <Field label="Position" error={errors.position}>
            <Input
              value={form.position}
              onChange={(e) => update("position", e.target.value)}
              placeholder="PG / SG / SF / PF / C"
              maxLength={20}
            />
          </Field>
          <Field label="Height (inches)" error={errors.height_inches}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.height_inches}
              onChange={(e) => update("height_inches", e.target.value)}
              placeholder="72"
            />
          </Field>
          <Field label="Weight (lbs)" error={errors.weight_lbs}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.weight_lbs}
              onChange={(e) => update("weight_lbs", e.target.value)}
            />
          </Field>
          <Field label="Jersey #" error={errors.jersey_number}>
            <Input value={form.jersey_number} onChange={(e) => update("jersey_number", e.target.value)} maxLength={5} />
          </Field>
        </div>
        <Field label="Bio" error={errors.bio}>
          <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} maxLength={1000} rows={3} />
          <span className="mt-1 block text-xs text-muted-foreground">{form.bio.length}/1000</span>
        </Field>
      </Card>

      {/* Contact — coaches only */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="font-display text-xl font-bold">Contact information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared only with approved college coaches and admins. Never shown on your public profile.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Athlete email" error={errors["contact.athlete_email"]}>
            <Input
              type="email"
              inputMode="email"
              value={contact.athlete_email}
              onChange={(e) => updateContact("athlete_email", e.target.value)}
            />
          </Field>
          <Field label="Athlete phone" error={errors["contact.athlete_phone"]}>
            <Input
              type="tel"
              inputMode="tel"
              value={contact.athlete_phone}
              onChange={(e) => updateContact("athlete_phone", e.target.value)}
            />
          </Field>
          <Field label="Parent / guardian name" error={errors["contact.guardian_name"]}>
            <Input
              value={contact.guardian_name}
              onChange={(e) => updateContact("guardian_name", e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Parent / guardian email" error={errors["contact.guardian_email"]}>
            <Input
              type="email"
              inputMode="email"
              value={contact.guardian_email}
              onChange={(e) => updateContact("guardian_email", e.target.value)}
            />
          </Field>
          <Field label="Parent / guardian phone" error={errors["contact.guardian_phone"]}>
            <Input
              type="tel"
              inputMode="tel"
              value={contact.guardian_phone}
              onChange={(e) => updateContact("guardian_phone", e.target.value)}
            />
          </Field>
          <Field label="Club / HS coach name" error={errors["contact.club_coach_name"]}>
            <Input
              value={contact.club_coach_name}
              onChange={(e) => updateContact("club_coach_name", e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="Club / HS coach phone" error={errors["contact.club_coach_phone"]}>
            <Input
              type="tel"
              inputMode="tel"
              value={contact.club_coach_phone}
              onChange={(e) => updateContact("club_coach_phone", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Visibility */}
      <Card className="mt-6 space-y-3 p-4 sm:p-6">
        <h2 className="font-display text-xl font-bold">Profile visibility</h2>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
            checked={form.is_published}
            onChange={(e) => update("is_published", e.target.checked)}
          />
          <span>
            <span className="font-semibold">Publish this profile publicly</span>
            <span className="block text-muted-foreground">
              Anyone with the link can view your profile, highlights and schedule — great for sharing with college
              coaches on social media. Leave off to keep the profile visible only to verified coaches and admins.
            </span>
          </span>
        </label>
        {form.id && form.is_published && (
          <p className="break-all text-xs text-muted-foreground">
            Public link: <span className="text-primary">/a/{form.id}</span>
          </p>
        )}
      </Card>

      {/* Target schools */}
      <Card className="mt-6 space-y-3 p-4 sm:p-6">
        <h2 className="font-display text-xl font-bold">Schools you're interested in</h2>
        <p className="text-sm text-muted-foreground">
          Pick up to {MAX_COLLEGE_INTERESTS} programs you'd love to play for. When a coach from one of those schools is
          registered here, they're notified that you're interested — one of the fastest ways to get seen.
        </p>
        <Button asChild variant="secondary">
          <Link to="/colleges">
            <GraduationCap className="mr-1.5 h-4 w-4" />
            Pick my target schools
          </Link>
        </Button>
      </Card>


      {/* Eligibility & consent */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <h2 className="font-display text-xl font-bold">Eligibility &amp; consent</h2>
        <p className="text-sm text-muted-foreground">
          Your NCAA Eligibility Center ID and date of birth help coaches confirm your recruiting class. Athletes under
          18 need a parent or guardian on record before the profile can be published.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="NCAA Eligibility Center ID" error={errors.ncaa_id}>
            <Input
              value={form.ncaa_id}
              onChange={(e) => update("ncaa_id", e.target.value)}
              placeholder="2411234567"
            />
          </Field>
          <Field label="Date of birth" error={errors.date_of_birth}>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => update("date_of_birth", e.target.value)}
            />
          </Field>
          <Field label="Parent / guardian name" error={errors.guardian_consent_name}>
            <Input
              value={form.guardian_consent_name}
              onChange={(e) => update("guardian_consent_name", e.target.value)}
            />
          </Field>
          <Field label="Parent / guardian email" error={errors.guardian_consent_email}>
            <Input
              type="email"
              value={form.guardian_consent_email}
              onChange={(e) => update("guardian_consent_email", e.target.value)}
            />
          </Field>
        </div>
        {form.guardian_consent_at && (
          <p className="text-xs text-muted-foreground">
            Consent recorded {new Date(form.guardian_consent_at).toLocaleDateString()}.
          </p>
        )}
      </Card>


      {/* Academics */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <h2 className="font-display text-xl font-bold">Academics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GPA" error={errors.gpa}>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.gpa}
              onChange={(e) => update("gpa", e.target.value)}
              placeholder="3.75"
            />
          </Field>
          <Field label="Intended major" error={errors.intended_major}>
            <Input
              value={form.intended_major}
              onChange={(e) => update("intended_major", e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="SAT" error={errors.sat_score}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.sat_score}
              onChange={(e) => update("sat_score", e.target.value)}
            />
          </Field>
          <Field label="ACT" error={errors.act_score}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.act_score}
              onChange={(e) => update("act_score", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Socials */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <h2 className="font-display text-xl font-bold">Socials</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram handle" error={errors.instagram_handle}>
            <Input
              value={form.instagram_handle}
              onChange={(e) => update("instagram_handle", e.target.value)}
              placeholder="@yourname"
              maxLength={50}
            />
          </Field>
          <Field label="TikTok handle" error={errors.tiktok_handle}>
            <Input
              value={form.tiktok_handle}
              onChange={(e) => update("tiktok_handle", e.target.value)}
              placeholder="@yourname"
              maxLength={50}
            />
          </Field>
        </div>
      </Card>

      {/* Action photos */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold">Action photos</h2>
            <p className="text-sm text-muted-foreground">
              Up to {MAX_PHOTOS} game shots ({photos.length}/{MAX_PHOTOS} used).
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={uploadingPhotos || photos.length >= MAX_PHOTOS}
            onClick={() => document.getElementById("action-photo-input")?.click()}
          >
            <Upload className="mr-1 h-4 w-4" /> {uploadingPhotos ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <input
          id="action-photo-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadActionPhotos(e.target.files);
            e.target.value = "";
          }}
        />
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No action photos yet. Coaches love seeing you in game situations.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <div key={i} className="space-y-2">
                <div className="relative">
                  <img src={p.url} alt={p.caption || `Action photo ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setPhotos((all) => all.filter((_, idx) => idx !== i))}
                    aria-label="Remove photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Caption"
                  value={p.caption}
                  maxLength={120}
                  onChange={(e) =>
                    setPhotos((all) => all.map((row, idx) => (idx === i ? { ...row, caption: e.target.value } : row)))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Videos */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="min-w-0 font-display text-xl font-bold">Highlight videos</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={videos.length >= 8}
            onClick={() => setVideos((v) => [...v, { url: "", title: "" }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste links from Hudl, YouTube (including Shorts), Vimeo, TikTok or Instagram — they play right on your
          profile.
        </p>
        {videos.length === 0 && (
          <p className="text-sm text-muted-foreground">No videos yet.</p>

        )}
        {videos.map((v, i) => (
          <div key={i} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder="https://..."
                inputMode="url"
                value={v.url}
                aria-invalid={!!errors[`video.${i}`]}
                onChange={(e) => {
                  setVideos((vs) => vs.map((row, idx) => (idx === i ? { ...row, url: e.target.value } : row)));
                  setErrors((er) => {
                    if (!er[`video.${i}`]) return er;
                    const next = { ...er };
                    delete next[`video.${i}`];
                    return next;
                  });
                }}
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
                className="justify-self-end"
                aria-label="Remove video"
                onClick={() => setVideos((vs) => vs.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {errors[`video.${i}`] && <p className="text-xs text-destructive">{errors[`video.${i}`]}</p>}
          </div>
        ))}
      </Card>

      {/* Events */}
      <Card className="mt-6 space-y-4 p-4 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="min-w-0 font-display text-xl font-bold">Upcoming games / events</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() =>
              setEvents((e) => [
                ...e,
                { event_date: "", event_time: "", opponent: "", location: "", is_mayb: false },
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
                aria-invalid={!!errors[`event.${i}`]}
                onChange={(e) => {
                  setEvents((all) => all.map((r, idx) => (idx === i ? { ...r, event_date: e.target.value } : r)));
                  setErrors((er) => {
                    if (!er[`event.${i}`]) return er;
                    const next = { ...er };
                    delete next[`event.${i}`];
                    return next;
                  });
                }}
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
            {errors[`event.${i}`] && <p className="mt-2 text-xs text-destructive">{errors[`event.${i}`]}</p>}
            <div className="mt-2 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
                  checked={ev.is_mayb}
                  onChange={(e) =>
                    setEvents((all) => all.map((r, idx) => (idx === i ? { ...r, is_mayb: e.target.checked } : r)))
                  }
                />
                Summit Hoops event
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove event"
                onClick={() => setEvents((all) => all.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate({ to: "/dashboard" })}>
          Cancel
        </Button>
        <Button className="w-full sm:w-auto" onClick={save} disabled={saving || !form.full_name.trim()}>
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
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <Label className="block font-normal">
      <span className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </Label>
  );
}

