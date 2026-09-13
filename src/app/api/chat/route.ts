import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { emptyStyleProfile, Outfit, StyleProfile } from "@/lib/types";
import { executeTool, SYSTEM_PROMPT, toolDefinitions, ToolRunContext } from "@/lib/chat-tools";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-5";
const MAX_TOOL_ROUNDS = 8;

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  profile: StyleProfile;
  currentOutfits: Outfit[];
  targetOutfitId?: string;
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

  const ctx: ToolRunContext = {
    profile: body.profile ?? emptyStyleProfile,
    outfitsById: new Map((body.currentOutfits ?? []).map((o) => [o.id, o])),
    touchedIds: [],
    replaces: new Map(),
    freshSetIds: new Set(),
  };

  const conversation: Anthropic.MessageParam[] = (body.messages ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const targetOutfit = body.targetOutfitId ? ctx.outfitsById.get(body.targetOutfitId) : undefined;
  const system = targetOutfit
    ? `${SYSTEM_PROMPT}\n\nContext for this turn only: the user's message is about the outfit with id "${targetOutfit.id}" ("${targetOutfit.name}"), currently shown on screen. If this is a modification request, call remix_outfit with that exact outfitId.`
    : SYSTEM_PROMPT;

  let finalMessage = "";
  const outfitExplanations = new Map<string, string>();

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
          const input = tu.input as { message: string; outfitExplanations?: { outfitId: string; explanation: string }[] };
          finalMessage = input.message;
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
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "The AI stylist ran into an error. Please try again." },
      { status: 502 }
    );
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

  return NextResponse.json({
    reply: finalMessage || "Let's find you something great — what are you shopping for?",
    profile: ctx.profile,
    outfits,
  });
}
