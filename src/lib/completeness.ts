/** Profile completeness scoring + nudges (shared by dashboard and editor). */

export type CompletenessInput = {
  full_name?: string | null;
  high_school?: string | null;
  grad_year?: number | null;
  position?: string | null;
  height_inches?: number | null;
  weight_lbs?: number | null;
  gpa?: number | null;
  zip_code?: string | null;
  bio?: string | null;
  profile_photo_url?: string | null;
  intended_major?: string | null;
  ncaa_id?: string | null;
  is_published?: boolean | null;
  videoCount?: number;
  photoCount?: number;
  eventCount?: number;
  hasContact?: boolean;
};

export type CompletenessItem = {
  key: string;
  label: string;
  weight: number;
  done: boolean;
  hint: string;
  /** Where the athlete should go to fix it. */
  to: string;
};

export function completenessItems(a: CompletenessInput): CompletenessItem[] {
  const edit = "/profile/edit";
  return [
    {
      key: "name",
      label: "Name",
      weight: 5,
      done: !!a.full_name,
      hint: "Coaches search by name.",
      to: edit,
    },
    {
      key: "photo",
      label: "Profile photo",
      weight: 10,
      done: !!a.profile_photo_url,
      hint: "Profiles with a headshot get opened far more often.",
      to: edit,
    },
    {
      key: "school",
      label: "High school",
      weight: 5,
      done: !!a.high_school,
      hint: "Coaches filter by school and region.",
      to: edit,
    },
    {
      key: "grad",
      label: "Grad year",
      weight: 10,
      done: !!a.grad_year,
      hint: "Without a class year you're invisible to class-based searches.",
      to: edit,
    },
    {
      key: "position",
      label: "Position",
      weight: 10,
      done: !!a.position,
      hint: "Position is the single most used coach filter.",
      to: edit,
    },
    {
      key: "measurements",
      label: "Height & weight",
      weight: 10,
      done: !!a.height_inches && !!a.weight_lbs,
      hint: "Coaches screen by size before they watch tape.",
      to: edit,
    },
    {
      key: "gpa",
      label: "GPA",
      weight: 10,
      done: a.gpa != null,
      hint: "Academics decide who is recruitable at many programs.",
      to: edit,
    },
    {
      key: "zip",
      label: "ZIP code",
      weight: 10,
      done: !!a.zip_code,
      hint: "Required to appear in 'within X miles' searches.",
      to: edit,
    },
    {
      key: "video",
      label: "Highlight video",
      weight: 15,
      done: (a.videoCount ?? 0) > 0,
      hint: "No tape, no evaluation. Add at least one Hudl/YouTube link.",
      to: edit,
    },
    {
      key: "photos",
      label: "Action photos",
      weight: 3,
      done: (a.photoCount ?? 0) > 0,
      hint: "Two or three game shots make the profile feel real.",
      to: edit,
    },
    {
      key: "events",
      label: "Upcoming games",
      weight: 7,
      done: (a.eventCount ?? 0) > 0,
      hint: "Coaches use your schedule to plan who they go watch.",
      to: edit,
    },
    {
      key: "bio",
      label: "Bio",
      weight: 3,
      done: !!a.bio,
      hint: "A short pitch in your own words.",
      to: edit,
    },
    {
      key: "contact",
      label: "Contact info",
      weight: 5,
      done: !!a.hasContact,
      hint: "Approved coaches can only reach out if there's a contact on file.",
      to: edit,
    },
    {
      key: "published",
      label: "Profile published",
      weight: 7,
      done: !!a.is_published,
      hint: "Publish so your link works publicly and can be shared.",
      to: edit,
    },
  ];
}

export function completenessScore(a: CompletenessInput): {
  score: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
} {
  const items = completenessItems(a);
  const total = items.reduce((s, i) => s + i.weight, 0);
  const earned = items.reduce((s, i) => s + (i.done ? i.weight : 0), 0);
  const missing = items
    .filter((i) => !i.done)
    .sort((x, y) => y.weight - x.weight);
  return { score: Math.round((earned / total) * 100), items, missing };
}

export function scoreTone(score: number): { label: string; className: string } {
  if (score >= 90) return { label: "Recruit-ready", className: "text-primary" };
  if (score >= 65) return { label: "Almost there", className: "text-primary" };
  if (score >= 35) return { label: "Needs work", className: "text-accent" };
  return { label: "Just getting started", className: "text-destructive" };
}
