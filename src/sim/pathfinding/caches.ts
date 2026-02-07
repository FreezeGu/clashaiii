/**
 * Optional path cache keyed by (startCol,startRow,endCol,endRow) for same-type units.
 * Invalidate when grid blocked set changes (tower destroyed etc).
 */
import type { AStarResult } from './AStar';

function cacheKey(sc: number, sr: number, ec: number, er: number): string {
  return `${sc},${sr},${ec},${er}`;
}

const MAX_CACHE_SIZE = 500;

export function createPathCache() {
  const map = new Map<string, AStarResult>();
  const keys: string[] = [];

  return {
    get(_grid: unknown, startCol: number, startRow: number, endCol: number, endRow: number): AStarResult | undefined {
      const key = cacheKey(startCol, startRow, endCol, endRow);
      return map.get(key);
    },
    set(startCol: number, startRow: number, endCol: number, endRow: number, result: AStarResult): void {
      const key = cacheKey(startCol, startRow, endCol, endRow);
      if (map.has(key)) return;
      if (keys.length >= MAX_CACHE_SIZE) {
        const old = keys.shift();
        if (old) map.delete(old);
      }
      keys.push(key);
      map.set(key, result);
    },
    clear(): void {
      map.clear();
      keys.length = 0;
    },
  };
}
