import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { message: `${label} must be ${max} characters or fewer` })
    .optional()
    .or(z.literal(""));

const numberInRange = (min: number, max: number, label: string, allowDecimal = false) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => {
        if (!v) return true;
        const n = allowDecimal ? Number.parseFloat(v) : Number.parseInt(v, 10);
        return Number.isFinite(n) && n >= min && n <= max;
      },
      { message: `${label} must be between ${min} and ${max}` },
    );

export const athleteSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Full name is required" })
    .max(100, { message: "Full name must be 100 characters or fewer" }),
  hometown: optionalText(100, "Hometown"),
  state: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[A-Za-z]{2}$/.test(v), {
      message: "Use a 2-letter state code (e.g. KS)",
    }),
  high_school: optionalText(120, "High school"),
  grad_year: numberInRange(CURRENT_YEAR - 1, CURRENT_YEAR + 8, "Grad year"),
  position: optionalText(20, "Position"),
  height_inches: numberInRange(40, 96, "Height (inches)"),
  weight_lbs: numberInRange(60, 400, "Weight"),
  jersey_number: optionalText(5, "Jersey number"),
  gpa: numberInRange(0, 5, "GPA", true),
  sat_score: numberInRange(400, 1600, "SAT score"),
  act_score: numberInRange(1, 36, "ACT score"),
  intended_major: optionalText(100, "Intended major"),
  instagram_handle: optionalText(50, "Instagram handle"),
  tiktok_handle: optionalText(50, "TikTok handle"),
  bio: optionalText(1000, "Bio"),
});

const phone = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^[0-9()+\-.\s]{7,20}$/.test(v), { message: "Enter a valid phone number" });

const email = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || z.string().email().safeParse(v).success, {
    message: "Enter a valid email address",
  });

export const contactSchema = z.object({
  athlete_email: email,
  athlete_phone: phone,
  guardian_name: optionalText(100, "Guardian name"),
  guardian_email: email,
  guardian_phone: phone,
  club_coach_name: optionalText(100, "Club coach name"),
  club_coach_phone: phone,
});

export function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type FieldErrors = Record<string, string>;

/** Flattens a Zod parse into a { field: message } map. */
export function collectErrors(result: z.SafeParseReturnType<any, any>, prefix = ""): FieldErrors {
  const errors: FieldErrors = {};
  if (result.success) return errors;
  for (const issue of result.error.issues) {
    const key = prefix + String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
