import type { Stat } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Chapter snapshot. Receives only real (derived or admin-entered) numbers. */
export function StatsStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <section aria-label="Chapter snapshot" className={cn("page-x", className)}>
      <dl className="grid grid-cols-2 border-y border-line sm:flex sm:divide-x sm:divide-line">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex flex-col-reverse justify-end px-1 py-5 sm:flex-1 sm:px-6 sm:first:pl-0",
              i % 2 === 1 && "border-l border-line pl-4 sm:pl-6",
              i >= 2 && "border-t border-line sm:border-t-0",
            )}
          >
            <dt className="mt-1 text-[0.82rem] text-muted">
              {s.label}
              {s.note && <span className="block text-[0.75rem] text-faint">{s.note}</span>}
            </dt>
            <dd className="display text-[2rem] leading-none text-ink sm:text-[2.3rem]">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
