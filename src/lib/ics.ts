/** Minimal RFC 5545 calendar export for athlete game schedules. */

export type IcsEvent = {
  uid: string;
  date: string; // YYYY-MM-DD
  time?: string | null; // free text, e.g. "6:30 PM"
  title: string;
  location?: string | null;
  description?: string | null;
};

function esc(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function stamp(d = new Date()) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Parses "6:30 PM" / "18:30" into { h, m }; falls back to an all-day entry. */
function parseTime(time?: string | null): { h: number; m: number } | null {
  if (!time) return null;
  const t = time.trim().toUpperCase();
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!m) return null;
  let h = Number.parseInt(m[1], 10);
  const min = m[2] ? Number.parseInt(m[2], 10) : 0;
  if (m[3] === "PM" && h < 12) h += 12;
  if (m[3] === "AM" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

export function buildIcs(events: IcsEvent[], calendarName = "Summit Hoops games"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Summit Hoops//Recruiting Hub//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${esc(calendarName)}`,
  ];

  for (const e of events) {
    const [y, mo, d] = e.date.split("-").map((n) => Number.parseInt(n, 10));
    if (!y || !mo || !d) continue;
    const time = parseTime(e.time);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}@summithoops`);
    lines.push(`DTSTAMP:${stamp()}`);
    if (time) {
      const pad = (n: number) => String(n).padStart(2, "0");
      const start = `${y}${pad(mo)}${pad(d)}T${pad(time.h)}${pad(time.m)}00`;
      const endH = (time.h + 2) % 24;
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${y}${pad(mo)}${pad(d)}T${pad(endH)}${pad(time.m)}00`);
    } else {
      const pad = (n: number) => String(n).padStart(2, "0");
      lines.push(`DTSTART;VALUE=DATE:${y}${pad(mo)}${pad(d)}`);
    }
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Very small CSV writer used by the coach pipeline export. */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const cell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => cell(r[c])).join(","))].join("\n");
}
