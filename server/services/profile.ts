import { supabase, assertSupabaseConfig } from "../lib/supabase.js";
import { SUPABASE_STORAGE_BUCKET } from "../config/env.js";
import {
  publicProfileProduct,
  type PublicProfile,
} from "../../src/utils/profile";
import { normalizeClientProduct } from "./catalog";
import type { Product } from "../../src/types";

export type ProfileIdentity = {
  id: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  closetIsPublic: boolean;
};

export async function getProfileIdentity(userId: string): Promise<ProfileIdentity> {
  assertSupabaseConfig();
  const { data, error } = await supabase!
    .from("users")
    .select("username,bio,avatar_path,closet_is_public")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return {
    id: userId,
    username: String(data.username),
    bio: String(data.bio || ""),
    avatarUrl: data.avatar_path
      ? supabase!.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .getPublicUrl(data.avatar_path).data.publicUrl
      : null,
    closetIsPublic: Boolean(data.closet_is_public),
  };
}

/** Resolves a current or still-active former username without loading a collection. */
export async function getProfileIdentityByUsername(
  username: string
): Promise<ProfileIdentity | null> {
  assertSupabaseConfig();
  const literalName = username.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await supabase!
    .from("users")
    .select("id,username,bio,avatar_path,closet_is_public")
    .ilike("username", literalName)
    .maybeSingle();
  if (error) throw error;

  if (data?.id) {
    return {
      id: String(data.id),
      username: String(data.username),
      bio: String(data.bio || ""),
      avatarUrl: data.avatar_path
        ? supabase!.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(data.avatar_path).data.publicUrl
        : null,
      closetIsPublic: Boolean(data.closet_is_public),
    };
  }

  const { data: alias, error: aliasError } = await supabase!
    .from("username_aliases")
    .select("user_id")
    .eq("username", username.toLowerCase())
    .gt("available_at", new Date().toISOString())
    .maybeSingle();
  if (aliasError) throw aliasError;
  return alias?.user_id ? getProfileIdentity(String(alias.user_id)) : null;
}

/** Loads only fields that are safe and necessary to render a public profile. */
export async function getPublicProfileProducts(userId: string): Promise<Product[]> {
  assertSupabaseConfig();
  const { data, error } = await supabase!.rpc("get_public_profile_products", {
    target_user_id: userId,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data : [])
    .map(normalizeClientProduct)
    .filter((product): product is Product => Boolean(product));
}

export async function getPublicClosetProducts(userId: string): Promise<Product[]> {
  assertSupabaseConfig();
  const { data, error } = await supabase!.rpc("get_public_closet_products", { target_user_id: userId });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(normalizeClientProduct).filter((product): product is Product => Boolean(product));
}

export async function getPublicProfile(
  username: string
): Promise<PublicProfile | null> {
  const identity = await getProfileIdentityByUsername(username);
  if (!identity) return null;
  const [products, closetProducts] = await Promise.all([
    getPublicProfileProducts(identity.id),
    identity.closetIsPublic ? getPublicClosetProducts(identity.id) : Promise.resolve([]),
  ]);
  return { ...identity, products: products.map(publicProfileProduct), closetProducts: closetProducts.map(publicProfileProduct) };
}
