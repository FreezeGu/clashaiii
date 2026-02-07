import type { Grid } from '../pathfinding/Grid';
import { aStar } from '../pathfinding/AStar';
import { createPathCache } from '../pathfinding/caches';
import type { UnitEntity } from '../entities/Unit';
import type { SimWorldState } from '../simWorld';
import { worldToTileSafe, tileToWorldSafe } from '../simWorld';

const pathCache = createPathCache();

export function findPath(
  grid: Grid,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] {
  const start = worldToTileSafe(startX, startY);
  const end = worldToTileSafe(endX, endY);
  const cached = pathCache.get(grid, start.col, start.row, end.col, end.row);
  let result;
  if (cached?.found) {
    result = cached;
  } else {
    result = aStar(grid, start.col, start.row, end.col, end.row);
    if (result.found) pathCache.set(start.col, start.row, end.col, end.row, result);
  }
  if (!result.found) return [];
  return result.path.map(({ col, row }) => tileToWorldSafe(col, row));
}

export function computeUnitPath(
  state: SimWorldState,
  unit: UnitEntity,
  targetX: number,
  targetY: number
): void {
  const path = findPath(state.grid, unit.x, unit.y, targetX, targetY);
  unit.path = path;
  unit.pathIndex = 0;
}

export function clearPathCache(): void {
  pathCache.clear();
}
