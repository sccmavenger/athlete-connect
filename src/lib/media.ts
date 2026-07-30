export type VideoPlatform = "youtube" | "hudl" | "vimeo" | "tiktok" | "instagram" | "twitter" | "other";

export type ParsedVideo = {
  platform: VideoPlatform;
  label: string;
  /** iframe src when the platform supports embedding, otherwise null */
  embedUrl: string | null;
  url: string;
  /** aspect ratio class for the embed container */
  vertical: boolean;
};

function youtubeId(u: URL): string | null {
  if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
  if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] ?? null;
  if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
  return u.searchParams.get("v");
}

export function parseVideoUrl(raw: string): ParsedVideo {
  const url = raw.trim();
  const fallback: ParsedVideo = { platform: "other", label: "Video", embedUrl: null, url, vertical: false };
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return fallback;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (host.includes("youtube.com") || host === "youtu.be") {
    const id = youtubeId(u);
    return {
      platform: "youtube",
      label: "YouTube",
      embedUrl: id ? `https://www.youtube.com/embed/${id}` : null,
      url,
      vertical: u.pathname.startsWith("/shorts/"),
    };
  }

  if (host.includes("vimeo.com")) {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return {
      platform: "vimeo",
      label: "Vimeo",
      embedUrl: id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null,
      url,
      vertical: false,
    };
  }

  if (host.includes("hudl.com")) {
    // Hudl video pages support /embed/video/<ids...>
    const m = u.pathname.match(/\/video\/(.+)$/);
    return {
      platform: "hudl",
      label: "Hudl",
      embedUrl: m ? `https://www.hudl.com/embed/video/${m[1]}` : null,
      url,
      vertical: false,
    };
  }

  if (host.includes("tiktok.com")) {
    const m = u.pathname.match(/\/video\/(\d+)/);
    return {
      platform: "tiktok",
      label: "TikTok",
      embedUrl: m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null,
      url,
      vertical: true,
    };
  }

  if (host.includes("instagram.com")) {
    const m = u.pathname.match(/\/(reel|p|tv)\/([^/]+)/);
    return {
      platform: "instagram",
      label: "Instagram",
      embedUrl: m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null,
      url,
      vertical: true,
    };
  }

  if (host.includes("twitter.com") || host === "x.com") {
    return { platform: "twitter", label: "X", embedUrl: null, url, vertical: false };
  }

  return { ...fallback, label: host };
}
