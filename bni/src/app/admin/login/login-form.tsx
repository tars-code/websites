"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/_actions/misc";
import { idleState } from "@/lib/form";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/form";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, idleState);
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email">
        <Input name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} autoFocus />
      </Field>
      <Field label="Password" name="password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
