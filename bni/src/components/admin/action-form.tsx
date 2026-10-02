"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/form";
import { idleState } from "@/lib/form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "./toast";

const FormCtx = createContext<FormState>(idleState);

/** Access the latest action result (errors, echoed values) from inside an ActionForm. */
export function useFormResult() {
  return useContext(FormCtx);
}

/**
 * Wraps a server action with useActionState, toasts on success/error and
 * exposes field errors to descendants via useFormResult().
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  id,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  id?: string;
}) {
  const [state, formAction] = useActionState(action, idleState);
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<FormState>(idleState);

  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.status === "success") {
      if (state.message) toast(state.message);
      if (resetOnSuccess) ref.current?.reset();
    } else if (state.status === "error") {
      toast(state.message ?? "Please check the highlighted fields.", "error");
      // Move focus to the first invalid field for keyboard/screen-reader users.
      requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
    }
  }, [state, resetOnSuccess]);

  return (
    <FormCtx.Provider value={state}>
      <form ref={ref} id={id} action={formAction} noValidate className={className}>
        {children}
      </form>
    </FormCtx.Provider>
  );
}

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className,
  name,
  value,
  size,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "accent" | "secondary" | "danger" | "ghost";
  className?: string;
  name?: string;
  value?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { pending, data } = useFormStatus();
  const mine = pending && (!name || data?.get(name) === value);
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending} name={name} value={value} className={cn(className)}>
      {mine ? pendingText : children}
    </Button>
  );
}

/** A tiny form that posts a void server action after a confirmation prompt. */
export function ConfirmAction({
  action,
  fields,
  confirmText,
  children,
  className,
  successMessage,
}: {
  action: (fd: FormData) => Promise<void>;
  fields: Record<string, string>;
  confirmText?: string;
  children: ReactNode;
  className?: string;
  successMessage?: string;
}) {
  return (
    <form
      action={async (fd) => {
        await action(fd);
        if (successMessage) toast(successMessage);
      }}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      className="contents"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <PendingButton className={className}>{children}</PendingButton>
    </form>
  );
}

function PendingButton({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("disabled:opacity-50", className)}>
      {children}
    </button>
  );
}
