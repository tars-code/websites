/**
 * Stateless session tokens: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
 * Uses Web Crypto only, so it runs in both the proxy and server code.
 */

export const SESSION_COOKIE = "chapter_admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export interface SessionPayload {
  sub: string;
  exp: number; // unix seconds
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export function resolveAuthSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  // Development convenience only — production requires a real secret.
  if (process.env.NODE_ENV !== "production") return "dev-only-insecure-secret-change-me-0000000000";
  return null;
}

export async function signSession(payload: SessionPayload, secret: string) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(body));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string | undefined, secret: string | null) {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await key(secret),
      fromB64url(sig) as BufferSource,
      enc.encode(body),
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (!payload.sub || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
