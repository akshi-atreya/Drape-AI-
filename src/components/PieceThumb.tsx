"use client";

import { GarmentPick, Product } from "@/lib/types";
import { colorHex, textOn } from "@/lib/colors";
import { CategoryIcon } from "@/components/CategoryIcon";

/**
 * The shopper's own garment photo when they've added one; otherwise a clean
 * chip in the piece's color with its category icon. (Per-piece stock photos
 * were removed: they kept showing the wrong garment or color — the outfit's
 * single illustrative image carries the visual idea instead.)
 */
export function PieceThumb({
  product,
  pick,
  className = "",
  compact = false,
}: {
  product: Product;
  pick?: GarmentPick;
  className?: string;
  compact?: boolean;
}) {
  if (pick) {
    return (
      <div className={`relative overflow-hidden bg-white ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- user-provided data: URL */}
        <img src={pick.imageDataUrl} alt={pick.title ?? product.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const hex = colorHex(product.primaryColor);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(155deg, ${hex} 0%, ${hex}cc 60%, ${hex}99 100%)` }}
    >
      <span style={{ color: textOn(hex) }} className="opacity-80">
        <CategoryIcon category={product.category} className={compact ? "w-6 h-6" : "w-14 h-14"} />
      </span>
      <span className="sr-only">{product.name}</span>
    </div>
  );
}
