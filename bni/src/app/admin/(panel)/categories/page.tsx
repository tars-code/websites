import { getCategories } from "@/lib/data";
import { db } from "@/lib/db";
import { CategoryRow, NewCategoryForm } from "@/components/admin/category-admin";
import { AdminHeader } from "@/components/admin/page-header";

export default async function CategoriesAdmin() {
  const [categories, members] = await Promise.all([getCategories(), db().list("members", { status: "active" })]);
  const groups = [...new Set(categories.map((c) => c.group).filter(Boolean))].sort();
  const memberLite = members
    .map((m) => ({ id: m.id, name: m.name, categoryId: m.categoryId }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const byGroup = new Map<string, typeof categories>();
  for (const c of categories) byGroup.set(c.group || "Other", [...(byGroup.get(c.group || "Other") ?? []), c]);
  const open = categories.filter((c) => c.status === "open").length;

  return (
    <>
      <AdminHeader
        title="Categories"
        description={`${categories.length} categories · ${open} open. Open categories are promoted to visitors on the homepage and categories page.`}
      />
      <NewCategoryForm groups={groups} />
      <div className="mt-8 space-y-8">
        {[...byGroup.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, list]) => (
            <section key={group}>
              <h2 className="eyebrow mb-2">{group}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {list.map((c) => (
                  <CategoryRow key={c.id} category={c} members={memberLite} />
                ))}
              </ul>
            </section>
          ))}
      </div>
    </>
  );
}
