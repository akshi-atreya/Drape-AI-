"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import {
  ChatMessage,
  emptyStyleProfile,
  Outfit,
  SavedLook,
  StyleProfile,
  WardrobeItem,
} from "@/lib/types";

interface ChatApiOutfitResult {
  outfit: Outfit;
  replacesId?: string;
  isFreshSet?: boolean;
}

interface AppState {
  chatStarted: boolean;
  messages: ChatMessage[];
  profile: StyleProfile;
  outfitOrder: string[]; // ids, in display order, most recent turn's outfits
  outfitsById: Record<string, Outfit>;
  wardrobe: WardrobeItem[];
  savedLooks: SavedLook[];
  loading: boolean;
  error: string | null;

  startChat: () => void;
  sendMessage: (text: string, targetOutfitId?: string) => Promise<void>;
  remix: (outfitId: string, instruction: string) => Promise<void>;
  updateProfile: (patch: Partial<StyleProfile>) => void;
  reviveOutfit: (outfit: Outfit) => void;
  addWardrobeItem: (item: Omit<WardrobeItem, "id" | "addedAt">) => void;
  removeWardrobeItem: (id: string) => void;
  saveLook: (look: Omit<SavedLook, "id" | "savedAt">) => void;
  removeSavedLook: (id: string) => void;
  resetChat: () => void;
}

async function callChatApi(
  messages: ChatMessage[],
  profile: StyleProfile,
  currentOutfits: Outfit[],
  targetOutfitId?: string
): Promise<{ reply: string; profile: StyleProfile; outfits: ChatApiOutfitResult[] }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      profile,
      currentOutfits,
      targetOutfitId,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong talking to the AI stylist.");
  return data;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      chatStarted: false,
      messages: [],
      profile: emptyStyleProfile,
      outfitOrder: [],
      outfitsById: {},
      wardrobe: [],
      savedLooks: [],
      loading: false,
      error: null,

      startChat: () => set({ chatStarted: true }),

      sendMessage: async (text: string, targetOutfitId?: string) => {
        const userMsg: ChatMessage = {
          id: uuid(),
          role: "user",
          content: text,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          chatStarted: true,
          messages: [...s.messages, userMsg],
          loading: true,
          error: null,
        }));

        try {
          const { messages, profile, outfitsById, outfitOrder } = get();
          const currentOutfits = outfitOrder.map((id) => outfitsById[id]).filter(Boolean);
          const { reply, profile: newProfile, outfits } = await callChatApi(
            messages,
            profile,
            currentOutfits,
            targetOutfitId
          );

          const nextOutfitsById = { ...get().outfitsById };
          const newIds: string[] = [];
          for (const { outfit } of outfits) {
            nextOutfitsById[outfit.id] = outfit;
            newIds.push(outfit.id);
          }

          // Merge into display order: a fresh find_outfits call replaces the
          // whole board; a remix patches just the card it came from in place.
          const hasFreshSet = outfits.some((o) => o.isFreshSet);
          let nextOrder = hasFreshSet
            ? outfits.filter((o) => o.isFreshSet).map((o) => o.outfit.id)
            : get().outfitOrder;
          if (!hasFreshSet) {
            for (const { outfit, replacesId } of outfits) {
              if (replacesId && nextOrder.includes(replacesId)) {
                nextOrder = nextOrder.map((id) => (id === replacesId ? outfit.id : id));
              } else if (!nextOrder.includes(outfit.id)) {
                nextOrder = [...nextOrder, outfit.id];
              }
            }
          }

          const assistantMsg: ChatMessage = {
            id: uuid(),
            role: "assistant",
            content: reply,
            outfits: newIds.map((id) => nextOutfitsById[id]),
            createdAt: new Date().toISOString(),
          };

          set(() => ({
            messages: [...get().messages, assistantMsg],
            profile: newProfile,
            outfitsById: nextOutfitsById,
            outfitOrder: newIds.length ? nextOrder : get().outfitOrder,
            loading: false,
          }));
        } catch (e) {
          set({
            loading: false,
            error: e instanceof Error ? e.message : "Something went wrong.",
          });
        }
      },

      remix: async (outfitId: string, instruction: string) => {
        await get().sendMessage(instruction, outfitId);
      },

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      reviveOutfit: (outfit) =>
        set((s) => ({
          chatStarted: true,
          outfitsById: { ...s.outfitsById, [outfit.id]: outfit },
          outfitOrder: s.outfitOrder.includes(outfit.id) ? s.outfitOrder : [...s.outfitOrder, outfit.id],
          messages: [
            ...s.messages,
            {
              id: uuid(),
              role: "assistant",
              content: `Here's your saved "${outfit.name}" look.`,
              outfits: [outfit],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      addWardrobeItem: (item) =>
        set((s) => ({
          wardrobe: [
            ...s.wardrobe,
            { ...item, id: uuid(), addedAt: new Date().toISOString() },
          ],
        })),

      removeWardrobeItem: (id) =>
        set((s) => ({ wardrobe: s.wardrobe.filter((w) => w.id !== id) })),

      saveLook: (look) =>
        set((s) => ({
          savedLooks: [
            { ...look, id: uuid(), savedAt: new Date().toISOString() },
            ...s.savedLooks,
          ],
        })),

      removeSavedLook: (id) =>
        set((s) => ({ savedLooks: s.savedLooks.filter((l) => l.id !== id) })),

      resetChat: () =>
        set({ chatStarted: false, messages: [], outfitOrder: [], outfitsById: {} }),
    }),
    {
      name: "ai-fashion-shopper-store",
      partialize: (s) => ({
        profile: s.profile,
        wardrobe: s.wardrobe,
        savedLooks: s.savedLooks,
        messages: s.messages,
        outfitOrder: s.outfitOrder,
        outfitsById: s.outfitsById,
        chatStarted: s.chatStarted,
      }),
    }
  )
);
