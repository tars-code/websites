import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarDays, Clock, ExternalLink, Mail, MapPin, Video, MessageCircle, Phone } from "lucide-react";
import { chapterWhatsapp, formatLabels, meetingModeOn, meetingPlace, meetingPlaceLines } from "@/lib/chapter-text";
import { getChapter, getNextMeeting } from "@/lib/data";
import { addDays, formatDateLong, formatTimeRange, relativeDay, todayInZone } from "@/lib/dates";
import { safeUrl, telLink } from "@/lib/utils";
import { Paragraphs } from "@/components/ui/text";
import { VisitForm } from "@/components/site/visit-form";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await getChapter();
  return {
    title: "Visit our chapter",
    description: `Visit a ${chapter.name} meeting as our guest — every ${chapter.meeting.day}, ${formatTimeRange(chapter.meeting.startTime, chapter.meeting.endTime)}. See what to expect and request a visit.`,
    alternates: { canonical: "/visit" },
  };
}

export default async function VisitPage() {
  const [chapter, next] = await Promise.all([getChapter(), getNextMeeting()]);
  const today = todayInZone(chapter.timezone);
  const rel = relativeDay(next.date, today);
  const dates = [0, 1, 2, 3, 4].map((i) => {
    const date = addDays(next.date, i * 7);
    const mode = meetingModeOn(chapter, date);
    return { value: date, note: mode === "online" ? chapter.meeting.onlinePlatform || "online" : mode === "in_person" ? "in person" : "" };
  });
  const wa = chapterWhatsapp(chapter);
  const mapUrl = safeUrl(chapter.meeting.mapUrl);
  const onlineUrl = safeUrl(chapter.meeting.onlineUrl);
  const c = chapter.content;

  return (
    <>
      <header className="border-b border-line">
        <div className="page-x grid gap-10 pt-10 pb-12 sm:pt-14 lg:grid-cols-12 lg:gap-12 lg:pb-16">
          <div className="animate-rise lg:col-span-7">
            <p className="eyebrow">Visit / Join</p>
            <h1 className="display mt-3 text-[2.4rem] sm:text-[3.2rem]">Visit our chapter</h1>
            <p className="mt-4 max-w-xl text-[1.08rem] leading-relaxed text-ink-2">
              The best way to understand {chapter.name} is to spend one morning with us. Come as our guest, meet the
              members and introduce your business. There&apos;s no obligation to join.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <a
                href="#request"
                className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-5 font-medium text-white transition-colors hover:bg-accent-ink"
              >
                Request a visit
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-5 font-medium hover:border-ink"
                >
                  <MessageCircle aria-hidden className="size-4" /> WhatsApp us
                </a>
              )}
            </div>
          </div>

          <aside aria-label="When and where" className="lg:col-span-5">
            <dl className="divide-y divide-line rounded-lg border border-line bg-surface">
              <div className="flex gap-4 p-5">
                <CalendarDays aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <dt className="text-[0.8rem] text-muted">Next meeting{rel && ` · ${rel}`}</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{formatDateLong(next.date, false)}</dd>
                  <dd className="text-[0.88rem] text-muted">Every {chapter.meeting.day}</dd>
                </div>
              </div>
              <div className="flex gap-4 p-5">
                <Clock aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <dt className="text-[0.8rem] text-muted">Time</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{formatTimeRange(next.startTime, next.endTime)}</dd>
                  <dd className="text-[0.88rem] text-muted">Please join a few minutes early</dd>
                </div>
              </div>
              <div className="flex gap-4 p-5">
                {next.mode === "online" ? (
                  <Video aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                ) : (
                  <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                )}
                <div>
                  <dt className="text-[0.8rem] text-muted">{formatLabels[next.mode]}</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{next.venueName}</dd>
                  {next.address && <dd className="text-[0.88rem] text-muted">{next.address}</dd>}
                  {next.mode === "online" && (
                    <dd className="text-[0.88rem] text-muted">We&apos;ll send you the link when you request a visit</dd>
                  )}
                  {chapter.meeting.pattern === "first_in_person" && (
                    <dd className="mt-2 text-[0.84rem] text-muted">
                      {meetingPlaceLines(chapter).map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </dd>
                  )}
                  {(mapUrl || onlineUrl) && (
                    <dd className="mt-2 flex flex-wrap gap-4 text-[0.88rem]">
                      {mapUrl && (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ink link-underline">
                          Open in Maps <ExternalLink aria-hidden className="size-3.5" />
                        </a>
                      )}
                      {onlineUrl && next.mode !== "in_person" && (
                        <a href={onlineUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ink link-underline">
                          Online link <ExternalLink aria-hidden className="size-3.5" />
                        </a>
                      )}
                    </dd>
                  )}
                </div>
              </div>
            </dl>
          </aside>
        </div>
      </header>

      {/* What happens */}
      {c.agenda.length > 0 && (
        <section aria-labelledby="agenda" className="page-x mt-16 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">A typical meeting</p>
            <h2 id="agenda" className="display mt-3 text-[1.9rem]">What happens in the room</h2>
            {chapter.meeting.visitorNote && (
              <Paragraphs text={chapter.meeting.visitorNote} className="mt-4 text-[0.95rem] leading-relaxed text-muted" />
            )}
          </div>
          <ol className="relative lg:col-span-8">
            {c.agenda.map((a, i) => (
              <li key={i} className="relative flex gap-5 pb-7 last:pb-0">
                {i < c.agenda.length - 1 && (
                  <span aria-hidden className="absolute top-9 bottom-1 left-[17px] w-px bg-line-strong" />
                )}
                <span className="display relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper text-[0.95rem]">
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-semibold text-ink">{a.title}</h3>
                  <p className="mt-1 text-[0.94rem] leading-relaxed text-muted">{a.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Who should visit + expectations */}
      {(c.audience.length > 0 || c.whyVisit.length > 0) && (
        <section className="mt-16 bg-sand/70 py-14">
          <div className="page-x grid gap-10 lg:grid-cols-2 lg:gap-16">
            {c.audience.length > 0 && (
              <div>
                <h2 className="display text-[1.6rem]">Who should visit</h2>
                <ul className="mt-5 space-y-3">
                  {c.audience.map((a) => (
                    <li key={a} className="flex gap-3 text-[0.98rem] text-ink-2">
                      <span aria-hidden className="mt-[0.65em] h-px w-3 shrink-0 bg-accent" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {c.whyVisit.length > 0 && (
              <div>
                <h2 className="display text-[1.6rem]">What to expect</h2>
                <ul className="mt-5 space-y-4">
                  {c.whyVisit.slice(0, 4).map((w) => (
                    <li key={w.title}>
                      <p className="font-semibold text-ink">{w.title}</p>
                      <p className="mt-0.5 text-[0.94rem] leading-relaxed text-muted">{w.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Request form */}
      <section id="request" aria-labelledby="request-heading" className="page-x scroll-mt-24 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="eyebrow">Request a visit</p>
            <h2 id="request-heading" className="display mt-3 text-[1.9rem]">Let us know you&apos;re coming</h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">
              Share a few details and we&apos;ll confirm your visit and help you prepare. It takes under a minute.
            </p>
            {(chapter.contact.name || chapter.contact.phone || chapter.contact.email || wa) && (
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-[0.8rem] text-muted">Prefer to talk first?</p>
                {chapter.contact.name && (
                  <p className="mt-1 font-semibold">
                    {chapter.contact.name}
                    {chapter.contact.role && <span className="font-normal text-muted"> · {chapter.contact.role}</span>}
                  </p>
                )}
                <ul className="mt-3 space-y-1 text-[0.94rem]">
                  {wa && (
                    <li>
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2.5 text-ink-2 hover:text-ink">
                        <MessageCircle aria-hidden className="size-4 text-muted" /> WhatsApp
                      </a>
                    </li>
                  )}
                  {chapter.contact.phone && (
                    <li>
                      <a href={telLink(chapter.contact.phone)} className="inline-flex min-h-10 items-center gap-2.5 text-ink-2 hover:text-ink">
                        <Phone aria-hidden className="size-4 text-muted" /> {chapter.contact.phone}
                      </a>
                    </li>
                  )}
                  {chapter.contact.email && (
                    <li>
                      <a href={`mailto:${chapter.contact.email}`} className="inline-flex min-h-10 items-center gap-2.5 break-all text-ink-2 hover:text-ink">
                        <Mail aria-hidden className="size-4 shrink-0 text-muted" /> {chapter.contact.email}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
              <Suspense fallback={<div className="h-96" />}>
                <VisitForm dates={dates} whatsappHref={wa} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {c.faqs.length > 0 && (
        <section aria-labelledby="faq" className="page-x pb-20">
          <h2 id="faq" className="display text-[1.9rem]">Questions visitors ask</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {c.faqs.map((f) => (
              <details key={f.title} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {f.title}
                  <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-[0.96rem] leading-relaxed text-muted">{f.text}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-[0.85rem] text-muted">Meeting location: {meetingPlace(chapter)}</p>
        </section>
      )}
    </>
  );
}
