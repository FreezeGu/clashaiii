/**
 * Collision / overlap checks for placement and movement.
 * Units cannot overlap towers; placement must be on valid tiles.
 */
import type { Grid } from '../pathfinding/Grid';
import { isWalkable } from '../pathfinding/Grid';
import { worldToTile } from '../pathfinding/Grid';
import { TILE_WIDTH, TILE_HEIGHT } from '../../game/config';

export function canPlaceAt(grid: Grid, worldX: number, worldY: number): boolean {
  const { col, row } = worldToTile(worldX, worldY, TILE_WIDTH, TILE_HEIGHT);
  return isWalkable(grid, col, row);
}

export function isPlayerSide(row: number, gridRows: number): boolean {
  const riverAround = Math.floor(gridRows / 2);
  return row >= riverAround;
}
