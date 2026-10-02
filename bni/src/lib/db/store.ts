import type { TableName, Tables } from "@/lib/types";

export type Where<K extends TableName> = Partial<
  Record<keyof Tables[K], string | number | boolean | null>
>;

/**
 * Minimal repository interface. Both adapters implement exactly this, so the
 * rest of the app never knows where data lives.
 */
export interface Store {
  readonly kind: "local" | "supabase";
  list<K extends TableName>(table: K, where?: Where<K>): Promise<Tables[K][]>;
  get<K extends TableName>(table: K, id: string): Promise<Tables[K] | null>;
  insert<K extends TableName>(table: K, row: Tables[K]): Promise<Tables[K]>;
  update<K extends TableName>(table: K, id: string, patch: Partial<Tables[K]>): Promise<Tables[K]>;
  remove<K extends TableName>(table: K, id: string): Promise<void>;
  getSetting<T>(key: string): Promise<T | null>;
  setSetting<T>(key: string, value: T): Promise<void>;
}

export interface MediaStorage {
  readonly kind: "local" | "supabase";
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  publicUrl(key: string): string;
}
