import { Check } from "lucide-react";
import { ProgressiveImage } from "../ProgressiveImage";
import type { Product } from "../../types";

export function OutfitProductTile({
  product,
  selected = false,
  selectable = false,
  order,
  badge,
  onClick,
}: {
  product: Product;
  selected?: boolean;
  selectable?: boolean;
  order?: number;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!selectable}
      aria-pressed={selectable ? selected : undefined}
      className={`group min-w-0 overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
        selected
          ? "border-orange-500 bg-orange-500/[0.06]"
          : "border-white/10 bg-[#111114]"
      } ${selectable ? "cursor-pointer hover:border-orange-500/60 active:scale-[0.985]" : "cursor-default"}`}
    >
      <div className="relative aspect-square bg-white/[0.04]">
        <ProgressiveImage
          src={product.thumbnailImage || product.image}
          alt={`${product.brand} ${product.name}`}
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        {badge && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-black/80 px-2 py-1 text-[10px] font-black text-orange-300 backdrop-blur">
            {badge}
          </span>
        )}
        {selected && (
          <span className="absolute right-2 top-2 z-10 flex h-8 min-w-8 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-black text-black shadow-md">
            {order || <Check className="h-4 w-4" />}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-orange-400">{product.brand}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{product.name}</p>
        <p className="mt-2 truncate text-xs text-white/45">{product.category}</p>
      </div>
    </button>
  );
}
