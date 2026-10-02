"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePhotoAction } from "@/app/admin/_actions/misc";
import { prepareImage, runPool, uploadImage } from "./upload";
import { toast } from "./toast";

export function GalleryQuickUpload({ events }: { events: { id: string; label: string }[] }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

  async function onFiles(files: FileList) {
    if (!eventId) return toast("Choose a meetup first.", "error");
    const list = [...files].slice(0, 60);
    let done = 0;
    let failed = 0;
    setProgress({ done, total: list.length, failed });
    await runPool(list, 3, async (file) => {
      try {
        const blob = await prepareImage(file, "gallery");
        await uploadImage(blob, { purpose: "gallery", eventId });
        done++;
      } catch (err) {
        failed++;
        toast(`${file.name}: ${err instanceof Error ? err.message : "failed"}`, "error");
      }
      setProgress({ done, total: list.length, failed });
    });
    setProgress(null);
    if (done) toast(`${done} photo${done > 1 ? "s" : ""} added.`);
    router.refresh();
  }

  if (!events.length) {
    return <p className="text-[0.9rem] text-muted">Create a meetup first, then add photos to it.</p>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5">
        <span className="text-[0.88rem] font-medium">Add photos to</span>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="h-11 rounded-md border border-line-strong bg-surface px-3 text-[0.92rem] focus:border-ink focus:outline-none"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </label>
      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-4 font-medium text-white hover:bg-ink-2">
        {progress ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" /> {progress.done + progress.failed}/{progress.total}
          </>
        ) : (
          <>
            <ImagePlus aria-hidden className="size-4" /> Choose photos
          </>
        )}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          disabled={!!progress}
          onChange={(e) => {
            if (e.target.files?.length) void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

export function MovePhotoSelect({
  photoId,
  current,
  events,
}: {
  photoId: string;
  current: string;
  events: { id: string; label: string }[];
}) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Move photo to another meetup"
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("id", photoId);
        fd.set("eventId", e.target.value);
        start(async () => {
          await updatePhotoAction(fd);
          toast("Photo moved.");
        });
      }}
      className="h-8 w-full rounded-sm border border-line bg-surface px-1.5 text-[0.75rem]"
    >
      <option value="">Unassigned</option>
      {events.map((e) => (
        <option key={e.id} value={e.id}>
          {e.label}
        </option>
      ))}
    </select>
  );
}

export function CaptionInput({ photoId, initial }: { photoId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <input
      aria-label="Caption"
      placeholder="Add caption…"
      value={value}
      maxLength={200}
      disabled={pending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value === initial) return;
        const fd = new FormData();
        fd.set("id", photoId);
        fd.set("caption", value);
        fd.set("alt", value);
        start(async () => {
          await updatePhotoAction(fd);
          toast("Caption saved.");
        });
      }}
      className="h-8 w-full rounded-sm border border-transparent bg-transparent px-1.5 text-[0.78rem] placeholder:text-faint hover:border-line focus:border-ink focus:bg-surface focus:outline-none"
    />
  );
}
