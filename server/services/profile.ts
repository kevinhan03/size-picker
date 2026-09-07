import { supabase, assertSupabaseConfig } from "../lib/supabase.js";
import { SUPABASE_STORAGE_BUCKET } from "../config/env.js";
import { getDigboxProducts } from "./user-collections";
import {
  publicProfileProduct,
  type PublicProfile,
} from "../../src/utils/profile";

export async function getProfileIdentity(userId: string) {
  assertSupabaseConfig();
  const { data, error } = await supabase!
    .from("users")
    .select("username,bio,avatar_path")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return {
    username: String(data.username),
    bio: String(data.bio || ""),
    avatarUrl: data.avatar_path
      ? supabase!.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .getPublicUrl(data.avatar_path).data.publicUrl
      : null,
  };
}

export async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  assertSupabaseConfig();
  const literalName = username.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await supabase!
    .from("users")
    .select("id")
    .ilike("username", literalName)
    .maybeSingle();
  if (error) throw error;
  let userId = data?.id;
  if (!userId) {
    const { data: alias, error: aliasError } = await supabase!
      .from("username_aliases")
      .select("user_id")
      .eq("username", username.toLowerCase())
      .gt("available_at", new Date().toISOString())
      .maybeSingle();
    if (aliasError) throw aliasError;
    userId = alias?.user_id;
  }
  if (!userId) return null;
  const [identity, saved] = await Promise.all([
    getProfileIdentity(userId),
    getDigboxProducts(userId),
  ]);
  return { ...identity, products: saved.products.map(publicProfileProduct) };
}
