/**
 * Arena (Field of Battle) — Clash Royale style symmetric grid.
 * Grid: 18×32 cells. River in the middle, two bridges.
 *
 * Two coordinate systems:
 * - Logical (spec): (0,0) = bottom-left (player), X right, Y up. Use logicalYToScreenRow / screenRowToLogicalY.
 * - Screen (engine/canvas): (0,0) = top-left; row 0 = top (enemy), row 31 = bottom (player).
 */

// ─── Grid & scale ──────────────────────────────────────────────────
export const GRID_WIDTH = 18;
export const GRID_HEIGHT = 32;
export const TOTAL_CELLS = GRID_WIDTH * GRID_HEIGHT;

/** Logical pixel size of one cell; used for hitboxes and snapping. */
export const CELL_SIZE_PX = 20;

/** No extra gap between building footprints (0 = adjacent allowed, as in CR). */
export const PLACEMENT_BUFFER_CELLS = 0;
export const PLACEMENT_BUFFER = 0;

// ─── River (horizontal band, blocks passage except bridges) ─────────
export const RIVER_START = 15;
export const RIVER_END = 16;

// ─── Bridges: 2×2 each, symmetric ─────────────────────────────────
/** Left bridge: columns 4–5, rows RIVER_START..RIVER_END */
export const BRIDGE_LEFT_X_START = 4;
export const BRIDGE_LEFT_X_END = 5;
/** Right bridge: columns 12–13 */
export const BRIDGE_RIGHT_X_START = 12;
export const BRIDGE_RIGHT_X_END = 13;

export const BRIDGE_HEIGHT_CELLS = RIVER_END - RIVER_START + 1;

// ─── Lanes ────────────────────────────────────────────────────────
/** Left lane: X ∈ [0 .. 8] */
export const LEFT_LANE_X_MIN = 0;
export const LEFT_LANE_X_MAX = 8;
/** Right lane: X ∈ [9 .. 17] */
export const RIGHT_LANE_X_MIN = 9;
export const RIGHT_LANE_X_MAX = 17;

// ─── Pocket (small zone behind destroyed princess tower only) ───────
/** Depth of "behind" zone toward enemy backline (tiles). */
export const POCKET_BACK_DEPTH_TILES = 3;
/** Extra tiles to the sides of tower footprint (0 = strict behind only). */
export const POCKET_SIDE_PADDING_TILES = 0;

// ─── Tile types (single source of truth) ────────────────────────────
export const TILE = {
  GROUND: 0,
  WATER: 1,
  BRIDGE: 2,
  /** BLOCKED / TOWER_PAD: live tower footprint — not walkable, not placeable. No buffer around. */
  BLOCKED: 3,
  /** RUINS: destroyed tower footprint — placeable & walkable, draw decal on top. */
  RUINS: 4,
} as const;

export const STRUCTURE_PAD = TILE.BLOCKED;
export const TOWER_PAD = TILE.BLOCKED;

export type TileType = (typeof TILE)[keyof typeof TILE];

export interface TileFlags {
  walkable: boolean;
  placeable: boolean;
}

const TILE_FLAGS: Record<TileType, TileFlags> = {
  [TILE.GROUND]: { walkable: true, placeable: true },
  [TILE.WATER]: { walkable: false, placeable: false },
  [TILE.BRIDGE]: { walkable: true, placeable: false },
  [TILE.BLOCKED]: { walkable: false, placeable: false },
  [TILE.RUINS]: { walkable: true, placeable: true },
};

export function getTileFlags(tileType: TileType): TileFlags {
  return TILE_FLAGS[tileType];
}

// ─── Grid building (static arena, no towers yet) ─────────────────────
export type ArenaGrid = TileType[][];

export function createArenaGrid(): ArenaGrid {
  const grid: ArenaGrid = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (y >= RIVER_START && y <= RIVER_END) {
        const onLeftBridge =
          x >= BRIDGE_LEFT_X_START && x <= BRIDGE_LEFT_X_END;
        const onRightBridge =
          x >= BRIDGE_RIGHT_X_START && x <= BRIDGE_RIGHT_X_END;
        row.push(onLeftBridge || onRightBridge ? TILE.BRIDGE : TILE.WATER);
      } else {
        row.push(TILE.GROUND);
      }
    }
    grid.push(row);
  }
  return grid;
}

/** Get tile type at cell when grid is in arena format (from createArenaGrid). */
export function getTileType(
  grid: (number | TileType)[][],
  cellX: number,
  cellY: number
): TileType {
  const x = Math.floor(cellX);
  const y = Math.floor(cellY);
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
    return TILE.BLOCKED;
  }
  return grid[y][x] as TileType;
}

/** Engine grid: 0=walkable, 1=blocked, 2=river, 3=bridge. Use for battle state grid. */
export function getTileTypeFromEngineGrid(
  engineGrid: number[][],
  cellX: number,
  cellY: number
): TileType {
  const x = Math.floor(cellX);
  const y = Math.floor(cellY);
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
    return TILE.BLOCKED;
  }
  return engineCellToArenaTile(engineGrid[y][x]);
}

