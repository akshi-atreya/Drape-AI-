"use client";

import { useAppStore } from "@/store/useAppStore";
import { SavedLookCard } from "@/components/SavedLookCard";

export default function SavedPage() {
  const savedLooks = useAppStore((s) => s.savedLooks);

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-10 py-14">
      <h1 className="font-serif text-4xl md:text-5xl mb-10">Saved Looks</h1>

      {savedLooks.length === 0 ? (
        <p className="text-sm text-gray">
          Nothing saved yet. When your stylist builds a look you love, hit &quot;Save look&quot; to keep it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedLooks.map((look) => (
            <SavedLookCard key={look.id} look={look} />
          ))}
        </div>
      )}
    </div>
  );
}
