import { COLLEGE_TUPLES } from "./colleges-data";

export const MAX_COLLEGE_INTERESTS = 10;

export type CollegeOption = {
  name: string;
  state: string;
  division: string;
  /** Common/short name (e.g. "LSU") — used for search only. */
  alt?: string;
};

/**
 * Every NCAA D1/D2/D3, NAIA and (Midwest) NJCAA member institution — 1,300+
 * programs nationwide. Athletes can still type any school that isn't listed.
 */
export const COLLEGES: CollegeOption[] = COLLEGE_TUPLES.map(([name, state, division, alt]) => ({
  name,
  state,
  division,
  ...(alt ? { alt } : {}),
}));

export const COLLEGE_DIVISIONS = ["D1", "D2", "D3", "NAIA", "JUCO"] as const;

/** "Louisiana State University" -> "lsu" (skips filler words). */
function acronym(name: string): string {
  const skip = new Set(["of", "at", "the", "and", "in", "for", "a"]);
  return name
    .replace(/[^A-Za-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w && !skip.has(w.toLowerCase()))
    .map((w) => w[0]!.toLowerCase())
    .join("");
}

const INDEX = COLLEGES.map((c) => ({
  c,
  name: c.name.toLowerCase(),
  alt: (c.alt ?? "").toLowerCase(),
  acro: acronym(c.name),
}));

export type CollegeSearchOptions = {
  /** Restrict to a division ("D1" … "JUCO"). Omit or "all" for every level. */
  division?: string;
  /** Restrict to a 2-letter state code. */
  state?: string;
  limit?: number;
};

/**
 * Type-ahead over the national list. Matches full name, common name
 * ("Louisiana Tech"), acronym ("LSU", "UNC") or state code ("LA").
 */
export function searchColleges(query: string, options: CollegeSearchOptions = {}): CollegeOption[] {
  const { division, state, limit = 10 } = options;
  const div = division && division !== "all" ? division : null;
  const st = state ? state.trim().toUpperCase() : null;
  const q = query.trim().toLowerCase();

  const pool = INDEX.filter(
    (e) => (!div || e.c.division === div) && (!st || st.length !== 2 || e.c.state === st),
  );
  if (!q) return pool.slice(0, limit).map((e) => e.c);

  const exact: CollegeOption[] = [];
  const starts: CollegeOption[] = [];
  const contains: CollegeOption[] = [];
  for (const e of pool) {
    if (e.acro === q || e.alt === q || e.name === q) exact.push(e.c);
    else if (e.name.startsWith(q) || e.alt.startsWith(q) || e.acro.startsWith(q)) starts.push(e.c);
    else if (e.name.includes(q) || e.alt.includes(q) || (q.length === 2 && e.c.state.toLowerCase() === q))
      contains.push(e.c);
    if (exact.length + starts.length + contains.length > limit * 6) break;
  }
  return [...exact, ...starts, ...contains].slice(0, limit);
}
