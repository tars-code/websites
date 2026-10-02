import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageMisconfigured } from "@/lib/env";
import { MAX_UPLOAD_BYTES, UploadError, processAndStorePhoto } from "@/lib/images";
import { toImg } from "@/lib/media";
import type { PhotoPurpose } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const PURPOSES: PhotoPurpose[] = ["gallery", "member", "chapter"];

/** One image per request (keeps each request well under host body limits). */
export async function POST(request: Request) {
  if (!(await getAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (storageMisconfigured) {
    return Response.json({ error: "Photo storage is not configured. See docs/DEPLOYMENT.md." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const purpose = String(form.get("purpose") ?? "gallery") as PhotoPurpose;
  const eventId = String(form.get("eventId") ?? "") || null;
  const alt = String(form.get("alt") ?? "");

  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  if (!PURPOSES.includes(purpose)) return Response.json({ error: "Invalid purpose." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Image is larger than 4 MB." }, { status: 413 });
  if (eventId && !(await db().get("events", eventId))) {
    return Response.json({ error: "Meetup not found." }, { status: 404 });
  }

  try {
    const photo = await processAndStorePhoto(Buffer.from(await file.arrayBuffer()), {
      purpose,
      eventId,
      alt,
    });
    if (eventId) revalidatePath("/", "layout");
    return Response.json({ photo, img: toImg(photo) });
  } catch (err) {
    if (err instanceof UploadError) return Response.json({ error: err.message }, { status: 422 });
    console.error("upload failed", err);
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
