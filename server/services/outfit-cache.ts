import { revalidateTag } from "next/cache";

export const OUTFIT_OPEN_CACHE_TAG = "outfit-open";

export function revalidateOpenOutfits() {
  revalidateTag(OUTFIT_OPEN_CACHE_TAG, "max");
}
