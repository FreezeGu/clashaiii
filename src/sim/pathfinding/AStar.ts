/**
 * A* pathfinding on tile grid. Uses Grid for walkable/blocked.
 */
import type { Grid } from './Grid';
import { keyOf, isWalkable } from './Grid';

const NEIGHBORS = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

export interface AStarResult {
  path: { col: number; row: number }[];
  found: boolean;
}

export function aStar(
  grid: Grid,
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number
): AStarResult {
  const startKey = keyOf(startCol, startRow);
  const endKey = keyOf(endCol, endRow);
  if (!isWalkable(grid, startCol, startRow)) return { path: [], found: false };
  if (!isWalkable(grid, endCol, endRow)) return { path: [], found: false };
  if (startKey === endKey) return { path: [{ col: endCol, row: endRow }], found: true };

  const open = new Set<string>([startKey]);
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, heuristic(startCol, startRow, endCol, endRow)]]);
  const cameFrom = new Map<string, { col: number; row: number }>();

  while (open.size > 0) {
    let current: string | null = null;
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = k;
      }
    }
    if (!current) break;
    const [cCol, cRow] = current.split(',').map(Number);

    if (current === endKey) {
      const path: { col: number; row: number }[] = [];
      let cur: string | undefined = current;
      while (cur) {
        const [col, row] = cur.split(',').map(Number);
        path.unshift({ col, row });
        const prev = cameFrom.get(cur);
        cur = prev ? keyOf(prev.col, prev.row) : undefined;
      }
      return { path, found: true };
    }

    open.delete(current);
    const g = gScore.get(current) ?? Infinity;

    for (const [dc, dr] of NEIGHBORS) {
      const nCol = cCol + dc;
      const nRow = cRow + dr;
      if (!isWalkable(grid, nCol, nRow)) continue;
      const diagonal = dc !== 0 && dr !== 0;
      const cost = diagonal ? 1.414 : 1;
      const nKey = keyOf(nCol, nRow);
      const tentative = g + cost;
      if (tentative < (gScore.get(nKey) ?? Infinity)) {
        cameFrom.set(nKey, { col: cCol, row: cRow });
        gScore.set(nKey, tentative);
        fScore.set(nKey, tentative + heuristic(nCol, nRow, endCol, endRow));
        open.add(nKey);
      }
    }
  }

  return { path: [], found: false };
}

function heuristic(col: number, row: number, endCol: number, endRow: number): number {
  return Math.hypot(endCol - col, endRow - row);
}
