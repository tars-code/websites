import { meetingEnd, meetingModeOn, placeFor } from "@/lib/chapter-text";
import { getChapter } from "@/lib/data";
import { addDays, nextWeeklyDate } from "@/lib/dates";
import { env } from "@/lib/env";

export const revalidate = 3600;

const DAY_CODES: Record<string, string> = {
  Monday: "MO", Tuesday: "TU", Wednesday: "WE", Thursday: "TH", Friday: "FR", Saturday: "SA", Sunday: "SU",
};

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;

/** Fold lines to 75 octets as RFC 5545 requires. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

/**
 * Recurring calendar invite for the chapter meeting. A chapter that meets in
 * person on the first week and online otherwise gets two recurring events,
 * each with the right location.
 */
export async function GET() {
  const c = await getChapter();
  const end = meetingEnd(c);
  const first = nextWeeklyDate(c.timezone, c.meeting.day, end);
  const host = new URL(env.siteUrl).host;
  const day = DAY_CODES[c.meeting.day];
  const stampNow = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;

  const event = (uid: string, start: string, rrule: string, summary: string, location: string) => [
    "BEGIN:VEVENT",
    `UID:${uid}@${host}`,
    `DTSTAMP:${stampNow}`,
    `DTSTART;TZID=${c.timezone}:${stamp(start, c.meeting.startTime)}`,
    `DTEND;TZID=${c.timezone}:${stamp(start, end)}`,
    `RRULE:${rrule}`,
    `SUMMARY:${esc(summary)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(`${c.meeting.visitorNote}\n\n${env.siteUrl}`)}`,
    `URL:${env.siteUrl}/meetings`,
    "BEGIN:VALARM",
    "TRIGGER:-PT12H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`${c.name} meeting tomorrow`)}`,
    "END:VALARM",
    "END:VEVENT",
  ];

  let events: string[];
  if (c.meeting.pattern === "first_in_person") {
    // Each RRULE's DTSTART must itself match the rule.
    let inPerson = first;
    while (meetingModeOn(c, inPerson) !== "in_person") inPerson = addDays(inPerson, 7);
    let online = first;
    while (meetingModeOn(c, online) !== "online") online = addDays(online, 7);
    events = [
      ...event("meeting-in-person", inPerson, `FREQ=MONTHLY;BYDAY=1${day}`, `${c.name} meeting (in person)`, placeFor(c, "in_person")),
      ...event("meeting-online", online, `FREQ=MONTHLY;BYDAY=2${day},3${day},4${day},5${day}`, `${c.name} meeting (${c.meeting.onlinePlatform || "online"})`, placeFor(c, "online")),
    ];
  } else {
    events = event("weekly-meeting", first, `FREQ=WEEKLY;BYDAY=${day}`, `${c.name} weekly meeting`, placeFor(c, c.meeting.format));
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${esc(c.name)}//Chapter Website//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ];
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(c.name.replace(/\s+/g, "-").toLowerCase())}-meeting.ics"`,
    },
  });
}
