import { CalendarPlus, Clock, MapPin, Video } from "lucide-react";
import type { NextMeeting } from "@/lib/data";
import { formatDateLong, formatTimeRange, relativeDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

export function NextMeetingBand({
  next,
  today,
  className,
}: {
  next: NextMeeting;
  today: string;
  className?: string;
}) {
  const rel = relativeDay(next.date, today);
  return (
    <section aria-labelledby="next-meeting" className={cn("page-x", className)}>
      <div className="grid gap-6 rounded-lg bg-ink px-5 py-6 text-white sm:px-8 sm:py-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="next-meeting" className="text-[0.72rem] font-semibold tracking-[0.14em] text-white/60 uppercase">
              Next meeting
            </h2>
            {rel && (
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-white/10 px-2 py-0.5 text-[0.75rem] font-medium">
                <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-[#ff5a6e]" />
                {rel}
              </span>
            )}
          </div>
          <p className="display mt-2 text-[1.7rem] sm:text-[2rem]">
            {formatDateLong(next.date, false)}
            {next.event && next.event.kind !== "weekly_meeting" && (
              <span className="text-white/60"> · {next.event.title}</span>
            )}
          </p>
          <p className="mt-2 flex flex-col gap-1.5 text-[0.95rem] text-white/80 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <span className="inline-flex items-center gap-2">
              <Clock aria-hidden className="size-4 text-white/50" />
              {formatTimeRange(next.startTime, next.endTime)}
            </span>
            <span className="inline-flex items-start gap-2">
              {next.mode === "online" ? (
                <Video aria-hidden className="mt-0.5 size-4 shrink-0 text-white/50" />
              ) : (
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-white/50" />
              )}
              <span>
                {next.venueName}
                {next.address && <span className="text-white/55">, {next.address}</span>}
              </span>
            </span>
          </p>
          {next.nextInPerson && (
            <p className="mt-3 text-[0.85rem] text-white/60">
              Next face-to-face meeting: {formatDateLong(next.nextInPerson, false)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/visit" variant="light" size="lg">
            Plan your visit
          </ButtonLink>
          <a
            href="/chapter-meeting.ics"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-[0.94rem] font-medium text-white transition-colors hover:bg-white/10"
          >
            <CalendarPlus aria-hidden className="size-4" />
            Add to calendar
          </a>
        </div>
      </div>
    </section>
  );
}
