import Anthropic from "@anthropic-ai/sdk";
import {
  CATEGORIES,
  GENDERS,
  Gender,
  OCCASION_TAGS,
  Outfit,
  SEASON_TAGS,
  STYLE_TAGS,
  StyleProfile,
  StyleTag,
} from "@/lib/types";
import {
  generateOutfits,
  parseRemixInstruction,
  remixOutfit,
} from "@/lib/recommendation-engine";
import { profileToOutfitRequest, mergeProfile } from "@/lib/style-profile";
import { catalog } from "@/lib/catalog";
import { CountryCode, retailersAvailableIn } from "@/lib/locale";

/**
 * Tool surface exposed to the LLM. The model handles conversation, intent
 * extraction, and phrasing; every tool here delegates the actual product
 * selection/ranking/budget math to the deterministic recommendation engine.
 */
export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "update_style_profile",
    description:
      "Record durable style preferences the user has revealed, so future turns remember them. Call this whenever the user states a lasting preference (not just a one-off request) — e.g. their general style, colors they dislike, brands they avoid, or fit preferences.",
    input_schema: {
      type: "object",
      properties: {
        gender: { type: "string", enum: GENDERS, description: "Who you're shopping for." },
        styles: { type: "array", items: { type: "string", enum: STYLE_TAGS } },
        trendLevel: { type: "number", minimum: 0, maximum: 1, description: "0 = classic, 1 = trendsetter" },
        colorsLike: { type: "array", items: { type: "string" } },
        colorsAvoid: { type: "array", items: { type: "string" } },
        brandsLike: { type: "array", items: { type: "string" } },
        brandsAvoid: { type: "array", items: { type: "string" } },
        fitPreferences: { type: "array", items: { type: "string" } },
        favoriteCategories: { type: "array", items: { type: "string", enum: CATEGORIES } },
        avoidedCategories: { type: "array", items: { type: "string", enum: CATEGORIES } },
        occasions: { type: "array", items: { type: "string", enum: OCCASION_TAGS } },
      },
    },
  },
  {
    name: "find_outfits",
    description:
      "Search the product catalog and construct complete, budget-aware outfits (not isolated items) for the user's current request. Requires knowing who you're shopping for (gender) — ask that first if it hasn't come up yet, don't guess. Only call this once you know enough to make a good outfit (gender + typically budget + occasion or explicit request).",
    input_schema: {
      type: "object",
      properties: {
        gender: { type: "string", enum: GENDERS, description: "Who you're shopping for. Required unless already known from the profile." },
        budget: { type: ["number", "null"], description: "Total budget for the whole outfit, if known. Always in USD — convert from the shopper's local currency first if they stated one (see the currency context in your system prompt)." },
        occasion: { type: ["string", "null"] },
        locationHint: { type: ["string", "null"], description: "City/trip mentioned by the user, e.g. 'NYC', 'Paris'." },
        season: { type: ["string", "null"], enum: [...SEASON_TAGS, null] },
        count: { type: "integer", minimum: 1, maximum: 4, default: 3 },
        styleTagsOverride: { type: "array", items: { type: "string", enum: STYLE_TAGS } },
        trendLevelOverride: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["occasion"],
    },
  },
  {
    name: "remix_outfit",
    description:
      "Modify one existing outfit conversationally (e.g. 'replace the jacket', 'make it more casual', 'keep the shoes but make everything else cheaper'). Preserves pieces that should stay and changes only what the instruction implies. outfitId must be one of the ids from the outfits currently shown to the user.",
    input_schema: {
      type: "object",
      properties: {
        outfitId: { type: "string" },
        instruction: { type: "string", description: "The user's modification request, close to verbatim." },
      },
      required: ["outfitId", "instruction"],
    },
  },
  {
    name: "respond_to_user",
    description:
      "Send your conversational reply. ALWAYS call this last, exactly once, to end your turn. If you called find_outfits or remix_outfit this turn, include a short, specific 'why it works' explanation for each affected outfitId (referencing actual colors/materials/trend tags where relevant).",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        outfitExplanations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              outfitId: { type: "string" },
              explanation: { type: "string" },
            },
            required: ["outfitId", "explanation"],
          },
        },
      },
      required: ["message"],
    },
  },
];

export interface OutfitResult {
  outfit: Outfit;
  replacesId?: string;
  isFreshSet?: boolean;
}

export interface ToolRunContext {
  profile: StyleProfile;
  outfitsById: Map<string, Outfit>;
  touchedIds: string[];
  replaces: Map<string, string>;
  /** ids produced by find_outfits this turn — a brand new board, not a patch. */
  freshSetIds: Set<string>;
  /** Shopper's region — restricts recommendations to retailers that actually operate there. */
  countryCode: CountryCode;
}

