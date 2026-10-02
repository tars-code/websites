import "server-only";
import { mediaStorage } from "@/lib/db";
import type { Photo } from "@/lib/types";

/** Serializable, render-ready image — safe to pass to client components. */
export interface Img {
  id: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  blurDataUrl: string;
  alt: string;
  caption: string;
  /** Largest variant, for lightbox / OpenGraph. */
  large: string;
}

export function photoKey(id: string, width: number) {
  return `photos/${id}/${width}.webp`;
}

export function photoKeys(photo: Pick<Photo, "id" | "widths">) {
  return photo.widths.map((w) => photoKey(photo.id, w));
}

export function toImg(photo: Photo, fallbackAlt = ""): Img {
  const store = mediaStorage();
  const widths = [...photo.widths].sort((a, b) => a - b);
  const url = (w: number) => store.publicUrl(photoKey(photo.id, w));
  const mid = widths.find((w) => w >= 960) ?? widths[widths.length - 1];
  return {
    id: photo.id,
    src: url(mid),
    srcSet: widths.map((w) => `${url(w)} ${w}w`).join(", "),
    width: photo.width,
    height: photo.height,
    blurDataUrl: photo.blurDataUrl,
    alt: photo.alt || fallbackAlt,
    caption: photo.caption,
    large: url(widths[widths.length - 1]),
  };
}
