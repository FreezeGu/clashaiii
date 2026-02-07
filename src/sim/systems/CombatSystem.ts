import type { UnitEntity } from '../entities/Unit';
import type { TowerEntity } from '../entities/Tower';
import { getEntity, getUnits } from '../simWorld';
import type { SimWorldState } from '../simWorld';
import { distance } from '../entities/Entity';

export function dealDamage(state: SimWorldState, targetId: string, amount: number, _splashRadius = 0): void {
  const target = getEntity(state, targetId);
  if (!target) return;
  if (target.kind === 'unit') {
    (target as UnitEntity).hp = Math.max(0, (target as UnitEntity).hp - amount);
    if ((target as UnitEntity).hp <= 0) (target as UnitEntity).dead = true;
  } else if (target.kind === 'tower') {
    const t = target as TowerEntity;
    t.hp = Math.max(0, t.hp - amount);
    if (t.towerType === 'king' && !t.active) t.active = true;
    if (t.hp <= 0) t.dead = true;
  }
}

export function getUnitsInRadius(
  state: SimWorldState,
  x: number,
  y: number,
  radius: number,
  excludeOwner?: string
): UnitEntity[] {
  const units = getUnits(state);
  return units.filter((u) => {
    if (excludeOwner && u.owner === excludeOwner) return false;
    return distance(u, { x, y }) <= radius;
  });
}

export function applySplashDamage(
  state: SimWorldState,
  centerX: number,
  centerY: number,
  radius: number,
  damage: number
): void {
  const units = getUnitsInRadius(state, centerX, centerY, radius * 40);
  for (const u of units) {
    dealDamage(state, u.id, damage, 0);
  }
}
