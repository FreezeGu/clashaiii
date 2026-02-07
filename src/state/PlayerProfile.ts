export interface PlayerProfile {
  playerName: string;
  trophies: number;
  gold: number;
  ownedCardIds: string[];
  cardAILevel: Record<string, number>;
  deckCardIds: string[];
}

const DEFAULT_DECK = [
  'steel_squire',
  'bone_trio',
  'alley_gobbers',
  'ember_archer',
  'shield_bearer',
  'sky_midge',
];

const DEFAULT_OWNED = [
  'steel_squire',
  'bone_trio',
  'alley_gobbers',
  'ember_archer',
  'shield_bearer',
  'sky_midge',
  'axe_matron',
  'clockwork_spear',
];

export function createDefaultProfile(): PlayerProfile {
  return {
    playerName: 'Champion',
    trophies: 0,
    gold: 500,
    ownedCardIds: [...DEFAULT_OWNED],
    cardAILevel: Object.fromEntries(
      DEFAULT_OWNED.map((id, i) => [id, i < 2 ? 2 : i < 4 ? 3 : 1])
    ),
    deckCardIds: [...DEFAULT_DECK],
  };
}
