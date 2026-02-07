import { describe, it, expect } from 'vitest';
import { createSeededRng, shuffle, randomInt } from '../sim/rng';

describe('rng', () => {
  it('same seed produces same sequence', () => {
    const r1 = createSeededRng(42);
    const r2 = createSeededRng(42);
    for (let i = 0; i < 10; i++) {
      expect(r1()).toBe(r2());
    }
  });

  it('shuffle is deterministic with same seed', () => {
    const arr = [1, 2, 3, 4, 5];
    const rng = createSeededRng(99);
    const s1 = shuffle([...arr], rng);
    const rng2 = createSeededRng(99);
    const s2 = shuffle([...arr], rng2);
    expect(s1).toEqual(s2);
  });

  it('randomInt is in range', () => {
    const rng = createSeededRng(1);
    for (let i = 0; i < 20; i++) {
      const n = randomInt(5, 10, rng);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });
});
