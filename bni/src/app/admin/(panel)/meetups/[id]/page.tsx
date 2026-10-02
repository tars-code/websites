import { meetingPlace } from "@/lib/chapter-text";
import { notFound } from "next/navigation";
import { getChapter, getEventPhotos } from "@/lib/data";
import { db } from "@/lib/db";
import { formatDateMedium } from "@/lib/dates";
import { env } from "@/lib/env";
import { toImg } from "@/lib/media";
import { SampleTag } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/admin/action-form";
import { MeetupForm } from "@/components/admin/meetup-form";
import { AdminHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";
import { deleteEvent } from "../../../_actions/events";

export default async function EditMeetup({ params, searchParams }: PageProps<"/admin/meetups/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [event, chapter] = await Promise.all([db().get("events", id), getChapter()]);
  if (!event) notFound();
  const images = (await getEventPhotos(event.id)).map((p) => toImg(p));
  const flash =
    sp.saved === "published"
      ? "Published! The homepage now shows this meetup."
      : sp.saved === "draft"
        ? "Saved as draft — not visible on the website yet."
        : undefined;

  return (
    <>
      <FlashToast message={flash} />
      <AdminHeader
        title={`${event.title} · ${formatDateMedium(event.date)}`}
        back={{ href: "/admin/meetups", label: "Meetups & events" }}
        description={<SampleTag show={event.isSample} />}
        actions={
          <ConfirmAction
            action={deleteEvent}
            fields={{ id: event.id }}
            confirmText="Delete this meetup and all its photos? This can't be undone."
            className="h-9 rounded-md px-3 text-[0.86rem] font-medium text-accent-ink hover:bg-accent-soft"
          >
            Delete
          </ConfirmAction>
        }
      />
      <MeetupForm
        event={event}
        images={images}
        siteUrl={env.siteUrl}
        defaultVenue={meetingPlace(chapter)}
        defaults={{ kind: event.kind, date: event.date, title: event.title }}
      />
    </>
  );
}
