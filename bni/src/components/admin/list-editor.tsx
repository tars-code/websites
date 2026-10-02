"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Row = Record<string, string>;

/**
 * Repeatable rows of small fields, serialized to a hidden JSON input.
 * Friendlier than "one per line" text for structured items like links or FAQs.
 */
export function ListEditor({
  name,
  fields,
  initial,
  addLabel = "Add",
  max = 20,
  emptyText,
}: {
  name: string;
  fields: { key: string; label: string; placeholder?: string; multiline?: boolean; width?: string }[];
  initial: object[];
  addLabel?: string;
  max?: number;
  emptyText?: string;
}) {
  const [rows, setRows] = useState<(Row & { _k: string })[]>(() =>
    (initial as Row[]).map((r, i) => ({ ...r, _k: `${i}-${Math.random()}` })),
  );
  const blank = () => ({ ...Object.fromEntries(fields.map((f) => [f.key, ""])), _k: String(Math.random()) });
  const update = (i: number, key: string, value: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: value } : row)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const next = [...r];
      const [x] = next.splice(i, 1);
      next.splice(i + d, 0, x);
      return next;
    });

  const serialized = JSON.stringify(rows.map((row) => Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ""]))));

  return (
    <div>
      <input type="hidden" name={name} value={serialized} />
      {rows.length === 0 && emptyText && <p className="mb-3 text-[0.86rem] text-muted">{emptyText}</p>}
      <ol className="space-y-3">
        {rows.map((row, i) => (
          <li key={row._k} className="flex gap-2 rounded-md border border-line bg-paper p-3">
            <div className={cn("grid flex-1 gap-2", fields.some((f) => f.multiline) ? "" : "sm:grid-cols-2")}>
              {fields.map((f) => (
                <label key={f.key} className="flex flex-col gap-1">
                  <span className="text-[0.75rem] font-medium text-muted">{f.label}</span>
                  {f.multiline ? (
                    <textarea
                      value={row[f.key] ?? ""}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={2}
                      className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[0.92rem] focus:border-ink focus:outline-none"
                    />
                  ) : (
                    <input
                      value={row[f.key] ?? ""}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.92rem] focus:border-ink focus:outline-none"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="size-4" />
              </IconBtn>
              <IconBtn label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="size-4" />
              </IconBtn>
              <IconBtn label="Remove" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </IconBtn>
            </div>
          </li>
        ))}
      </ol>
      {rows.length < max && (
        <button
          type="button"
          onClick={() => setRows((r) => [...r, blank()])}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-dashed border-line-strong px-3 text-[0.86rem] font-medium text-ink-2 hover:border-ink hover:text-ink"
        >
          <Plus aria-hidden className="size-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-sand hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
