"use client";

import type { ReactNode } from "react";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { useFormResult } from "./action-form";

function useField(name: string, defaultValue?: string | number | null) {
  const state = useFormResult();
  const echoed = state.status === "error" ? state.values?.[name] : undefined;
  return {
    error: state.errors?.[name],
    value: echoed ?? (defaultValue === null || defaultValue === undefined ? "" : String(defaultValue)),
  };
}

export function TextField({
  name,
  label,
  defaultValue,
  hint,
  required,
  optional,
  type = "text",
  placeholder,
  multiline,
  rows,
  maxLength,
  className,
  inputMode,
  autoComplete,
  list,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url";
  autoComplete?: string;
  /** id of a <datalist> with suggestions */
  list?: string;
}) {
  const { error, value } = useField(name, defaultValue);
  return (
    <Field label={label} name={name} hint={hint} error={error} required={required} optional={optional} className={className}>
      {multiline ? (
        <Textarea name={name} defaultValue={value} rows={rows ?? 4} placeholder={placeholder} maxLength={maxLength} error={error} />
      ) : (
        <Input
          name={name}
          type={type}
          defaultValue={value}
          placeholder={placeholder}
          maxLength={maxLength}
          error={error}
          inputMode={inputMode}
          autoComplete={autoComplete ?? "off"}
          list={list}
        />
      )}
    </Field>
  );
}

export function SelectField({
  name,
  label,
  defaultValue,
  options,
  hint,
  required,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  hint?: ReactNode;
  required?: boolean;
  className?: string;
}) {
  const { error, value } = useField(name, defaultValue);
  return (
    <Field label={label} name={name} hint={hint} error={error} required={required} className={className}>
      <Select name={name} defaultValue={value} error={error}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function CheckField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const state = useFormResult();
  const checked = state.status === "error" && state.values ? state.values[name] === "on" : !!defaultChecked;
  return <Checkbox name={name} label={label} hint={hint} defaultChecked={checked} key={String(checked)} />;
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 border-t border-line py-8 first:border-t-0 first:pt-0 lg:grid-cols-[240px_1fr] lg:gap-10">
      <div>
        <h2 className="text-[1rem] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-[0.86rem] leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

export function ErrorFor({ name }: { name: string }) {
  const state = useFormResult();
  const error = state.errors?.[name];
  if (!error) return null;
  return (
    <p className="text-[0.82rem] text-accent-ink" role="alert">
      {error}
    </p>
  );
}
