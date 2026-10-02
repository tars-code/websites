import type { Metadata } from "next";
import Link from "next/link";
import { meetingPlace, meetingSchedule } from "@/lib/chapter-text";
import { getChapter, getMembers } from "@/lib/data";
import { safeUrl } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/section";
import { Avatar } from "@/components/ui/smart-image";
import { Paragraphs } from "@/components/ui/text";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await getChapter();
  return {
    title: "About the chapter",
    description: chapter.description,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [chapter, members] = await Promise.all([getChapter(), getMembers()]);
  const leaders = members.filter((m) => m.role);
  const links = chapter.bniLinks.filter((l) => l.label && safeUrl(l.url));

  return (
    <>
      <PageIntro eyebrow="About" title={`About ${chapter.name}`}>
        <Paragraphs text={chapter.description} />
      </PageIntro>

      <div className="page-x pb-20">
        {chapter.content.about.length > 0 && (
          <section aria-label="How we work" className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {chapter.content.about.map((s, i) => (
              <div key={i} className="border-t border-line-strong pt-6">
                <span className="display text-[0.95rem] text-accent-ink">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="display mt-2 text-[1.5rem]">{s.title}</h2>
                <Paragraphs text={s.text} className="mt-3 text-[1rem] leading-relaxed text-ink-2" />
              </div>
            ))}
          </section>
        )}

        <section aria-labelledby="when" className="mt-16 grid gap-6 rounded-lg bg-sand/70 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 id="when" className="display text-[1.6rem]">When & where we meet</h2>
            <p className="mt-2 text-ink-2">{meetingSchedule(chapter)}</p>
            <p className="text-muted">{meetingPlace(chapter)}</p>
          </div>
          <ButtonLink href="/visit" variant="accent" size="lg">
            Visit a meeting
          </ButtonLink>
        </section>

        {leaders.length > 0 && (
          <section aria-labelledby="leadership" className="mt-16">
            <h2 id="leadership" className="display text-[1.8rem]">Leadership team</h2>
            <p className="mt-2 text-muted">Members who volunteer to run the chapter this term.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/members/${m.slug}`}
                    className="flex items-center gap-4 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-ink"
                  >
                    <Avatar img={m.img} name={m.name} size={56} />
                    <div className="min-w-0">
                      <p className="text-[0.75rem] font-semibold tracking-wide text-accent-ink uppercase">{m.role}</p>
                      <p className="truncate font-semibold">{m.name}</p>
                      <p className="truncate text-[0.88rem] text-muted">{m.businessName}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {links.length > 0 && (
          <section aria-labelledby="bni" className="mt-16 border-t border-line pt-10">
            <h2 id="bni" className="display text-[1.5rem]">Part of BNI</h2>
            <p className="mt-2 max-w-2xl text-muted">
              {chapter.name} is a chapter of BNI (Business Network International), a business referral organisation
              with chapters around the world.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {links.map((l) => (
                <li key={l.url}>
                  <a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer" className="link-underline font-medium">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
