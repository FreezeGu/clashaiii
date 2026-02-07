/**
 * Deck as queue; hand as first N cards. When a card is played it goes to back of queue.
 * Deterministic and test-covered.
 */
export interface CardCycleState {
  /** Queue order: [next to draw, ..., back of queue] */
  deckQueue: string[];
  /** Current hand (indices 0..handSize-1 from deckQueue) */
  hand: string[];
  handSize: number;
}

export function createCardCycle(deckCardIds: string[], handSize: number): CardCycleState {
  const deckQueue = [...deckCardIds];
  const hand: string[] = [];
  for (let i = 0; i < handSize && deckQueue.length > 0; i++) {
    hand.push(deckQueue.shift()!);
  }
  return { deckQueue, hand, handSize };
}

/**
 * Play card at hand index. Card goes to back of deck; next card drawn into hand.
 * Returns the cardId that was played, or null if invalid.
 */
export function playCard(state: CardCycleState, handIndex: number): string | null {
  if (handIndex < 0 || handIndex >= state.hand.length) return null;
  const cardId = state.hand[handIndex];
  state.hand.splice(handIndex, 1);
  state.deckQueue.push(cardId);
  if (state.deckQueue.length > 0) {
    const next = state.deckQueue.shift()!;
    state.hand.push(next);
  }
  return cardId;
}

/** Get the next card that would be drawn (first in queue) without modifying state. */
export function peekNextCard(state: CardCycleState): string | null {
  return state.deckQueue[0] ?? null;
}
