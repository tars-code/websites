import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { eventKindLabels } from "@/lib/chapter-text";
import { getChapter, getEvents } from "@/lib/data";
import { formatDateMedium, todayInZone } from "@/lib/dates";
import { Badge, SampleTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ConfirmAction } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";
import { setEventStatus } from "../../_actions/events";

export default async function MeetupsAdmin({ searchParams }: PageProps<"/admin/meetups">) {
  const sp = await searchParams;
  const [chapter, events] = await Promise.all([getChapter(), getEvents(true)]);
  const today = todayInZone(chapter.timezone);
  const upcoming = events.filter((e) => e.date > today).reverse();
  const past = events.filter((e) => e.date <= today);

  return (
    <>
      <FlashToast message={sp.deleted ? "Deleted." : undefined} />
      <AdminHeader
        title="Meetups & events"
        description="Weekly meetups with photos and highlights, plus special events like visitor days and socials."
        actions={
          <>
            <ButtonLink href="/admin/meetups/new?kind=event" variant="secondary">
              <Plus aria-hidden className="size-4" /> Add event
            </ButtonLink>
            <ButtonLink href="/admin/meetups/new" variant="accent">
              <Plus aria-hidden className="size-4" /> Add weekly meetup
            </ButtonLink>
          </>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No meetups yet"
          action={<ButtonLink href="/admin/meetups/new" variant="accent">Add your first meetup</ButtonLink>}
        >
          After your next meeting, add the photos and a few highlights. It takes about two minutes.
        </EmptyState>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && <EventTable title="Upcoming" events={upcoming} />}
          <EventTable title="Past" events={past} />
        </div>
      )}
    </>
  );
}

function EventTable({ title, events }: { title: string; events: Awaited<ReturnType<typeof getEvents>> }) {
  if (!events.length) return null;
  return (
    <section>
      <h2 className="eyebrow mb-3">{title}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {events.map((e) => (
          <li key={e.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="size-14 shrink-0 overflow-hidden rounded-md bg-sand">
                {e.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.cover.srcSet.split(" ")[0]} alt="" className="size-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="min-w-0">
                <Link href={`/admin/meetups/${e.id}`} className="font-semibold hover:underline">
                  {e.title}
                </Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.84rem] text-muted">
                  {formatDateMedium(e.date)} · {eventKindLabels[e.kind]} · {e.photoCount} photos
                  <SampleTag show={e.isSample} />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:shrink-0">
              {e.status === "published" ? <Badge tone="open">Published</Badge> : <Badge tone="warn">Draft</Badge>}
              <div className="ml-auto flex items-center gap-1 sm:ml-2">
                {e.status === "draft" && (
                  <ConfirmAction
                    action={setEventStatus}
                    fields={{ id: e.id, status: "published" }}
                    successMessage="Published."
                    className="h-9 rounded-md px-3 text-[0.86rem] font-medium text-ink hover:bg-sand"
                  >
                    Publish
                  </ConfirmAction>
                )}
                <Link href={`/admin/meetups/${e.id}`} className="inline-flex h-9 items-center rounded-md border border-line-strong px-3 text-[0.86rem] font-medium hover:border-ink">
                  Edit
                </Link>
                {e.status === "published" && (
                  <a href={`/meetings/${e.slug}`} target="_blank" className="inline-flex h-9 items-center rounded-md px-3 text-[0.86rem] text-muted hover:text-ink">
                    View ↗
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
