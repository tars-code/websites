import Link from "next/link";
import { chapterWhatsapp, meetingPlaceLines, meetingSchedule } from "@/lib/chapter-text";
import { getChapter } from "@/lib/data";
import { safeUrl, telLink } from "@/lib/utils";
import { primaryNav } from "./nav-config";
import { TarsCredit } from "./tars-card";

export async function SiteFooter() {
  const chapter = await getChapter();
  const wa = chapterWhatsapp(chapter);
  const year = new Date().getFullYear();
  const social = chapter.social.filter((s) => s.label && safeUrl(s.url));
  const bni = chapter.bniLinks.filter((s) => s.label && safeUrl(s.url));

  return (
    <footer className="mt-auto border-t border-line bg-sand/60 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="page-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="display text-xl">{chapter.name}</p>
          <p className="mt-2 max-w-xs text-[0.92rem] leading-relaxed text-muted">{chapter.tagline}</p>
          <dl className="mt-5 space-y-1 text-[0.9rem]">
            <dt className="sr-only">When</dt>
            <dd className="text-ink-2">{meetingSchedule(chapter)}</dd>
            <dt className="sr-only">Where</dt>
            {meetingPlaceLines(chapter).map((l) => (
              <dd key={l} className="text-muted">
                {l}
              </dd>
            ))}
          </dl>
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow mb-3">Explore</p>
          <ul className="space-y-2 text-[0.92rem]">
            {primaryNav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-ink-2 hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/visit" className="text-ink-2 hover:text-ink">
                Visit us
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="eyebrow mb-3">Get in touch</p>
          <ul className="space-y-2 text-[0.92rem] text-ink-2">
            {chapter.contact.name && (
              <li>
                {chapter.contact.name}
                {chapter.contact.role && <span className="text-muted"> · {chapter.contact.role}</span>}
              </li>
            )}
            {chapter.contact.phone && (
              <li>
                <a href={telLink(chapter.contact.phone)} className="hover:text-ink">
                  {chapter.contact.phone}
                </a>
              </li>
            )}
            {chapter.contact.email && (
              <li>
                <a href={`mailto:${chapter.contact.email}`} className="break-all hover:text-ink">
                  {chapter.contact.email}
                </a>
              </li>
            )}
            {wa && (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  WhatsApp
                </a>
              </li>
            )}
            <li>
              <a href="/chapter-meeting.ics" className="hover:text-ink">
                Add meeting to calendar
              </a>
            </li>
            {[...social, ...bni].map((s) => (
              <li key={s.url}>
                <a href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="border-t border-line">
        <div className="page-x flex flex-col gap-2 py-5 text-[0.78rem] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {chapter.name}. BNI® is a registered trademark of BNI Global, LLC.
          </p>
          <div className="flex items-center gap-4">
            <TarsCredit attribution={chapter.attribution} />
            <Link href="/admin" className="hover:text-ink" rel="nofollow">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
