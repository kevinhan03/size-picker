import { Check, Maximize2 } from "lucide-react";
import type { Product } from "../../types";
import { OutfitImageFrame } from "./OutfitImageFrame";

export function OutfitProductTile({
  product,
  selected = false,
  selectable = false,
  order,
  selectionLimitReached = false,
  badge,
  onClick,
  onPreview,
}: {
  product: Product;
  selected?: boolean;
  selectable?: boolean;
  order?: number;
  selectionLimitReached?: boolean;
  badge?: string;
  onClick?: () => void;
  onPreview?: () => void;
}) {
  const selectionDisabled = selectable && selectionLimitReached && !selected;
  const className = `outfit-detail-product-tile group min-w-0 overflow-hidden rounded-2xl border-2 text-left transition-[border-color,background-color,transform] duration-150 ${selectable ? "outfit-detail-product-tile-selectable " : ""}${selectionDisabled ? "opacity-45 " : ""}${
    selected
      ? "border-orange-500 bg-orange-500/[0.06]"
      : "border-white/10 bg-[#111114]"
  }`;

  const image = <>
    <div className="relative aspect-[4/5] bg-white/[0.04]">
      <div className={`outfit-detail-product-image absolute inset-0 transition-transform duration-150 ${selectable ? "group-hover:scale-[1.02]" : ""}`}>
        <OutfitImageFrame product={product} alt={`${product.brand} ${product.name}`} fit="contain" />
      </div>
      {badge && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold text-white/75 backdrop-blur">
          {badge}
        </span>
      )}
      {selected && (
        <span className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-black shadow-md">
          {order || <Check className="h-4 w-4" />}
        </span>
      )}
    </div>
  </>;

  const details = <>
    <div className="p-2.5">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-white/55">{product.brand}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white">{product.name}</p>
    </div>
  </>;

  if (!selectable) {
    return <article className={className}>{image}{details}</article>;
  }

  if (onPreview) {
    return (
      <article className={className} data-selected={selected}>
        <div className="relative">
          <button type="button" onClick={onClick} aria-pressed={selected} disabled={selectionDisabled} className="outfit-detail-pressable outfit-detail-product-select block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400 disabled:cursor-not-allowed">
            {image}
          </button>
          <button type="button" onClick={onPreview} aria-label={`${product.brand} ${product.name} 미리보기`} className="outfit-detail-pressable outfit-detail-product-preview absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-md backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={onClick} aria-pressed={selected} disabled={selectionDisabled} className="outfit-detail-pressable outfit-detail-product-select block min-h-14 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400 disabled:cursor-not-allowed">
          {details}
        </button>
      </article>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      disabled={selectionDisabled}
      className={`${className} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed`}
    >
      {image}{details}
    </button>
  );
}
