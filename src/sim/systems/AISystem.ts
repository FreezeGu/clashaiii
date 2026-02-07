/**
 * Unit micro-AI: target acquisition and behavior. Uses scoring from aiProfiles.
 * AI level affects reaction delay, weights, and path replan frequency.
 */
import type { UnitEntity } from '../entities/Unit';
import type { Entity } from '../entities/Entity';
import type { SimWorldState } from '../simWorld';
import { getUnits, getTowers } from '../simWorld';
import { distance } from '../entities/Entity';

export interface AIProfileWeights {
  reactionDelayMs: number;
  targetPriorityWeights: {
    distance: number;
    hp: number;
    tower: number;
    threat: number;
    focusFire: number;
  };
  retreatThreshold: number;
  kiteDistance: number;
  focusFireBias: number;
  pathReplanIntervalMs: number;
  awarenessRadiusTiles: number;
}

const DEFAULT_WEIGHTS: AIProfileWeights = {
  reactionDelayMs: 500,
  targetPriorityWeights: { distance: 0.5, hp: 0.2, tower: 0.2, threat: 0.1, focusFire: 0 },
  retreatThreshold: 0.3,
  kiteDistance: 2,
  focusFireBias: 0.2,
  pathReplanIntervalMs: 1500,
  awarenessRadiusTiles: 8,
};

/** Score a potential target for a unit. Higher = better. */
export function scoreTarget(
  unit: UnitEntity,
  target: Entity,
  _state: SimWorldState,
  weights: AIProfileWeights
): number {
  const dist = distance(unit, target);
  const distNorm = Math.min(1, dist / (weights.awarenessRadiusTiles * 40));
  const w = weights.targetPriorityWeights;
  let score = w.distance * (1 - distNorm);
  if (target.kind === 'unit') {
    const u = target as UnitEntity;
    const hpFactor = u.hp / (u.maxHp || 1);
    score += w.hp * hpFactor;
  }
  if (target.kind === 'tower') score += w.tower;
  return score;
}

/** Choose best target from visible enemies. */
export function chooseTarget(
  state: SimWorldState,
  unit: UnitEntity,
  weights: AIProfileWeights
): Entity | null {
  const units = getUnits(state).filter((u) => u.owner !== unit.owner);
  const towers = getTowers(state).filter((t) => t.owner !== unit.owner && t.active);
  const candidates: Entity[] = [...units, ...towers];
  const radius = weights.awarenessRadiusTiles * 40;
  const inRange = candidates.filter((c) => distance(unit, c) <= radius);
  if (inRange.length === 0) return null;
  let best: Entity | null = null;
  let bestScore = -1;
  for (const c of inRange) {
    const s = scoreTarget(unit, c, state, weights);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

/** Get path to target for unit (e.g. nearest tower if no units). */
export function getMoveTarget(state: SimWorldState, unit: UnitEntity): { x: number; y: number } | null {
  if (unit.targetId) {
    const e = state.entities.find((x) => x.id === unit.targetId);
    if (e && !e.dead) return { x: e.x, y: e.y };
  }
  const enemyTowers = getTowers(state).filter((t) => t.owner !== unit.owner && !t.dead);
  if (enemyTowers.length === 0) return null;
  let nearest = enemyTowers[0];
  let d = distance(unit, nearest);
  for (const t of enemyTowers) {
    const d2 = distance(unit, t);
    if (d2 < d) {
      d = d2;
      nearest = t;
    }
  }
  return { x: nearest.x, y: nearest.y };
}

export function getWeightsForLevel(level: number, _profiles: unknown): AIProfileWeights {
  return { ...DEFAULT_WEIGHTS, reactionDelayMs: Math.max(100, 800 - level * 60) };
}
