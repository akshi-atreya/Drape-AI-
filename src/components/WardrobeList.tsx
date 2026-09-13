"use client";

import { useState } from "react";
import { CATEGORIES, Category } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { CategoryIcon } from "@/components/CategoryIcon";
import { colorHex, textOn } from "@/lib/colors";

export function WardrobeList() {
  const wardrobe = useAppStore((s) => s.wardrobe);
  const addWardrobeItem = useAppStore((s) => s.addWardrobeItem);
  const removeWardrobeItem = useAppStore((s) => s.removeWardrobeItem);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Tops");
  const [color, setColor] = useState("black");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addWardrobeItem({ name: name.trim(), category, color: color.trim() || "black" });
    setName("");
  };

  const outfitPotential = Math.max(0, wardrobe.length - 1) * 2;

  return (
    <div className="space-y-8 max-w-2xl">
      {wardrobe.length > 0 && (
        <p className="text-sm text-charcoal-soft bg-beige/60 rounded-xl px-4 py-3">
          You already own {wardrobe.length} piece{wardrobe.length === 1 ? "" : "s"}. Ask your stylist to build
          outfits around what you have — that&apos;s roughly {outfitPotential || "a few"} outfit combinations
          before buying anything new.
        </p>
      )}

      <form onSubmit={submit} className="flex flex-wrap gap-2 items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Black boots"
          className="flex-1 min-w-[160px] text-sm bg-beige/50 rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-charcoal placeholder:text-gray"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="text-sm bg-beige/50 rounded-full px-4 py-2 outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="Color"
          className="w-28 text-sm bg-beige/50 rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-charcoal placeholder:text-gray"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-full bg-charcoal text-ivory text-sm hover:bg-charcoal-soft transition-colors"
        >
          Add
        </button>
      </form>

      {wardrobe.length === 0 ? (
        <p className="text-sm text-gray">
          Nothing here yet. Add pieces you already own so your stylist can build outfits around them.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {wardrobe.map((item) => {
            const hex = colorHex(item.color);
            const fg = textOn(hex);
            return (
              <li
                key={item.id}
                className="animate-in relative rounded-xl overflow-hidden border border-beige-dark/60 group"
              >
                <div
                  className="aspect-square flex items-center justify-center"
                  style={{ background: `linear-gradient(155deg, ${hex}, ${hex}cc)` }}
                >
                  <span style={{ color: fg }} className="opacity-80">
                    <CategoryIcon category={item.category} className="w-10 h-10" />
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray">{item.category}</p>
                </div>
                <button
                  onClick={() => removeWardrobeItem(item.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
