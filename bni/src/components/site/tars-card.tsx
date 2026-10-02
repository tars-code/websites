import type { ChapterSettings } from "@/lib/types";
import { cn, displayUrl, safeUrl } from "@/lib/utils";

/**
 * Subtle, static attribution for the volunteer who built and maintains the site.
 * Always rendered below chapter content and visually secondary to it.
 */
export function TarsCard({
  attribution,
  className,
  tone = "light",
}: {
  attribution: ChapterSettings["attribution"];
  className?: string;
  tone?: "light" | "muted";
}) {
  if (!attribution.enabled || !attribution.name) return null;
  const url = safeUrl(attribution.url);
  return (
    <aside
      aria-label={`Website by ${attribution.name}`}
      className={cn(
        "rounded-md border border-line px-4 py-3.5",
        tone === "light" ? "bg-surface" : "bg-sand/50",
        className,
      )}
    >
      <p className="text-[0.66rem] font-semibold tracking-[0.14em] text-faint uppercase">
        {attribution.line || "Website & digital solutions"}
      </p>
      <p className="mt-1 text-[0.95rem] font-semibold tracking-tight text-ink">{attribution.name}</p>
      {attribution.services.length > 0 && (
        <p className="mt-0.5 text-[0.8rem] text-muted">{attribution.services.join(" · ")}</p>
      )}
      {(url || attribution.email || attribution.phone) && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.8rem]">
          {url && (
            <a href={url} target="_blank" rel="noopener" className="link-underline text-ink-2">
              {displayUrl(url)}
            </a>
          )}
          {attribution.email && (
            <a href={`mailto:${attribution.email}`} className="link-underline text-ink-2">
              {attribution.email}
            </a>
          )}
          {attribution.phone && <span className="text-ink-2">{attribution.phone}</span>}
        </p>
      )}
    </aside>
  );
}

/** One-line credit for the footer's bottom bar, e.g. "Website & digital solutions by Tars Technology". */
export function TarsCredit({ attribution }: { attribution: ChapterSettings["attribution"] }) {
  if (!attribution.enabled || !attribution.name) return null;
  const url = safeUrl(attribution.url);
  return (
    <p>
      {attribution.line || "Website & digital solutions"} by{" "}
      {url ? (
        <a href={url} target="_blank" rel="noopener" className="link-underline text-ink-2">
          {attribution.name}
        </a>
      ) : (
        <span className="text-ink-2">{attribution.name}</span>
      )}
    </p>
  );
}
