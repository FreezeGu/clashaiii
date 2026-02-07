/**
 * Bot commander macro-AI: chooses which card to play and where.
 * Difficulty scales with trophy tier (reaction delay, mistake rate, weights).
 */
import type { SimWorldState } from '../simWorld';
import { createSeededRng, pickOne } from '../rng';
import type { ElixirState } from './ElixirSystem';

export interface BotProfile {
  tier: number;
  trophyRange: [number, number];
  deckPoolIds: string[];
  reactionDelayMs: number;
  mistakeRate: number;
  lookaheadDepth: number;
  commanderWeights: Record<string, number>;
}

export interface BotDecision {
  cardHandIndex: number;
  tileX: number;
  tileY: number;
  cardId: string;
}

/** Bot side (top of arena). */
const LANE_PLACEMENTS_BOT_SIDE = [
  { tileX: 4, tileY: 4 },
  { tileX: 14, tileY: 4 },
  { tileX: 18, tileY: 4 },
  { tileX: 27, tileY: 4 },
  { tileX: 8, tileY: 5 },
  { tileX: 23, tileY: 5 },
];

/** Decide bot play: card index in hand and placement. */
export function decideBotPlay(
  _state: SimWorldState,
  hand: string[],
  cardCosts: Record<string, number>,
  elixir: ElixirState,
  botProfile: BotProfile,
  seed: number
): BotDecision | null {
  const rng = createSeededRng(seed);
  const affordable: number[] = [];
  for (let i = 0; i < hand.length; i++) {
    const cost = cardCosts[hand[i]] ?? 5;
    if (elixir.current >= cost) affordable.push(i);
  }
  if (affordable.length === 0) return null;
  if (rng() < botProfile.mistakeRate) {
    const idx = Math.floor(rng() * hand.length);
    const cost = cardCosts[hand[idx]] ?? 5;
    if (elixir.current < cost) return null;
    const pos = LANE_PLACEMENTS_BOT_SIDE[Math.floor(rng() * LANE_PLACEMENTS_BOT_SIDE.length)];
    return { cardHandIndex: idx, tileX: pos.tileX, tileY: pos.tileY, cardId: hand[idx] };
  }
  const handIndex = pickOne(affordable, rng)!;
  const cardId = hand[handIndex];
  const pos = LANE_PLACEMENTS_BOT_SIDE[Math.floor(rng() * LANE_PLACEMENTS_BOT_SIDE.length)];
  return { cardHandIndex: handIndex, tileX: pos.tileX, tileY: pos.tileY, cardId };
}

export function getBotProfileForTrophies(trophies: number, profiles: { tiers: BotProfile[] }): BotProfile {
  for (let i = profiles.tiers.length - 1; i >= 0; i--) {
    const t = profiles.tiers[i];
    if (trophies >= t.trophyRange[0]) return t;
  }
  return profiles.tiers[0];
}
