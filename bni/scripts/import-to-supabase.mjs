#!/usr/bin/env node
/**
 * ONE-TIME IMPORT — copies the local JSON store (.data/) into Supabase:
 * categories, photos (rows + files), members, events and settings.
 *
 *   node --env-file=.env.local scripts/import-to-supabase.mjs
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (the secret key), and
 * supabase/schema.sql already run. Safe to re-run: rows are upserted by id
 * and files overwritten. Admin users and visit requests are not copied —
 * production creates its first admin from ADMIN_EMAIL/ADMIN_PASSWORD.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || "chapter-media";
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local) first.");
  process.exit(1);
}

const dataDir = path.resolve(process.env.DATA_DIR || ".data");
const dbFile = path.join(dataDir, "db.json");
if (!existsSync(dbFile)) {
  console.error(`${dbFile} not found — nothing to import.`);
  process.exit(1);
}
const { tables, settings = {} } = JSON.parse(readFileSync(dbFile, "utf8"));

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const toSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const rowToDb = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [toSnake(k), v]));

async function upsert(table, rows = tables[table] ?? []) {
  if (!rows.length) return console.log(`${table}: nothing to copy`);
  const { error } = await sb.from(table).upsert(rows.map(rowToDb), { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: ${rows.length} rows`);
}

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
}

async function uploadMedia() {
  const root = path.join(dataDir, "uploads");
  const files = filesUnder(root);
  for (const file of files) {
    const storageKey = path.relative(root, file).split(path.sep).join("/");
    const { error } = await sb.storage.from(bucket).upload(storageKey, readFileSync(file), {
      contentType: file.endsWith(".webp") ? "image/webp" : undefined,
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) throw new Error(`upload ${storageKey}: ${error.message}`);
  }
  console.log(`files: ${files.length} uploaded to bucket "${bucket}"`);
}

// Order matters: members/events reference photos, and photos reference events,
// so photos go in first without their event link and get it once events exist.
await upsert("categories");
await uploadMedia();
await upsert("photos", (tables.photos ?? []).map((p) => ({ ...p, eventId: null })));
await upsert("members");
await upsert("events");
if ((tables.photos ?? []).some((p) => p.eventId)) await upsert("photos");
for (const [k, value] of Object.entries(settings)) {
  const { error } = await sb.from("settings").upsert({ key: k, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(`settings.${k}: ${error.message}`);
}
console.log(`settings: ${Object.keys(settings).length} keys\nDone.`);
