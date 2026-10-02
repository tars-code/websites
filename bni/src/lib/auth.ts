import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  resolveAuthSecret,
  signSession,
  verifySession,
} from "@/lib/session";
import type { AdminUser } from "@/lib/types";
import { newId } from "@/lib/utils";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/* ───────────── Brute-force throttle (per server instance; best effort) ───────────── */

const failures = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 6;

function throttled(key: string) {
  const f = failures.get(key);
  return !!f && f.count >= MAX_FAILURES && f.until > Date.now();
}
function recordFailure(key: string) {
  const f = failures.get(key);
  const fresh = !f || f.until < Date.now();
  failures.set(key, { count: fresh ? 1 : f.count + 1, until: Date.now() + WINDOW_MS });
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(emailRaw: string, password: string): Promise<LoginResult> {
  const secret = resolveAuthSecret();
  if (!secret) {
    return { ok: false, error: "AUTH_SECRET is not configured on the server (min. 32 characters)." };
  }
  const email = emailRaw.trim().toLowerCase();
  if (throttled(email)) {
    return { ok: false, error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const users = await db().list("admin_users");
  let user: AdminUser | undefined = users.find((u) => u.email === email);

  // First-run bootstrap: if there are no admins yet, the ADMIN_EMAIL /
  // ADMIN_PASSWORD environment pair creates the first account.
  if (!user && users.length === 0 && env.adminEmail && env.adminPassword) {
    if (email === env.adminEmail && password === env.adminPassword) {
      user = await db().insert("admin_users", {
        id: newId(),
        email,
        name: "Chapter Admin",
        passwordHash: await hashPassword(password),
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    recordFailure(email);
    await new Promise((r) => setTimeout(r, 400));
    return { ok: false, error: "That email and password combination didn't work." };
  }

  failures.delete(email);
  await db().update("admin_users", user.id, { lastLoginAt: new Date().toISOString() });
  const token = await signSession({ sub: user.id, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }, secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Current admin, or null. Verifies signature AND that the account still exists. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token, resolveAuthSecret());
  if (!payload) return null;
  return db().get("admin_users", payload.sub);
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
