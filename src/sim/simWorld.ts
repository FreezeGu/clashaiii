/**
 * Central simulation world: entities, grid, and system updates.
 * Battle scene drives fixed timestep and reads state for rendering.
 */
import type { Entity } from './entities/Entity';
import type { UnitEntity } from './entities/Unit';
import type { TowerEntity } from './entities/Tower';
import type { ProjectileEntity } from './entities/Projectile';
import { createGrid, blockTowerFootprint, tileToWorld, worldToTile } from './pathfinding/Grid';
import type { Grid } from './pathfinding/Grid';
import { TILE_WIDTH, TILE_HEIGHT, GRID_COLS, GRID_ROWS } from '../game/config';

export interface SimWorldState {
  entities: Entity[];
  grid: Grid;
  matchTimeSec: number;
  playerCrowns: number;
  botCrowns: number;
  gameOver: boolean;
  winner: 'player' | 'bot' | null;
}

/** Tower layout: 2 crown + 1 king per side. */
export function getDefaultTowerPositions(): { owner: string; type: TowerEntity['towerType']; tileX: number; tileY: number }[] {
  return [
    { owner: 'player', type: 'crown_left', tileX: 6, tileY: 14 },
    { owner: 'player', type: 'crown_right', tileX: 25, tileY: 14 },
    { owner: 'player', type: 'king', tileX: 16, tileY: 15 },
    { owner: 'bot', type: 'crown_left', tileX: 6, tileY: 3 },
    { owner: 'bot', type: 'crown_right', tileX: 25, tileY: 3 },
    { owner: 'bot', type: 'king', tileX: 16, tileY: 2 },
  ];
}

export function createSimWorld(): SimWorldState {
  const grid = createGrid({ cols: GRID_COLS, rows: GRID_ROWS });
  const entities: Entity[] = [];
  const positions = getDefaultTowerPositions();
  const CROWN_HP = 2400;
  const KING_HP = 2400;
  const CROWN_DMG = 90;
  const KING_DMG = 90;
  const CROWN_RANGE = 7;
  const CROWN_ATK = 0.8;
  const KING_ATK = 1;

  positions.forEach((p) => {
    const { x, y } = tileToWorld(p.tileX, p.tileY, TILE_WIDTH, TILE_HEIGHT);
    const isKing = p.type === 'king';
    const tower: TowerEntity = {
      id: `tower_${p.owner}_${p.type}`,
      kind: 'tower',
      x,
      y,
      owner: p.owner,
      dead: false,
      towerType: p.type,
      hp: isKing ? KING_HP : CROWN_HP,
      maxHp: isKing ? KING_HP : CROWN_HP,
      damage: isKing ? KING_DMG : CROWN_DMG,
      range: CROWN_RANGE,
      attackInterval: isKing ? 1 / KING_ATK : 1 / CROWN_ATK,
      lastAttackTime: 0,
      active: !isKing,
      tileX: p.tileX,
      tileY: p.tileY,
      lane: p.type === 'king' ? 'center' : p.type === 'crown_left' ? 'left' : 'right',
    };
    entities.push(tower);
    blockTowerFootprint(grid, p.tileX, p.tileY, 1);
  });

  return {
    entities,
    grid,
    matchTimeSec: 0,
    playerCrowns: 0,
    botCrowns: 0,
    gameOver: false,
    winner: null,
  };
}

export function getUnits(state: SimWorldState): UnitEntity[] {
  return state.entities.filter((e): e is UnitEntity => e.kind === 'unit' && !e.dead);
}

export function getTowers(state: SimWorldState): TowerEntity[] {
  return state.entities.filter((e): e is TowerEntity => e.kind === 'tower' && !e.dead);
}

export function getProjectiles(state: SimWorldState): ProjectileEntity[] {
  return state.entities.filter((e): e is ProjectileEntity => e.kind === 'projectile');
}

export function getEntity(state: SimWorldState, id: string): Entity | undefined {
  return state.entities.find((e) => e.id === id);
}

export function worldToTileSafe(wx: number, wy: number): { col: number; row: number } {
  return worldToTile(wx, wy, TILE_WIDTH, TILE_HEIGHT);
}

export function tileToWorldSafe(col: number, row: number): { x: number; y: number } {
  return tileToWorld(col, row, TILE_WIDTH, TILE_HEIGHT);
}
