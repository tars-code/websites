import Link from "next/link";
import { ArrowRight, Check, CircleAlert, Plus } from "lucide-react";
import { placeholderChecks } from "@/config/chapter";
import { getChapter, getEvents, hasSampleContent } from "@/lib/data";
import { db } from "@/lib/db";
import { formatDateLong, formatDateMedium, formatRelativeTimestamp, lastWeeklyDate, todayInZone } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmAction } from "@/components/admin/action-form";
import { FlashToast } from "@/components/admin/toast";
import { AdminHeader } from "@/components/admin/page-header";
import { removeSampleContent } from "../_actions/misc";

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const [chapter, events, members, categories, requests, sample] = await Promise.all([
    getChapter(),
    getEvents(true),
    db().list("members", { status: "active" }),
    db().list("categories"),
    db().list("visit_requests"),
    hasSampleContent(),
  ]);
  const today = todayInZone(chapter.timezone);
  const lastMeetingDay = lastWeeklyDate(chapter.timezone, chapter.meeting.day);
  const published = events.filter((e) => e.status === "published");
  const latest = published.find((e) => e.date <= today) ?? null;
  const drafts = events.filter((e) => e.status === "draft");
  const lastMeetingPosted = events.some((e) => e.date === lastMeetingDay && e.kind === "weekly_meeting");
  const upcoming = published.filter((e) => e.date > today);
  const newRequests = requests.filter((r) => r.status === "new").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const openCats = categories.filter((c) => c.status === "open").length;

  const checklist = [
    ...placeholderChecks.map((p) => ({ label: p.label, done: p.done(chapter), href: "/admin/chapter" })),
    { label: "Visitor contact (WhatsApp or phone)", done: !!(chapter.contact.whatsapp || chapter.contact.phone), href: "/admin/chapter" },
    { label: "Chapter logo or hero photo", done: !!(chapter.logoPhotoId || chapter.heroPhotoId), href: "/admin/chapter" },
    { label: "Business categories added", done: categories.some((c) => !c.isSample), href: "/admin/categories" },
    { label: "Members added", done: members.some((m) => !m.isSample), href: "/admin/members/new" },
    { label: "First meetup published", done: published.some((e) => !e.isSample), href: "/admin/meetups/new" },
  ];
  const pending = checklist.filter((c) => !c.done);

  return (
    <>
      <FlashToast message={sp.cleaned ? "Sample content removed." : undefined} />
      <AdminHeader title="Dashboard" description={`Welcome back. Here's what's happening on the ${chapter.name} website.`} />

      {sample && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-dashed border-warn/50 bg-warn-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9rem] text-warn">
            <strong>Sample content is showing on the website.</strong> It&apos;s tagged “Sample” and is only for
            development. Remove it before sharing the site.
          </p>
          <ConfirmAction
            action={removeSampleContent}
            fields={{}}
            confirmText="Remove all sample members, categories, meetups and photos? Your own content is not affected."
            className="h-9 shrink-0 rounded-md bg-warn px-3 text-[0.86rem] font-medium text-white"
          >
            Remove sample content
          </ConfirmAction>
        </div>
      )}

      {/* The weekly action */}
      <section className="grid gap-6 rounded-lg bg-ink p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-[0.75rem] font-semibold tracking-[0.14em] text-white/60 uppercase">After each meeting</p>
          <h2 className="display mt-2 text-[1.7rem]">
            {lastMeetingPosted ? "This week's meetup is posted" : `Post ${formatDateLong(lastMeetingDay, false)}'s meetup`}
          </h2>
          <p className="mt-2 max-w-xl text-[0.94rem] text-white/70">
            Add photos and a few highlights. The homepage updates automatically — then share the link in the chapter
            WhatsApp group.
          </p>
        </div>
        <ButtonLink href="/admin/meetups/new" variant="accent" size="lg" className="text-[1rem]">
          <Plus aria-hidden className="size-5" /> Add weekly meetup
        </ButtonLink>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Active members" value={members.length} href="/admin/members" />
        <Tile label="Open categories" value={openCats} href="/admin/categories" />
        <Tile label="New visit requests" value={newRequests.length} href="/admin/requests" highlight={newRequests.length > 0} />
        <Tile label="Upcoming events" value={upcoming.length} href="/admin/meetups" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold">Latest on the homepage</h2>
          {latest ? (
            <div className="mt-3">
              <p className="text-[0.95rem]">
                {latest.title} · {formatDateMedium(latest.date)}
              </p>
              <p className="text-[0.85rem] text-muted">
                {latest.photoCount} photos · published {latest.publishedAt ? formatRelativeTimestamp(latest.publishedAt) : ""}
              </p>
              <div className="mt-3 flex gap-4 text-[0.88rem] font-medium">
                <Link href={`/admin/meetups/${latest.id}`} className="underline underline-offset-4">
                  Edit
                </Link>
                <a href={`/meetings/${latest.slug}`} target="_blank" className="underline underline-offset-4">
                  View on site ↗
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[0.9rem] text-muted">No meetups published yet. The homepage shows a friendly placeholder until you add one.</p>
          )}
          {drafts.length > 0 && (
            <p className="mt-4 border-t border-line pt-3 text-[0.86rem] text-warn">
              {drafts.length} draft{drafts.length > 1 ? "s" : ""} not published yet —{" "}
              <Link href="/admin/meetups" className="underline underline-offset-4">
                review
              </Link>
            </p>
          )}
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">New visit requests</h2>
            <Link href="/admin/requests" className="text-[0.86rem] font-medium underline underline-offset-4">
              All requests
            </Link>
          </div>
          {newRequests.length ? (
            <ul className="mt-3 divide-y divide-line">
              {newRequests.slice(0, 4).map((r) => (
                <li key={r.id} className="py-2.5 text-[0.9rem]">
                  <span className="font-medium">{r.name}</span>
                  {r.business && <span className="text-muted"> · {r.business}</span>}
                  <span className="block text-[0.8rem] text-faint">{formatRelativeTimestamp(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[0.9rem] text-muted">You&apos;re all caught up.</p>
          )}
        </section>
      </div>

      {pending.length > 0 && (
        <section className="mt-8 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold">Finish setting up</h2>
          <p className="mt-1 text-[0.86rem] text-muted">
            {checklist.length - pending.length} of {checklist.length} done.
          </p>
          <ul className="mt-4 grid gap-1 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className={cn(
                    "flex min-h-10 items-center gap-2.5 rounded-md px-2 text-[0.9rem] hover:bg-sand",
                    c.done ? "text-muted line-through decoration-line-strong" : "text-ink",
                  )}
                >
                  {c.done ? (
                    <Check aria-hidden className="size-4 shrink-0 text-open" />
                  ) : (
                    <CircleAlert aria-hidden className="size-4 shrink-0 text-warn" />
                  )}
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Tile({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-lg border bg-surface p-4 transition-colors hover:border-ink",
        highlight ? "border-accent/40" : "border-line",
      )}
    >
      <p className={cn("display text-[2rem] leading-none", highlight && "text-accent")}>{value}</p>
      <p className="mt-2 flex items-center justify-between text-[0.84rem] text-muted">
        {label} <ArrowRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      </p>
    </Link>
  );
}
