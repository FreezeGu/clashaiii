import type { Entity } from './Entity';

export type TowerType = 'crown_left' | 'crown_right' | 'king';

export interface TowerEntity extends Entity {
  kind: 'tower';
  towerType: TowerType;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  attackInterval: number;
  lastAttackTime: number;
  /** King starts inactive until damaged */
  active: boolean;
  /** Tile grid position */
  tileX: number;
  tileY: number;
  /** Which lane: 'left' | 'right' | 'center' */
  lane: string;
}

export function isTower(e: Entity): e is TowerEntity {
  return e.kind === 'tower';
}
