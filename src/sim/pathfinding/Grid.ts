/**
 * Tile grid for arena: walkable, river, bridges, tower footprints.
 * Coordinates: (col, row) or (x, y) in tile space.
 */
export const RIVER_ROW_TOP = 8;
export const RIVER_ROW_BOTTOM = 9;
export const BRIDGE_LEFT_COL = 12;
export const BRIDGE_RIGHT_COL = 19;

export interface GridConfig {
  cols: number;
  rows: number;
  riverTop: number;
  riverBottom: number;
  bridgeLeftCol: number;
  bridgeRightCol: number;
}

const DEFAULT_CONFIG: GridConfig = {
  cols: 32,
  rows: 18,
  riverTop: RIVER_ROW_TOP,
  riverBottom: RIVER_ROW_BOTTOM,
  bridgeLeftCol: BRIDGE_LEFT_COL,
  bridgeRightCol: BRIDGE_RIGHT_COL,
};

export function createGrid(config: Partial<GridConfig> = {}): Grid {
  const c = { ...DEFAULT_CONFIG, ...config };
  const walkable = new Set<string>();

  for (let row = 0; row < c.rows; row++) {
    for (let col = 0; col < c.cols; col++) {
      const key = keyOf(col, row);
      if (isRiverTile(col, row, c)) {
        if (isBridgeTile(col, row, c)) walkable.add(key);
      } else {
        walkable.add(key);
      }
    }
  }

  return {
    config: c,
    walkable,
    blocked: new Set<string>(),
  };
}

export interface Grid {
  config: GridConfig;
  walkable: Set<string>;
  /** Dynamically blocked (towers, etc.) */
  blocked: Set<string>;
}

export function keyOf(col: number, row: number): string {
  return `${col},${row}`;
}

export function isRiverTile(_col: number, row: number, c: GridConfig): boolean {
  return row >= c.riverTop && row <= c.riverBottom;
}

export function isBridgeTile(col: number, row: number, c: GridConfig): boolean {
  return isRiverTile(col, row, c) && (col >= c.bridgeLeftCol && col <= c.bridgeLeftCol + 2 || col >= c.bridgeRightCol && col <= c.bridgeRightCol + 2);
}

export function isWalkable(grid: Grid, col: number, row: number): boolean {
  if (col < 0 || col >= grid.config.cols || row < 0 || row >= grid.config.rows) return false;
  const k = keyOf(col, row);
  return grid.walkable.has(k) && !grid.blocked.has(k);
}

export function worldToTile(worldX: number, worldY: number, tileW: number, tileH: number): { col: number; row: number } {
  return {
    col: Math.floor(worldX / tileW),
    row: Math.floor(worldY / tileH),
  };
}

export function tileToWorld(col: number, row: number, tileW: number, tileH: number): { x: number; y: number } {
  return {
    x: col * tileW + tileW / 2,
    y: row * tileH + tileH / 2,
  };
}

/** Mark tower footprint as blocked (e.g. 2x2 or 3x3). */
export function blockTowerFootprint(grid: Grid, centerCol: number, centerRow: number, radius: number): void {
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      grid.blocked.add(keyOf(centerCol + dc, centerRow + dr));
    }
  }
}
