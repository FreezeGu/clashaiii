import type { UnitEntity } from '../entities/Unit';
import type { SimWorldState } from '../simWorld';

export function moveUnitAlongPath(unit: UnitEntity, dt: number, _state: SimWorldState): void {
  if (unit.path.length === 0) return;
  const speed = unit.moveSpeed * 40; // tiles/sec -> approximate px/sec (tile = 40px)
  let remaining = speed * dt;

  while (remaining > 0 && unit.pathIndex < unit.path.length) {
    const next = unit.path[unit.pathIndex];
    const dx = next.x - unit.x;
    const dy = next.y - unit.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= remaining) {
      unit.x = next.x;
      unit.y = next.y;
      remaining -= dist;
      unit.pathIndex++;
    } else {
      const t = remaining / dist;
      unit.x += dx * t;
      unit.y += dy * t;
      remaining = 0;
    }
  }
}
