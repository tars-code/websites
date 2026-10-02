import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, MessageCircle, Users, Video } from "lucide-react";
import { chapterWhatsapp, meetingPlaceLines, meetingSchedule, placeOn } from "@/lib/chapter-text";
import {
  getCategoryViews,
  getChapter,
  getEventPhotos,
  getImg,
  getLatestMeetup,
  getMembers,
  getNextMeeting,
  getSnapshot,
  getUpcomingEvents,
} from "@/lib/data";
import { formatTimeRange, todayInZone } from "@/lib/dates";
import { env } from "@/lib/env";
import { toImg } from "@/lib/media";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink, SectionHeader } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { SmartImage } from "@/components/ui/smart-image";
import { UpcomingEventRow } from "@/components/site/event-card";
import { LatestMeetup } from "@/components/site/latest-meetup";
import { MemberRosterItem } from "@/components/site/member-card";
import { NextMeetingBand } from "@/components/site/next-meeting";
import { StatsStrip } from "@/components/site/stats-strip";
import { JsonLd, chapterJsonLd } from "@/components/site/json-ld";

export const revalidate = 600;

export default async function HomePage() {
  const [chapter, next, snapshot, latest, members, categories, upcoming] = await Promise.all([
    getChapter(),
    getNextMeeting(),
    getSnapshot(),
    getLatestMeetup(),
    getMembers(),
    getCategoryViews(),
    getUpcomingEvents(),
  ]);
  const today = todayInZone(chapter.timezone);
  const latestPhotos = latest ? (await getEventPhotos(latest.id)).map((p) => toImg(p, latest.title)) : [];
  const heroImg = (await getImg(chapter.heroPhotoId, chapter.name)) ?? latest?.cover ?? null;

  const roster = [...members].sort((a, b) => a.name.localeCompare(b.name));
  const filled = categories.filter((c) => c.status === "filled");
  const open = categories
    .filter((c) => c.status === "open")
    .sort((a, b) => Number(b.priority) - Number(a.priority));
  const otherUpcoming = upcoming.filter((e) => e.id !== next.event?.id).slice(0, 3);
  const wa = chapterWhatsapp(chapter);

  return (
    <>
      <JsonLd data={chapterJsonLd(chapter, next, env.siteUrl)} />

      {/* ───────────── Hero ───────────── */}
      <section className="page-x pt-8 pb-8 sm:pt-12 lg:pt-16 lg:pb-12">
        <div className={heroImg ? "grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12" : "max-w-3xl"}>
          <div className="animate-rise lg:col-span-6">
            <p className="eyebrow">
              BNI chapter <span className="text-line-strong">/</span> {chapter.city}
            </p>
            <h1 className="display mt-4 text-[2.5rem] text-ink sm:text-[3.2rem] lg:text-[3.6rem]">
              {chapter.name}
            </h1>
            <p className="mt-4 max-w-xl text-[1.06rem] leading-relaxed text-ink-2 sm:text-[1.12rem]">
              {chapter.tagline}
            </p>
            <ul className="mt-6 space-y-2 text-[0.95rem] text-ink-2">
              <li className="flex items-center gap-2.5">
                <CalendarDays aria-hidden className="size-4 text-accent" />
                {meetingSchedule(chapter)}
              </li>
              {meetingPlaceLines(chapter).map((line, i) => (
                <li key={line} className="flex items-start gap-2.5">
                  {i === 0 ? (
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                  ) : (
                    <Video aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                  )}
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <ButtonLink href="/visit" variant="accent" size="lg">
                Visit our chapter
              </ButtonLink>
              <ButtonLink href="/members" variant="secondary" size="lg">
                Meet our members
              </ButtonLink>
            </div>
          </div>
          {heroImg && (
            <div className="relative lg:col-span-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand shadow-[var(--shadow-card)]">
                <SmartImage img={heroImg} fill priority sizes="(min-width: 1024px) 580px, 100vw" />
              </div>
              {latest && !chapter.heroPhotoId && (
                <Link
                  href={`/meetings/${latest.slug}`}
                  className="absolute -bottom-4 left-4 inline-flex items-center gap-2 rounded-md bg-paper px-3.5 py-2.5 text-[0.85rem] shadow-[var(--shadow-lift)] sm:left-6"
                >
                  <span className="size-2 rounded-full bg-accent" aria-hidden />
                  <span className="font-medium">From our latest meeting</span>
                  <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <NextMeetingBand next={next} today={today} className="mt-2" />

      {snapshot.length > 0 && <StatsStrip stats={snapshot} className="mt-10 sm:mt-12" />}

      <div className="mt-14 sm:mt-20">
        <LatestMeetup meetup={latest} photos={latestPhotos} chapter={chapter} today={today} />
      </div>

      {/* ───────────── Members ───────────── */}
      <section aria-labelledby="members-heading" className="page-x mt-20 sm:mt-28">
        <SectionHeader
          id="members-heading"
          eyebrow="Members"
          title={roster.length ? `Meet all ${roster.length} of our members` : "Meet our members"}
          description="Owners and professionals who meet every week and refer business to each other."
        />
        {roster.length ? (
          <>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {roster.map((m) => (
                <li key={m.id}>
                  <MemberRosterItem member={m} />
                </li>
              ))}
            </ul>
            <ArrowLink href="/members" className="mt-5">
              Search members by name, business or service
            </ArrowLink>
          </>
        ) : (
          <EmptyState icon={Users} title="Member profiles are on their way" className="mt-8">
            We&apos;re adding our members&apos; profiles. In the meantime, the best way to meet them is in person.
          </EmptyState>
        )}
      </section>

      {/* ───────────── Categories ───────────── */}
      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="page-x mt-20 sm:mt-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <SectionHeader
                id="categories-heading"
                eyebrow="Business categories"
                title="Who's in the room"
                description="One member per category, so every member can refer with confidence."
              />
              {filled.length > 0 ? (
                <ul className="mt-7 flex flex-wrap gap-2">
                  {filled.slice(0, 24).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={c.members[0] ? `/members/${c.members[0].slug}` : "/categories"}
                        className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-[0.9rem] transition-colors hover:border-ink"
                      >
                        <span className="font-medium text-ink">{c.name}</span>
                        {c.members[0] && <span className="text-muted">· {c.members[0].name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-muted">Category details will be listed here soon.</p>
              )}
              <ArrowLink href="/categories" className="mt-5">
                Explore all categories
              </ArrowLink>
            </div>

            {open.length > 0 && (
              <aside
                aria-labelledby="open-heading"
                className="self-start rounded-lg border border-open/20 bg-open-soft/60 p-6 sm:p-7 lg:col-span-5"
              >
                <p className="eyebrow text-open!">Looking to join?</p>
                <h3 id="open-heading" className="display mt-2 text-[1.5rem]">
                  These categories are currently open
                </h3>
                <ul className="mt-5 divide-y divide-open/15 border-y border-open/15">
                  {open.slice(0, 8).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-[0.95rem]">
                      <span className="text-ink">{c.name}</span>
                      {c.priority && <span className="text-[0.75rem] font-semibold text-open">Priority</span>}
                    </li>
                  ))}
                </ul>
                {open.length > 8 && <p className="mt-3 text-sm text-muted">+ {open.length - 8} more</p>}
                <ButtonLink href="/categories?status=open" variant="primary" className="mt-6 w-full sm:w-auto">
                  Check available categories
                </ButtonLink>
                <p className="mt-4 text-[0.8rem] leading-relaxed text-muted">
                  Availability is subject to chapter approval and BNI membership requirements.
                </p>
              </aside>
            )}
          </div>
        </section>
      )}

      {/* ───────────── How a meeting works ───────────── */}
      {chapter.content.agenda.length > 0 && (
        <section aria-labelledby="flow-heading" className="mt-20 bg-sand/70 py-16 sm:mt-28 sm:py-20">
          <div className="page-x">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="eyebrow">First time?</p>
                <h2 id="flow-heading" className="display mt-3 text-[1.9rem] sm:text-[2.3rem]">
                  How a BNI meeting works
                </h2>
                <p className="mt-3 text-muted">
                  {meetingSchedule(chapter)}. Here&apos;s what you&apos;ll experience as a guest.
                </p>
              </div>
              <ArrowLink href="/visit" className="shrink-0 max-sm:hidden">
                Plan your visit
              </ArrowLink>
            </div>
            <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {chapter.content.agenda.map((item, i) => (
                <li key={i} className="border-t border-line-strong pt-5">
                  <span className="display text-[0.95rem] text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-[1.05rem] font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-[0.94rem] leading-relaxed text-muted">{item.text}</p>
                </li>
              ))}
            </ol>
            <ButtonLink href="/visit" variant="primary" className="mt-10 w-full sm:hidden">
              Plan your visit
            </ButtonLink>
          </div>
        </section>
      )}

      {/* ───────────── Upcoming events ───────────── */}
      <section aria-labelledby="events-heading" className="page-x mt-20 sm:mt-24">
        <SectionHeader
          id="events-heading"
          eyebrow="Calendar"
          title="Upcoming events"
          action={{ href: "/meetings", label: "All meetings & events" }}
        />
        {otherUpcoming.length ? (
          <div className="mt-6 divide-y divide-line border-y border-line">
            {otherUpcoming.map((e) => (
              <UpcomingEventRow key={e.id} event={e} today={today} defaultLocation={placeOn(chapter, e.date)} />
            ))}
          </div>
        ) : (
          <p className="mt-6 border-y border-line py-6 text-[0.95rem] text-muted">
            No special events scheduled right now. We meet {`every ${chapter.meeting.day}, ${formatTimeRange(chapter.meeting.startTime, chapter.meeting.endTime)}`} — visitors are
            always welcome.
          </p>
        )}
      </section>

      {/* ───────────── Final CTA ───────────── */}
      <section aria-labelledby="cta-heading" className="page-x mt-20 mb-16 sm:mt-24 sm:mb-24">
        <div className="relative overflow-hidden rounded-lg bg-ink px-6 py-12 text-white sm:px-12 sm:py-16">
          <div aria-hidden className="absolute top-0 left-0 h-1 w-24 bg-accent" />
          <h2 id="cta-heading" className="display max-w-xl text-[2rem] sm:text-[2.6rem]">
            Interested in visiting our chapter?
          </h2>
          <p className="mt-4 max-w-lg text-white/70">
            Come as our guest. Meet the members, introduce your business and see how the chapter works — no
            obligation.
          </p>
          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <ButtonLink href="/visit" variant="light" size="lg">
              Plan your visit
            </ButtonLink>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-5 font-medium hover:bg-white/10"
              >
                <MessageCircle aria-hidden className="size-4" /> Contact us
              </a>
            ) : (
              <Link
                href="/visit#request"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/25 px-5 font-medium hover:bg-white/10"
              >
                Contact us
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
