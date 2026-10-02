"use server";

import { redirect } from "next/navigation";
import { guard, revalidateSite, syncCategoryStatus } from "@/lib/admin";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/form";
import { deletePhoto } from "@/lib/images";
import type { Member } from "@/lib/types";
import { newId, slugify, uniqueSlug } from "@/lib/utils";
import { memberSchema } from "@/lib/validation";

export async function saveMember(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const id = String(fd.get("id") ?? "");
  const values = formValues(fd);
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };
  }
  const v = parsed.data;
  const existing = id ? await db().get("members", id) : null;
  if (id && !existing) return { status: "error", message: "This member no longer exists." };

  if (v.categoryId && !(await db().get("categories", v.categoryId))) {
    return { status: "error", errors: { categoryId: "Choose a category from the list." }, values };
  }
  if (v.photoId) {
    const photo = await db().get("photos", v.photoId);
    if (!photo) return { status: "error", errors: { photoId: "Photo upload not found — please re-upload." }, values };
  }

  const all = await db().list("members");
  // One member per category (BNI rule) — warn rather than silently double-booking.
  const clash = v.categoryId && v.status === "active"
    ? all.find((m) => m.id !== id && m.status === "active" && m.categoryId === v.categoryId)
    : null;
  if (clash) {
    return {
      status: "error",
      errors: { categoryId: `${clash.name} already holds this category. Archive or reassign them first.` },
      values,
    };
  }

  const now = new Date().toISOString();
  const slug =
    existing && slugify(existing.name) === slugify(v.name)
      ? existing.slug
      : uniqueSlug(slugify(v.name), all.filter((m) => m.id !== id).map((m) => m.slug));

  const record: Member = {
    id: existing?.id ?? newId(),
    slug,
    name: v.name,
    businessName: v.businessName,
    categoryId: v.categoryId || null,
    role: v.role,
    headline: v.headline,
    about: v.about,
    services: v.services,
    referralTips: v.referralTips,
    website: v.website,
    phone: v.phone,
    whatsapp: v.whatsapp.replace(/\D/g, ""),
    email: v.email,
    showPhone: v.showPhone,
    showEmail: v.showEmail,
    social: v.social.filter((s) => s.label && s.url),
    photoId: v.photoId || null,
    joinedOn: v.joinedOn,
    featured: v.featured,
    status: v.status,
    isSample: existing?.isSample ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (existing) await db().update("members", record.id, record);
  else await db().insert("members", record);

  // Replace old profile photo if it changed.
  if (existing?.photoId && existing.photoId !== record.photoId) await deletePhoto(existing.photoId);
  await syncCategoryStatus([existing?.categoryId, record.categoryId]);
  revalidateSite();

  if (!existing) redirect(`/admin/members/${record.id}?saved=created`);
  return { status: "success", message: "Member saved." };
}

export async function deleteMember(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  const member = await db().get("members", id);
  if (member) {
    await db().remove("members", id);
    if (member.photoId) await deletePhoto(member.photoId);
    await syncCategoryStatus([member.categoryId]);
    revalidateSite();
  }
  redirect("/admin/members?deleted=1");
}
