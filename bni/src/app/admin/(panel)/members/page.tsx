import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { getCategories, getPhotoMap } from "@/lib/data";
import { db } from "@/lib/db";
import { toImg } from "@/lib/media";
import { cn } from "@/lib/utils";
import { Badge, SampleTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/states";
import { AdminHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";

export default async function MembersAdmin({ searchParams }: PageProps<"/admin/members">) {
  const sp = await searchParams;
  const tab = sp.status === "archived" ? "archived" : "active";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const [members, categories, photos] = await Promise.all([db().list("members"), getCategories(), getPhotoMap()]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const list = members
    .filter((m) => m.status === tab)
    .filter((m) => !q || [m.name, m.businessName, catName.get(m.categoryId ?? "")].some((s) => s?.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const counts = {
    active: members.filter((m) => m.status === "active").length,
    archived: members.filter((m) => m.status === "archived").length,
  };

  return (
    <>
      <FlashToast message={sp.deleted ? "Member deleted." : undefined} />
      <AdminHeader
        title="Members"
        description="Add members, assign their category and choose what contact details are public."
        actions={
          <ButtonLink href="/admin/members/new" variant="accent">
            <Plus aria-hidden className="size-4" /> Add member
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-md border border-line-strong bg-surface p-1">
          {(["active", "archived"] as const).map((t) => (
            <Link
              key={t}
              href={t === "active" ? "/admin/members" : "/admin/members?status=archived"}
              className={cn("rounded-sm px-3 py-1.5 text-[0.86rem] font-medium capitalize", tab === t ? "bg-ink text-white" : "text-muted hover:text-ink")}
            >
              {t} <span className="opacity-70">{counts[t]}</span>
            </Link>
          ))}
        </div>
        <form className="sm:w-72">
          {tab === "archived" && <input type="hidden" name="status" value="archived" />}
          <label className="sr-only" htmlFor="q">Search members</label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search name, business, category"
            className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9rem] focus:border-ink focus:outline-none"
          />
        </form>
      </div>

      {list.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {list.map((m) => {
            const photo = m.photoId ? photos.get(m.photoId) : undefined;
            return (
              <li key={m.id}>
                <Link href={`/admin/members/${m.id}`} className="flex items-center gap-4 p-3.5 hover:bg-paper sm:px-4">
                  <Avatar img={photo ? toImg(photo) : null} name={m.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="truncate">{m.name}</span>
                      {m.featured && <Badge tone="outline">Featured</Badge>}
                      <SampleTag show={m.isSample} />
                    </p>
                    <p className="truncate text-[0.85rem] text-muted">
                      {m.businessName} · {catName.get(m.categoryId ?? "") ?? <span className="text-warn">No category</span>}
                    </p>
                  </div>
                  {m.role && <span className="hidden text-[0.82rem] text-muted sm:block">{m.role}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Users} title={q ? "No matches" : tab === "archived" ? "No archived members" : "No members yet"} action={!q && tab === "active" ? <ButtonLink href="/admin/members/new">Add the first member</ButtonLink> : undefined}>
          {!q && tab === "active" && "Start with your leadership team — then everyone else."}
        </EmptyState>
      )}
    </>
  );
}
