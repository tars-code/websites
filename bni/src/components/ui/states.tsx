import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 inline-flex size-11 items-center justify-center rounded-full bg-sand text-ink-2">
          <Icon aria-hidden className="size-5" />
        </span>
      )}
      <p className="display text-xl">{title}</p>
      {children && <div className="mt-2 max-w-md text-[0.94rem] leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-sand", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="page-x py-12" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-10 w-2/3 max-w-md" />
      <Skeleton className="mt-3 h-4 w-1/2 max-w-sm" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
