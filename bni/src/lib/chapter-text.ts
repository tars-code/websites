import { addDays, addMinutes, formatTimeRange, weekOfMonth } from "@/lib/dates";
import type { ChapterSettings, EventKind, MeetingFormat } from "@/lib/types";
import { whatsappLink } from "@/lib/utils";

export const formatLabels: Record<MeetingFormat, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "In person & online",
};

export const eventKindLabels: Record<EventKind, string> = {
  weekly_meeting: "Weekly meeting",
  visitor_day: "Visitor day",
  training: "Training",
  social: "Social",
  event: "Event",
};

/** End time used for "has the meeting finished?" when none is configured. */
export function meetingEnd(c: ChapterSettings) {
  return c.meeting.endTime || addMinutes(c.meeting.startTime, 120);
}

/** "Every Friday · 7:30 AM onwards" */
export function meetingSchedule(c: ChapterSettings) {
  return `Every ${c.meeting.day} · ${formatTimeRange(c.meeting.startTime, c.meeting.endTime)}`;
}

/** Whether the regular meeting on a given date is in person or online. */
export function meetingModeOn(c: ChapterSettings, date: string): MeetingFormat {
  if (c.meeting.pattern === "first_in_person") return weekOfMonth(date) === 1 ? "in_person" : "online";
  return c.meeting.format;
}

function venue(c: ChapterSettings) {
  const place = [c.meeting.venueName, c.meeting.address].filter(Boolean).join(", ");
  // Until a venue is configured, say so honestly rather than show placeholder text.
  return place || `${c.city} · venue shared when you request a visit`;
}

function platform(c: ChapterSettings) {
  return c.meeting.onlinePlatform ? `on ${c.meeting.onlinePlatform}` : "by video call";
}

export function onlineLabel(c: ChapterSettings) {
  return `Online ${platform(c)}`;
}

/** Where the regular meeting happens for a given mode. */
export function placeFor(c: ChapterSettings, mode: MeetingFormat) {
  if (mode === "online") return onlineLabel(c);
  if (mode === "hybrid") return `${venue(c)} · also online ${platform(c)}`;
  return venue(c);
}

/** Where the regular meeting on a specific date happens. */
export function placeOn(c: ChapterSettings, date: string) {
  return placeFor(c, meetingModeOn(c, date));
}

/** One or two short lines describing where the chapter meets. */
export function meetingPlaceLines(c: ChapterSettings): string[] {
  if (c.meeting.pattern === "first_in_person") {
    return [
      `First ${c.meeting.day} of the month: ${venue(c)}`,
      `Other ${c.meeting.day}s: online ${platform(c)}`,
    ];
  }
  return [placeFor(c, c.meeting.format)];
}

export function meetingPlace(c: ChapterSettings) {
  return meetingPlaceLines(c).join(" · ");
}

/** Next date on/after `from` (a meeting date) whose regular meeting is in person. */
export function nextInPersonDate(c: ChapterSettings, from: string) {
  for (let i = 0; i < 6; i++) {
    const d = addDays(from, i * 7);
    if (meetingModeOn(c, d) !== "online") return d;
  }
  return null;
}

export function chapterWhatsapp(c: ChapterSettings, text?: string) {
  return whatsappLink(
    c.contact.whatsapp,
    text ?? `Hi, I'd like to visit a ${c.name} meeting. Could you share the details?`,
  );
}
