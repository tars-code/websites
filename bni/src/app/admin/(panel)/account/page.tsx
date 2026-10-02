import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRelativeTimestamp } from "@/lib/dates";
import { ConfirmAction } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/page-header";
import { AddAdminForm, PasswordForm } from "@/components/admin/account-forms";
import { removeAdmin } from "../../_actions/misc";

export default async function AccountPage() {
  const me = await requireAdmin();
  const admins = (await db().list("admin_users")).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <>
      <AdminHeader title="Admins & password" description="Who can edit the website. Give access to one or two people who will post meetups each week." />

      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="font-semibold">Admins</h2>
        <ul className="mt-3 divide-y divide-line">
          {admins.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">
                  {a.name} {a.id === me.id && <span className="text-[0.8rem] font-normal text-muted">(you)</span>}
                </p>
                <p className="text-[0.84rem] text-muted">
                  {a.email} · {a.lastLoginAt ? `last signed in ${formatRelativeTimestamp(a.lastLoginAt)}` : "never signed in"}
                </p>
              </div>
              {a.id !== me.id && admins.length > 1 && (
                <ConfirmAction
                  action={removeAdmin}
                  fields={{ id: a.id }}
                  confirmText={`Remove ${a.name}'s admin access?`}
                  successMessage="Admin removed."
                  className="text-[0.84rem] font-medium text-accent-ink hover:underline"
                >
                  Remove
                </ConfirmAction>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold">Add an admin</h2>
          <p className="mt-1 text-[0.86rem] text-muted">Set a temporary password and share it privately. They can change it here after signing in.</p>
          <AddAdminForm />
        </section>
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="font-semibold">Change your password</h2>
          <PasswordForm />
        </section>
      </div>
    </>
  );
}
