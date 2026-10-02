import type { NextMeeting } from "@/lib/data";
import type { ChapterSettings } from "@/lib/types";
import { safeUrl } from "@/lib/utils";

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped is safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function offsetFor(timeZone: string, date: string) {
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(new Date(`${date}T12:00:00Z`))
      .find((p) => p.type === "timeZoneName")?.value;
    const m = /GMT([+-]\d{2}:\d{2})/.exec(name ?? "");
    return m ? m[1] : "Z";
  } catch {
    return "Z";
  }
}

export function chapterJsonLd(chapter: ChapterSettings, next: NextMeeting, siteUrl: string) {
  const offset = offsetFor(chapter.timezone, next.date);
  const place =
    next.mode === "online"
      ? { "@type": "VirtualLocation", url: safeUrl(chapter.meeting.onlineUrl) || siteUrl }
      : {
          "@type": "Place",
          name: next.venueName,
          address: next.address || chapter.city,
        };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#org`,
        name: chapter.name,
        description: chapter.description,
        url: siteUrl,
        ...(chapter.contact.email ? { email: chapter.contact.email } : {}),
        sameAs: chapter.social.map((s) => safeUrl(s.url)).filter(Boolean),
      },
      {
        "@type": "Event",
        name: next.event?.title || `${chapter.name} weekly meeting`,
        startDate: `${next.date}T${next.startTime}:00${offset}`,
        ...(next.endTime ? { endDate: `${next.date}T${next.endTime}:00${offset}` } : {}),
        eventAttendanceMode:
          next.mode === "online"
            ? "https://schema.org/OnlineEventAttendanceMode"
            : next.mode === "hybrid"
              ? "https://schema.org/MixedEventAttendanceMode"
              : "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: place,
        organizer: { "@id": `${siteUrl}/#org` },
        url: `${siteUrl}/visit`,
      },
    ],
  };
}
