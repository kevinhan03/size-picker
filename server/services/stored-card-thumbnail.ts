import { SUPABASE_PRODUCTS_TABLE, SUPABASE_STORAGE_BUCKET } from "../config/env.js";
import { assertSupabaseConfig, supabase } from "../lib/supabase.js";
import { cardThumbnailLocation } from "../utils/card-thumbnail-path.js";
import { createCardThumbnail } from "./card-thumbnail";

const pending = new Map<string, Promise<Buffer>>();
const MAX_CONCURRENT_GENERATIONS = 3;
const MAX_QUEUED_GENERATIONS = 24;
let activeGenerations = 0;
const generationQueue: Array<() => void> = [];

function runNextGeneration() {
  while (activeGenerations < MAX_CONCURRENT_GENERATIONS && generationQueue.length) {
    activeGenerations++;
    generationQueue.shift()!();
  }
}

function enqueueGeneration<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    generationQueue.push(() => {
      void task().then(resolve, reject).finally(() => {
        activeGenerations--;
        runNextGeneration();
      });
    });
    runNextGeneration();
  });
}

async function generate(id: string) {
  assertSupabaseConfig();
  const { data: product, error } = await supabase!.from(SUPABASE_PRODUCTS_TABLE)
    .select("image_path").eq("id", id).maybeSingle();
  if (error) throw error;
  const location = cardThumbnailLocation(id, product?.image_path);
  if (!location) throw new Error("stored image unavailable");
  const storage = supabase!.storage.from(SUPABASE_STORAGE_BUCKET);
  const cached = await storage.download(location.path);
  if (cached.data) return Buffer.from(await cached.data.arrayBuffer());
  if (cached.error && !["400", "404"].includes(String(cached.error.statusCode))) throw cached.error;
  const original = await storage.download(location.source);
  if (original.error || !original.data || original.data.size > 10 * 1024 * 1024) throw new Error("source unavailable");
  const { bytes } = await createCardThumbnail(Buffer.from(await original.data.arrayBuffer()));
  const saved = await storage.upload(location.path, bytes, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (saved.error && !/already exists|duplicate/i.test(saved.error.message)) throw saved.error;
  return bytes;
}
export function ensureStoredCardThumbnail(id: string): Promise<Buffer> {
  const existing = pending.get(id);
  if (existing) return existing;
  if (pending.size >= MAX_QUEUED_GENERATIONS) return Promise.reject(new Error("thumbnail worker busy"));
  const task = enqueueGeneration(() => generate(id)).finally(() => pending.delete(id));
  pending.set(id, task);
  return task;
}
// Background failure must never turn a saved product into a registration error.
export async function prepareCardThumbnail(id: string) {
  try { await ensureStoredCardThumbnail(id); }
  catch (error) {
    console.error("[card-thumbnail] preparation failed", { id, error: error instanceof Error ? error.message : String(error) });
  }
}
