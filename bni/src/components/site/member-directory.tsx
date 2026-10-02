"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import type { MemberView } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MemberCard } from "./member-card";

type Sort = "name" | "category" | "business";

export function MemberDirectory({
  members,
  categories,
}: {
  members: MemberView[];
  categories: { slug: string; name: string; count: number }[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [sort, setSort] = useState<Sort>((params.get("sort") as Sort) || "name");
  const deferredQuery = useDeferredValue(query);

  /** Keep the URL shareable without adding history entries per keystroke. */
  function sync(next: { q?: string; category?: string; sort?: Sort }) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v && !(k === "sort" && v === "name")) sp.set(k, v);
      else sp.delete(k);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = members.filter((m) => {
      if (category && m.category?.slug !== category) return false;
      if (!q) return true;
      return [m.name, m.businessName, m.category?.name, m.headline, m.category?.group, ...m.services]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
    const key = (m: MemberView) =>
      sort === "category" ? (m.category?.name ?? "~") : sort === "business" ? m.businessName : m.name;
    return list.sort((a, b) => key(a).localeCompare(key(b)));
  }, [members, deferredQuery, category, sort]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:px-0">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search members</span>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                sync({ q: e.target.value });
              }}
              placeholder="Search by name, business or service"
              className="h-11 w-full rounded-md border border-line-strong bg-surface pr-3 pl-10 text-[0.95rem] placeholder:text-faint focus:border-ink focus:outline-none"
            />
          </label>
          <div className="flex gap-2">
            <label className="flex-1 sm:w-56 sm:flex-none">
              <span className="sr-only">Filter by category</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  sync({ category: e.target.value });
                }}
                className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.92rem] focus:border-ink focus:outline-none"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-36 shrink-0">
              <span className="sr-only">Sort</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as Sort);
                  sync({ sort: e.target.value as Sort });
                }}
                className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.92rem] focus:border-ink focus:outline-none"
              >
                <option value="name">Sort: Name</option>
                <option value="category">Sort: Category</option>
                <option value="business">Sort: Business</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 flex min-h-8 flex-wrap items-center gap-2 text-[0.88rem] text-muted" aria-live="polite">
        <span>
          {results.length} {results.length === 1 ? "member" : "members"}
          {activeCategory && <> in {activeCategory.name}</>}
          {deferredQuery && <> matching “{deferredQuery}”</>}
        </span>
        {(category || query) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
              sync({ q: "", category: "" });
            }}
            className="inline-flex items-center gap-1 rounded-sm px-1.5 py-1 font-medium text-ink hover:bg-sand"
          >
            <X aria-hidden className="size-3.5" /> Clear
          </button>
        )}
      </div>

      {results.length ? (
        <div className={cn("mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6")}>
          {results.map((m, i) => (
            <MemberCard key={m.id} member={m} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="display text-xl">No members match that search</p>
          <p className="mt-2 text-muted">
            Try a different word — or check whether the category is{" "}
            <a href="/categories?status=open" className="link-underline text-ink">
              open for new members
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
