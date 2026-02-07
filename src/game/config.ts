import type { Types } from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const TILE_WIDTH = 40;
export const TILE_HEIGHT = 40;
export const GRID_COLS = 32;
export const GRID_ROWS = 18;
export const MIN_DECK_SIZE = 6;
export const MAX_DECK_SIZE = 8;
export const DEFAULT_DECK_SIZE = 6;
export const HAND_SIZE = 4;
export const MAX_ELIXIR = 10;
export const ELIXIR_REGEN_SECONDS = 2.8;
export const MATCH_DURATION_SEC = 180;
export const OVERTIME_SEC = 60;
export const CROWN_TOWER_HP = 2400;
export const KING_TOWER_HP = 2400;
export const CROWN_TOWER_DAMAGE = 90;
export const KING_TOWER_DAMAGE = 90;
export const CROWN_TOWER_RANGE_TILES = 7;
export const CROWN_TOWER_ATTACK_INTERVAL_MS = 800;
export const KING_TOWER_ATTACK_INTERVAL_MS = 1000;
export const SIM_FPS = 60;
export const SIM_DT = 1 / SIM_FPS;
export const MAX_AI_LEVEL = 10;
export const MIN_AI_LEVEL = 1;

export const phaserConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0f0a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [],
  input: {
    activePointers: 3,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
};
