import "server-only";
import { cache } from "react";
import { chapterDefaults } from "@/config/chapter";
import { db } from "@/lib/db";
import { meetingEnd, meetingModeOn, nextInPersonDate, placeFor } from "@/lib/chapter-text";
import { addDays, nextWeeklyDate, todayInZone } from "@/lib/dates";
import { toImg, type Img } from "@/lib/media";
import type { Category, ChapterEvent, ChapterSettings, MeetingFormat, Member, Photo } from "@/lib/types";

/* ───────────────────────── Chapter settings ───────────────────────── */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge saved settings over defaults; arrays are replaced, not merged. */
function merge<T>(base: T, over: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(over)) return (over ?? base) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? merge(out[k], v) : v;
  }
  return out as T;
}

export const getChapter = cache(async (): Promise<ChapterSettings> => {
  const saved = await db().getSetting<Partial<ChapterSettings>>("chapter");
  return merge(chapterDefaults, saved ?? {});
});

/* ───────────────────────── Photos ───────────────────────── */

const byOrder = (a: Photo, b: Photo) =>
  a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);

export const getAllPhotos = cache(async () => db().list("photos"));

export const getPhotoMap = cache(async () => {
  const photos = await getAllPhotos();
  return new Map(photos.map((p) => [p.id, p]));
});

export async function getImg(id: string | null | undefined, alt = ""): Promise<Img | null> {
  if (!id) return null;
  const p = (await getPhotoMap()).get(id);
  return p ? toImg(p, alt) : null;
}

export async function getEventPhotos(eventId: string): Promise<Photo[]> {
  const photos = await getAllPhotos();
  return photos.filter((p) => p.eventId === eventId && p.purpose === "gallery").sort(byOrder);
}

/* ───────────────────────── Categories & members ───────────────────────── */

export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await db().list("categories");
  return rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
});

export interface MemberView extends Member {
  category: Category | null;
  img: Img | null;
}

/**
 * Launch ambassadors help start the chapter but don't hold a category seat, so
 * they're listed in their own section and never counted as members. An admin
 * marks someone as one through their chapter role.
 */
export const isAmbassador = (m: Pick<Member, "role">) => /ambassador/i.test(m.role);

