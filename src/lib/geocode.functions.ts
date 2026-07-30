import { createServerFn } from "@tanstack/react-start";

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
