import type { Entity } from '../entities/Entity';
import type { UnitEntity } from '../entities/Unit';
import type { TowerEntity } from '../entities/Tower';
import { distance } from '../entities/Entity';
import { getUnits, getTowers, getEntity } from '../simWorld';
import type { SimWorldState } from '../simWorld';

/** Find nearest valid target for a unit (enemy unit or tower in range). */
export function findTargetForUnit(
  state: SimWorldState,
  unit: UnitEntity,
  maxRange: number
): Entity | null {
  const enemies: Entity[] = [
    ...getUnits(state).filter((u) => u.owner !== unit.owner),
    ...getTowers(state).filter((t) => t.owner !== unit.owner && t.active),
  ];
  let best: Entity | null = null;
  let bestDist = maxRange;
  for (const e of enemies) {
    const d = distance(unit, e);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

/** Find nearest enemy unit for a tower to shoot. */
export function findTargetForTower(
  state: SimWorldState,
  tower: TowerEntity,
  range: number
): UnitEntity | null {
  const units = getUnits(state).filter((u) => u.owner !== tower.owner);
  let best: UnitEntity | null = null;
  let bestDist = range * 40 + 100;
  for (const u of units) {
    const d = distance(tower, u);
    if (d <= range * 40 && d < bestDist) {
      bestDist = d;
      best = u;
    }
  }
  return best;
}

export function getDistanceToTarget(state: SimWorldState, unit: UnitEntity): number | null {
  if (!unit.targetId) return null;
  const target = getEntity(state, unit.targetId);
  return target ? distance(unit, target) : null;
}
