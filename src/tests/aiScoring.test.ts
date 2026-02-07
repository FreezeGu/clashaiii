import { describe, it, expect } from 'vitest';
import { scoreTarget, getWeightsForLevel } from '../sim/systems/AISystem';
import type { UnitEntity } from '../sim/entities/Unit';

describe('AISystem', () => {
  it('getWeightsForLevel returns object with reactionDelayMs', () => {
    const w = getWeightsForLevel(5, {});
    expect(w.reactionDelayMs).toBeLessThanOrEqual(800);
    expect(w.targetPriorityWeights).toBeDefined();
  });

  it('scoreTarget returns higher for closer target', () => {
    const unit: UnitEntity = {
      id: 'u1',
      kind: 'unit',
      x: 0,
      y: 0,
      owner: 'player',
      dead: false,
      cardId: 'steel_squire',
      aiLevel: 5,
      hp: 1000,
      maxHp: 1000,
      damage: 100,
      attackRange: 2,
      attackSpeed: 1,
      moveSpeed: 2,
      targetType: 'ground',
      splashRadius: 0,
      targetId: null,
      path: [],
      pathIndex: 0,
      lastAttackTime: 0,
      lane: 'left',
      state: 'idle',
      stateTime: 0,
      projectileType: 'none',
      slowUntil: 0,
      buffUntil: 0,
    };
    const close: UnitEntity = { ...unit, id: 'close', x: 40, y: 0 };
    const far: UnitEntity = { ...unit, id: 'far', x: 200, y: 0 };
    const weights = getWeightsForLevel(5, {});
    const state = { entities: [], grid: {} as never, matchTimeSec: 0, playerCrowns: 0, botCrowns: 0, gameOver: false, winner: null };
    const scoreClose = scoreTarget(unit, close, state as never, weights);
    const scoreFar = scoreTarget(unit, far, state as never, weights);
    expect(scoreClose).toBeGreaterThan(scoreFar);
  });
});
