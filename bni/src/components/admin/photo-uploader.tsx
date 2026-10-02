"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, RotateCcw, Star, Trash2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Img } from "@/lib/media";
import { cn } from "@/lib/utils";
import { PrepareError, prepareImage, runPool, uploadImage } from "./upload";
import { toast } from "./toast";

type Item = {
  key: string;
  id?: string;
  img?: Img;
  preview?: string;
  file?: File;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

/**
 * Multi-photo uploader for meetups. Photos upload immediately; the parent
 * form receives the ordered ids (hidden `photoIds`) and chosen cover, and
 * attaches them when saved.
 */
export function MeetupPhotoUploader({
  initial,
  initialCover,
  altPrefix,
}: {
  initial: Img[];
  initialCover: string | null;
  altPrefix: string;
}) {
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((img) => ({ key: img.id, id: img.id, img, status: "done", progress: 100 })),
  );
  const [cover, setCover] = useState<string | null>(initialCover);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const busy = items.some((i) => i.status === "queued" || i.status === "uploading");

  const patch = (key: string, p: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)));

  // Block saving while uploads are still running.
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const onSubmit = (e: SubmitEvent) => {
      if (busy) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast("Please wait — photos are still uploading.", "error");
      }
    };
    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, [busy]);

  // Free object URLs when unmounting.
  useEffect(() => () => items.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function process(item: Item) {
    patch(item.key, { status: "uploading", progress: 0, error: undefined });
    try {
      const blob = await prepareImage(item.file!, "gallery");
      const res = await uploadImage(blob, {
        purpose: "gallery",
        alt: altPrefix,
        onProgress: (progress) => patch(item.key, { progress }),
      });
      patch(item.key, { status: "done", id: res.photo.id, img: res.img, progress: 100 });
    } catch (err) {
      patch(item.key, {
        status: "error",
        error: err instanceof PrepareError || err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  function addFiles(files: FileList | File[]) {
    const list = [...files].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    if (!list.length) return toast("Please choose image files (JPEG, PNG or WebP).", "error");
    const capped = list.slice(0, 60);
    if (list.length > capped.length) toast("Up to 60 photos at a time — the rest were skipped.", "error");
    const newItems: Item[] = capped.map((file) => ({
      key: `${file.name}-${file.size}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: "queued",
      progress: 0,
    }));
    setItems((cur) => [...cur, ...newItems]);
    void runPool(newItems, 3, process);
  }

  function remove(key: string) {
    setItems((list) => {
      const target = list.find((i) => i.key === key);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      if (target?.id && target.id === cover) setCover(null);
      return list.filter((i) => i.key !== key);
    });
  }

  function move(index: number, delta: number) {
    setItems((list) => {
      const next = [...list];
      const [x] = next.splice(index, 1);
      next.splice(index + delta, 0, x);
      return next;
    });
  }

  const done = items.filter((i) => i.status === "done" && i.id);
  const effectiveCover = cover && done.some((d) => d.id === cover) ? cover : (done[0]?.id ?? "");
  const uploading = items.filter((i) => i.status === "uploading" || i.status === "queued").length;
  const failed = items.filter((i) => i.status === "error").length;

  return (
    <div ref={rootRef}>
      <input type="hidden" name="photoIds" value={done.map((d) => d.id).join(",")} />
      <input type="hidden" name="coverPhotoId" value={effectiveCover} />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-9 text-center transition-colors",
          dragging ? "border-accent bg-accent-soft/50" : "border-line-strong bg-paper hover:border-ink",
        )}
      >
        <ImagePlus aria-hidden className="size-8 text-muted" />
        <span className="mt-3 text-[1rem] font-semibold text-ink">
          <span className="hidden sm:inline">Drop photos here or </span>
          <span className="text-accent-ink underline underline-offset-4">choose photos</span>
        </span>
        <span className="mt-1 text-[0.82rem] text-muted">
          JPEG, PNG or WebP · select many at once · resized automatically
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {items.length > 0 && (
        <>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.86rem] text-muted" aria-live="polite">
            <span>
              <strong className="text-ink">{done.length}</strong> {done.length === 1 ? "photo" : "photos"}
            </span>
            {uploading > 0 && (
              <span className="inline-flex items-center gap-1.5 text-ink">
                <Loader2 aria-hidden className="size-3.5 animate-spin" /> Uploading {uploading}…
              </span>
            )}
            {failed > 0 && <span className="text-accent-ink">{failed} failed</span>}
            <span className="hidden sm:inline">· Star a photo to make it the cover</span>
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {items.map((item, i) => {
              const isCover = !!item.id && item.id === effectiveCover;
              return (
                <li
                  key={item.key}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-md bg-sand",
                    isCover && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.img ? item.img.srcSet.split(", ")[0].split(" ")[0] : item.preview}
                    alt=""
                    className={cn("size-full object-cover", item.status !== "done" && "opacity-60")}
                  />
                  {item.status === "uploading" && (
                    <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-white/70">
                      <div className="h-full bg-ink transition-[width]" style={{ width: `${Math.max(item.progress, 8)}%` }} />
                    </div>
                  )}
                  {item.status === "queued" && (
                    <span className="absolute inset-0 flex items-center justify-center text-[0.75rem] font-medium text-ink">
                      Waiting…
                    </span>
                  )}
                  {item.status === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/85 p-2 text-center">
                      <AlertCircle aria-hidden className="size-4 text-accent" />
                      <span className="line-clamp-3 text-[0.7rem] leading-tight text-accent-ink">{item.error}</span>
                      {item.file && (
                        <button
                          type="button"
                          onClick={() => void process(item)}
                          className="mt-1 inline-flex items-center gap-1 text-[0.72rem] font-semibold text-ink underline"
                        >
                          <RotateCcw aria-hidden className="size-3" /> Retry
                        </button>
                      )}
                    </div>
                  )}
                  {isCover && (
                    <span className="absolute top-1.5 left-1.5 rounded-sm bg-accent px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-white uppercase">
                      Cover
                    </span>
                  )}
                  {item.status === "done" && (
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                      <div className="flex">
                        <ThumbBtn label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}>
                          <ArrowLeft className="size-3.5" />
                        </ThumbBtn>
                        <ThumbBtn label="Move later" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                          <ArrowRight className="size-3.5" />
                        </ThumbBtn>
                      </div>
                      <div className="flex">
                        <ThumbBtn label="Use as cover photo" onClick={() => setCover(item.id!)} pressed={isCover}>
                          <Star className={cn("size-3.5", isCover && "fill-current")} />
                        </ThumbBtn>
                        <ThumbBtn label="Remove photo" onClick={() => remove(item.key)}>
                          <Trash2 className="size-3.5" />
                        </ThumbBtn>
                      </div>
                    </div>
                  )}
                  {item.status === "error" && (
                    <button
                      type="button"
                      onClick={() => remove(item.key)}
                      aria-label="Discard failed photo"
                      className="absolute top-1 right-1 rounded-sm bg-white/90 p-1 text-ink"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function ThumbBtn({
  children,
  label,
  onClick,
  disabled,
  pressed,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-sm text-white hover:bg-white/20 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Single image field (member portrait, chapter logo, hero image). */
export function SinglePhotoField({
  name,
  label,
  initial,
  purpose,
  hint,
  shape = "square",
  alt,
}: {
  name: string;
  label: string;
  initial: Img | null;
  purpose: "member" | "chapter";
  hint?: string;
  shape?: "square" | "portrait" | "wide";
  alt?: string;
}) {
  const [img, setImg] = useState<Img | null>(initial);
  const [state, setState] = useState<{ busy: boolean; progress: number; error?: string }>({ busy: false, progress: 0 });

  async function onFile(file: File) {
    setState({ busy: true, progress: 0 });
    try {
      const blob = await prepareImage(file, purpose);
      const res = await uploadImage(blob, {
        purpose,
        alt,
        onProgress: (progress) => setState((s) => ({ ...s, progress })),
      });
      setImg(res.img);
      setState({ busy: false, progress: 100 });
    } catch (err) {
      setState({ busy: false, progress: 0, error: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  const aspect = shape === "portrait" ? "aspect-[4/5] w-36" : shape === "wide" ? "aspect-[16/9] w-full max-w-sm" : "aspect-square w-28";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.88rem] font-medium text-ink">{label}</span>
      <input type="hidden" name={name} value={img?.id ?? ""} />
      <div className="flex flex-wrap items-end gap-4">
        <div className={cn("relative overflow-hidden rounded-md border border-line bg-sand", aspect)}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.src} alt="" className={cn("size-full", shape === "square" && purpose === "chapter" ? "object-contain p-2" : "object-cover")} />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-faint">
              <ImagePlus aria-hidden className="size-6" />
            </span>
          )}
          {state.busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 aria-hidden className="size-5 animate-spin text-ink" />
              <span className="sr-only">Uploading {state.progress}%</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface px-3 text-[0.86rem] font-medium hover:border-ink">
            {img ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="sr-only"
              disabled={state.busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
          </label>
          {img && (
            <button type="button" onClick={() => setImg(null)} className="h-9 rounded-md px-3 text-[0.86rem] text-muted hover:text-accent-ink">
              Remove
            </button>
          )}
        </div>
      </div>
      {state.error ? (
        <p className="text-[0.82rem] text-accent-ink" role="alert">
          {state.error}
        </p>
      ) : (
        hint && <p className="text-[0.8rem] text-muted">{hint}</p>
      )}
    </div>
  );
}
