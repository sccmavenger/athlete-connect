import { parseVideoUrl } from "@/lib/media";
import { ExternalLink } from "lucide-react";

export function VideoEmbed({ url, title }: { url: string; title?: string | null }) {
  const v = parseVideoUrl(url);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {v.embedUrl ? (
        <div className={v.vertical ? "mx-auto aspect-[9/16] max-w-sm" : "aspect-video w-full"}>
          <iframe
            src={v.embedUrl}
            title={title || `${v.label} highlight`}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={v.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 p-4 text-sm hover:text-primary"
        >
          <span className="truncate">{title || v.label} — open link</span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
      )}
      <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span className="truncate">{title || v.label}</span>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5">{v.label}</span>
      </div>
    </div>
  );
}
