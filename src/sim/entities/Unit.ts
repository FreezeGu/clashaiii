import type { Entity } from './Entity';
import type { Vec2 } from './Entity';

export type UnitCardId = string;

export interface UnitEntity extends Entity {
  kind: 'unit';
  cardId: UnitCardId;
  /** AI level 1..10 (affects behavior only, not stats) */
  aiLevel: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  targetType: 'ground' | 'air' | 'both';
  splashRadius: number;
  /** Current target entity id */
  targetId: string | null;
  /** Path to follow (tile or world positions) */
  path: Vec2[];
  pathIndex: number;
  lastAttackTime: number;
  /** Lane preference for pathing */
  lane: 'left' | 'right';
  /** For bomb / charge etc */
  state: string;
  stateTime: number;
  /** Ranged: projectile type */
  projectileType: string;
  /** Slow effect remaining time */
  slowUntil: number;
  /** Buff from Royal Courier etc */
  buffUntil: number;
}

export function isUnit(e: Entity): e is UnitEntity {
  return e.kind === 'unit';
}
