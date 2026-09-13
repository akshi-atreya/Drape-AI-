import { Category } from "@/lib/types";

// Minimal single-weight line icons standing in for product photography.
export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (category) {
    case "Tops":
      return (
        <svg {...common}>
          <path d="M17 8 L24 12 L31 8 L38 14 L33 20 L30 17 V38 H18 V17 L15 20 L10 14 Z" />
        </svg>
      );
    case "Bottoms":
      return (
        <svg {...common}>
          <path d="M15 8 H33 L34 40 L26 40 L24 20 L22 40 L14 40 Z" />
        </svg>
      );
    case "Dresses":
      return (
        <svg {...common}>
          <path d="M19 8 H29 L31 16 L36 40 H12 L17 16 Z" />
          <path d="M19 8 Q24 13 29 8" />
        </svg>
      );
    case "Jackets":
      return (
        <svg {...common}>
          <path d="M16 9 L24 14 L32 9 L40 16 L35 22 L32 19 V40 H16 V19 L13 22 L8 16 Z" />
          <path d="M24 14 V26" />
        </svg>
      );
    case "Shoes":
      return (
        <svg {...common}>
          <path d="M8 32 Q8 26 14 25 L20 22 Q24 20 27 22 L34 27 Q40 29 40 34 V36 H8 Z" />
        </svg>
      );
    case "Bags":
      return (
        <svg {...common}>
          <rect x="10" y="18" width="28" height="22" rx="3" />
          <path d="M17 18 V13 Q17 8 24 8 Q31 8 31 13 V18" />
        </svg>
      );
    case "Accessories":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="4" />
          <path d="M24 4 V14 M24 34 V44 M4 24 H14 M34 24 H44 M10 10 L17 17 M31 31 L38 38 M38 10 L31 17 M17 31 L10 38" />
        </svg>
      );
    default:
      return null;
  }
}
