import { meetingPlace } from "@/lib/chapter-text";
import { getChapter } from "@/lib/data";
import { lastWeeklyDate, todayInZone } from "@/lib/dates";
import { env } from "@/lib/env";
import type { EventKind } from "@/lib/types";
import { MeetupForm } from "@/components/admin/meetup-form";
import { AdminHeader } from "@/components/admin/page-header";

const KINDS: EventKind[] = ["weekly_meeting", "visitor_day", "training", "social", "event"];

export default async function NewMeetup({ searchParams }: PageProps<"/admin/meetups/new">) {
  const sp = await searchParams;
  const chapter = await getChapter();
  const kind = KINDS.includes(sp.kind as EventKind) ? (sp.kind as EventKind) : "weekly_meeting";
  const weekly = kind === "weekly_meeting";

  return (
    <>
      <AdminHeader
        title={weekly ? "Add weekly meetup" : "Add event"}
        back={{ href: "/admin/meetups", label: "Meetups & events" }}
        description={
          weekly
            ? "Date and title are pre-filled for the latest meeting. Add a short description and photos, then publish."
            : "Create an upcoming event such as a visitor day, training or social."
        }
      />
      <MeetupForm
        event={null}
        images={[]}
        siteUrl={env.siteUrl}
        defaultVenue={meetingPlace(chapter)}
        defaults={{
          kind,
          date: weekly ? lastWeeklyDate(chapter.timezone, chapter.meeting.day) : todayInZone(chapter.timezone),
          title: weekly ? "Weekly Meeting" : "",
        }}
      />
    </>
  );
}
