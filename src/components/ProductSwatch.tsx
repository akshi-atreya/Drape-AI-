import { Product } from "@/lib/types";
import { colorHex, textOn } from "@/lib/colors";
import { CategoryIcon } from "@/components/CategoryIcon";

/**
 * Stands in for real product photography in the mock catalog: a soft color
 * wash in the product's actual color plus a minimal category icon. Swap for
 * <img src={product.image} /> once a real image field is populated.
 */
export function ProductSwatch({
  product,
  className = "",
  compact = false,
}: {
  product: Product;
  className?: string;
  compact?: boolean;
}) {
  const hex = colorHex(product.primaryColor);
  const fg = textOn(hex);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(155deg, ${hex} 0%, ${hex}cc 60%, ${hex}99 100%)`,
      }}
    >
      <span style={{ color: fg }} className="opacity-80">
        <CategoryIcon category={product.category} className={compact ? "w-8 h-8" : "w-16 h-16"} />
      </span>
      <span className="sr-only">{product.name}</span>
    </div>
  );
}
