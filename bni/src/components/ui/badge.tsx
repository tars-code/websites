import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "open" | "accent" | "warn" | "ink" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-sand text-ink-2",
  open: "bg-open-soft text-open",
  accent: "bg-accent-soft text-accent-ink",
  warn: "bg-warn-soft text-warn",
  ink: "bg-ink text-white",
  outline: "border border-line-strong text-ink-2",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[0.72rem] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: "open" | "filled" }) {
  return status === "open" ? (
    <Badge tone="open">
      <span aria-hidden className="size-1.5 rounded-full bg-open" />
      Open
    </Badge>
  ) : (
    <Badge tone="neutral">Filled</Badge>
  );
}

/** Visible marker for development seed data so it can't be mistaken for real content. */
export function SampleTag({ show, className }: { show: boolean; className?: string }) {
  if (!show) return null;
  return (
    <span
      title="Sample content for development — remove before launch"
      className={cn(
        "inline-flex items-center rounded-sm border border-dashed border-warn/50 bg-warn-soft px-1.5 py-px text-[0.65rem] font-semibold tracking-wider text-warn uppercase",
        className,
      )}
    >
      Sample
    </span>
  );
}