export function isWalkable(
  grid: (number | TileType)[][],
  cellX: number,
  cellY: number
): boolean {
  return getTileFlags(getTileType(grid, cellX, cellY)).walkable;
}

export function isPlaceable(
  grid: (number | TileType)[][],
  cellX: number,
  cellY: number
): boolean {
  return getTileFlags(getTileType(grid, cellX, cellY)).placeable;
}

// ─── Coordinate conversion ───────────────────────────────────────────
/** Logical Y (0=player bottom, 31=enemy top) → screen row (0=top, 31=bottom). */
export function logicalYToScreenRow(logicalY: number): number {
  return GRID_HEIGHT - 1 - Math.floor(logicalY);
}

/** Screen row (0=top, 31=bottom) → logical Y (0=player bottom, 31=enemy top). */
export function screenRowToLogicalY(screenRow: number): number {
  return GRID_HEIGHT - 1 - Math.floor(screenRow);
}

/** Cell (anchor top-left) → world pixel (cell center for display). */
export function cellToWorld(
  cellX: number,
  cellY: number,
  cellSizePx: number = CELL_SIZE_PX
): { pixelX: number; pixelY: number } {
  return {
    pixelX: (cellX + 0.5) * cellSizePx,
    pixelY: (cellY + 0.5) * cellSizePx,
  };
}

/** World pixel → cell (floor to grid). */
export function worldToCell(
  pixelX: number,
  pixelY: number,
  cellSizePx: number = CELL_SIZE_PX
): { cellX: number; cellY: number } {
  return {
    cellX: Math.floor(pixelX / cellSizePx),
    cellY: Math.floor(pixelY / cellSizePx),
  };
}

// ─── Zones (row 0 = top/enemy, row 31 = bottom/player) ───────────────
/** Player side (bottom of screen): row > RIVER_END, i.e. [17..31]. */
export function isPlayerHalf(cellY: number): boolean {
  return cellY > RIVER_END && cellY < GRID_HEIGHT;
}

/** Enemy side (top of screen): row < RIVER_START, i.e. [0..14]. */
export function isEnemyHalf(cellY: number): boolean {
  return cellY >= 0 && cellY < RIVER_START;
}

/** River band (water + bridges): Y in [RIVER_START .. RIVER_END]. */
export function isRiverRow(cellY: number): boolean {
  return cellY >= RIVER_START && cellY <= RIVER_END;
}

export function isOnBridge(cellX: number, cellY: number): boolean {
  if (!isRiverRow(cellY)) return false;
  const x = Math.floor(cellX);
  return (
    (x >= BRIDGE_LEFT_X_START && x <= BRIDGE_LEFT_X_END) ||
    (x >= BRIDGE_RIGHT_X_START && x <= BRIDGE_RIGHT_X_END)
  );
}

// ─── Deployment: territory mask, pocket (behind destroyed tower), validators ─
export type TeamSide = "player" | "enemy";

/** One pocket zone = ruins of destroyed princess tower + small "behind" rectangle. */
export interface PocketRect {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface DeployTerritoryOptions {
  /** Legacy lane flags; ignored when pocketRects is set. */
  pocketLeft?: boolean;
  pocketRight?: boolean;
  /** Pocket zones (behind each destroyed enemy princess). Takes precedence. */
  pocketRects?: PocketRect[];
}

/** Base territory: own half only (no pocket). */
export function isInBaseTerritory(side: TeamSide, cellY: number): boolean {
  const y = Math.floor(cellY);
  if (side === "player") return isPlayerHalf(y);
  return isEnemyHalf(y);
}

/** Pocket: (x,y) inside any of the pocket rects (strict "behind tower" zones). */
export function isInPocket(
  _side: TeamSide,
  options: DeployTerritoryOptions,
  cellX: number,
  cellY: number
): boolean {
  const x = Math.floor(cellX);
  const y = Math.floor(cellY);
  const rects = options.pocketRects;
  if (rects?.length) {
    return rects.some(
      (r) => x >= r.xMin && x <= r.xMax && y >= r.yMin && y <= r.yMax
    );
  }
  return false;
}

/** Full deploy territory: base + pocket (after enemy princess tower destroyed). */
export function isInDeployTerritory(
  side: TeamSide,
  options: DeployTerritoryOptions,
  cellX: number,
  cellY: number
): boolean {
  const y = Math.floor(cellY);
  if (isInBaseTerritory(side, y)) return true;
  return isInPocket(side, options, cellX, cellY);
}

/** Troops: deploy territory + tile placeable (ground/ruins). No check for "occupied by unit" (stacking allowed). */
export function canPlaceTroopDeploy(
  engineGrid: number[][],
  cellX: number,
  cellY: number,
  side: TeamSide,
  territory: DeployTerritoryOptions
): boolean {
  const x = Math.floor(cellX);
  const y = Math.floor(cellY);
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
  if (!isInDeployTerritory(side, territory, x, y)) return false;
  const tile = getTileTypeFromEngineGrid(engineGrid, x, y);
  return getTileFlags(tile).placeable;
}

/** Can place troops on this cell (legacy: base half only, no pocket). Use canPlaceTroopDeploy for full CR rules. */
export function canPlaceTroop(
  engineGrid: number[][],
  cellX: number,
  cellY: number,
  side: TeamSide
): boolean {
  return canPlaceTroopDeploy(engineGrid, cellX, cellY, side, { pocketRects: [] });
}

/** Footprint sizes (width × height in cells). Anchor = top-left. */
export const FOOTPRINT = {
  /** Standard building: 3×3 */
  LARGE: { w: 3, h: 3 },
  /** Tesla, etc.: 2×2 */
  SMALL: { w: 2, h: 2 },
} as const;

/**
 * Check if a building with given footprint can be placed with top-left at (cellX, cellY).
 * All cells of the footprint must be: in bounds, on correct half, placeable, not occupied.
 */
export function canPlaceBuilding(
  grid: (number | TileType)[][],
  cellX: number,
  cellY: number,
  footprint: { w: number; h: number },
  side: TeamSide
): boolean {
  const x0 = Math.floor(cellX);
  const y0 = Math.floor(cellY);
  const { w, h } = footprint;

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const x = x0 + dx;
      const y = y0 + dy;
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
      if (side === "player" && !isPlayerHalf(y)) return false;
      if (side === "enemy" && !isEnemyHalf(y)) return false;
      if (!isPlaceable(grid, x, y)) return false;
    }
  }
  return true;
}

