"use server";

import { guard, revalidateSite } from "@/lib/admin";
import { getChapter } from "@/lib/data";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/form";
import { deletePhoto } from "@/lib/images";
import type { ChapterSettings, Weekday } from "@/lib/types";
import { chapterSchema } from "@/lib/validation";

export async function saveChapter(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const values = formValues(fd);
  const parsed = chapterSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };
  }
  const v = parsed.data;
  const current = await getChapter();

  for (const [key, label] of [["logoPhotoId", "Logo"], ["heroPhotoId", "Hero image"]] as const) {
    if (v[key] && !(await db().get("photos", v[key]))) {
      return { status: "error", errors: { [key]: `${label} upload not found — please re-upload.` }, values };
    }
  }

  const next: ChapterSettings = {
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    city: v.city,
    timezone: v.timezone || "Asia/Kolkata",
    foundedOn: v.foundedOn,
    meeting: {
      day: v.meetingDay as Weekday,
      startTime: v.startTime,
      endTime: v.endTime,
      format: v.format,
      pattern: v.pattern,
      onlinePlatform: v.onlinePlatform,
      venueName: v.venueName,
      address: v.address,
      mapUrl: v.mapUrl,
      onlineUrl: v.onlineUrl,
      visitorNote: v.visitorNote,
    },
    contact: {
      name: v.contactName,
      role: v.contactRole,
      phone: v.contactPhone,
      email: v.contactEmail,
      whatsapp: v.contactWhatsapp,
    },
    social: v.social.filter((l) => l.label && l.url),
    bniLinks: v.bniLinks.filter((l) => l.label && l.url),
    logoPhotoId: v.logoPhotoId || null,
    heroPhotoId: v.heroPhotoId || null,
    customStats: v.customStats.filter((s) => s.label && s.value),
    content: {
      whyVisit: v.whyVisit.filter((x) => x.title),
      agenda: v.agenda.filter((x) => x.title),
      audience: v.audience.map((a) => a.text).filter(Boolean),
      faqs: v.faqs.filter((x) => x.title),
      about: v.about.filter((x) => x.title),
    },
    membersIndexable: v.membersIndexable,
    attribution: {
      enabled: v.attrEnabled,
      name: v.attrName,
      line: v.attrLine,
      services: v.attrServices.split(/[,·]/).map((s) => s.trim()).filter(Boolean),
      url: v.attrUrl,
      email: v.attrEmail,
      phone: v.attrPhone,
    },
  };

  await db().setSetting("chapter", next);
  for (const key of ["logoPhotoId", "heroPhotoId"] as const) {
    if (current[key] && current[key] !== next[key]) await deletePhoto(current[key]!);
  }
  revalidateSite();
  return { status: "success", message: "Chapter settings saved." };
}
