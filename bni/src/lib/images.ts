import "server-only";
import sharp, { type Metadata } from "sharp";
import { db, mediaStorage } from "@/lib/db";
import { photoKey, photoKeys } from "@/lib/media";
import type { Photo, PhotoPurpose } from "@/lib/types";
import { newId } from "@/lib/utils";

/** Upload limits. The browser downsizes photos before upload, so real uploads are ~0.5–1.5 MB. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5 MB request cap
export const ACCEPTED_FORMATS = ["jpeg", "png", "webp"] as const;
const MAX_INPUT_PIXELS = 60_000_000;

const VARIANT_WIDTHS: Record<PhotoPurpose, number[]> = {
  gallery: [480, 960, 1600],
  member: [320, 640],
  chapter: [640, 1280, 2000],
};

export class UploadError extends Error {}

export async function processAndStorePhoto(
  input: Buffer,
  opts: { purpose: PhotoPurpose; eventId?: string | null; alt?: string; sortOrder?: number; isSample?: boolean },
): Promise<Photo> {
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError("Image is larger than 4 MB.");
  }

  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new UploadError("This file isn't a readable image.");
  }
  if (!meta.format || !(ACCEPTED_FORMATS as readonly string[]).includes(meta.format)) {
    throw new UploadError("Only JPEG, PNG or WebP images are allowed.");
  }

  // .rotate() applies EXIF orientation; sharp drops all metadata (incl. GPS) by default.
  const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  // EXIF orientations 5–8 are rotated by 90°, so width/height swap after .rotate().
  const swapped = (meta.orientation ?? 1) >= 5;
  const srcW = (swapped ? meta.height : meta.width) ?? 0;
  const srcH = (swapped ? meta.width : meta.height) ?? 0;
  if (!srcW || !srcH) throw new UploadError("Could not read image dimensions.");

  const targets = VARIANT_WIDTHS[opts.purpose].filter((w) => w <= srcW);
  const widths = targets.length ? targets : [srcW];

  const id = newId();
  const store = mediaStorage();
  const written: string[] = [];
  try {
    for (const w of widths) {
      const buf = await base
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: opts.purpose === "member" ? 80 : 76, effort: 4 })
        .toBuffer();
      const key = photoKey(id, w);
      await store.put(key, buf, "image/webp");
      written.push(key);
    }
  } catch (err) {
    await store.remove(written).catch(() => undefined);
    throw err;
  }

  const blur = await base.clone().resize(16).webp({ quality: 40 }).toBuffer();

  return db().insert("photos", {
    id,
    purpose: opts.purpose,
    eventId: opts.eventId ?? null,
    width: srcW,
    height: srcH,
    widths,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    alt: (opts.alt ?? "").slice(0, 200),
    caption: "",
    sortOrder: opts.sortOrder ?? Date.now() % 1_000_000_000,
    isSample: opts.isSample ?? false,
    createdAt: new Date().toISOString(),
  });
}

export async function deletePhoto(id: string) {
  const photo = await db().get("photos", id);
  if (!photo) return;
  await mediaStorage().remove(photoKeys(photo)).catch(() => undefined);
  await db().remove("photos", id);
}
