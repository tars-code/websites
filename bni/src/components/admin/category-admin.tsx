"use client";

import { Star } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteCategory, quickUpdateCategory, saveCategory } from "@/app/admin/_actions/categories";
import { SampleTag } from "@/components/ui/badge";
import { ActionForm, ConfirmAction, SubmitButton } from "./action-form";
import { CheckField, SelectField, TextField } from "./fields";

type MemberLite = { id: string; name: string; categoryId: string | null };

export function NewCategoryForm({ groups }: { groups: string[] }) {
  return (
    <ActionForm action={saveCategory} resetOnSuccess className="rounded-lg border border-line bg-surface p-5">
      <h2 className="font-semibold">Add a category</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
        <TextField name="name" label="Category name" required placeholder="e.g. Commercial Real Estate" />
        <div>
          <TextField name="group" label="Industry group" placeholder="e.g. Property & Construction" list="category-groups" />
          <GroupList groups={groups} />
        </div>
        <input type="hidden" name="status" value="open" />
        <SubmitButton pendingText="Adding…">Add category</SubmitButton>
      </div>
      <p className="mt-3 text-[0.8rem] text-muted">New categories start as open. Assigning a member marks it filled automatically.</p>
    </ActionForm>
  );
}

function GroupList({ groups }: { groups: string[] }) {
  return (
    <datalist id="category-groups">
      {groups.map((g) => (
        <option key={g} value={g} />
      ))}
    </datalist>
  );
}

export function CategoryRow({
  category,
  members,
}: {
  category: Category;
  members: MemberLite[];
}) {
  const holder = members.find((m) => m.categoryId === category.id);
  const open = category.status === "open";

  return (
    <li className="bg-surface">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {category.name}
            {category.priority && open && (
              <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-open">
                <Star aria-hidden className="size-3 fill-current" /> Priority
              </span>
            )}
            <SampleTag show={category.isSample} />
          </p>
          <p className="text-[0.85rem] text-muted">{holder ? holder.name : "No member assigned"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-line-strong p-0.5" role="group" aria-label={`Status of ${category.name}`}>
            {(["open", "filled"] as const).map((s) => (
              <ConfirmAction
                key={s}
                action={quickUpdateCategory}
                fields={{ id: category.id, status: s }}
                className={cn(
                  "h-8 rounded-sm px-3 text-[0.82rem] font-medium capitalize",
                  category.status === s ? (s === "open" ? "bg-open text-white" : "bg-ink text-white") : "text-muted hover:text-ink",
                )}
              >
                {s}
              </ConfirmAction>
            ))}
          </div>
          {open && (
            <ConfirmAction
              action={quickUpdateCategory}
              fields={{ id: category.id, priority: String(!category.priority) }}
              className="h-9 rounded-md px-2.5 text-[0.82rem] text-muted hover:bg-sand hover:text-ink"
            >
              {category.priority ? "Unmark priority" : "Mark priority"}
            </ConfirmAction>
          )}
        </div>
      </div>
      <details className="group border-t border-line">
        <summary className="cursor-pointer list-none px-4 py-2 text-[0.82rem] font-medium text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Edit / assign member</span>
          <span className="hidden group-open:inline">Close</span>
        </summary>
        <ActionForm action={saveCategory} className="grid gap-4 border-t border-dashed border-line bg-paper p-4">
          <input type="hidden" name="id" value={category.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="name" label="Name" required defaultValue={category.name} />
            <div>
              <TextField name="group" label="Industry group" defaultValue={category.group} list="category-groups" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              name="memberId"
              label="Assigned member"
              defaultValue={holder?.id ?? ""}
              options={[
                { value: "", label: "— Nobody —" },
                ...members.map((m) => ({
                  value: m.id,
                  label: m.categoryId && m.categoryId !== category.id ? `${m.name} (moves from another category)` : m.name,
                })),
              ]}
            />
            <SelectField
              name="status"
              label="Status"
              defaultValue={category.status}
              options={[
                { value: "open", label: "Open — looking for a member" },
                { value: "filled", label: "Filled" },
              ]}
            />
          </div>
          <TextField name="description" label="Note for visitors" defaultValue={category.description} hint="Shown on open categories, e.g. “Ideally someone focused on commercial projects.”" />
          <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <TextField name="sortOrder" label="Sort order" inputMode="numeric" defaultValue={category.sortOrder} />
            <CheckField name="priority" label="Priority open category" defaultChecked={category.priority} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SubmitButton size="sm">Save category</SubmitButton>
          </div>
        </ActionForm>
        <div className="flex justify-end px-4 pb-3">
          <ConfirmAction
            action={deleteCategory}
            fields={{ id: category.id }}
            confirmText={`Delete “${category.name}”?${holder ? ` ${holder.name} will be left without a category.` : ""}`}
            className="text-[0.82rem] font-medium text-accent-ink hover:underline"
          >
            Delete category
          </ConfirmAction>
        </div>
      </details>
    </li>
  );
}
