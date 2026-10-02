import type { MeetupStats } from "@/lib/types";
import { cn } from "@/lib/utils";

const statLabels: [keyof MeetupStats, string, string][] = [
  ["membersPresent", "member present", "members present"],
  ["visitors", "visitor", "visitors"],
  ["referrals", "referral passed", "referrals passed"],
  ["oneToOnes", "one-to-one", "one-to-ones"],
  ["newMembers", "new member", "new members"],
];

/** Only the numbers the admin actually entered. Returns null if none. */
export function meetupStatItems(stats: MeetupStats) {
  const items: { value: string; label: string }[] = [];
  for (const [key, one, many] of statLabels) {
    const v = stats[key];
    if (typeof v === "number" && v >= 0) items.push({ value: String(v), label: v === 1 ? one : many });
  }
  if (stats.businessValue) items.push({ value: stats.businessValue, label: "business thanked" });
  return items;
}

export function MeetupStatsRow({
  stats,
  className,
  tone = "light",
}: {
  stats: MeetupStats;
  className?: string;
  tone?: "light" | "dark";
}) {
  const items = meetupStatItems(stats);
  if (!items.length) return null;
  return (
    <dl className={cn("flex flex-wrap gap-x-7 gap-y-3", className)}>
      {items.map((s) => (
        <div key={s.label} className="flex items-baseline gap-1.5">
          <dt className="sr-only">{s.label}</dt>
          <dd className={cn("display text-[1.6rem] leading-none", tone === "dark" ? "text-white" : "text-ink")}>
            {s.value}
          </dd>
          <dd className={cn("text-[0.85rem]", tone === "dark" ? "text-white/70" : "text-muted")}>{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}
