import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { emptyStyleProfile, Outfit, StyleProfile } from "@/lib/types";
import { executeTool, SYSTEM_PROMPT, toolDefinitions, ToolRunContext } from "@/lib/chat-tools";
import { CountryCode } from "@/lib/locale";
import { getLiveTrends } from "@/lib/live-trends";
import { MANUAL_WEATHER_OPTIONS, WeatherContext, weatherPromptBlock } from "@/lib/weather";

export const runtime = "nodejs";
// Model calls can take a while; Vercel's default function timeout is shorter.
export const maxDuration = 60;

const MODEL = "claude-sonnet-5";
const MAX_TOOL_ROUNDS = 8;

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string; images?: { id: string; dataUrl: string }[] }[];
  /** Items the shopper has saved as owned (their Wardrobe page). */
  wardrobe?: { name?: string; category?: string; color?: string }[];
  profile: StyleProfile;
  currentOutfits: Outfit[];
  targetOutfitId?: string;
  countryCode?: CountryCode;
  /** Weather summary (never coordinates) from the shopper's location, if they shared it. */
  weather?: WeatherContext | null;
  /** True if we asked for location and the shopper declined / it was unavailable. */
  locationDenied?: boolean;
}

/** Compact, sanitized summary of the saved profile for the model (the profile comes from the browser). */
function profileBlock(p: StyleProfile | undefined): string {
  if (!p) return "";
  const clean = (v: unknown, max = 40) => String(v).replace(/[^\p{L}\p{N}\s,'&-]/gu, "").trim().slice(0, max);
  const list = (arr: unknown) => (Array.isArray(arr) ? arr.slice(0, 8).map((x) => clean(x)).filter(Boolean) : []);
  const parts: string[] = [];
  if (p.gender === "Women") parts.push("shopping for womenswear");
  else if (p.gender === "Men") parts.push("shopping for menswear");
  else if (p.gender === "Unisex") parts.push("no gender preference");
  const styles = list(p.styles);
  if (styles.length) parts.push(`style: ${styles.join(", ")}`);
  const likes = list(p.colorsLike);
  if (likes.length) parts.push(`likes colors: ${likes.join(", ")}`);
  const avoid = list(p.colorsAvoid);
  if (avoid.length) parts.push(`avoids colors: ${avoid.join(", ")}`);
  const fits = list(p.fitPreferences);
  if (fits.length) parts.push(`fit: ${fits.join(", ")}`);
  if (!parts.length) return "";
  return `\n\nSaved shopper profile (remembered from earlier visits): ${parts.join("; ")}. Use it and don't ask again for anything already listed. Only ask about menswear/womenswear again if the user says this look is for someone else.`;
}

/** Photos the shopper can attach: how many we keep and how big each may be. */
const MAX_PHOTOS = 4;
const MAX_PHOTO_CHARS = 1_600_000;
const IMAGE_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

/**
 * Turns the chat history into model messages, attaching the most recent
 * photos as images labeled [Photo N] so the stylist can refer to them (and
 * point tools at them with photoIndex). The photos come from the browser, so
 * type and size are re-checked here.
 */
function buildConversation(messages: ChatRequestBody["messages"]): { conversation: Anthropic.MessageParam[]; photoIds: string[] } {
  type Valid = { id: string; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; data: string };
  const valid = (m: ChatRequestBody["messages"][number]): Valid[] =>
    m.role !== "user" || !Array.isArray(m.images)
      ? []
      : m.images.slice(0, 3).flatMap((img) => {
          const match = typeof img?.dataUrl === "string" && img.dataUrl.length <= MAX_PHOTO_CHARS ? IMAGE_RE.exec(img.dataUrl) : null;
          const id = typeof img?.id === "string" ? img.id.replace(/[^A-Za-z0-9-]/g, "").slice(0, 60) : "";
          return match && id ? [{ id, mediaType: match[1] as Valid["mediaType"], data: match[2] }] : [];
        });

  // Keep only the most recent photos overall.
  const all = messages.flatMap(valid);
  const keep = new Set(all.slice(-MAX_PHOTOS).map((p) => p.id));
  const photoIds: string[] = [];

  const conversation = messages.map((m): Anthropic.MessageParam => {
    const photos = valid(m).filter((p) => keep.has(p.id));
    if (photos.length === 0) return { role: m.role, content: m.content || "(photo)" };
    const blocks: Anthropic.ContentBlockParam[] = [];
    for (const p of photos) {
      photoIds.push(p.id);
      blocks.push({ type: "text", text: `[Photo ${photoIds.length}]` });
      blocks.push({ type: "image", source: { type: "base64", media_type: p.mediaType, data: p.data } });
    }
    blocks.push({ type: "text", text: m.content || "How can I style this?" });
    return { role: "user", content: blocks };
  });
  return { conversation, photoIds };
}

/** What the shopper told us they own (their Wardrobe page), sanitized for the prompt. */
function wardrobeBlock(items: ChatRequestBody["wardrobe"]): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  const clean = (v: unknown, max: number) => String(v ?? "").replace(/[^\p{L}\p{N}\s,'&()/-]/gu, "").trim().slice(0, max);
  const lines = items
    .slice(0, 20)
    .map((w) => [clean(w?.color, 20), clean(w?.name, 50)].filter(Boolean).join(" ") + (w?.category ? ` (${clean(w.category, 20)})` : ""))
    .filter((l) => l.trim());
  if (!lines.length) return "";
  return `\n\nThings the shopper has saved as already owning: ${lines.join("; ")}. When styling or building looks, you may use these as ownedItems (no photoIndex) and mention that they already have them — only if they fit the request.`;
}

/** The weather arrives from the browser, so re-validate it before it reaches the prompt or the engine. */
function cleanWeather(w: unknown): WeatherContext | null {
  if (!w || typeof w !== "object") return null;
  const x = w as Partial<WeatherContext>;
  const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
  const tempC = num(x.tempC, -60, 60);
  const feelsLikeC = num(x.feelsLikeC, -80, 70);
  const effectiveC = num(x.effectiveC, -60, 60);
  if (tempC == null || feelsLikeC == null || effectiveC == null) return null;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[^\p{L}\p{N}\s,.'°/()-]/gu, "").slice(0, max) : "");
  const bands = ["cold", "cool", "mild", "warm", "hot"];
  const seasons = ["Winter", "Fall", "Spring", "Summer"];
  return {
    city: x.city ? text(x.city, 60) || null : null,
    tempC,
    feelsLikeC,
    effectiveC,
    band: bands.includes(x.band as string) ? (x.band as WeatherContext["band"]) : "mild",
    season: seasons.includes(x.season as string) ? (x.season as WeatherContext["season"]) : "Spring",
    conditions: text(x.conditions, 40) || "unknown",
    rain: x.rain === true,
    snow: x.snow === true,
    forecast: (Array.isArray(x.forecast) ? x.forecast : []).slice(0, 5).map((d) => ({
      label: text(d?.label, 12),
      highC: num(d?.highC, -60, 60) ?? 0,
      lowC: num(d?.lowC, -60, 60) ?? 0,
      conditions: text(d?.conditions, 40),
      rain: d?.rain === true,
    })),
    weekend:
      x.weekend && num(x.weekend.tempC, -60, 60) != null
        ? { tempC: x.weekend.tempC as number, summary: text(x.weekend.summary, 120) }
        : null,
    source: x.source === "manual" ? "manual" : "location",
    fetchedAt: typeof x.fetchedAt === "string" ? x.fetchedAt.slice(0, 40) : "",
  };
}

/**
 * True only when the reply is actually asking "menswear or womenswear?" — it names both
 * and asks a question. A reply like "Got it, womenswear it is! Where are you headed?"
 * mentions one and must NOT bring the gender buttons back.
 */
function asksMenswearOrWomenswear(message: string): boolean {
  const men = /\b(menswear|men'?s)\b/i.test(message);
  const women = /\b(womenswear|women'?s)\b/i.test(message);
  return men && women && message.includes("?");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to a .env.local file at the project root and restart the dev server.",
      },
      { status: 500 }
    );
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });

  const countryCode: CountryCode = body.countryCode ?? "US";
  const weather = cleanWeather(body.weather);
  // Current trends from fashion publications. Cached for hours; if the cache is cold we don't make the shopper wait for a rebuild.
  const trendData = await getLiveTrends(2500);
  const ctx: ToolRunContext = {
    profile: body.profile ?? emptyStyleProfile,
    outfitsById: new Map((body.currentOutfits ?? []).map((o) => [o.id, o])),
    touchedIds: [],
    replaces: new Map(),
    freshSetIds: new Set(),
    countryCode,
    liveTrends: trendData.live ? trendData.trends : null,
    weather,
    photoIds: [],
  };

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Say something to your stylist first." }, { status: 400 });
  }
  const built = buildConversation(Array.isArray(body.messages) ? body.messages : []);
  const conversation = built.conversation;
  ctx.photoIds = built.photoIds;

  const targetOutfit = body.targetOutfitId ? ctx.outfitsById.get(body.targetOutfitId) : undefined;
  const targetContext = targetOutfit
    ? `\n\nContext for this turn only: the user's message is about the outfit with id "${targetOutfit.id}" ("${targetOutfit.name}"), currently shown on screen. If this is a modification request, call remix_outfit with that exact outfitId.`
    : "";

  const trendContext = trendData.live
    ? `\n\nWhat's trending right now (extracted from current fashion publications such as ${trendData.outlets.join(", ")}; updated ${trendData.updatedAt?.slice(0, 10)}):\n${trendData.trends
        .map((t) => `- ${t.name}: ${t.shortExplanation}`)
        .join("\n")}\nWhen it genuinely fits, tell the user which current trend a look draws on, by name and in your own words — never invent a trend that isn't listed, and don't quote articles.`
    : "";

  const weatherContext = weatherPromptBlock(weather, !body.locationDenied);

  const system = `${SYSTEM_PROMPT}${profileBlock(ctx.profile)}${wardrobeBlock(body.wardrobe)}${weatherContext}${trendContext}${targetContext}`;

  let finalMessage = "";
  const outfitExplanations = new Map<string, string>();
  let quickReplies: string[] = [];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system,
        tools: toolDefinitions,
        messages: conversation,
      });

      conversation.push({ role: "assistant", content: response.content });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUses.length === 0) {
        finalMessage = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        break;
      }

      let done = false;
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const tu of toolUses) {
        if (tu.name === "respond_to_user") {
          const input = tu.input as {
            message: string;
            quickReplies?: unknown;
            outfitExplanations?: { outfitId: string; explanation: string }[];
          };
          finalMessage = input.message;
          if (Array.isArray(input.quickReplies)) {
            quickReplies = input.quickReplies
              .filter((q): q is string => typeof q === "string" && q.trim().length > 0 && q.length <= 40)
              .slice(0, 5);
          }
          for (const ex of input.outfitExplanations ?? []) {
            outfitExplanations.set(ex.outfitId, ex.explanation);
          }
          done = true;
          toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: "ok" });
          continue;
        }

        const result = executeTool(tu.name, tu.input as Record<string, unknown>, ctx);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        });
      }

      conversation.push({ role: "user", content: toolResults });
      if (done) break;
    }
  } catch (err) {
    // Full detail goes to the server logs; the shopper gets a message that says
    // what kind of problem it is without revealing configuration details.
    const status = err instanceof Anthropic.APIError ? err.status : undefined;
    console.error("Chat route error:", { status, name: err instanceof Error ? err.name : typeof err, message: err instanceof Error ? err.message.slice(0, 300) : String(err) });

    let message = "The AI stylist ran into an error. Please try again.";
    if (status === 401 || status === 403) {
      message = "The stylist isn't set up correctly on the server right now (the AI service rejected its credentials). The site owner needs to check the API key.";
    } else if (status === 429 || status === 529) {
      message = "The stylist is very busy right now. Please try again in a moment.";
    } else if (status === 400 && err instanceof Error && /credit balance|billing/i.test(err.message)) {
      message = "The stylist is temporarily unavailable (the AI account is out of credits). The site owner needs to top it up.";
    } else if (status === 404) {
      message = "The stylist is misconfigured on the server (unknown AI model).";
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }

  for (const [id, explanation] of outfitExplanations) {
    const outfit = ctx.outfitsById.get(id);
    if (outfit) outfit.explanation = explanation;
  }

  const outfits = ctx.touchedIds
    .map((id) => ctx.outfitsById.get(id))
    .filter((o): o is Outfit => Boolean(o))
    .map((outfit) => ({
      outfit,
      replacesId: ctx.replaces.get(outfit.id),
      isFreshSet: ctx.freshSetIds.has(outfit.id),
    }));

  // Guarantee the gender question always comes with buttons, even if the
  // model forgot to attach them: no outfits yet and the reply is asking for it.
  if (
    quickReplies.length === 0 &&
    outfits.length === 0 &&
    asksMenswearOrWomenswear(finalMessage)
  ) {
    quickReplies = ["Womenswear", "Menswear", "No preference"];
  }
  // Same for an occasion question: never leave the shopper typing an answer to "date night or casual?".
  if (
    quickReplies.length === 0 &&
    outfits.length === 0 &&
    finalMessage.includes("?") &&
    /\boccasion\b|date night or|what are you dressing for|what('s| is) the (event|plan)/i.test(finalMessage)
  ) {
    quickReplies = ["Date night", "Casual day out", "Work", "Party"];
  }

  // Same guarantee for the weather question: always offer tappable answers.
  if (
    quickReplies.length === 0 &&
    outfits.length === 0 &&
    !weather &&
    /weather|temperature|how (cold|warm|hot)|climate/i.test(finalMessage)
  ) {
    quickReplies = MANUAL_WEATHER_OPTIONS.map((o) => o.label);
  }
  // Buttons only make sense alongside a question, not next to finished looks.
  if (outfits.length > 0) quickReplies = [];

  return NextResponse.json({
    reply: finalMessage || "Let's find you something great — what are you shopping for?",
    quickReplies,
    profile: ctx.profile,
    outfits,
  });
}
