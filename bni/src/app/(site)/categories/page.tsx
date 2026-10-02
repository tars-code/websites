import type { Metadata } from "next";
import { Suspense } from "react";
import { Grid2x2 } from "lucide-react";
import { getCategoryViews, getChapter } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { CategoryBrowser, type CategoryRow } from "@/components/site/category-browser";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await getChapter();
  return {
    title: "Business categories",
    description: `Which business categories are represented at ${chapter.name}, and which are open for new members.`,
    alternates: { canonical: "/categories" },
  };
}

export default async function CategoriesPage() {
  const [chapter, categories] = await Promise.all([getChapter(), getCategoryViews()]);
  const rows: CategoryRow[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    group: c.group,
    description: c.description,
    status: c.status,
    priority: c.priority,
    isSample: c.isSample,
    member: c.members[0]
      ? { name: c.members[0].name, slug: c.members[0].slug, businessName: c.members[0].businessName }
      : null,
  }));
  const open = rows.filter((r) => r.status === "open").length;

  return (
    <>
      <PageIntro eyebrow="Business categories" title="One seat per category">
        <p>
          {chapter.name} has one member per business category, so members can refer each other without competing.
          {open > 0 && (
            <>
              {" "}
              <strong className="font-semibold text-open">
                {open} {open === 1 ? "category is" : "categories are"} currently open.
              </strong>
            </>
          )}
        </p>
      </PageIntro>

      <div className="page-x pb-20">
        {rows.length ? (
          <>
            <Suspense fallback={null}>
              <CategoryBrowser rows={rows} />
            </Suspense>
            <aside className="mt-12 grid gap-6 rounded-lg border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="display text-[1.5rem]">Is your category open?</h2>
                <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-muted">
                  Category availability is subject to chapter approval and BNI membership requirements. An open
                  category is an invitation to visit — not a guarantee of membership. The best first step is to
                  attend a meeting as our guest.
                </p>
              </div>
              <ButtonLink href="/visit" variant="accent" size="lg">
                Visit the chapter
              </ButtonLink>
            </aside>
          </>
        ) : (
          <EmptyState icon={Grid2x2} title="Category list coming soon" className="mt-10" action={<ButtonLink href="/visit">Ask about your category</ButtonLink>}>
            We&apos;re publishing our category list shortly. Ask us directly whether your category is available.
          </EmptyState>
        )}
      </div>
    </>
  );
}
