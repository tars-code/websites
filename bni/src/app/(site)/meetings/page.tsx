import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { getChapter, getNextMeeting, getPastEvents, getUpcomingEvents } from "@/lib/data";
import { formatTimeRange, todayInZone } from "@/lib/dates";
import { placeOn } from "@/lib/chapter-text";
import { PageIntro, SectionHeader } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { MeetupCard, UpcomingEventRow } from "@/components/site/event-card";
import { NextMeetingBand } from "@/components/site/next-meeting";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await getChapter();
  return {
    title: "Meetings & events",
    description: `${chapter.name} meets ${`every ${chapter.meeting.day}, ${formatTimeRange(chapter.meeting.startTime, chapter.meeting.endTime)}`}. See upcoming events and photos from past meetings.`,
    alternates: { canonical: "/meetings" },
  };
}

export default async function MeetingsPage() {
  const [chapter, next, upcoming, past] = await Promise.all([
    getChapter(),
    getNextMeeting(),
    getUpcomingEvents(),
    getPastEvents(),
  ]);
  const today = todayInZone(chapter.timezone);

  return (
    <>
      <PageIntro eyebrow="Meetings & events" title="Every week, in person">
        <p>
          We meet {`every ${chapter.meeting.day}, ${formatTimeRange(chapter.meeting.startTime, chapter.meeting.endTime)}`}. Visitors are welcome at any regular meeting — here&apos;s
          what&apos;s coming up and what we&apos;ve been up to.
        </p>
      </PageIntro>

      <NextMeetingBand next={next} today={today} className="mt-8" />

      <section aria-labelledby="upcoming" className="page-x mt-14">
        <SectionHeader id="upcoming" title="Upcoming" />
        {upcoming.length ? (
          <div className="mt-4 divide-y divide-line border-y border-line">
            {upcoming.map((e) => (
              <UpcomingEventRow key={e.id} event={e} today={today} defaultLocation={placeOn(chapter, e.date)} />
            ))}
          </div>
        ) : (
          <p className="mt-4 border-y border-line py-6 text-muted">
            No special events scheduled. Our regular weekly meeting is listed above.
          </p>
        )}
      </section>

      <section aria-labelledby="past" className="page-x mt-16 pb-20">
        <SectionHeader
          id="past"
          title="Past meetups"
          description="Photos and highlights from recent meetings."
        />
        {past.length ? (
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e, i) => (
              <MeetupCard key={e.id} event={e} priority={i < 3} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="See what happens at our weekly meetings"
            className="mt-8"
            action={<ButtonLink href="/visit">Visit a meeting</ButtonLink>}
          >
            Photos and highlights from our meetings will appear here after each week.
          </EmptyState>
        )}
      </section>
    </>
  );
}
