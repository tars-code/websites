import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, resolveAuthSecret, verifySession } from "@/lib/session";

/**
 * Optimistic gate for the admin area. Every admin page and server action also
 * calls requireAdmin(), so this is defence in depth, not the only check.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, resolveAuthSecret());
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