/** Same as canPlaceBuilding but for engine grid (battle state). */
export function canPlaceBuildingEngine(
  engineGrid: number[][],
  cellX: number,
  cellY: number,
  footprint: { w: number; h: number },
  side: TeamSide
): boolean {
  return canPlaceBuildingDeploy(
    engineGrid,
    cellX,
    cellY,
    footprint,
    side,
    { pocketRects: [] },
    () => false
  );
}

/**
 * Buildings: all footprint cells in deploy territory, placeable, and not overlapping live tower/building footprints.
 * liveTowerOrBuildingCell(x, y) returns true if (x,y) is blocked by a live structure.
 */
export function canPlaceBuildingDeploy(
  engineGrid: number[][],
  cellX: number,
  cellY: number,
  footprint: { w: number; h: number },
  side: TeamSide,
  territory: DeployTerritoryOptions,
  isLiveStructureCell: (x: number, y: number) => boolean
): boolean {
  const x0 = Math.floor(cellX);
  const y0 = Math.floor(cellY);
  const { w, h } = footprint;

  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const x = x0 + dx;
      const y = y0 + dy;
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
      if (!isInDeployTerritory(side, territory, x, y)) return false;
      if (isLiveStructureCell(x, y)) return false;
      const tile = getTileTypeFromEngineGrid(engineGrid, x, y);
      if (!getTileFlags(tile).placeable) return false;
    }
  }
  return true;
}

/**
 * Get all cells covered by a footprint with top-left at (cellX, cellY).
 */
export function getFootprintCells(
  cellX: number,
  cellY: number,
  footprint: { w: number; h: number }
): { x: number; y: number }[] {
  const x0 = Math.floor(cellX);
  const y0 = Math.floor(cellY);
  const { w, h } = footprint;
  const out: { x: number; y: number }[] = [];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      out.push({ x: x0 + dx, y: y0 + dy });
    }
  }
  return out;
}

// ─── Engine grid: 0=ground, 1=blocked/tower, 2=river, 3=bridge, 4=ruins ─
export function arenaTileToEngineCell(tile: TileType): number {
  switch (tile) {
    case TILE.GROUND:
      return 0;
    case TILE.BLOCKED:
      return 1;
    case TILE.WATER:
      return 2;
    case TILE.BRIDGE:
      return 3;
    case TILE.RUINS:
      return 4;
    default:
      return 0;
  }
}

export function engineCellToArenaTile(cell: number): TileType {
  switch (cell) {
    case 0:
      return TILE.GROUND;
    case 1:
      return TILE.BLOCKED;
    case 2:
      return TILE.WATER;
    case 3:
      return TILE.BRIDGE;
    case 4:
      return TILE.RUINS;
    default:
      return TILE.GROUND;
  }
}

// ─── Unified deploy API (canDeployTroop / canDeployBuilding) ─────────
/** Can the given side deploy a troop on (tileX, tileY)? Uses territory mask (base + pocket). */
export function canDeployTroop(
  engineGrid: number[][],
  tileX: number,
  tileY: number,
  playerSide: TeamSide,
  territory: DeployTerritoryOptions
): boolean {
  return canPlaceTroopDeploy(engineGrid, tileX, tileY, playerSide, territory);
}

/** Can the given side deploy a building with top-left (anchorTileX, anchorTileY) and footprint? */
export function canDeployBuilding(
  engineGrid: number[][],
  anchorTileX: number,
  anchorTileY: number,
  footprintW: number,
  footprintH: number,
  playerSide: TeamSide,
  territory: DeployTerritoryOptions,
  isLiveStructureCell: (x: number, y: number) => boolean
): boolean {
  return canPlaceBuildingDeploy(
    engineGrid,
    anchorTileX,
    anchorTileY,
    { w: footprintW, h: footprintH },
    playerSide,
    territory,
    isLiveStructureCell
  );
}
