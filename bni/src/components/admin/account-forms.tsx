"use client";

import { addAdmin, changePassword } from "@/app/admin/_actions/misc";
import { ActionForm, SubmitButton } from "./action-form";
import { TextField } from "./fields";

export function AddAdminForm() {
  return (
    <ActionForm action={addAdmin} resetOnSuccess className="mt-4 grid gap-4">
      <TextField name="name" label="Name" required />
      <TextField name="email" label="Email" type="email" required />
      <TextField name="password" label="Temporary password" type="text" required hint="At least 10 characters." autoComplete="new-password" />
      <div>
        <SubmitButton pendingText="Adding…">Add admin</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePassword} resetOnSuccess className="mt-4 grid gap-4">
      <TextField name="current" label="Current password" type="password" required autoComplete="current-password" />
      <TextField name="password" label="New password" type="password" required hint="At least 10 characters." autoComplete="new-password" />
      <TextField name="confirm" label="Repeat new password" type="password" required autoComplete="new-password" />
      <div>
        <SubmitButton pendingText="Updating…">Update password</SubmitButton>
      </div>
    </ActionForm>
  );
}
