import { describe, it, expect } from 'vitest';
import { createCardCycle, playCard, peekNextCard } from '../sim/systems/CardCycleSystem';

describe('CardCycleSystem', () => {
  it('creates hand of size 4 from deck of 6', () => {
    const deck = ['a', 'b', 'c', 'd', 'e', 'f'];
    const state = createCardCycle(deck, 4);
    expect(state.hand).toHaveLength(4);
    expect(state.deckQueue).toHaveLength(2);
    expect(state.hand).toEqual(['a', 'b', 'c', 'd']);
    expect(state.deckQueue).toEqual(['e', 'f']);
  });

  it('playCard moves card to back and draws next', () => {
    const deck = ['a', 'b', 'c', 'd', 'e', 'f'];
    const state = createCardCycle(deck, 4);
    const played = playCard(state, 0);
    expect(played).toBe('a');
    expect(state.hand).toEqual(['b', 'c', 'd', 'e']);
    expect(state.deckQueue).toEqual(['f', 'a']);
  });

  it('playCard returns null for invalid index', () => {
    const state = createCardCycle(['a', 'b', 'c', 'd', 'e', 'f'], 4);
    expect(playCard(state, -1)).toBeNull();
    expect(playCard(state, 10)).toBeNull();
  });

  it('peekNextCard returns first in queue', () => {
    const state = createCardCycle(['a', 'b', 'c', 'd', 'e', 'f'], 4);
    expect(peekNextCard(state)).toBe('e');
    playCard(state, 0);
    expect(peekNextCard(state)).toBe('f');
  });

  it('cycle is deterministic after multiple plays', () => {
    const state = createCardCycle(['a', 'b', 'c', 'd', 'e', 'f'], 4);
    for (let i = 0; i < 6; i++) {
      playCard(state, 0);
    }
    expect(state.hand).toEqual(['a', 'b', 'c', 'd']);
    expect(state.deckQueue).toEqual(['e', 'f']);
  });
});
