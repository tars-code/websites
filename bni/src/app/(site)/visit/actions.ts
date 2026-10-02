"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getChapter } from "@/lib/data";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/form";
import { notifyVisitRequest } from "@/lib/notify";
import { newId } from "@/lib/utils";

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);

const schema = z
  .object({
    name: text(80).min(2, "Please enter your name."),
    business: text(120).min(2, "Please enter your business name."),
    category: text(80),
    phone: text(30).refine((v) => !v || /^[+\d][\d\s\-()]{6,}$/.test(v), "Please enter a valid phone number."),
    email: z.union([z.literal(""), z.email("Please enter a valid email address.").max(160)]),
    preferredDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    message: text(1000),
  })
  .refine((v) => v.phone || v.email, {
    message: "Please share a phone number or email so we can reach you.",
    path: ["phone"],
  });

/* Best-effort abuse protection (per server instance). */
const recent = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW = 60 * 60 * 1000;

export async function requestVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd);

  // Honeypot: real people never see or fill this field.
  if (String(fd.get("$website") ?? "")) return { status: "success", data: { name: "" } };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const hits = (recent.get(ip) ?? []).filter((t) => Date.now() - t < WINDOW);
  if (hits.length >= LIMIT) {
    return { status: "error", message: "We've received several requests from you already. We'll be in touch soon.", values };
  }

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error), values };
  }

  // Bots submit a complete form instantly; humans take a few seconds.
  const startedAt = Number(fd.get("$t") ?? 0);
  if (startedAt && Date.now() - startedAt < 2500) {
    return { status: "error", message: "That was quick! Please check your details and submit again.", values };
  }

  const now = new Date().toISOString();
  const request = {
    id: newId(),
    ...parsed.data,
    status: "new" as const,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db().insert("visit_requests", request);
  } catch (err) {
    console.error("visit request save failed", err);
    return {
      status: "error",
      message: "Sorry — we couldn't save your request just now. Please try again, or contact us directly.",
      values,
    };
  }

  hits.push(Date.now());
  recent.set(ip, hits);
  const chapter = await getChapter();
  after(() => notifyVisitRequest(request, chapter.name));

  return { status: "success", data: { name: parsed.data.name.split(" ")[0], date: parsed.data.preferredDate } };
}
