/**
 * Basketball position normalization + recruiting-style position groups.
 *
 * Athletes type their position freely ("Point Guard", "PG/SG", "guard", "wing"),
 * so search has to normalize before matching.
 */

export type PositionCode = "PG" | "SG" | "SF" | "PF" | "C";

export const POSITION_LABELS: Record<PositionCode, string> = {
  PG: "Point guard",
  SG: "Shooting guard",
  SF: "Small forward",
  PF: "Power forward",
  C: "Center",
};

export type PositionGroupId = "perimeter" | "guards" | "wings" | "bigs";

export const POSITION_GROUPS: {
  id: PositionGroupId;
  label: string;
  codes: PositionCode[];
}[] = [
  { id: "perimeter", label: "Perimeter (PG/SG/SF)", codes: ["PG", "SG", "SF"] },
  { id: "guards", label: "Guards (PG/SG)", codes: ["PG", "SG"] },
  { id: "wings", label: "Wings (SG/SF)", codes: ["SG", "SF"] },
  { id: "bigs", label: "Bigs (PF/C)", codes: ["PF", "C"] },
];

/** Longest-first so "power forward" wins over "forward". */
const PATTERNS: { re: RegExp; codes: PositionCode[] }[] = [
  { re: /\bpoint\s*guard\b|\bpg\b|\bcombo\s*guard\b|\bfloor\s*general\b|\b1\b/, codes: ["PG"] },
  { re: /\bshooting\s*guard\b|\bsg\b|\boff\s*guard\b|\b2\b/, codes: ["SG"] },
  { re: /\bsmall\s*forward\b|\bsf\b|\bwing\b|\b3\b/, codes: ["SF"] },
  { re: /\bpower\s*forward\b|\bpf\b|\bstretch\s*four\b|\b4\b/, codes: ["PF"] },
  { re: /\bcenter\b|\bcentre\b|\bc\b|\bpost\b|\bbig\b|\b5\b/, codes: ["C"] },
  { re: /\bcombo\b/, codes: ["PG", "SG"] },
  { re: /\bguard\b|\bg\b/, codes: ["PG", "SG"] },
  { re: /\bforward\b|\bf\b/, codes: ["SF", "PF"] },
];

/** Parses a free-text position into the set of position codes it covers. */
export function parsePositions(raw: string | null | undefined): PositionCode[] {
  if (!raw) return [];
  const text = ` ${raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  const found = new Set<PositionCode>();
  for (const { re, codes } of PATTERNS) {
    if (re.test(text)) codes.forEach((c) => found.add(c));
  }
  return Array.from(found);
}

/** True when an athlete's free-text position overlaps any wanted code. */
export function matchesPositions(
  raw: string | null | undefined,
  wanted: PositionCode[],
): boolean {
  if (wanted.length === 0) return true;
  const codes = parsePositions(raw);
  if (codes.length === 0) return false;
  return codes.some((c) => wanted.includes(c));
}

export function codesForGroup(id: PositionGroupId): PositionCode[] {
  return POSITION_GROUPS.find((g) => g.id === id)?.codes ?? [];
}
