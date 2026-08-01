/**
 * NCAA compliance helpers.
 *
 * These are informational summaries of publicly published NCAA recruiting
 * calendars for basketball. They are intentionally conservative and are NOT
 * legal advice — every surface that renders them also renders a disclaimer and
 * a link to the NCAA Eligibility Center.
 */

export const NCAA_ELIGIBILITY_CENTER_URL = "https://web3.ncaa.org/ecwr3/";
export const NCAA_RECRUITING_CALENDAR_URL =
  "https://www.ncaa.org/sports/2013/11/14/recruiting-calendars.aspx";

/** Primary published sources behind the summaries in this file. */
export const NCAA_SOURCES: { label: string; url: string }[] = [
  {
    label: "D1 men's basketball recruiting calendar (NCAA)",
    url: "https://ncaaorg.s3.amazonaws.com/compliance/recruiting/calendar/2026-27/2026-27D1Rec_MBBRecruitingCalendar.pdf",
  },
  {
    label: "D1 women's basketball recruiting calendar (NCAA)",
    url: "https://ncaaorg.s3.amazonaws.com/compliance/recruiting/calendar/2026-27/2026-27D1Rec_WBBRecruitingCalendar.pdf",
  },
  {
    label: "D2 off-campus recruiting guide (NCAA)",
    url: "https://ncaaorg.s3.amazonaws.com/compliance/recruiting/calendar/2026-27/2026-27D2REC_RecGuide.pdf",
  },
  {
    label: "D1 contacts & evaluations basics (NCAA)",
    url: "https://ncaaorg.s3.amazonaws.com/compliance/d1/D1Comp_ContactsEvals.pdf",
  },
  { label: "NAIA recruiting rules", url: "https://www.playnaia.org/" },
  { label: "NJCAA (junior college) recruiting", url: "https://www.njcaa.org/" },
];


export type Division = "D1" | "D2" | "D3" | "NAIA" | "JUCO";

export const DIVISIONS: Division[] = ["D1", "D2", "D3", "NAIA", "JUCO"];

/** Age in whole years on a given date (defaults to today). */
export function ageFromDob(dob: string | null | undefined, on = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  let age = on.getFullYear() - d.getFullYear();
  const m = on.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < d.getDate())) age--;
  return age;
}

export function isUnder13(dob: string | null | undefined): boolean {
  const age = ageFromDob(dob);
  return age != null && age < 13;
}

export function isUnder18(dob: string | null | undefined): boolean {
  const age = ageFromDob(dob);
  return age != null && age < 18;
}

/**
 * Date a college coach in a given division may first initiate recruiting
 * contact with a prospect graduating in `gradYear`.
 *
 * Basketball: D1/D2 contact opens June 15 after sophomore year.
 * D3 / NAIA / JUCO have no equivalent date-based restriction.
 */
export function contactOpensOn(gradYear: number | null, division: Division): Date | null {
  if (!gradYear) return null;
  if (division === "D3" || division === "NAIA" || division === "JUCO") return null;
  // Sophomore year ends in the spring of (gradYear - 2).
  return new Date(Date.UTC(gradYear - 2, 5, 15));
}

export type ContactWindow = {
  division: Division;
  opensOn: Date | null;
  open: boolean;
  summary: string;
};

export function contactWindows(gradYear: number | null, now = new Date()): ContactWindow[] {
  return DIVISIONS.map((division) => {
    const opensOn = contactOpensOn(gradYear, division);
    if (!opensOn) {
      return {
        division,
        opensOn: null,
        open: true,
        summary:
          division === "D3"
            ? "No date-based contact restriction — coaches may contact you at any time."
            : "Recruiting contact is not restricted by a national calendar date.",
      };
    }
    const open = now >= opensOn;
    const when = opensOn.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    return {
      division,
      opensOn,
      open,
      summary: open
        ? `Coaches have been able to contact you directly since ${when}.`
        : `Coaches may begin contacting you on ${when}. Until then you can still reach out to them.`,
    };
  });
}

/**
 * Athlete-initiated outreach is allowed at any time — this is the core reason
 * the outreach feature exists, so we surface it wherever contact rules appear.
 */
export const ATHLETE_OUTREACH_NOTE =
  "You may contact college coaches at any age or grade. The NCAA calendar limits when coaches may contact you — not when you may contact them.";

export type ComplianceCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  blocking: boolean;
};

export function complianceChecks(a: {
  date_of_birth?: string | null;
  ncaa_id?: string | null;
  guardian_consent_at?: string | null;
  grad_year?: number | null;
  is_published?: boolean | null;
  guardianCount?: number;
}): ComplianceCheck[] {
  const under13 = isUnder13(a.date_of_birth);
  const under18 = isUnder18(a.date_of_birth);
  const checks: ComplianceCheck[] = [
    {
      key: "dob",
      label: "Date of birth on file",
      ok: !!a.date_of_birth,
      detail: "Used to apply age-appropriate privacy rules (COPPA) and eligibility timelines.",
      blocking: false,
    },
    {
      key: "consent",
      label: under13 ? "Guardian consent (required under 13)" : "Guardian consent recorded",
      ok: !!a.guardian_consent_at,
      detail: under13
        ? "Athletes under 13 cannot publish a public profile until a parent or guardian consents."
        : "Recommended for every athlete under 18.",
      blocking: under13,
    },
    {
      key: "guardian",
      label: "Parent/guardian linked to this account",
      ok: (a.guardianCount ?? 0) > 0,
      detail: under18
        ? "Invite a parent so they can manage the profile and see coach interest."
        : "Optional once you're 18.",
      blocking: false,
    },
    {
      key: "ncaa",
      label: "NCAA Eligibility Center ID",
      ok: !!a.ncaa_id,
      detail:
        "Required before you can be recruited or receive an official visit at a Division I or II school. Register in your sophomore/junior year.",
      blocking: false,
    },
  ];
  return checks;
}
