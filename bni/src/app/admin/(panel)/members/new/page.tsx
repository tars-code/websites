import { getCategories } from "@/lib/data";
import { db } from "@/lib/db";
import { MemberForm } from "@/components/admin/member-form";
import { AdminHeader } from "@/components/admin/page-header";

export default async function NewMember() {
  const [categories, members] = await Promise.all([getCategories(), db().list("members", { status: "active" })]);
  const holders = Object.fromEntries(members.filter((m) => m.categoryId).map((m) => [m.categoryId!, m.name]));
  return (
    <>
      <AdminHeader title="Add member" back={{ href: "/admin/members", label: "Members" }} />
      <MemberForm member={null} categories={categories} holders={holders} photo={null} />
    </>
  );
}
