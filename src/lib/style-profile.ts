import { StyleProfile } from "@/lib/types";
import { OutfitRequest, defaultOutfitRequest } from "@/lib/recommendation-engine";

/** Merges partial updates the LLM extracted from conversation into a profile. */
export function mergeProfile(base: StyleProfile, patch: Partial<StyleProfile>): StyleProfile {
  return {
    styles: patch.styles?.length ? [...new Set([...base.styles, ...patch.styles])] : base.styles,
    trendLevel: patch.trendLevel != null ? patch.trendLevel : base.trendLevel,
    colorsLike: patch.colorsLike?.length ? [...new Set([...base.colorsLike, ...patch.colorsLike])] : base.colorsLike,
    colorsAvoid: patch.colorsAvoid?.length ? [...new Set([...base.colorsAvoid, ...patch.colorsAvoid])] : base.colorsAvoid,
    brandsLike: patch.brandsLike?.length ? [...new Set([...base.brandsLike, ...patch.brandsLike])] : base.brandsLike,
    brandsAvoid: patch.brandsAvoid?.length ? [...new Set([...base.brandsAvoid, ...patch.brandsAvoid])] : base.brandsAvoid,
    priceRange: patch.priceRange ?? base.priceRange,
    fitPreferences: patch.fitPreferences?.length ? [...new Set([...base.fitPreferences, ...patch.fitPreferences])] : base.fitPreferences,
    favoriteCategories: patch.favoriteCategories?.length ? [...new Set([...base.favoriteCategories, ...patch.favoriteCategories])] : base.favoriteCategories,
    avoidedCategories: patch.avoidedCategories?.length ? [...new Set([...base.avoidedCategories, ...patch.avoidedCategories])] : base.avoidedCategories,
    occasions: patch.occasions?.length ? [...new Set([...base.occasions, ...patch.occasions])] : base.occasions,
  };
}

/** Builds an OutfitRequest from the persistent style profile plus this turn's ask. */
export function profileToOutfitRequest(
  profile: StyleProfile,
  turn: Partial<OutfitRequest>
): OutfitRequest {
  return {
    ...defaultOutfitRequest,
    styleTags: turn.styleTags?.length ? turn.styleTags : profile.styles,
    trendLevel: turn.trendLevel ?? profile.trendLevel,
    colorsLike: [...profile.colorsLike, ...(turn.colorsLike ?? [])],
    colorsAvoid: [...profile.colorsAvoid, ...(turn.colorsAvoid ?? [])],
    brandsLike: [...profile.brandsLike, ...(turn.brandsLike ?? [])],
    brandsAvoid: [...profile.brandsAvoid, ...(turn.brandsAvoid ?? [])],
    budget: turn.budget ?? (profile.priceRange ? profile.priceRange[1] : null),
    occasion: turn.occasion ?? null,
    locationHint: turn.locationHint ?? null,
    season: turn.season ?? null,
    ownedItemNames: turn.ownedItemNames ?? [],
    count: turn.count ?? 3,
  };
}
