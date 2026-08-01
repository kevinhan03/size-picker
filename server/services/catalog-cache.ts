import { revalidatePath, revalidateTag } from "next/cache";

export function invalidatePublicProductCaches(productId?: string) {
  revalidateTag("catalog", "max");
  revalidateTag("search", "max");
  revalidateTag("recommendations", "max");
  if (productId) {
    revalidateTag(`product:${productId}`, "max");
    revalidateTag(`recommendations:${productId}`, "max");
  }
  revalidatePath("/");
}
