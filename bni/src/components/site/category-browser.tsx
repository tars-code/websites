"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { SampleTag, StatusBadge } from "@/components/ui/badge";

export interface CategoryRow {
  id: string;
  name: string;
  group: string;
  description: string;
  status: "open" | "filled";
  priority: boolean;
  isSample: boolean;
  member: { name: string; slug: string; businessName: string } | null;
}

type StatusFilter = "all" | "open" | "filled";

export function CategoryBrowser({ rows }: { rows: CategoryRow[] }) {
  const params = useSearchParams();
  const initial = params.get("status");
  const [status, setStatus] = useState<StatusFilter>(initial === "open" || initial === "filled" ? initial : "all");
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();

  const counts = {
    all: rows.length,
    open: rows.filter((r) => r.status === "open").length,
    filled: rows.filter((r) => r.status === "filled").length,
  };

  const groups = useMemo(() => {
    const filtered = rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (!q ||
          [r.name, r.group, r.member?.name, r.member?.businessName].some((s) => s?.toLowerCase().includes(q))),
    );
    const map = new Map<string, CategoryRow[]>();
    for (const r of filtered) {
      const g = r.group || "Other";
      map.set(g, [...(map.get(g) ?? []), r]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows, status, q]);

  const total = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 flex flex-col gap-2 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:flex-row sm:items-center sm:px-0">
        <div role="radiogroup" aria-label="Status" className="flex rounded-md border border-line-strong bg-surface p-1">
          {(["all", "open", "filled"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "h-9 flex-1 rounded-sm px-3 text-[0.88rem] font-medium capitalize transition-colors sm:flex-none",
                status === s ? (s === "open" ? "bg-open text-white" : "bg-ink text-white") : "text-muted hover:text-ink",
              )}
            >
              {s} <span className="tabular-nums opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <span className="sr-only">Search categories</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories, e.g. “insurance”"
            className="h-11 w-full rounded-md border border-line-strong bg-surface pr-3 pl-10 text-[0.95rem] placeholder:text-faint focus:border-ink focus:outline-none"
          />
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {total} categories shown
      </p>

      {groups.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
          <p className="display text-xl">No categories match</p>
          <p className="mt-2 text-muted">
            Don&apos;t see your category? It may still be available —{" "}
            <Link href="/visit" className="link-underline text-ink">
              ask us when you visit
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {groups.map(([group, list]) => (
            <section key={group} aria-label={group}>
              <h2 className="eyebrow mb-2">{group}</h2>
              <ul className="divide-y divide-line border-y border-line">
                {list.map((r) => (
                  <li key={r.id}>
                    <CategoryItem row={r} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryItem({ row }: { row: CategoryRow }) {
  if (row.status === "open") {
    return (
      <div className="grid gap-3 bg-open-soft/40 px-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[1rem] font-semibold text-ink">{row.name}</p>
            <StatusBadge status="open" />
            {row.priority && <span className="text-[0.75rem] font-semibold text-open">Actively looking</span>}
            <SampleTag show={row.isSample} />
          </div>
          <p className="mt-0.5 text-[0.88rem] text-muted">
            {row.description || "Interested in this category? Visit the chapter and meet the members."}
          </p>
        </div>
        <Link
          href={`/visit?category=${encodeURIComponent(row.name)}#request`}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-open px-4 text-[0.88rem] font-medium text-white transition-colors hover:bg-open/90"
        >
          Visit the chapter <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-1 px-3 py-3.5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[0.98rem] font-medium text-ink">{row.name}</p>
        <SampleTag show={row.isSample} />
      </div>
      <p className="text-[0.9rem] text-muted">
        {row.member ? (
          <Link href={`/members/${row.member.slug}`} className="hover:text-ink">
            <span className="text-ink-2">{row.member.name}</span> · {row.member.businessName}
          </Link>
        ) : (
          "Held by a chapter member"
        )}
      </p>
      <div className="hidden sm:block">
        <StatusBadge status="filled" />
      </div>
    </div>
  );
}
