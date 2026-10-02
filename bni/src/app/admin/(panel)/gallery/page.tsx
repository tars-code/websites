import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { getEvents } from "@/lib/data";
import { db } from "@/lib/db";
import { formatDateMedium } from "@/lib/dates";
import { toImg } from "@/lib/media";
import type { Photo } from "@/lib/types";
import { ConfirmAction } from "@/components/admin/action-form";
import { CaptionInput, GalleryQuickUpload, MovePhotoSelect } from "@/components/admin/gallery-admin";
import { AdminHeader } from "@/components/admin/page-header";
import { deletePhotoAction, setCoverAction } from "../../_actions/misc";

export default async function GalleryAdmin() {
  const [events, photos] = await Promise.all([getEvents(true), db().list("photos", { purpose: "gallery" })]);
  const options = events.map((e) => ({ id: e.id, label: `${e.title} · ${formatDateMedium(e.date)}` }));
  const byEvent = new Map<string, Photo[]>();
  const orphans: Photo[] = [];
  for (const p of photos.sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (p.eventId && events.some((e) => e.id === p.eventId)) byEvent.set(p.eventId, [...(byEvent.get(p.eventId) ?? []), p]);
    else orphans.push(p);
  }

  return (
    <>
      <AdminHeader
        title="Gallery"
        description={`${photos.length} photos. Photos belong to a meetup or event — that's how they're grouped on the website.`}
      />

      <section className="rounded-lg border border-line bg-surface p-5">
        <GalleryQuickUpload events={options} />
      </section>

      {orphans.length > 0 && (
        <PhotoGroup
          title="Unassigned photos"
          note="Uploaded but never saved to a meetup. Move them to a meetup or delete them."
          photos={orphans}
          options={options}
          coverId={null}
        />
      )}

      {events
        .filter((e) => byEvent.has(e.id))
        .map((e) => (
          <PhotoGroup
            key={e.id}
            title={`${e.title} · ${formatDateMedium(e.date)}`}
            href={`/admin/meetups/${e.id}`}
            photos={byEvent.get(e.id)!}
            options={options}
            coverId={e.coverPhotoId ?? byEvent.get(e.id)![0]?.id ?? null}
            draft={e.status !== "published"}
          />
        ))}
    </>
  );
}

function PhotoGroup({
  title,
  note,
  href,
  photos,
  options,
  coverId,
  draft,
}: {
  title: string;
  note?: string;
  href?: string;
  photos: Photo[];
  options: { id: string; label: string }[];
  coverId: string | null;
  draft?: boolean;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">
          {title} <span className="font-normal text-muted">· {photos.length}</span>
          {draft && <span className="ml-2 text-[0.8rem] font-medium text-warn">Draft</span>}
        </h2>
        {href && (
          <Link href={href} className="text-[0.86rem] font-medium underline underline-offset-4">
            Edit meetup
          </Link>
        )}
      </div>
      {note && <p className="-mt-1 mb-3 text-[0.86rem] text-muted">{note}</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {photos.map((p) => {
          const img = toImg(p);
          const isCover = p.id === coverId;
          return (
            <li key={p.id} className="overflow-hidden rounded-md border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.srcSet.split(" ")[0]} alt={p.alt} loading="lazy" className="size-full object-cover" />
                {isCover && (
                  <span className="absolute top-1.5 left-1.5 rounded-sm bg-accent px-1.5 py-0.5 text-[0.62rem] font-bold tracking-wide text-white uppercase">
                    Cover
                  </span>
                )}
                <div className="absolute top-1 right-1 flex gap-1">
                  {p.eventId && !isCover && (
                    <ConfirmAction
                      action={setCoverAction}
                      fields={{ id: p.id }}
                      successMessage="Cover photo updated."
                      className="inline-flex size-8 items-center justify-center rounded-sm bg-white/90 text-ink hover:bg-white"
                    >
                      <Star aria-label="Make cover" className="size-4" />
                    </ConfirmAction>
                  )}
                  <ConfirmAction
                    action={deletePhotoAction}
                    fields={{ id: p.id }}
                    confirmText="Delete this photo permanently?"
                    successMessage="Photo deleted."
                    className="inline-flex size-8 items-center justify-center rounded-sm bg-white/90 text-accent-ink hover:bg-white"
                  >
                    <Trash2 aria-label="Delete photo" className="size-4" />
                  </ConfirmAction>
                </div>
              </div>
              <div className="space-y-1 p-1.5">
                <CaptionInput photoId={p.id} initial={p.caption} />
                <MovePhotoSelect photoId={p.id} current={p.eventId ?? ""} events={options} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
