import Link from "next/link";
import { Globe, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import type { MemberView } from "@/lib/data";
import { cn, initials, safeUrl, telLink, whatsappLink } from "@/lib/utils";
import { SampleTag } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";

export function MemberPortrait({ member, sizes, priority }: { member: MemberView; sizes: string; priority?: boolean }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand">
      {member.img ? (
        <SmartImage
          img={member.img}
          sizes={sizes}
          fill
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-[1.025]"
        />
      ) : (
        <div aria-hidden className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sand to-sand-2">
          <span className="display text-5xl text-ink-2/70">{initials(member.name)}</span>
        </div>
      )}
      {member.role && (
        <span className="absolute top-2.5 left-2.5 rounded-sm bg-paper/95 px-2 py-0.5 text-[0.68rem] font-semibold tracking-wide text-ink">
          {member.role}
        </span>
      )}
    </div>
  );
}

export function MemberCard({ member, priority }: { member: MemberView; priority?: boolean }) {
  return (
    <article className="group relative">
      <MemberPortrait
        member={member}
        priority={priority}
        sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 50vw"
      />
      <div className="mt-3">
        <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-accent-ink uppercase">
          {member.category?.name ?? "Member"}
        </p>
        <h3 className="mt-1 text-[1.02rem] leading-snug font-semibold text-ink">
          <Link href={`/members/${member.slug}`} className="after:absolute after:inset-0">
            {member.name}
          </Link>
        </h3>
        <p className="text-[0.88rem] text-muted">{member.businessName}</p>
        {member.headline && (
          <p className="mt-2 line-clamp-2 text-[0.88rem] leading-relaxed text-ink-2">{member.headline}</p>
        )}
        <MemberContactLinks member={member} />
        <SampleTag show={member.isSample} className="mt-2" />
      </div>
    </article>
  );
}

/** Compact row for the home-page roster, so every member fits on the front page. */
export function MemberRosterItem({ member }: { member: MemberView }) {
  return (
    <article className="group relative flex items-start gap-3.5 rounded-md border border-line bg-surface p-3 transition-colors hover:border-ink">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-sand">
        {member.img ? (
          <SmartImage img={member.img} sizes="64px" fill />
        ) : (
          <div aria-hidden className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sand to-sand-2">
            <span className="display text-xl text-ink-2/70">{initials(member.name)}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.68rem] font-semibold tracking-[0.08em] text-accent-ink uppercase">
          {member.category?.name ?? "Member"}
        </p>
        <h3 className="mt-0.5 truncate text-[0.98rem] leading-snug font-semibold text-ink">
          <Link href={`/members/${member.slug}`} className="after:absolute after:inset-0">
            {member.name}
          </Link>
        </h3>
        <p className="truncate text-[0.85rem] text-muted">{member.businessName}</p>
        <MemberContactLinks member={member} className="mt-1 -mb-1.5" />
      </div>
    </article>
  );
}

/** lucide-react no longer ships brand marks, so LinkedIn is drawn inline. */
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/** Quick contact icons; each only appears when the member has published that detail. */
function MemberContactLinks({ member, className }: { member: MemberView; className?: string }) {
  const first = member.name.split(" ")[0];
  const website = safeUrl(member.website);
  const wa = whatsappLink(member.whatsapp, `Hi ${first}, I found you on our BNI chapter website.`);
  const linkedin = member.social.map((s) => safeUrl(s.url)).find((u) => /linkedin\.com/i.test(u)) ?? "";
  const links = [
    website && { href: website, label: "website", icon: <Globe aria-hidden className="size-4" />, external: true },
    member.phone && { href: telLink(member.phone), label: "phone", icon: <Phone aria-hidden className="size-4" /> },
    wa && { href: wa, label: "WhatsApp", icon: <MessageCircle aria-hidden className="size-4" />, external: true },
    linkedin && { href: linkedin, label: "LinkedIn", icon: <LinkedInIcon className="size-4" />, external: true },
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode; external?: boolean }[];
  if (!links.length) return null;
  return (
    <ul className={cn("relative z-10 -ml-2 flex flex-wrap", className ?? "mt-2")}>
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            aria-label={`${member.name} — ${l.label}`}
            title={l.label[0].toUpperCase() + l.label.slice(1)}
            className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-sand hover:text-ink"
            {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {l.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
