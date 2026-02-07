import { describe, it, expect } from 'vitest';
import { createGrid, keyOf } from '../sim/pathfinding/Grid';
import { aStar } from '../sim/pathfinding/AStar';

describe('AStar', () => {
  it('finds path on empty grid', () => {
    const grid = createGrid({ cols: 10, rows: 10, riverTop: 99, riverBottom: -1 });
    const result = aStar(grid, 0, 0, 9, 9);
    expect(result.found).toBe(true);
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toEqual({ col: 0, row: 0 });
    expect(result.path[result.path.length - 1]).toEqual({ col: 9, row: 9 });
  });

  it('returns same start/end when start equals end', () => {
    const grid = createGrid({ cols: 10, rows: 10 });
    const result = aStar(grid, 5, 5, 5, 5);
    expect(result.found).toBe(true);
    expect(result.path).toEqual([{ col: 5, row: 5 }]);
  });

  it('returns not found when start blocked', () => {
    const grid = createGrid({ cols: 10, rows: 10 });
    grid.blocked.add(keyOf(0, 0));
    const result = aStar(grid, 0, 0, 9, 9);
    expect(result.found).toBe(false);
  });
});
