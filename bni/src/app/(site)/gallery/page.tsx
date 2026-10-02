import type { Metadata } from "next";
import Link from "next/link";
import { Images } from "lucide-react";
import { eventKindLabels } from "@/lib/chapter-text";
import { getChapter, getEventPhotos, getPastEvents } from "@/lib/data";
import { formatDateMedium } from "@/lib/dates";
import { toImg } from "@/lib/media";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLink, PageIntro } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { SampleTag } from "@/components/ui/badge";
import { PhotoGallery } from "@/components/site/photo-gallery";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await getChapter();
  return {
    title: "Gallery",
    description: `Photos from ${chapter.name} weekly meetings and events.`,
    alternates: { canonical: "/gallery" },
  };
}

const PER_EVENT = 8;

export default async function GalleryPage() {
  const past = (await getPastEvents()).filter((e) => e.photoCount > 0);
  const groups = await Promise.all(
    past.map(async (e) => ({
      event: e,
      images: (await getEventPhotos(e.id)).map((p, i) =>
        toImg(p, `${e.title}, ${formatDateMedium(e.date)} — photo ${i + 1}`),
      ),
    })),
  );
  const total = groups.reduce((n, g) => n + g.images.length, 0);

  return (
    <>
      <PageIntro eyebrow="Gallery" title="Inside our meetings">
        <p>
          {total > 0
            ? `${total} photos from ${groups.length} ${groups.length === 1 ? "meeting" : "meetings"}. Tap any photo to view it full screen.`
            : "Photos from our weekly meetings and events."}
        </p>
      </PageIntro>

      <div className="page-x pb-20">
        {groups.length ? (
          <div className="mt-10 space-y-16">
            {groups.map(({ event, images }) => (
              <section key={event.id} aria-labelledby={`g-${event.id}`}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 id={`g-${event.id}`} className="display text-[1.4rem] sm:text-[1.6rem]">
                      <Link href={`/meetings/${event.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">
                        {event.title}
                      </Link>{" "}
                      <span className="text-faint">— {formatDateMedium(event.date)}</span>
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-[0.85rem] text-muted">
                      {eventKindLabels[event.kind]} · {images.length} photos <SampleTag show={event.isSample} />
                    </p>
                  </div>
                  <ArrowLink href={`/meetings/${event.slug}`}>Meetup details</ArrowLink>
                </div>
                <PhotoGallery images={images} label={event.title} limit={PER_EVENT} />
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Images}
            title="Photos are coming soon"
            className="mt-10"
            action={<ButtonLink href="/visit">Visit a meeting</ButtonLink>}
          >
            After each weekly meeting we&apos;ll share photos here.
          </EmptyState>
        )}
      </div>
    </>
  );
}
