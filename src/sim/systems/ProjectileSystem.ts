import type { ProjectileEntity } from '../entities/Projectile';
import type { SimWorldState } from '../simWorld';
import { getEntity } from '../simWorld';
import { dealDamage, applySplashDamage } from './CombatSystem';

const TILE_PX = 40;

export function updateProjectiles(state: SimWorldState, dt: number): void {
  const projectiles = state.entities.filter((e): e is ProjectileEntity => e.kind === 'projectile');
  for (const p of projectiles) {
    const target = getEntity(state, p.targetId);
    if (!target || target.dead) {
      p.dead = true;
      continue;
    }
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const move = p.speed * TILE_PX * dt;
    if (dist <= move || dist < 8) {
      if (p.splashRadius > 0) {
        applySplashDamage(state, p.x, p.y, p.splashRadius, p.damage);
      } else {
        dealDamage(state, p.targetId, p.damage);
      }
      p.dead = true;
    } else {
      p.x += (dx / dist) * move;
      p.y += (dy / dist) * move;
    }
  }
}

export function createProjectile(
  state: SimWorldState,
  id: string,
  startX: number,
  startY: number,
  targetId: string,
  damage: number,
  speed: number,
  splashRadius: number,
  projectileType: string
): ProjectileEntity {
  const p: ProjectileEntity = {
    id,
    kind: 'projectile',
    x: startX,
    y: startY,
    owner: '',
    dead: false,
    targetId,
    damage,
    speed,
    splashRadius,
    startX,
    startY,
    projectileType,
  };
  state.entities.push(p);
  return p;
}
