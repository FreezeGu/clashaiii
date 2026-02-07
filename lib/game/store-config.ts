/** Store configuration for shop items */

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: "gold_pack" | "ai_manual" | "card_crate";
  icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "gold_pack_small",
    name: "Gold Pouch",
    description: "+200 Gold",
    cost: 0, // free starter pack
    type: "gold_pack",
    icon: "coins",
  },
  {
    id: "gold_pack_large",
    name: "Gold Chest",
    description: "+500 Gold",
    cost: 0, // free for prototype
    type: "gold_pack",
    icon: "chest",
  },
  {
    id: "ai_manual",
    name: "AI Manual",
    description: "Upgrade any card's AI by 1 level at 50% discount",
    cost: 25,
    type: "ai_manual",
    icon: "book",
  },
  {
    id: "card_crate",
    name: "Card Crate",
    description: "Unlock a random missing card",
    cost: 150,
    type: "card_crate",
    icon: "crate",
  },
];

/** Trophy rewards */
export const TROPHY_WIN = 30;
export const TROPHY_LOSS = -15;
export const TROPHY_TIE = 0;

/** Elixir config */
export const MAX_ELIXIR = 10;
export const ELIXIR_REGEN_MS = 2800;

/** Battle config */
export const BATTLE_DURATION_S = 180; // 3 minutes
