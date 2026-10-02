import Link from "next/link";
import { Camera, Clock, MapPin } from "lucide-react";
import { eventKindLabels } from "@/lib/chapter-text";
import type { EventView } from "@/lib/data";
import { dateParts, formatDateMedium, formatTimeRange, relativeDay } from "@/lib/dates";
import { Badge, SampleTag } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";

/** Compact row for upcoming events: date block + details. */
export function UpcomingEventRow({
  event,
  today,
  defaultLocation,
}: {
  event: EventView;
  today: string;
  defaultLocation: string;
}) {
  const d = dateParts(event.date);
  const rel = relativeDay(event.date, today);
  return (
    <article className="group relative flex gap-4 py-5 sm:gap-6">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-surface py-2.5 text-center sm:w-[72px]">
        <span className="text-[0.68rem] font-semibold tracking-[0.12em] text-accent-ink uppercase">{d.month}</span>
        <span className="display text-[1.85rem] leading-none">{d.day}</span>
        <span className="mt-0.5 text-[0.7rem] text-muted">{d.weekday}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={event.kind === "weekly_meeting" ? "neutral" : "accent"}>{eventKindLabels[event.kind]}</Badge>
          {rel && <span className="text-[0.8rem] font-medium text-ink-2">{rel}</span>}
          <SampleTag show={event.isSample} />
        </div>
        <h3 className="mt-1.5 text-[1.05rem] font-semibold text-ink">
          <Link href={`/meetings/${event.slug}`} className="after:absolute after:inset-0 group-hover:underline">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.86rem] text-muted">
          {event.startTime && (
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="size-3.5" />
              {formatTimeRange(event.startTime, event.endTime)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden className="size-3.5" />
            {event.location || defaultLocation}
          </span>
        </p>
        {event.summary && <p className="mt-2 line-clamp-2 text-[0.9rem] text-ink-2">{event.summary}</p>}
      </div>
    </article>
  );
}

/** Card for past meetups: cover photo + date + title. */
export function MeetupCard({ event, priority }: { event: EventView; priority?: boolean }) {
  return (
    <article className="group relative">
      <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-sand">
        {event.cover ? (
          <SmartImage
            img={event.cover}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-faint">
            <Camera aria-hidden className="size-7" />
          </div>
        )}
        {event.photoCount > 0 && (
          <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-sm bg-black/60 px-2 py-0.5 text-[0.72rem] font-medium text-white backdrop-blur-sm">
            <Camera aria-hidden className="size-3" /> {event.photoCount}
          </span>
        )}
      </div>
      <p className="mt-3 text-[0.78rem] font-medium text-muted">
        {formatDateMedium(event.date)} · {eventKindLabels[event.kind]}
      </p>
      <h3 className="mt-0.5 text-[1.02rem] font-semibold text-ink">
        <Link href={`/meetings/${event.slug}`} className="after:absolute after:inset-0 group-hover:underline">
          {event.title}
        </Link>
      </h3>
      {event.summary && <p className="mt-1 line-clamp-2 text-[0.88rem] text-muted">{event.summary}</p>}
      <SampleTag show={event.isSample} className="mt-2" />
    </article>
  );
}
