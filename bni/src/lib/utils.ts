export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function newId(): string {
  return crypto.randomUUID();
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

/** Make `base` unique against `taken` by appending -2, -3… */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  for (let i = 2; ; i++) if (!set.has(`${base}-${i}`)) return `${base}-${i}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function nonEmpty<T>(list: (T | null | undefined | "")[]): T[] {
  return list.filter((x): x is T => x !== null && x !== undefined && x !== "");
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Normalise a user-entered URL; returns "" if it isn't http(s). */
export function safeUrl(url: string): string {
  const v = url.trim();
  if (!v) return "";
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProto);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
