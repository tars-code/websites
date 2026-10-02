import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-md border bg-surface px-3.5 text-[0.95rem] text-ink placeholder:text-faint transition-colors focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent/40 disabled:bg-sand disabled:text-muted aria-[invalid=true]:border-accent";

export function Field({
  label,
  name,
  hint,
  error,
  required,
  optional,
  children,
  className,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-[0.88rem] font-medium text-ink">
        {label}
        {required && <span className="text-accent"> *</span>}
        {optional && <span className="font-normal text-faint"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-[0.82rem] text-accent-ink" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="text-[0.8rem] text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type WithError = { error?: string };

function aria(name: string | undefined, error?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": name ? (error ? `${name}-error` : `${name}-hint`) : undefined,
  } as const;
}

export function Input({ className, error, ...props }: ComponentProps<"input"> & WithError) {
  return <input id={props.name} className={cn(control, "h-11", className)} {...aria(props.name, error)} {...props} />;
}

export function Textarea({ className, error, ...props }: ComponentProps<"textarea"> & WithError) {
  return (
    <textarea
      id={props.name}
      rows={4}
      className={cn(control, "min-h-24 py-2.5 leading-relaxed", className)}
      {...aria(props.name, error)}
      {...props}
    />
  );
}

export function Select({ className, error, children, ...props }: ComponentProps<"select"> & WithError) {
  return (
    <select id={props.name} className={cn(control, "h-11 pr-8", className)} {...aria(props.name, error)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  hint,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: string; hint?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-sm border-line-strong accent-ink"
        {...props}
      />
      <span className="text-[0.92rem] leading-snug">
        <span className="font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.8rem] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function FormMessage({ state }: { state: { status: string; message?: string } }) {
  if (!state.message || state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-4 py-3 text-[0.9rem]",
        state.status === "error" ? "bg-accent-soft text-accent-ink" : "bg-open-soft text-open",
      )}
    >
      {state.message}
    </p>
  );
}
