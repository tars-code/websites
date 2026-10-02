"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Img } from "@/lib/media";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";

export function PhotoGallery({
  images,
  label,
  className,
  limit,
  moreHref,
}: {
  images: Img[];
  /** Used for accessible names, e.g. the meetup title. */
  label: string;
  className?: string;
  /** Show only the first N thumbnails (all still browsable in the lightbox). */
  limit?: number;
  moreHref?: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const shown = limit ? images.slice(0, limit) : images;
  const hidden = images.length - shown.length;

  return (
    <>
      <ul className={cn("grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4", className)}>
        {shown.map((img, i) => (
          <li key={img.id} className="relative">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-sm bg-sand"
              aria-label={`Open photo ${i + 1} of ${images.length}${img.alt ? `: ${img.alt}` : ""}`}
            >
              <SmartImage
                img={img}
                fill
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
                className="transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {hidden > 0 && i === shown.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
                  +{hidden}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {moreHref && hidden > 0 && <span className="sr-only">{hidden} more photos</span>}
      <Lightbox images={images} index={index} onIndex={setIndex} label={label} />
    </>
  );
}

/** A single image that opens the lightbox (used for the large meetup hero photo). */
export function LightboxTrigger({
  images,
  start = 0,
  label,
  className,
  children,
}: {
  images: Img[];
  start?: number;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => setIndex(start)}
        className={cn("group block w-full text-left", className)}
        aria-label={`Open photos from ${label}`}
      >
        {children}
      </button>
      <Lightbox images={images} index={index} onIndex={setIndex} label={label} />
    </>
  );
}

export function Lightbox({
  images,
  index,
  onIndex,
  label,
}: {
  images: Img[];
  index: number | null;
  onIndex: (i: number | null) => void;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndex((index + delta + count) % count);
    },
    [index, count, onIndex],
  );

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  // Preload neighbours for instant next/prev.
  useEffect(() => {
    if (index === null || count < 2) return;
    for (const j of [index + 1, index - 1]) {
      const img = images[(j + count) % count];
      const pre = new Image();
      pre.sizes = "100vw";
      pre.srcset = img.srcSet;
    }
  }, [index, images, count]);

  const current = index !== null ? images[index] : null;

  return (
    <dialog
      ref={ref}
      aria-label={`Photos: ${label}`}
      onClose={() => onIndex(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white open:animate-fade"
    >
      {current && (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 text-sm">
            <span className="tabular-nums text-white/80" aria-live="polite">
              {index! + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => onIndex(null)}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
              aria-label="Close"
              autoFocus
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated variants */}
            <img
              key={current.id}
              src={current.src}
              srcSet={current.srcSet}
              sizes="100vw"
              alt={current.alt || `Photo ${index! + 1} from ${label}`}
              className="max-h-full max-w-full animate-fade object-contain select-none"
              style={{ aspectRatio: `${current.width} / ${current.height}` }}
              draggable={false}
            />
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:inline-flex"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:inline-flex"
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          <div className="flex min-h-14 items-center justify-between gap-4 px-4 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]">
            <p className="text-sm text-white/80">{current.caption}</p>
            {count > 1 && (
              <div className="flex gap-2 sm:hidden">
                <button type="button" onClick={() => go(-1)} className="inline-flex size-11 items-center justify-center rounded-full bg-white/10" aria-label="Previous photo">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" onClick={() => go(1)} className="inline-flex size-11 items-center justify-center rounded-full bg-white/10" aria-label="Next photo">
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
