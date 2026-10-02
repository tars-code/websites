import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Mail, MessageCircle, Phone } from "lucide-react";
import { getChapter, getMemberBySlug, getMembers } from "@/lib/data";
import { displayUrl, safeUrl, telLink, whatsappLink } from "@/lib/utils";
import { SampleTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Paragraphs } from "@/components/ui/text";
import { MemberCard, MemberPortrait } from "@/components/site/member-card";

export const revalidate = 600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/members/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [member, chapter] = await Promise.all([getMemberBySlug(slug), getChapter()]);
  if (!member) return { title: "Member not found" };
  const title = `${member.name} — ${member.businessName}`;
  // Only public, card-level information goes into metadata — never contact details.
  const description =
    member.headline ||
    `${member.name} represents ${member.category?.name ?? "their business"} at ${chapter.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/members/${member.slug}` },
    robots: chapter.membersIndexable ? undefined : { index: false, follow: true },
    openGraph: {
      type: "profile",
      title,
      description,
      ...(member.img ? { images: [{ url: member.img.large, alt: member.name }] } : {}),
    },
  };
}

export default async function MemberPage({ params }: PageProps<"/members/[slug]">) {
  const { slug } = await params;
  const [member, chapter, all] = await Promise.all([getMemberBySlug(slug), getChapter(), getMembers()]);
  if (!member) notFound();

  const website = safeUrl(member.website);
  const wa = whatsappLink(member.whatsapp, `Hi ${member.name.split(" ")[0]}, I found you on the ${chapter.name} website.`);
  const social = member.social.filter((s) => s.label && safeUrl(s.url));
  const hasContact = website || member.phone || member.email || wa || social.length;
  const firstName = member.name.split(" ")[0];
  const related = all
    .filter((m) => m.id !== member.id && m.category?.group && m.category.group === member.category?.group)
    .slice(0, 4);

  return (
    <article className="page-x pt-6 pb-20 sm:pt-8">
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 py-2 text-[0.88rem] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" /> Back to members
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <div className="mx-auto max-w-[340px] lg:max-w-none">
              <MemberPortrait member={member} sizes="(min-width: 1024px) 360px, 340px" priority />
            </div>

            {hasContact ? (
              <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                <h2 className="eyebrow">Contact</h2>
                <ul className="mt-3 space-y-1 text-[0.94rem]">
                  {website && (
                    <ContactRow href={website} icon={Globe} label={displayUrl(website)} external />
                  )}
                  {member.phone && <ContactRow href={telLink(member.phone)} icon={Phone} label={member.phone} />}
                  {wa && <ContactRow href={wa} icon={MessageCircle} label="WhatsApp" external />}
                  {member.email && <ContactRow href={`mailto:${member.email}`} icon={Mail} label={member.email} />}
                </ul>
                {social.length > 0 && (
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[0.88rem]">
                    {social.map((s) => (
                      <a key={s.url} href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer" className="link-underline text-ink-2">
                        {s.label}
                      </a>
                    ))}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-8 lg:pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.75rem] font-semibold tracking-[0.1em] text-accent-ink uppercase">
              {member.category?.name ?? "Member"}
            </p>
            <SampleTag show={member.isSample} />
          </div>
          <h1 className="display mt-2 text-[2.3rem] sm:text-[3rem]">{member.name}</h1>
          <p className="mt-1 text-[1.1rem] text-ink-2">
            {member.businessName}
            {member.role && <span className="text-muted"> · {member.role}, {chapter.name}</span>}
          </p>

          {member.headline && (
            <p className="mt-6 max-w-2xl border-l-2 border-accent pl-4 text-[1.15rem] leading-relaxed text-ink">
              {member.headline}
            </p>
          )}

          {member.about && (
            <section className="mt-10 max-w-2xl">
              <h2 className="eyebrow mb-3">About</h2>
              <Paragraphs text={member.about} className="text-[1.02rem] leading-relaxed text-ink-2" />
            </section>
          )}

          {member.services.length > 0 && (
            <section className="mt-10 max-w-2xl">
              <h2 className="eyebrow mb-3">Services</h2>
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {member.services.map((s) => (
                  <li key={s} className="flex gap-3 border-b border-line py-2.5 text-[0.98rem] text-ink-2">
                    <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-accent" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {member.referralTips && (
            <section className="mt-10 max-w-2xl rounded-lg bg-sand/70 p-6">
              <h2 className="eyebrow mb-2">A good referral for {firstName}</h2>
              <Paragraphs text={member.referralTips} className="text-[1rem] leading-relaxed text-ink" />
            </section>
          )}

          <section className="mt-10 flex max-w-2xl flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.98rem] text-ink-2">
              Meet {firstName} and the rest of the chapter every {chapter.meeting.day}.
            </p>
            <ButtonLink href="/visit" variant="accent" className="shrink-0">
              Visit a meeting
            </ButtonLink>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-20 border-t border-line pt-12">
          <h2 id="related" className="display text-2xl">
            Also in {member.category?.group}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:gap-x-6">
            {related.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function ContactRow({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: typeof Globe;
  label: string;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        className="-mx-2 flex min-h-11 items-center gap-3 rounded-md px-2 text-ink-2 transition-colors hover:bg-sand hover:text-ink"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <Icon aria-hidden className="size-4 shrink-0 text-muted" />
        <span className="truncate">{label}</span>
      </a>
    </li>
  );
}
