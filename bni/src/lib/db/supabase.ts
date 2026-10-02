import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MediaStorage, Store } from "./store";

/**
 * Production adapter: Supabase Postgres + Storage, using the service-role key
 * on the server only. Tables mirror src/lib/types.ts with snake_case columns;
 * nested objects are jsonb and keep their camelCase keys.
 */

const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function rowToDb(row: object) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [toSnake(k), v]));
}
function rowFromDb<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v])) as T;
}

let client: SupabaseClient | null = null;
function getClient(url: string, key: string) {
  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Database error: ${res.error.message}`);
  return res.data;
}

export function createSupabaseStore(url: string, key: string): Store {
  const sb = getClient(url, key);
  return {
    kind: "supabase",
    async list(table, where) {
      let q = sb.from(table).select("*");
      for (const [k, v] of Object.entries(where ?? {})) {
        q = v === null ? q.is(toSnake(k), null) : q.eq(toSnake(k), v as string | number | boolean);
      }
      const data = check(await q.limit(5000));
      return (data ?? []).map((r) => rowFromDb(r));
    },
    async get(table, id) {
      const data = check(await sb.from(table).select("*").eq("id", id).maybeSingle());
      return data ? rowFromDb(data) : null;
    },
    async insert(table, row) {
      const data = check(await sb.from(table).insert(rowToDb(row)).select("*").single());
      return rowFromDb(data as Record<string, unknown>);
    },
    async update(table, id, patch) {
      const data = check(await sb.from(table).update(rowToDb(patch)).eq("id", id).select("*").single());
      return rowFromDb(data as Record<string, unknown>);
    },
    async remove(table, id) {
      check(await sb.from(table).delete().eq("id", id));
    },
    async getSetting<T>(k: string) {
      const data = check(await sb.from("settings").select("value").eq("key", k).maybeSingle());
      return ((data as { value: T } | null)?.value ?? null) as T | null;
    },
    async setSetting(k, value) {
      check(await sb.from("settings").upsert({ key: k, value, updated_at: new Date().toISOString() }));
    },
  };
}

export function createSupabaseMedia(url: string, key: string, bucket: string): MediaStorage {
  const sb = getClient(url, key);
  return {
    kind: "supabase",
    async put(path, data, contentType) {
      const { error } = await sb.storage.from(bucket).upload(path, data, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw new Error(`Upload failed: ${error.message}`);
    },
    async remove(paths) {
      if (!paths.length) return;
      const { error } = await sb.storage.from(bucket).remove(paths);
      if (error) throw new Error(`Delete failed: ${error.message}`);
    },
    publicUrl(path) {
      return `${url.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
    },
  };
}
