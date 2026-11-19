import { StyleProfile } from "@/lib/types";
import { OutfitRequest, defaultOutfitRequest } from "@/lib/recommendation-engine";

/** Merges partial updates the LLM extracted from conversation into a profile. */
export function mergeProfile(base: StyleProfile, patch: Partial<StyleProfile>): StyleProfile {
  return {
    gender: patch.gender ?? base.gender,
    styles: patch.styles?.length ? [...new Set([...base.styles, ...patch.styles])] : base.styles,
    trendLevel: patch.trendLevel != null ? patch.trendLevel : base.trendLevel,
    colorsLike: patch.colorsLike?.length ? [...new Set([...base.colorsLike, ...patch.colorsLike])] : base.colorsLike,
    colorsAvoid: patch.colorsAvoid?.length ? [...new Set([...base.colorsAvoid, ...patch.colorsAvoid])] : base.colorsAvoid,
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
    gender: turn.gender ?? profile.gender,
    styleTags: turn.styleTags?.length ? turn.styleTags : profile.styles,
    trendLevel: turn.trendLevel ?? profile.trendLevel,
    colorsLike: [...profile.colorsLike, ...(turn.colorsLike ?? [])],
    colorsAvoid: [...profile.colorsAvoid, ...(turn.colorsAvoid ?? [])],
    // FitCast AI recommends garment types, not branded products or price points,
    // so brand and budget never constrain the engine.
    brandsLike: [],
    brandsAvoid: [],
    budget: null,
    occasion: turn.occasion ?? null,
    locationHint: turn.locationHint ?? null,
    availableRetailers: turn.availableRetailers ?? null,
    season: turn.season ?? null,
    temperatureC: turn.temperatureC ?? null,
    ownedItemNames: turn.ownedItemNames ?? [],
    ownedItems: turn.ownedItems ?? [],
    count: turn.count ?? 3,
    liveTrends: turn.liveTrends ?? null,
  };
}
