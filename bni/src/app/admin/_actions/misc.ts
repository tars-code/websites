"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { guard, revalidateSite } from "@/lib/admin";
import { hashPassword, login, logout, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/form";
import { deletePhoto } from "@/lib/images";
import type { VisitRequestStatus } from "@/lib/types";
import { newId } from "@/lib/utils";
import { email, passwordSchema, str } from "@/lib/validation";

/* ───────────── Auth ───────────── */

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const emailValue = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!emailValue || !password) return { status: "error", message: "Enter your email and password.", values: { email: emailValue } };
  const result = await login(emailValue, password);
  if (!result.ok) return { status: "error", message: result.error, values: { email: emailValue } };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ───────────── Gallery ───────────── */

export async function deletePhotoAction(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  // Clear references first so nothing points at a missing photo.
  for (const e of await db().list("events", { coverPhotoId: id })) {
    await db().update("events", e.id, { coverPhotoId: null });
  }
  await deletePhoto(id);
  revalidateSite();
}

export async function updatePhotoAction(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  const photo = await db().get("photos", id);
  if (!photo) return;
  const patch: { eventId?: string | null; caption?: string; alt?: string } = {};
  if (fd.has("eventId")) {
    const eventId = String(fd.get("eventId") ?? "");
    if (eventId && !(await db().get("events", eventId))) return;
    patch.eventId = eventId || null;
  }
  if (fd.has("caption")) patch.caption = String(fd.get("caption") ?? "").slice(0, 200);
  if (fd.has("alt")) patch.alt = String(fd.get("alt") ?? "").slice(0, 200);
  await db().update("photos", id, patch);
  if (patch.eventId !== undefined && photo.eventId && patch.eventId !== photo.eventId) {
    for (const e of await db().list("events", { coverPhotoId: id })) {
      await db().update("events", e.id, { coverPhotoId: null });
    }
  }
  revalidateSite();
}

export async function setCoverAction(fd: FormData) {
  await guard();
  const photoId = String(fd.get("id") ?? "");
  const photo = await db().get("photos", photoId);
  if (!photo?.eventId) return;
  await db().update("events", photo.eventId, { coverPhotoId: photoId, updatedAt: new Date().toISOString() });
  revalidateSite();
}

/* ───────────── Visit requests ───────────── */

export async function updateVisitRequest(fd: FormData) {
  await guard();
  const id = String(fd.get("id") ?? "");
  const req = await db().get("visit_requests", id);
  if (!req) return;
  const status = String(fd.get("status") ?? req.status) as VisitRequestStatus;
  if (!["new", "contacted", "visited", "closed"].includes(status)) return;
  await db().update("visit_requests", id, {
    status,
    notes: fd.has("notes") ? String(fd.get("notes") ?? "").slice(0, 2000) : req.notes,
    updatedAt: new Date().toISOString(),
  });
  revalidatePath("/admin", "layout");
}

export async function deleteVisitRequest(fd: FormData) {
  await guard();
  await db().remove("visit_requests", String(fd.get("id") ?? ""));
  revalidatePath("/admin", "layout");
}

/* ───────────── Sample data ───────────── */

export async function removeSampleContent() {
  await guard();
  const store = db();
  for (const m of await store.list("members", { isSample: true })) await store.remove("members", m.id);
  for (const e of await store.list("events", { isSample: true })) await store.remove("events", e.id);
  for (const p of await store.list("photos", { isSample: true })) await deletePhoto(p.id);
  const cats = await store.list("categories", { isSample: true });
  for (const c of cats) {
    for (const m of await store.list("members", { categoryId: c.id })) {
      await store.update("members", m.id, { categoryId: null });
    }
    await store.remove("categories", c.id);
  }
  revalidateSite();
  redirect("/admin?cleaned=1");
}

/* ───────────── Account & admins ───────────── */

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await guard();
  const current = String(fd.get("current") ?? "");
  const parsed = passwordSchema.safeParse(String(fd.get("password") ?? ""));
  if (!(await verifyPassword(current, admin.passwordHash))) {
    return { status: "error", errors: { current: "Current password is incorrect." } };
  }
  if (!parsed.success) return { status: "error", errors: { password: parsed.error.issues[0].message } };
  if (parsed.data !== String(fd.get("confirm") ?? "")) {
    return { status: "error", errors: { confirm: "Passwords don't match." } };
  }
  await db().update("admin_users", admin.id, { passwordHash: await hashPassword(parsed.data) });
  return { status: "success", message: "Password updated." };
}

const newAdminSchema = z.object({
  name: str(80).min(1, "Name is required."),
  email: email.refine(Boolean, "Email is required."),
  password: passwordSchema,
});

export async function addAdmin(_prev: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const values = formValues(fd);
  const parsed = newAdminSchema.safeParse(values);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: { ...values, password: "" } };
  const emailLower = parsed.data.email.toLowerCase();
  const existing = await db().list("admin_users");
  if (existing.some((u) => u.email === emailLower)) {
    return { status: "error", errors: { email: "This person is already an admin." }, values };
  }
  await db().insert("admin_users", {
    id: newId(),
    email: emailLower,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
  });
  return { status: "success", message: `${parsed.data.name} can now sign in. Share the password with them privately.` };
}

export async function removeAdmin(fd: FormData) {
  const admin = await guard();
  const id = String(fd.get("id") ?? "");
  if (id === admin.id) return; // can't remove yourself
  const all = await db().list("admin_users");
  if (all.length <= 1) return;
  await db().remove("admin_users", id);
}
