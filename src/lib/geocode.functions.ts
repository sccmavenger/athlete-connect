import { createServerFn } from "@tanstack/react-start";
import { resolveState } from "@/lib/us-states";

type ZipResult = { zip: string; latitude: number; longitude: number; place: string } | null;

/** Geocodes a 5-digit US ZIP code to a lat/lng centroid (free, no API key). */
export const geocodeZip = createServerFn({ method: "GET" })
  .inputValidator((input: { zip: string }) => {
    const zip = String(input?.zip ?? "").trim();
    if (!/^\d{5}$/.test(zip)) throw new Error("Enter a 5-digit ZIP code");
    return { zip };
  })
  .handler(async ({ data }): Promise<ZipResult> => {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${data.zip}`);
      if (!res.ok) return null;
      const json: any = await res.json();
      const place = json?.places?.[0];
      if (!place) return null;
      const latitude = Number.parseFloat(place.latitude);
      const longitude = Number.parseFloat(place.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        zip: data.zip,
        latitude,
        longitude,
        place: `${place["place name"]}, ${place["state abbreviation"]}`,
      };
    } catch {
      return null;
    }
  });

export type PlaceResult =
  | { kind: "state"; state: string; label: string }
  | { kind: "point"; latitude: number; longitude: number; label: string }
  | { kind: "none"; label: string };

/**
 * Resolves whatever a coach types into either a state filter or a map point:
 * "Virginia" / "VA" -> state, "San Francisco, CA" / "Bay Area" / "63103" -> point.
 */
export const geocodePlace = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) => {
    const query = String(input?.query ?? "").trim().slice(0, 120);
    if (query.length < 2) throw new Error("Enter a city, state or ZIP code");
    return { query };
  })
  .handler(async ({ data }): Promise<PlaceResult> => {
    const { query } = data;

    const state = resolveState(query);
    if (state) return { kind: "state", state: state.code, label: state.name };

    if (/^\d{5}$/.test(query)) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${query}`);
        if (res.ok) {
          const json: any = await res.json();
          const p = json?.places?.[0];
          const latitude = Number.parseFloat(p?.latitude);
          const longitude = Number.parseFloat(p?.longitude);
          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            return {
              kind: "point",
              latitude,
              longitude,
              label: `${p["place name"]}, ${p["state abbreviation"]} ${query}`,
            };
          }
        }
      } catch {
        /* fall through to the general geocoder */
      }
    }

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=" +
        encodeURIComponent(query);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "SummitHoopsRecruitingHub/1.0 (coach athlete search)",
          Accept: "application/json",
        },
      });
      if (!res.ok) return { kind: "none", label: query };
      const json: any = await res.json();
      const hit = Array.isArray(json) ? json[0] : null;
      if (!hit) return { kind: "none", label: query };
      const latitude = Number.parseFloat(hit.lat);
      const longitude = Number.parseFloat(hit.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return { kind: "none", label: query };
      }
      return {
        kind: "point",
        latitude,
        longitude,
        label: String(hit.display_name ?? query).split(",").slice(0, 3).join(",").trim(),
      };
    } catch {
      return { kind: "none", label: query };
    }
  });
