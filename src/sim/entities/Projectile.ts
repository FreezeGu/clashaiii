import type { Entity } from './Entity';

export interface ProjectileEntity extends Entity {
  kind: 'projectile';
  targetId: string;
  damage: number;
  speed: number;
  splashRadius: number;
  /** For interpolation */
  startX: number;
  startY: number;
  projectileType: string;
}

export function isProjectile(e: Entity): e is ProjectileEntity {
  return e.kind === 'projectile';
}
