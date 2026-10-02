import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageMisconfigured } from "@/lib/env";

/** Every admin server action starts with this. */
export async function guard() {
  const admin = await requireAdmin();
  if (storageMisconfigured) {
    throw new Error("Database is not configured on this deployment. See docs/DEPLOYMENT.md.");
  }
  return admin;
}

/** Public pages are statically cached; refresh all of them after any change. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}

/**
 * Keep category status in step with membership: a category with an active
 * member is "filled"; when its last member leaves it becomes "open".
 */
export async function syncCategoryStatus(categoryIds: (string | null | undefined)[]) {
  const ids = [...new Set(categoryIds.filter(Boolean) as string[])];
  if (!ids.length) return;
  const members = await db().list("members", { status: "active" });
  for (const id of ids) {
    const cat = await db().get("categories", id);
    if (!cat) continue;
    const status = members.some((m) => m.categoryId === id) ? "filled" : "open";
    if (cat.status !== status) {
      await db().update("categories", id, { status, updatedAt: new Date().toISOString() });
    }
  }
}
