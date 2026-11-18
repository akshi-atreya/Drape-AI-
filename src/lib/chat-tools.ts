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
  Trend,
} from "@/lib/types";
import {
  generateOutfits,
  matchedTrendNames,
  parseRemixInstruction,
  remixOutfit,
} from "@/lib/recommendation-engine";
import { profileToOutfitRequest, mergeProfile } from "@/lib/style-profile";
import { catalog } from "@/lib/catalog";
import { CountryCode } from "@/lib/locale";

/**
 * Tool surface exposed to the LLM. The model handles conversation, intent
 * extraction, and phrasing; every tool here delegates the actual product
 * selection/ranking math to the deterministic recommendation engine.
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
      "Design complete outfits (not isolated items) for the user's current request, made of garment TYPES — e.g. 'charcoal satin blouse', 'wide-leg trousers' — not specific store products. The shopper will find the real pieces themselves on any store and paste the links. Requires knowing who you're shopping for (gender) — ask that first if it hasn't come up yet, don't guess. Only call this once you know enough to make a good outfit (gender + occasion or explicit request).",
    input_schema: {
      type: "object",
      properties: {
        gender: { type: "string", enum: GENDERS, description: "Who you're shopping for. Required unless already known from the profile." },
        occasion: { type: ["string", "null"] },
        locationHint: { type: ["string", "null"], description: "City/trip mentioned by the user, e.g. 'NYC', 'Paris'." },
        season: { type: ["string", "null"], enum: [...SEASON_TAGS, null], description: "The season the outfit will be worn in. ALWAYS set this when the user states or implies one — a season ('winter'), a month or date, or a trip destination and time ('Europe in December' → Winter, 'Paris in October' → Fall, 'Bali in July' → Summer). Think about the destination's hemisphere and climate, not the user's current season. Only leave null if there is truly no clue." },
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
      "Modify one existing outfit conversationally (e.g. 'replace the jacket', 'make it more casual', 'make it warmer', 'use more color'). Preserves pieces that should stay and changes only what the instruction implies. outfitId must be one of the ids from the outfits currently shown to the user.",
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
      "Send your conversational reply. ALWAYS call this last, exactly once, to end your turn. If you called find_outfits or remix_outfit this turn, include a short, specific 'why it works' explanation for each affected outfitId (referencing the actual colors, cuts and currentTrends from the tool result — never invent fabrics or materials).",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        quickReplies: {
          type: "array",
          items: { type: "string" },
          maxItems: 5,
          description:
            "Optional tap-to-reply buttons for a question you are asking in this message, so the user doesn't have to type. 2-5 short options (1-3 words each) that are direct answers to your question. When you ask who you're shopping for, ALWAYS pass exactly: [\"Womenswear\", \"Menswear\", \"No preference\"]. Omit when you are not asking a question, or when the answer is open-ended.",
        },
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
  /** Shopper's region (used for locale-aware search links in the UI; recommendations are region-independent). */
  countryCode: CountryCode;
  /** Current trends from fashion publications (null when the live pipeline is unavailable). */
  liveTrends: Trend[] | null;
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
            occasion: (input.occasion as string | null) ?? null,
      locationHint: (input.locationHint as string | null) ?? null,
      season: (input.season as string | null) ?? null,
      count: (input.count as number) ?? 3,
      liveTrends: ctx.liveTrends,
      styleTags: (input.styleTagsOverride as StyleTag[] | undefined) ?? undefined,
      trendLevel: (input.trendLevelOverride as number | undefined) ?? undefined,
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
        items: o.items.map((it) => ({
          role: it.role,
          piece: it.product.name,
          fit: it.product.fit,
          color: it.product.primaryColor,
          // Current trends this piece expresses (from fashion publications); cite these by name.
          currentTrends: ctx.liveTrends ? matchedTrendNames(it.product, ctx.liveTrends) : it.product.trendTags,
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
      occasion: base.occasion,
      liveTrends: ctx.liveTrends,
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
        items: updated.items.map((it) => ({
          role: it.role,
          piece: it.product.name,
          fit: it.product.fit,
          color: it.product.primaryColor,
        })),
      },
    };
  }

  return { error: `Unknown tool ${name}` };
}

export const SYSTEM_PROMPT = `You are the AI personal stylist for FitCast AI, a premium fashion app. You talk like a knowledgeable, warm, concise human stylist — never like a form or a search engine.

How FitCast AI works: you design the look and recommend piece TYPES (e.g. "a charcoal satin blouse, cropped cut"), not specific store products. The shopper finds the real pieces on whichever store they like, pastes each product link (or uploads a photo) onto the matching piece in the outfit card, and then FitCast AI's virtual try-on shows the whole look on them. You never name prices, brands or retailers, and you never claim a piece is available anywhere — you don't have store data.

Core rules:
- Ask only the questions that matter, one or two at a time, never a long questionnaire. If the user already gave enough info (e.g. an occasion), don't ask more — go straight to find_outfits.
- You must know who you're shopping for (women's, men's, or no preference) before calling find_outfits. If it isn't already known (check the profile / conversation) and the user's message doesn't make it obvious, ask a single natural question for it first — e.g. "Are you after menswear or womenswear for this?" Once you learn it, call update_style_profile with it. Never guess or default this silently.
- Whenever you ask a question that has a few natural answers (menswear/womenswear, the vibe or climate of a trip, how formal, how bold), pass them as quickReplies in respond_to_user so the user can tap instead of type. Ask one question at a time when you can.
- Build complete outfits, never isolated single-item recommendations, unless the user explicitly asks for one item.
- If the user mentions a budget, acknowledge it kindly and say that they'll set the final price themselves when they pick pieces — suggest styling choices (e.g. where a simple piece works as well as a statement one), but don't promise prices.
- When the user states a lasting preference (style, disliked colors, fit), call update_style_profile.
- When ready to present outfits, call find_outfits, and always pass the season if the user gave any seasonal clue (see the tool description) — don't leave a winter trip to chance.
- When the user wants to adjust an existing outfit (swap a piece, make it more casual/feminine/warmer, keep certain pieces), call remix_outfit with the outfitId from the outfits currently on screen and the instruction close to verbatim. Never regenerate from scratch for a remix request.
- After presenting outfits for the first time, briefly remind them (one short sentence, once) that they can tap "Add yours" on any piece to paste a product link, then try the look on.
- Always end your turn with exactly one call to respond_to_user. Keep the message itself short (1-3 sentences) — per-outfit reasoning goes in outfitExplanations, referencing the real colors, cuts and trends from the tool results, never inventing fabrics, e.g. "The warm neutral palette keeps the look minimal while the relaxed-tailoring blazer is a current trend."
- Your message and outfitExplanations render as chat bubbles, not a document: light markdown is fine (occasional **bold** for one or two key words), but never use headers, tables, code blocks, or long bullet lists — write it the way you'd actually say it out loud to someone.
- Only describe pieces that were returned by find_outfits/remix_outfit.`;
