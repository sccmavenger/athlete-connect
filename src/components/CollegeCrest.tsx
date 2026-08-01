import { useState } from "react";

export function collegeLogoUrl(name: string, size = 256) {
  return `/api/public/college-logo?name=${encodeURIComponent(name)}&size=${size}`;
}

export function crestInitials(name: string) {
  const words = name
    .replace(/\b(University|College|of|the|State|at|and)\b/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
  const src = words.length ? words : name.split(/\s+/);
  return src
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * School crest: fetches the real logo through the app's logo microservice and
 * falls back to a monogram crest when no logo is available.
 */
export function CollegeCrest({
  name,
  className = "h-14 w-14",
}: {
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-br from-primary/25 to-secondary font-display text-base font-bold tracking-tight text-primary ${className}`}
      >
        {crestInitials(name)}
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card ${className}`}
    >
      <img
        src={collegeLogoUrl(name)}
        alt={`${name} logo`}
        loading="lazy"
        className="h-full w-full object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
