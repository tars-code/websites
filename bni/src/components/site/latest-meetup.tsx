import Link from "next/link";
import { Camera, PartyPopper, Sparkles, UserPlus } from "lucide-react";
import type { EventView } from "@/lib/data";
import { daysBetween, formatDateLong } from "@/lib/dates";
import type { Img } from "@/lib/media";
import type { ChapterSettings } from "@/lib/types";
import { SampleTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { MeetupStatsRow } from "./meetup-stats";
import { LightboxTrigger, PhotoGallery } from "./photo-gallery";

export function LatestMeetup({
  meetup,
  photos,
  chapter,
  today,
}: {
  meetup: EventView | null;
  photos: Img[];
  chapter: ChapterSettings;
  today: string;
}) {
  if (!meetup) return <LatestMeetupEmpty chapter={chapter} />;

  const recent = daysBetween(meetup.date, today) <= 7;
  const heading = recent ? `This week at ${chapter.name}` : "Latest meetup";
  const cover = meetup.cover ?? photos[0] ?? null;
  const gallery = cover ? [cover, ...photos.filter((p) => p.id !== cover.id)] : photos;
  const thumbs = gallery.slice(1);

  return (
    <section aria-labelledby="latest-meetup" className="page-x">
      <div className="flex flex-wrap items-center gap-3">
        <p className="eyebrow">{heading}</p>
        <SampleTag show={meetup.isSample} />
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          {cover ? (
            <LightboxTrigger images={gallery} label={meetup.title}>
              <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-sand">
                <SmartImage
                  img={cover}
                  fill
                  sizes="(min-width: 1024px) 680px, 100vw"
                  className="transition-transform duration-700 group-hover:scale-[1.015]"
                />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-sm bg-black/60 px-2.5 py-1 text-[0.78rem] font-medium text-white backdrop-blur-sm">
                  <Camera aria-hidden className="size-3.5" />
                  {meetup.photoCount} photos
                </span>
              </div>
            </LightboxTrigger>
          ) : (
            <div className="flex aspect-[3/2] items-center justify-center rounded-md bg-sand text-faint">
              <Camera aria-hidden className="size-8" />
            </div>
          )}
          {thumbs.length > 0 && (
            <PhotoGallery
              images={thumbs}
              label={meetup.title}
              limit={4}
              className="mt-1.5 grid-cols-4! sm:mt-2"
            />
          )}
        </div>

        <div className="lg:col-span-5 lg:pt-1">
          <h2 id="latest-meetup" className="display text-[1.9rem] sm:text-[2.3rem]">
            <Link href={`/meetings/${meetup.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">
              {meetup.title}
            </Link>
          </h2>
          <p className="mt-1.5 text-[0.95rem] font-medium text-muted">{formatDateLong(meetup.date)}</p>

          <MeetupStatsRow stats={meetup.stats} className="mt-5 border-y border-line py-4" />

          {meetup.summary && <p className="mt-5 text-[1rem] leading-relaxed text-ink-2">{meetup.summary}</p>}

          <MeetupHighlights meetup={meetup} limit={4} />

          <div className="mt-7">
            <ButtonLink href={`/meetings/${meetup.slug}`} variant="primary">
              {recent ? "View this week's meetup" : "View meetup"}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MeetupHighlights({ meetup, limit }: { meetup: EventView; limit?: number }) {
  const highlights = limit ? meetup.highlights.slice(0, limit) : meetup.highlights;
  const groups = [
    { icon: PartyPopper, label: "Celebrations", items: meetup.celebrations },
    { icon: UserPlus, label: "New members", items: meetup.newMembers },
    { icon: Sparkles, label: "Member achievements", items: meetup.achievements },
  ].filter((g) => g.items.length);

  if (!highlights.length && !groups.length && !meetup.spotlight) return null;
  return (
    <div className="mt-5 space-y-5">
      {highlights.length > 0 && (
        <ul className="space-y-2.5">
          {highlights.map((h, i) => (
            <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink-2">
              <span aria-hidden className="mt-[0.6em] h-px w-3 shrink-0 bg-accent" />
              {h}
            </li>
          ))}
        </ul>
      )}
      {meetup.spotlight && (
        <p className="rounded-md bg-sand/70 px-4 py-3 text-[0.92rem] text-ink-2">
          <span className="font-semibold text-ink">Member spotlight: </span>
          {meetup.spotlight}
        </p>
      )}
      {groups.map(({ icon: Icon, label, items }) => (
        <div key={label}>
          <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-ink">
            <Icon aria-hidden className="size-4 text-accent" /> {label}
          </p>
          <p className="mt-1 text-[0.92rem] text-ink-2">{items.join(" · ")}</p>
        </div>
      ))}
    </div>
  );
}

function LatestMeetupEmpty({ chapter }: { chapter: ChapterSettings }) {
  return (
    <section aria-labelledby="latest-meetup" className="page-x">
      <div className="grid gap-8 rounded-lg border border-line bg-surface p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="eyebrow">Weekly meetings</p>
          <h2 id="latest-meetup" className="display mt-3 text-[1.9rem] sm:text-[2.3rem]">
            See what happens at our weekly meetings.
          </h2>
          <p className="mt-3 text-muted">
            Every {chapter.meeting.day} morning, members meet to share what they do, pass referrals and welcome visitors.
            Photos from our meetings will appear here.
          </p>
          <ButtonLink href="/visit" variant="primary" className="mt-6">
            Visit a meeting
          </ButtonLink>
        </div>
        {chapter.content.agenda.length > 0 && (
          <ol className="divide-y divide-line border-y border-line">
            {chapter.content.agenda.slice(0, 5).map((a, i) => (
              <li key={i} className="flex gap-4 py-3">
                <span className="display w-6 text-lg text-faint">{i + 1}</span>
                <span className="text-[0.95rem] text-ink-2">{a.title}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
