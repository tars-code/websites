import { notFound } from "next/navigation";
import { getCategories, getImg } from "@/lib/data";
import { db } from "@/lib/db";
import { SampleTag } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/admin/action-form";
import { MemberForm } from "@/components/admin/member-form";
import { AdminHeader } from "@/components/admin/page-header";
import { FlashToast } from "@/components/admin/toast";
import { deleteMember } from "../../../_actions/members";

export default async function EditMember({ params, searchParams }: PageProps<"/admin/members/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [member, categories, members] = await Promise.all([
    db().get("members", id),
    getCategories(),
    db().list("members", { status: "active" }),
  ]);
  if (!member) notFound();
  const holders = Object.fromEntries(members.filter((m) => m.categoryId).map((m) => [m.categoryId!, m.name]));
  const photo = await getImg(member.photoId, member.name);

  return (
    <>
      <FlashToast message={sp.saved === "created" ? "Member added." : undefined} />
      <AdminHeader
        title={member.name}
        back={{ href: "/admin/members", label: "Members" }}
        description={
          <span className="inline-flex items-center gap-3">
            {member.status === "active" && (
              <a href={`/members/${member.slug}`} target="_blank" className="underline underline-offset-4">
                View profile ↗
              </a>
            )}
            <SampleTag show={member.isSample} />
          </span>
        }
        actions={
          <ConfirmAction
            action={deleteMember}
            fields={{ id: member.id }}
            confirmText={`Permanently delete ${member.name}? To hide them without deleting, set Status to Archived instead.`}
            className="h-9 rounded-md px-3 text-[0.86rem] font-medium text-accent-ink hover:bg-accent-soft"
          >
            Delete
          </ConfirmAction>
        }
      />
      <MemberForm member={member} categories={categories} holders={holders} photo={photo} />
    </>
  );
}