const getMemberViews = cache(async (includeArchived: boolean) => {
  const [rows, categories, photos] = await Promise.all([
    db().list("members"),
    getCategories(),
    getPhotoMap(),
  ]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  return rows
    .filter((m) => includeArchived || m.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map<MemberView>((m) => {
      const photo = m.photoId ? photos.get(m.photoId) : undefined;
      return {
        ...m,
        // Public views only ever see contact details the member chose to publish.
        phone: m.showPhone ? m.phone : "",
        whatsapp: m.showPhone ? m.whatsapp : "",
        email: m.showEmail ? m.email : "",
        category: (m.categoryId && catMap.get(m.categoryId)) || null,
        img: photo ? toImg(photo, `${m.name}, ${m.businessName}`) : null,
      };
    });
});

/** Chapter members — excludes launch ambassadors (see getAmbassadors). */
export const getMembers = cache(async (includeArchived: boolean = false) =>
  (await getMemberViews(includeArchived)).filter((m) => !isAmbassador(m)),
);

export const getAmbassadors = cache(async () => (await getMemberViews(false)).filter(isAmbassador));

/** Any public profile: members and launch ambassadors. */
export async function getMemberBySlug(slug: string) {
  const members = await getMemberViews(false);
  return members.find((m) => m.slug === slug) ?? null;
}

export interface CategoryView extends Category {
  members: MemberView[];
}

/** Categories with their (active) members attached. */
export const getCategoryViews = cache(async (): Promise<CategoryView[]> => {
  const [categories, members] = await Promise.all([getCategories(), getMembers()]);
  return categories.map((c) => ({
    ...c,
    members: members.filter((m) => m.categoryId === c.id),
  }));
});

/* ───────────────────────── Events & meetups ───────────────────────── */

export interface EventView extends ChapterEvent {
  cover: Img | null;
  photoCount: number;
}

export const getEvents = cache(async (includeUnpublished: boolean = false) => {
  const [rows, photos] = await Promise.all([db().list("events"), getAllPhotos()]);
  const photoMap = new Map(photos.map((p) => [p.id, p]));
  const counts = new Map<string, number>();
  const firstPhoto = new Map<string, Photo>();
  for (const p of [...photos].sort(byOrder)) {
    if (!p.eventId || p.purpose !== "gallery") continue;
    counts.set(p.eventId, (counts.get(p.eventId) ?? 0) + 1);
    if (!firstPhoto.has(p.eventId)) firstPhoto.set(p.eventId, p);
  }
  return rows
    .filter((e) => includeUnpublished || e.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .map<EventView>((e) => {
      const cover = (e.coverPhotoId && photoMap.get(e.coverPhotoId)) || firstPhoto.get(e.id);
      return { ...e, cover: cover ? toImg(cover, e.title) : null, photoCount: counts.get(e.id) ?? 0 };
    });
});

export async function getEventBySlug(slug: string) {
  const events = await getEvents();
  return events.find((e) => e.slug === slug) ?? null;
}

/** An event "has happened" if its date is before today, or it's today and has photos. */
function isPast(e: EventView, today: string) {
  return e.date < today || (e.date === today && e.photoCount > 0);
}

export async function getPastEvents() {
  const [events, chapter] = await Promise.all([getEvents(), getChapter()]);
  const today = todayInZone(chapter.timezone);
  return events.filter((e) => isPast(e, today));
}

export async function getUpcomingEvents() {
  const [events, chapter] = await Promise.all([getEvents(), getChapter()]);
  const today = todayInZone(chapter.timezone);
  return events.filter((e) => !isPast(e, today)).reverse();
}

/** The most recent meetup that actually has something to show. */
export async function getLatestMeetup() {
  const past = await getPastEvents();
  return past.find((e) => e.photoCount > 0 || e.summary || e.highlights.length) ?? null;
}

export interface NextMeeting {
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  mapUrl: string;
  /** In person, online or both — for hybrid chapters this varies by date. */
  mode: MeetingFormat;
  /** When the next meeting is online: the next face-to-face date. */
  nextInPerson: string | null;
  /** A scheduled event for this date, if the admin created one (e.g. visitor day). */
  event: EventView | null;
}

export async function getNextMeeting(): Promise<NextMeeting> {
  const [chapter, upcoming] = await Promise.all([getChapter(), getUpcomingEvents()]);
  const m = chapter.meeting;
  const regular = nextWeeklyDate(chapter.timezone, m.day, meetingEnd(chapter));
  const special = upcoming.find(
    (e) => (e.kind === "weekly_meeting" || e.kind === "visitor_day") && e.date <= regular,
  );
  const date = special?.date ?? regular;
  const mode: MeetingFormat = special?.location ? "in_person" : meetingModeOn(chapter, date);
  const inPerson = mode !== "online";
  return {
    date,
    startTime: special?.startTime || m.startTime,
    endTime: special?.endTime || m.endTime,
    venueName: special?.location || (inPerson ? m.venueName : "") || placeFor(chapter, mode),
    address: special?.location || !inPerson ? "" : m.address,
    mapUrl: special?.location || !inPerson ? "" : m.mapUrl,
    mode,
    nextInPerson: inPerson ? null : nextInPersonDate(chapter, addDays(date, 7)),
    event: special ?? null,
  };
}

/* ───────────────────────── Snapshot (derived, never invented) ───────────────────────── */

export interface Stat {
  label: string;
  value: string;
  note?: string;
}

export async function getSnapshot(): Promise<Stat[]> {
  const [chapter, members, categories, past] = await Promise.all([
    getChapter(),
    getMembers(),
    getCategories(),
    getPastEvents(),
  ]);
  const stats: Stat[] = [];
  if (members.length) stats.push({ label: "Members", value: String(members.length) });
  const represented = new Set(members.map((m) => m.categoryId).filter(Boolean)).size;
  if (represented) stats.push({ label: "Business categories", value: String(represented) });
  const open = categories.filter((c) => c.status === "open").length;
  if (open) stats.push({ label: "Open categories", value: String(open), note: "Looking for members" });

  const today = todayInZone(chapter.timezone);
  const month = today.slice(0, 7);
  const thisMonth = past.filter((e) => e.date.startsWith(month));
  const visitorEntries = thisMonth.filter((e) => typeof e.stats.visitors === "number");
  if (visitorEntries.length) {
    const total = visitorEntries.reduce((n, e) => n + (e.stats.visitors ?? 0), 0);
    if (total > 0) stats.push({ label: "Visitors this month", value: String(total) });
  }
  if (chapter.foundedOn) {
    const year = chapter.foundedOn.slice(0, 4);
    stats.push({ label: "Meeting since", value: year });
  }
  for (const s of chapter.customStats) if (s.label && s.value) stats.push(s);
  return stats;
}

export async function hasSampleContent() {
  const [members, categories, events, photos] = await Promise.all([
    db().list("members", { isSample: true }),
    db().list("categories", { isSample: true }),
    db().list("events", { isSample: true }),
    db().list("photos", { isSample: true }),
  ]);
  return members.length + categories.length + events.length + photos.length > 0;
}
