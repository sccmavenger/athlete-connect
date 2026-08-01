import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { COLLEGE_DOMAINS } from "@/lib/college-domains";

const QuerySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .max(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)
    .optional(),
  size: z.coerce.number().int().min(32).max(256).default(128),
});

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const DOMAIN_BY_NORM: Record<string, string> = Object.fromEntries(
  Object.entries(COLLEGE_DOMAINS).map(([name, domain]) => [norm(name), domain]),
);

function resolveDomain(name?: string, domain?: string): string | null {
  if (domain) return domain;
  if (!name) return null;
  const key = norm(name);
  if (DOMAIN_BY_NORM[key]) return DOMAIN_BY_NORM[key];
  // tolerate small naming differences ("Univ." vs "University", trailing suffixes)
  const candidates = Object.keys(DOMAIN_BY_NORM);
  const hit =
    candidates.find((c) => c === key) ??
    candidates.find((c) => c.startsWith(key) || key.startsWith(c)) ??
    null;
  return hit ? DOMAIN_BY_NORM[hit]! : null;
}

/** Providers tried in order; all are keyless public logo/favicon services. */
function providerUrls(domain: string, size: number): string[] {
  return [
    `https://logo.clearbit.com/${domain}?size=${size}`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?sz=${size}&domain=${domain}`,
  ];
}

// Warm, per-isolate memo so repeat tiles don't re-hit upstream providers.
const memo = new Map<string, { body: ArrayBuffer; type: string }>();

export const Route = createFileRoute("/api/public/college-logo")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success) {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const { name, domain: rawDomain, size } = parsed.data;
        const domain = resolveDomain(name, rawDomain);
        if (!domain) {
          return Response.json({ error: "No logo source for that school" }, { status: 404 });
        }

        const cacheKey = `${domain}:${size}`;
        const cached = memo.get(cacheKey);
        if (cached) {
          return new Response(cached.body, {
            headers: {
              "Content-Type": cached.type,
              "Cache-Control": "public, max-age=604800, s-maxage=2592000",
            },
          });
        }

        for (const candidate of providerUrls(domain, size)) {
          try {
            const res = await fetch(candidate, {
              headers: { Accept: "image/*" },
              redirect: "follow",
            });
            if (!res.ok) continue;
            const type = res.headers.get("content-type") ?? "";
            if (!type.startsWith("image/")) continue;
            const body = await res.arrayBuffer();
            if (body.byteLength < 200) continue; // skip 1px / empty placeholders
            if (memo.size < 500) memo.set(cacheKey, { body, type });
            return new Response(body, {
              headers: {
                "Content-Type": type,
                "Cache-Control": "public, max-age=604800, s-maxage=2592000",
              },
            });
          } catch (err) {
            console.error(`college-logo: provider failed for ${domain}`, err);
          }
        }

        return Response.json({ error: "Logo unavailable", domain }, { status: 404 });
      },
    },
  },
});