export function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolRunContext
): unknown {
  if (name === "update_style_profile") {
    ctx.profile = mergeProfile(ctx.profile, input as Partial<StyleProfile>);
    return { ok: true, profile: ctx.profile };
  }

  if (name === "find_outfits") {
    const gender = (input.gender as Gender | undefined) ?? ctx.profile.gender;
    if (!gender) {
      return {
        error:
          "Gender is not known yet. Do not call find_outfits — instead ask the user who you're shopping for (women's, men's, or no preference) via respond_to_user.",
      };
    }
    if (!ctx.profile.gender) {
      ctx.profile = mergeProfile(ctx.profile, { gender });
    }

    const req = profileToOutfitRequest(ctx.profile, {
      gender,
      budget: (input.budget as number | null) ?? null,
      occasion: (input.occasion as string | null) ?? null,
      locationHint: (input.locationHint as string | null) ?? null,
      season: (input.season as string | null) ?? null,
      count: (input.count as number) ?? 3,
      styleTags: (input.styleTagsOverride as StyleTag[] | undefined) ?? undefined,
      trendLevel: (input.trendLevelOverride as number | undefined) ?? undefined,
      availableRetailers: retailersAvailableIn(ctx.countryCode),
    });
    const outfits = generateOutfits(catalog, req);
    outfits.forEach((o) => {
      ctx.outfitsById.set(o.id, o);
      ctx.touchedIds.push(o.id);
      ctx.freshSetIds.add(o.id);
    });
    return {
      outfits: outfits.map((o) => ({
        id: o.id,
        name: o.name,
        occasion: o.occasion,
        totalPrice: o.totalPrice,
        budget: o.budget,
        items: o.items.map((it) => ({
          role: it.role,
          name: it.product.name,
          brand: it.product.brand,
          retailer: it.product.retailer,
          price: it.product.salePrice ?? it.product.price,
          color: it.product.primaryColor,
          material: it.product.material,
          trendTags: it.product.trendTags,
        })),
      })),
    };
  }

  if (name === "remix_outfit") {
    const outfitId = input.outfitId as string;
    const base = ctx.outfitsById.get(outfitId);
    if (!base) {
      return { error: `No outfit found with id ${outfitId}. Use an id from the outfits currently shown.` };
    }
    const instruction = parseRemixInstruction((input.instruction as string) ?? "");
    const req = profileToOutfitRequest(ctx.profile, {
      budget: base.budget,
      occasion: base.occasion,
      availableRetailers: retailersAvailableIn(ctx.countryCode),
    });
    const updated = remixOutfit(catalog, base, instruction, req);
    ctx.outfitsById.delete(outfitId);
    ctx.outfitsById.set(updated.id, updated);
    ctx.touchedIds.push(updated.id);
    ctx.replaces.set(updated.id, outfitId);
    return {
      outfit: {
        id: updated.id,
        name: updated.name,
        totalPrice: updated.totalPrice,
        budget: updated.budget,
        items: updated.items.map((it) => ({
          role: it.role,
          name: it.product.name,
          brand: it.product.brand,
          price: it.product.salePrice ?? it.product.price,
          color: it.product.primaryColor,
        })),
      },
    };
  }

  return { error: `Unknown tool ${name}` };
}

export const SYSTEM_PROMPT = `You are the AI personal stylist for a premium fashion discovery app. You talk like a knowledgeable, warm, concise human stylist — never like a form or a search engine.

Core rules:
- Ask only the questions that matter, one or two at a time, never a long questionnaire. If the user already gave enough info (e.g. budget + occasion), don't ask more — go straight to find_outfits.
- You must know who you're shopping for (women's, men's, or no preference) before calling find_outfits. If it isn't already known (check the profile / conversation) and the user's message doesn't make it obvious, ask a single natural question for it first — e.g. "Who are we shopping for — you, or a gift for someone?" or "Are you after menswear or womenswear for this?" — before anything else, even before budget. Once you learn it, call update_style_profile with it. Never guess or default this silently.
- Build complete outfits, never isolated single-item recommendations, unless the user explicitly asks for one item.
- Respect budget strictly. The recommendation engine handles the math; you never need to compute prices yourself.
- When the user states a lasting preference (style, disliked colors/brands, fit), call update_style_profile.
- When ready to present outfits, call find_outfits.
- When the user wants to adjust an existing outfit (swap a piece, make it more casual/feminine/warmer, change budget, try a specific brand, keep certain pieces), call remix_outfit with the outfitId from the outfits currently on screen and the instruction close to verbatim. Never regenerate from scratch for a remix request.
- Always end your turn with exactly one call to respond_to_user. Keep the message itself short (1-3 sentences) — per-outfit reasoning goes in outfitExplanations, referencing real colors/materials/trends from the tool results, e.g. "The warm neutral palette keeps the look minimal while the suede jacket introduces a current fall texture trend."
- If the user goes over budget, mention it plainly and offer a specific swap rather than silently ignoring it.
- Never invent products that weren't returned by find_outfits/remix_outfit.`;
