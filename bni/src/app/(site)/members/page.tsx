import type { Metadata } from "next";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { getChapter, getMembers } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { MemberDirectory } from "@/components/site/member-directory";
import { MemberCard } from "@/components/site/member-card";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await getChapter();
  return {
    title: "Members",
    description: `Meet the business owners and professionals of ${chapter.name}. Search by name, business or category.`,
    alternates: { canonical: "/members" },
  };
}

export default async function MembersPage() {
  const [chapter, members] = await Promise.all([getChapter(), getMembers()]);
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const m of members) {
    if (!m.category) continue;
    const c = counts.get(m.category.slug) ?? { slug: m.category.slug, name: m.category.name, count: 0 };
    c.count++;
    counts.set(c.slug, c);
  }
  const categories = [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageIntro
        eyebrow={chapter.name}
        title="Our members"
        aside={
          <ButtonLink href="/categories" variant="secondary" className="self-start lg:self-auto">
            See categories & openings
          </ButtonLink>
        }
      >
        <p>
          {members.length > 0
            ? `${members.length} business owners and professionals who meet every ${chapter.meeting.day}. Each holds a unique business category in the chapter.`
            : "Business owners and professionals who meet every week."}
        </p>
      </PageIntro>

      <div className="page-x pb-20">
        {members.length ? (
          <Suspense
            fallback={
              <div className="mt-24 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
                {members.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            }
          >
            <MemberDirectory members={members} categories={categories} />
          </Suspense>
        ) : (
          <EmptyState
            icon={Users}
            title="Member profiles are coming soon"
            className="mt-10"
            action={<ButtonLink href="/visit">Meet us at a meeting</ButtonLink>}
          >
            We&apos;re adding member profiles. The quickest way to meet everyone is to visit a meeting.
          </EmptyState>
        )}
      </div>
    </>
  );
}
