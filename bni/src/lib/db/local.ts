import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { TableName, Tables } from "@/lib/types";
import type { MediaStorage, Store, Where } from "./store";

/**
 * Development adapter: one JSON file + files on disk under DATA_DIR.
 * Not for production on serverless hosts (their disk is ephemeral).
 */

type DbFile = {
  tables: { [K in TableName]: Tables[K][] };
  settings: Record<string, unknown>;
};

const emptyDb = (): DbFile => ({
  tables: {
    categories: [],
    members: [],
    events: [],
    photos: [],
    visit_requests: [],
    admin_users: [],
  },
  settings: {},
});

function matches<K extends TableName>(row: Tables[K], where?: Where<K>) {
  if (!where) return true;
  return Object.entries(where).every(
    ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v,
  );
}

export function createLocalStore(dataDir: string): Store {
  const file = path.resolve(dataDir, "db.json");
  let cache: { mtimeMs: number; db: DbFile } | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  async function read(): Promise<DbFile> {
    try {
      const stat = await fs.stat(file);
      if (cache && cache.mtimeMs === stat.mtimeMs) return cache.db;
      const db = { ...emptyDb(), ...JSON.parse(await fs.readFile(file, "utf8")) } as DbFile;
      db.tables = { ...emptyDb().tables, ...db.tables };
      cache = { mtimeMs: stat.mtimeMs, db };
      return db;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyDb();
      throw err;
    }
  }

  /** Serialise writes in-process and write atomically. */
  function mutate<T>(fn: (db: DbFile) => T): Promise<T> {
    const run = queue.then(async () => {
      const db = structuredClone(await read());
      const result = fn(db);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2));
      await fs.rename(tmp, file);
      cache = null;
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    kind: "local",
    async list(table, where) {
      const db = await read();
      return structuredClone(db.tables[table].filter((r) => matches(r, where)));
    },
    async get(table, id) {
      const db = await read();
      const row = db.tables[table].find((r) => r.id === id);
      return row ? structuredClone(row) : null;
    },
    insert(table, row) {
      return mutate((db) => {
        (db.tables[table] as Tables[typeof table][]).push(row);
        return row;
      });
    },
    update(table, id, patch) {
      return mutate((db) => {
        const rows = db.tables[table] as Tables[typeof table][];
        const i = rows.findIndex((r) => r.id === id);
        if (i < 0) throw new Error(`${table} ${id} not found`);
        rows[i] = { ...rows[i], ...patch, id };
        return rows[i];
      });
    },
    remove(table, id) {
      return mutate((db) => {
        const rows = db.tables[table] as Tables[typeof table][];
        db.tables[table] = rows.filter((r) => r.id !== id) as never;
      });
    },
    async getSetting<T>(key: string) {
      const db = await read();
      return (db.settings[key] as T) ?? null;
    },
    setSetting(key, value) {
      return mutate((db) => {
        db.settings[key] = value;
      });
    },
  };
}

export function createLocalMedia(dataDir: string): MediaStorage {
  const root = path.resolve(dataDir, "uploads");
  const safe = (key: string) => {
    const p = path.resolve(root, key);
    if (!p.startsWith(root + path.sep)) throw new Error("Invalid media key");
    return p;
  };
  return {
    kind: "local",
    async put(key, data) {
      const p = safe(key);
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, data);
    },
    async remove(keys) {
      await Promise.all(keys.map((k) => fs.rm(safe(k), { force: true })));
    },
    publicUrl(key) {
      return `/media/${key}`;
    },
  };
}

export function localMediaPath(dataDir: string, key: string) {
  const root = path.resolve(dataDir, "uploads");
  const p = path.resolve(root, key);
  return p.startsWith(root + path.sep) ? p : null;
}
