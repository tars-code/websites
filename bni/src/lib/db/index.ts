import "server-only";
import { env, useSupabase } from "@/lib/env";
import { createLocalMedia, createLocalStore } from "./local";
import { createSupabaseMedia, createSupabaseStore } from "./supabase";
import type { MediaStorage, Store } from "./store";

let store: Store | null = null;
let media: MediaStorage | null = null;

export function db(): Store {
  store ??= useSupabase
    ? createSupabaseStore(env.supabaseUrl, env.supabaseServiceKey)
    : createLocalStore(env.dataDir);
  return store;
}

export function mediaStorage(): MediaStorage {
  media ??= useSupabase
    ? createSupabaseMedia(env.supabaseUrl, env.supabaseServiceKey, env.supabaseBucket)
    : createLocalMedia(env.dataDir);
  return media;
}

export type { Store, MediaStorage } from "./store";
