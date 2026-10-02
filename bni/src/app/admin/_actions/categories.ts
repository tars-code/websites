"use server";

import { guard, revalidateSite, syncCategoryStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/form";
import type { Category } from "@/lib/types";
import { newId, slugify, uniqueSlug } from "@/lib/utils";
import { categorySchema } from "@/lib/validation";

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = String(fd.get("id") ?? "");
  const values = formValues(fd);
  const parsed = categorySchema.safeParse({ status: "open", ...values });
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };
  }
  const v = parsed.data;
  const all = await db().list("categories");
  const existing = id ? all.find((c) => c.id === id) : null;
  if (id && !existing) return { status: "error", message: "This category no longer exists." };
  if (all.some((c) => c.id !== id && c.name.toLowerCase() === v.name.toLowerCase())) {
    return { status: "error", errors: { name: "A category with this name already exists." }, values };
  }

  const now = new Date().toISOString();
  const record: Category = {
    id: existing?.id ?? newId(),
    name: v.name,
    slug:
      existing && slugify(existing.name) === slugify(v.name)
        ? existing.slug
        : uniqueSlug(slugify(v.name), all.filter((c) => c.id !== id).map((c) => c.slug)),
    group: v.group,
    description: v.description,
    status: v.status,
    priority: v.priority,
    sortOrder: v.sortOrder ?? existing?.sortOrder ?? all.length,
    isSample: existing?.isSample ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  if (existing) await db().update("categories", record.id, record);
  else await db().insert("categories", record);

  // Optional: assign a member straight from the category screen.
  if (fd.has("memberId")) {
    const memberId = String(fd.get("memberId") ?? "");
    const members = await db().list("members", { status: "active" });
    const prevHolders = members.filter((m) => m.categoryId === record.id && m.id !== memberId);
    for (const m of prevHolders) await db().update("members", m.id, { categoryId: null, updatedAt: now });
    if (memberId) {
      const m = members.find((x) => x.id === memberId);
      if (m) {
        await db().update("members", m.id, { categoryId: record.id, updatedAt: now });
        await syncCategoryStatus([m.categoryId, record.id]);
      }
    } else if (prevHolders.length) {
      await syncCategoryStatus([record.id]);
    }
  }

  revalidateSite();
  return { status: "success", message: existing ? "Category updated." : `Added “${record.name}”.` };
}

export async function quickUpdateCategory(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  const cat = await db().get("categories", id);
  if (!cat) return;
  const patch: Partial<Category> = { updatedAt: new Date().toISOString() };
  const status = fd.get("status");
  if (status === "open" || status === "filled") patch.status = status;
  if (fd.has("priority")) patch.priority = fd.get("priority") === "true";
  await db().update("categories", id, patch);
  revalidateSite();
}

export async function deleteCategory(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  const members = await db().list("members");
  for (const m of members.filter((m) => m.categoryId === id)) {
    await db().update("members", m.id, { categoryId: null, updatedAt: new Date().toISOString() });
  }
  await db().remove("categories", id);
  revalidateSite();
}
