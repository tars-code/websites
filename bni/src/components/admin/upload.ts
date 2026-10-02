"use client";

import type { Img } from "@/lib/media";
import type { PhotoPurpose } from "@/lib/types";

const MAX_EDGE = 2000;
const SERVER_LIMIT = 4 * 1024 * 1024;

export class PrepareError extends Error {}

/**
 * Downscale in the browser before uploading: a 6 MB phone photo becomes
 * ~500 KB, uploads quickly on mobile data and stays under host body limits.
 * Small logo/hero files are sent untouched so PNG transparency survives.
 */
export async function prepareImage(file: File, purpose: PhotoPurpose): Promise<Blob> {
  const okType = /^image\/(jpeg|png|webp)$/.test(file.type);
  if (purpose === "chapter" && okType && file.size <= SERVER_LIMIT * 0.9) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PrepareError(
      /heic|heif/i.test(file.type + file.name)
        ? "HEIC photos can't be read in this browser. Please export as JPEG (or upload from your phone's browser)."
        : "This file couldn't be read as an image.",
    );
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PrepareError("Your browser couldn't process this image.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new PrepareError("Your browser couldn't process this image.");
  if (blob.size > SERVER_LIMIT) throw new PrepareError("This image is still too large after resizing.");
  return blob;
}

export interface UploadResult {
  photo: { id: string };
  img: Img;
}

/** XHR (not fetch) so we get upload progress events. */
export function uploadImage(
  blob: Blob,
  opts: { purpose: PhotoPurpose; alt?: string; eventId?: string; onProgress?: (pct: number) => void },
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", blob, "photo.jpg");
    fd.append("purpose", opts.purpose);
    if (opts.alt) fd.append("alt", opts.alt);
    if (opts.eventId) fd.append("eventId", opts.eventId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { error?: string } & Partial<UploadResult> = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.photo && body.img) resolve(body as UploadResult);
      else if (xhr.status === 401) reject(new Error("Your session expired. Please sign in again in a new tab."));
      else reject(new Error(body.error || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection and retry."));
    xhr.send(fd);
  });
}

/** Run async jobs with limited concurrency. */
export async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift()!);
    }),
  );
}
