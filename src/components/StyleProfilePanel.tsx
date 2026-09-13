"use client";

import type { ReactNode } from "react";
import { CATEGORIES, OCCASION_TAGS, STYLE_TAGS } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { TagToggleGroup } from "@/components/TagToggleGroup";
import { TagListInput } from "@/components/TagListInput";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-charcoal">{label}</p>
      {children}
    </div>
  );
}

export function StyleProfilePanel() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const toggle = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="space-y-10 max-w-2xl">
      <p className="text-sm text-gray">
        Your stylist learns these automatically as you chat — adjust anything directly here.
      </p>

      <Field label="Style">
        <TagToggleGroup
          options={STYLE_TAGS}
          selected={profile.styles}
          onToggle={(v) => updateProfile({ styles: toggle(profile.styles, v) })}
        />
      </Field>

      <Field label="Trend level">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray w-16">Classic</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={profile.trendLevel}
            onChange={(e) => updateProfile({ trendLevel: Number(e.target.value) })}
            className="flex-1 accent-charcoal"
          />
          <span className="text-xs text-gray w-20 text-right">Trendsetter</span>
        </div>
      </Field>

      <Field label="Colors you like">
        <TagListInput
          values={profile.colorsLike}
          onChange={(v) => updateProfile({ colorsLike: v })}
          placeholder="Add a color and press Enter"
        />
      </Field>

      <Field label="Colors to avoid">
        <TagListInput
          values={profile.colorsAvoid}
          onChange={(v) => updateProfile({ colorsAvoid: v })}
          placeholder="Add a color and press Enter"
        />
      </Field>

      <Field label="Favorite brands">
        <TagListInput
          values={profile.brandsLike}
          onChange={(v) => updateProfile({ brandsLike: v })}
          placeholder="e.g. Aritzia"
        />
      </Field>

      <Field label="Brands to avoid">
        <TagListInput
          values={profile.brandsAvoid}
          onChange={(v) => updateProfile({ brandsAvoid: v })}
          placeholder="e.g. H&M"
        />
      </Field>

      <Field label="Preferred fits">
        <TagListInput
          values={profile.fitPreferences}
          onChange={(v) => updateProfile({ fitPreferences: v })}
          placeholder="e.g. relaxed, tailored"
        />
      </Field>

      <Field label="Favorite categories">
        <TagToggleGroup
          options={CATEGORIES}
          selected={profile.favoriteCategories}
          onToggle={(v) => updateProfile({ favoriteCategories: toggle(profile.favoriteCategories, v) })}
        />
      </Field>

      <Field label="Categories to avoid">
        <TagToggleGroup
          options={CATEGORIES}
          selected={profile.avoidedCategories}
          onToggle={(v) => updateProfile({ avoidedCategories: toggle(profile.avoidedCategories, v) })}
        />
      </Field>

      <Field label="Occasions you shop for">
        <TagToggleGroup
          options={OCCASION_TAGS}
          selected={profile.occasions}
          onToggle={(v) => updateProfile({ occasions: toggle(profile.occasions, v) })}
        />
      </Field>
    </div>
  );
}
