import type { CSSProperties } from "react";
import type { Img } from "@/lib/media";
import { cn, initials } from "@/lib/utils";

/**
 * Responsive image backed by pre-generated webp variants.
 * - srcset/sizes so phones fetch the 480/960px variant, not the original
 * - lazy-loaded by default; `priority` for above-the-fold images
 * - tiny blurred placeholder painted as background while loading
 */
export function SmartImage({
  img,
  sizes,
  className,
  priority = false,
  fill = false,
  style,
  alt,
}: {
  img: Img;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Fill the parent (parent must be positioned and sized). */
  fill?: boolean;
  style?: CSSProperties;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- variants are pre-generated at upload time
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes={sizes}
      width={img.width}
      height={img.height}
      alt={alt ?? img.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn(fill && "absolute inset-0 size-full", "object-cover", className)}
      style={{
        backgroundImage: img.blurDataUrl ? `url(${img.blurDataUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...style,
      }}
    />
  );
}

export function Avatar({
  img,
  name,
  size = 48,
  className,
  sizes,
}: {
  img: Img | null;
  name: string;
  size?: number;
  className?: string;
  sizes?: string;
}) {
  if (img) {
    return (
      <SmartImage
        img={img}
        alt={name}
        sizes={sizes ?? `${size}px`}
        className={cn("rounded-full bg-sand", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-sand-2 font-display text-ink-2",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}
