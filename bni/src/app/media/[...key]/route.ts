import { promises as fs } from "node:fs";
import { env, useSupabase } from "@/lib/env";
import { localMediaPath } from "@/lib/db/local";

export const runtime = "nodejs";

/**
 * Serves uploaded photos in local/dev mode. In production with Supabase,
 * photo URLs point straight at the Supabase Storage CDN and this route is unused.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  if (useSupabase) return new Response("Not found", { status: 404 });
  const { key } = await ctx.params;
  const joined = key.join("/");
  if (!/^[\w\-/]+\.webp$/.test(joined)) return new Response("Not found", { status: 404 });
  const file = localMediaPath(env.dataDir, joined);
  if (!file) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
