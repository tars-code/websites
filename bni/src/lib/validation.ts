import { z } from "zod";
import { WEEKDAYS } from "@/lib/dates";

/* ───────── helpers for FormData-shaped input ───────── */

export const str = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
export const required = (max: number, label = "This field") =>
  str(max).min(1, `${label} is required.`);
export const bool = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");
export const time = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM.")]);
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");
export const optDate = z.union([z.literal(""), date]);
export const url = z
  .string()
  .trim()
  .max(300)
  .refine((v) => !v || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(v), "Enter a valid web address.")
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v));
export const email = z.union([z.literal(""), z.email("Enter a valid email.").max(160)]);
export const phone = str(30).refine((v) => !v || /^[+\d][\d\s\-()]{5,}$/.test(v), "Enter a valid phone number.");
export const optInt = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 100000) {
      ctx.addIssue({ code: "custom", message: "Enter a whole number." });
      return z.NEVER;
    }
    return n;
  });

/** Textarea → list of non-empty lines. */
export const lines = (maxItems: number, maxLen = 300) =>
  z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split("\n")
        .map((l) => l.trim().slice(0, maxLen))
        .filter(Boolean)
        .slice(0, maxItems),
    );

/** Hidden JSON field from the list editor. */
export const jsonList = <T extends z.ZodTypeAny>(item: T, maxItems = 30) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      try {
        return v ? JSON.parse(v) : [];
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid list." });
        return z.NEVER;
      }
    })
    .pipe(z.array(item).max(maxItems));

export const linkItem = z.object({ label: str(40), url }).transform((l) => l);
export const labeledText = z.object({ title: str(120), text: str(1200) });

/* ───────── entity schemas ───────── */

export const categorySchema = z.object({
  name: required(80, "Category name"),
  group: str(60),
  description: str(300),
  status: z.enum(["open", "filled"]),
  priority: bool,
  sortOrder: optInt,
});

export const memberSchema = z.object({
  name: required(80, "Name"),
  businessName: required(120, "Business name"),
  categoryId: str(64),
  role: str(60),
  headline: str(200),
  about: str(3000),
  services: lines(20, 120),
  referralTips: str(800),
  website: url,
  phone,
  whatsapp: phone,
  email,
  showPhone: bool,
  showEmail: bool,
  social: jsonList(linkItem, 8),
  photoId: str(64),
  joinedOn: optDate,
  featured: bool,
  status: z.enum(["active", "archived"]),
});

export const visitorLines = lines(40, 160).transform((list) =>
  list.map((l) => {
    const [name, ...rest] = l.split(/\s+[—–-]\s+|\s*\|\s*|,\s*/);
    return { name: name.trim(), business: rest.join(" ").trim() };
  }),
);

export const eventSchema = z.object({
  kind: z.enum(["weekly_meeting", "visitor_day", "training", "social", "event"]),
  title: required(120, "Title"),
  date,
  startTime: time,
  endTime: time,
  location: str(200),
  summary: str(600),
  body: str(5000),
  visitorInfo: str(800),
  highlights: lines(12),
  celebrations: lines(12),
  announcements: lines(12),
  achievements: lines(12),
  newMembers: lines(12, 120),
  spotlight: str(500),
  visitors: visitorLines,
  membersPresent: optInt,
  visitorsCount: optInt,
  referrals: optInt,
  newMembersCount: optInt,
  oneToOnes: optInt,
  businessValue: str(40),
  photoIds: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter((s) => /^[\w-]{1,64}$/.test(s)) : [])),
  coverPhotoId: str(64),
  intent: z.enum(["publish", "draft", "unpublish"]).default("publish"),
});

export const chapterSchema = z.object({
  name: required(80, "Chapter name"),
  tagline: str(200),
  description: str(1500),
  city: str(60),
  timezone: str(60).refine((tz) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Unknown timezone (e.g. Asia/Kolkata)."),
  foundedOn: optDate,
  meetingDay: z.enum(WEEKDAYS as [string, ...string[]]),
  startTime: time.refine(Boolean, "Start time is required."),
  endTime: time,
  format: z.enum(["in_person", "online", "hybrid"]),
  pattern: z.enum(["same_every_week", "first_in_person"]).default("same_every_week"),
  onlinePlatform: str(40),
  venueName: str(120),
  address: str(250),
  mapUrl: url,
  onlineUrl: url,
  visitorNote: str(800),
  contactName: str(80),
  contactRole: str(60),
  contactPhone: phone,
  contactEmail: email,
  contactWhatsapp: str(20).transform((v) => v.replace(/\D/g, "")),
  social: jsonList(linkItem, 10),
  bniLinks: jsonList(linkItem, 10),
  customStats: jsonList(z.object({ label: str(40), value: str(20), note: str(60).optional() }), 6),
  whyVisit: jsonList(labeledText, 8),
  agenda: jsonList(labeledText, 12),
  audience: jsonList(z.object({ text: str(160) }), 10),
  faqs: jsonList(labeledText, 12),
  about: jsonList(labeledText, 8),
  membersIndexable: bool,
  logoPhotoId: str(64),
  heroPhotoId: str(64),
  attrEnabled: bool,
  attrName: str(60),
  attrLine: str(80),
  attrServices: str(160),
  attrUrl: url,
  attrEmail: email,
  attrPhone: phone,
});

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200);
