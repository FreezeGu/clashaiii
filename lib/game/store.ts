"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ALL_CARDS,
  COLLECTION_CARDS,
  DEFAULT_DECK_IDS,
  getUpgradeCost,
} from "./cards";

export interface GameState {
  playerName: string;
  trophies: number;
  gold: number;
  ownedCardIds: string[];
  deckIds: string[]; // exactly 6
  cardAiLevels: Record<string, number>;
  dailyDealCardId: string;
  dailyDealDate: string;

  // Actions
  setPlayerName: (name: string) => void;
  addTrophies: (amount: number) => void;
  addGold: (amount: number) => void;
  unlockCard: (cardId: string) => void;
  swapDeckCard: (deckIndex: number, newCardId: string) => void;
  upgradeCardAI: (cardId: string, discount?: boolean) => boolean;
  purchaseGoldPack: (amount: number) => void;
  purchaseCardCrate: () => string | null;
  refreshDailyDeal: () => void;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getRandomDailyDeal(owned: string[]) {
  const allIds = COLLECTION_CARDS.map((c) => c.id);
  const idx = Math.floor(Math.random() * allIds.length);
  return allIds[idx];
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerName: "Comandante",
      trophies: 0,
      gold: 500,
      ownedCardIds: ALL_CARDS.map((c) => c.id),
      deckIds: [...DEFAULT_DECK_IDS],
      cardAiLevels: Object.fromEntries(
        COLLECTION_CARDS.map((c) => [c.id, 1])
      ),
      dailyDealCardId: COLLECTION_CARDS[0].id,
      dailyDealDate: getTodayString(),

      setPlayerName: (name) => set({ playerName: name }),

      addTrophies: (amount) =>
        set((s) => ({ trophies: Math.max(0, s.trophies + amount) })),

      addGold: (amount) =>
        set((s) => ({ gold: Math.max(0, s.gold + amount) })),

      unlockCard: (cardId) =>
        set((s) => {
          if (s.ownedCardIds.includes(cardId)) return s;
          return { ownedCardIds: [...s.ownedCardIds, cardId] };
        }),

      swapDeckCard: (deckIndex, newCardId) =>
        set((s) => {
          const newDeck = [...s.deckIds];
          newDeck[deckIndex] = newCardId;
          return { deckIds: newDeck };
        }),

      upgradeCardAI: (cardId, discount = false) => {
        const state = get();
        const currentLevel = state.cardAiLevels[cardId] || 1;
        if (currentLevel >= 10) return false;
        const cost = discount
          ? Math.floor(getUpgradeCost(currentLevel) / 2)
          : getUpgradeCost(currentLevel);
        if (state.gold < cost) return false;
        set({
          gold: state.gold - cost,
          cardAiLevels: {
            ...state.cardAiLevels,
            [cardId]: currentLevel + 1,
          },
        });
        return true;
      },

      purchaseGoldPack: (amount) =>
        set((s) => ({ gold: s.gold + amount })),

      purchaseCardCrate: () => {
        const state = get();
        if (state.gold < 150) return null;
        const missing = COLLECTION_CARDS.filter(
          (c) => !state.ownedCardIds.includes(c.id)
        );
        if (missing.length === 0) {
          // Give gold instead as "shards"
          set({ gold: state.gold - 150 + 75 });
          return null;
        }
        const card = missing[Math.floor(Math.random() * missing.length)];
        set({
          gold: state.gold - 150,
          ownedCardIds: [...state.ownedCardIds, card.id],
          cardAiLevels: { ...state.cardAiLevels, [card.id]: 1 },
        });
        return card.id;
      },

      refreshDailyDeal: () => {
        const today = getTodayString();
        const state = get();
        if (state.dailyDealDate !== today) {
          set({
            dailyDealCardId: getRandomDailyDeal(state.ownedCardIds),
            dailyDealDate: today,
          });
        }
      },
    }),
    {
      name: "torre-di-battaglia-store",
    }
  )
);
