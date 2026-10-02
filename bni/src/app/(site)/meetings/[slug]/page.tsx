import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, MapPin, Megaphone } from "lucide-react";
import { eventKindLabels, placeOn } from "@/lib/chapter-text";
import { getChapter, getEventBySlug, getEventPhotos, getPastEvents } from "@/lib/data";
import { formatDateLong, formatDateMedium, formatTimeRange, todayInZone } from "@/lib/dates";
import { env } from "@/lib/env";
import { toImg } from "@/lib/media";
import { Badge, SampleTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { Paragraphs } from "@/components/ui/text";
import { MeetupHighlights } from "@/components/site/latest-meetup";
import { MeetupStatsRow } from "@/components/site/meetup-stats";
import { PhotoGallery } from "@/components/site/photo-gallery";
import { ShareButtons } from "@/components/site/share-buttons";

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/meetings/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [event, chapter] = await Promise.all([getEventBySlug(slug), getChapter()]);
  if (!event) return { title: "Not found" };
  const title = `${event.title} — ${formatDateMedium(event.date)}`;
  const description = event.summary || `${eventKindLabels[event.kind]} of ${chapter.name} on ${formatDateLong(event.date)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/meetings/${event.slug}` },
    openGraph: {
      type: "article",
      title: `${title} · ${chapter.name}`,
      description,
      // The cover photo becomes the WhatsApp/LinkedIn preview when members share the link.
      ...(event.cover
        ? { images: [{ url: event.cover.large, width: event.cover.width, height: event.cover.height, alt: event.title }] }
        : {}),
    },
    twitter: { card: event.cover ? "summary_large_image" : "summary" },
  };
}

export default async function MeetingPage({ params }: PageProps<"/meetings/[slug]">) {
  const { slug } = await params;
  const [event, chapter] = await Promise.all([getEventBySlug(slug), getChapter()]);
  if (!event) notFound();

  const [photos, past] = await Promise.all([getEventPhotos(event.id), getPastEvents()]);
  const images = photos.map((p, i) => toImg(p, `${event.title}, ${formatDateMedium(event.date)} — photo ${i + 1}`));
  const today = todayInZone(chapter.timezone);
  const isUpcoming = event.date >= today && images.length === 0;
  const location = event.location || placeOn(chapter, event.date);

  const idx = past.findIndex((e) => e.id === event.id);
  const newer = idx > 0 ? past[idx - 1] : null;
  const older = idx >= 0 && idx < past.length - 1 ? past[idx + 1] : null;
  const shareUrl = `${env.siteUrl}/meetings/${event.slug}`;

  return (
    <article className="pb-20">
      <header className="page-x pt-6 sm:pt-8">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1.5 py-2 text-[0.88rem] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" /> All meetings
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge tone={event.kind === "weekly_meeting" ? "neutral" : "accent"}>{eventKindLabels[event.kind]}</Badge>
          {isUpcoming && <Badge tone="open">Upcoming</Badge>}
          <SampleTag show={event.isSample} />
        </div>
        <h1 className="display mt-3 text-[2.2rem] sm:text-[3rem]">{event.title}</h1>
        <p className="mt-2 text-[1.05rem] text-ink-2">{formatDateLong(event.date)}</p>
        <p className="mt-3 flex flex-col gap-1.5 text-[0.92rem] text-muted sm:flex-row sm:gap-6">
          {event.startTime && (
            <span className="inline-flex items-center gap-2">
              <Clock aria-hidden className="size-4" /> {formatTimeRange(event.startTime, event.endTime)}
            </span>
          )}
          {location && (
            <span className="inline-flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" /> {location}
            </span>
          )}
        </p>
      </header>

      {!isUpcoming && event.cover && (
        <div className="page-x mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-sand sm:aspect-[21/9]">
            <SmartImage img={event.cover} fill priority sizes="(min-width: 1200px) 1140px, 100vw" />
          </div>
        </div>
      )}

      <div className="page-x mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <MeetupStatsRow stats={event.stats} className="border-y border-line py-5" />
          {event.summary && <p className="mt-6 text-[1.12rem] leading-relaxed text-ink">{event.summary}</p>}
          {event.body && <Paragraphs text={event.body} className="mt-5 text-[1rem] leading-relaxed text-ink-2" />}
          {(event.highlights.length > 0 || event.spotlight || event.celebrations.length > 0) && (
            <section className="mt-8">
              <h2 className="eyebrow">Highlights</h2>
              <MeetupHighlights meetup={event} />
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:col-span-5">
          {isUpcoming && (
            <div className="rounded-lg border border-line bg-surface p-6">
              <h2 className="display text-xl">Visiting?</h2>
              <Paragraphs
                text={event.visitorInfo || chapter.meeting.visitorNote}
                className="mt-2 text-[0.95rem] leading-relaxed text-muted"
              />
              <ButtonLink href="/visit#request" variant="accent" className="mt-5 w-full">
                Request a visit
              </ButtonLink>
            </div>
          )}

          {event.announcements.length > 0 && (
            <div className="rounded-lg bg-sand/70 p-6">
              <h2 className="flex items-center gap-2 text-[0.85rem] font-semibold">
                <Megaphone aria-hidden className="size-4 text-accent" /> Announcements
              </h2>
              <ul className="mt-3 space-y-2 text-[0.94rem] text-ink-2">
                {event.announcements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {event.visitors.length > 0 && (
            <div className="rounded-lg border border-line p-6">
              <h2 className="text-[0.85rem] font-semibold">Visitors we welcomed</h2>
              <ul className="mt-3 divide-y divide-line text-[0.94rem]">
                {event.visitors.map((v, i) => (
                  <li key={i} className="flex justify-between gap-3 py-2">
                    <span className="text-ink">{v.name}</span>
                    <span className="text-right text-muted">{v.business}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isUpcoming && (
            <div>
              <h2 className="eyebrow mb-3">Share this meetup</h2>
              <ShareButtons
                url={shareUrl}
                title={`${event.title} · ${chapter.name}`}
                text={`${chapter.name} — ${event.title}, ${formatDateMedium(event.date)}`}
              />
            </div>
          )}
        </aside>
      </div>

      {images.length > 0 && (
        <section aria-labelledby="photos" className="page-x mt-14">
          <h2 id="photos" className="display text-2xl">
            Photos <span className="text-faint">· {images.length}</span>
          </h2>
          <PhotoGallery images={images} label={event.title} className="mt-5" />
        </section>
      )}

      {(newer || older) && (
        <nav aria-label="More meetups" className="page-x mt-16">
          <div className="grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          {older ? (
            <Link href={`/meetings/${older.slug}`} className="group rounded-md p-3 -m-3 hover:bg-sand/60">
              <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
                <ArrowLeft aria-hidden className="size-3.5" /> Previous
              </span>
              <span className="mt-1 block font-medium">
                {older.title} · {formatDateMedium(older.date)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {newer && (
            <Link href={`/meetings/${newer.slug}`} className="group -m-3 rounded-md p-3 text-right hover:bg-sand/60">
              <span className="flex items-center justify-end gap-1.5 text-[0.8rem] text-muted">
                Next <ArrowRight aria-hidden className="size-3.5" />
              </span>
              <span className="mt-1 block font-medium">
                {newer.title} · {formatDateMedium(newer.date)}
              </span>
            </Link>
          )}
          </div>
        </nav>
      )}
    </article>
  );
}
