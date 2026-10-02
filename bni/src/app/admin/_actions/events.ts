"use server";

import { redirect } from "next/navigation";
import { guard, revalidateSite } from "@/lib/admin";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/form";
import { deletePhoto } from "@/lib/images";
import type { ChapterEvent } from "@/lib/types";
import { newId, slugify, uniqueSlug } from "@/lib/utils";
import { eventSchema } from "@/lib/validation";

export async function saveEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = String(fd.get("id") ?? "");
  const values = formValues(fd);
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };
  }
  const v = parsed.data;
  const existing = id ? await db().get("events", id) : null;
  if (id && !existing) return { status: "error", message: "This meetup no longer exists." };

  const now = new Date().toISOString();
  const status: ChapterEvent["status"] =
    v.intent === "publish" ? "published" : v.intent === "unpublish" ? "draft" : (existing?.status ?? "draft");

  const all = await db().list("events");
  const baseSlug = `${slugify(v.title)}-${v.date}`;
  const slug =
    existing && existing.slug.startsWith(baseSlug)
      ? existing.slug
      : uniqueSlug(baseSlug, all.filter((e) => e.id !== id).map((e) => e.slug));

  const record: ChapterEvent = {
    id: existing?.id ?? newId(),
    slug,
    kind: v.kind,
    status,
    title: v.title,
    date: v.date,
    startTime: v.startTime,
    endTime: v.endTime,
    location: v.location,
    summary: v.summary,
    body: v.body,
    visitorInfo: v.visitorInfo,
    coverPhotoId: null,
    stats: {
      membersPresent: v.membersPresent,
      visitors: v.visitorsCount,
      referrals: v.referrals,
      newMembers: v.newMembersCount,
      oneToOnes: v.oneToOnes,
      businessValue: v.businessValue || null,
    },
    highlights: v.highlights,
    celebrations: v.celebrations,
    announcements: v.announcements,
    achievements: v.achievements,
    spotlight: v.spotlight,
    visitors: v.visitors,
    newMembers: v.newMembers,
    isSample: existing?.isSample ?? false,
    publishedAt: status === "published" ? (existing?.publishedAt ?? now) : (existing?.publishedAt ?? null),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  // Photos: the editor sends the ordered list of photo ids that should belong
  // to this event. Attach/reorder those; delete ones that were removed.
  const photos = await db().list("photos");
  const valid = v.photoIds.filter((pid) => photos.some((p) => p.id === pid && p.purpose === "gallery"));
  record.coverPhotoId = valid.includes(v.coverPhotoId) ? v.coverPhotoId : (valid[0] ?? null);

  if (existing) await db().update("events", record.id, record);
  else await db().insert("events", record);

  for (const [i, pid] of valid.entries()) {
    await db().update("photos", pid, { eventId: record.id, sortOrder: i });
  }
  const removed = photos.filter((p) => p.eventId === record.id && !valid.includes(p.id));
  for (const p of removed) await deletePhoto(p.id);

  revalidateSite();

  if (!existing) redirect(`/admin/meetups/${record.id}?saved=${status === "published" ? "published" : "draft"}`);
  return {
    status: "success",
    message: status === "published" ? "Published — the website is updated." : "Saved as draft.",
    data: { slug: record.slug, status },
  };
}

export async function deleteEvent(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  const event = await db().get("events", id);
  if (!event) redirect("/admin/meetups");
  const photos = await db().list("photos", { eventId: id });
  for (const p of photos) await deletePhoto(p.id);
  await db().remove("events", id);
  revalidateSite();
  redirect("/admin/meetups?deleted=1");
}

export async function setEventStatus(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!["draft", "published", "archived"].includes(status)) return;
  const event = await db().get("events", id);
  if (!event) return;
  await db().update("events", id, {
    status: status as ChapterEvent["status"],
    publishedAt: status === "published" ? (event.publishedAt ?? new Date().toISOString()) : event.publishedAt,
    updatedAt: new Date().toISOString(),
  });
  revalidateSite();
}
