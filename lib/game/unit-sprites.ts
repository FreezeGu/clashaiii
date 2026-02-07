/**
 * Unit sprite animation config.
 * Place PNGs in public/units/{folder}/walk/, attack/, idle/
 * with filenames 1.png, 2.png, ... (numbered).
 */

export interface UnitSpriteConfig {
  /** Folder name under public/units/ (e.g. "lanceguard") */
  folder: string;
  walkFrames: number;
  attackFrames: number;
  /** Idle animation frame count (e.g. 7). Used in deck preview and when unit is standing still. */
  idleFrames?: number;
  /** Body/character draw size multiplier (default 1). */
  scale?: number;
  /** Attack (sword) overlay draw size; if set, sword stays this size while body uses scale. */
  attackScale?: number;
  walkFps?: number;
  attackDurationMs?: number;
  idleFps?: number;
}

/** Card IDs that have sprite animations. folder = public/units/{folder}/ */
export const UNIT_SPRITE_CONFIG: Record<string, UnitSpriteConfig> = {
  lancia: {
    folder: "lanceguard",
    walkFrames: 7,
    attackFrames: 5,
    idleFrames: 7,
    scale: 2.4,
    attackScale: 3,
    walkFps: 10,
    attackDurationMs: 400,
    idleFps: 8,
  },
  maga: {
    folder: "frostmage",
    walkFrames: 7,
    attackFrames: 5,
    idleFrames: 8,
    scale: 1.5,
    walkFps: 10,
    attackDurationMs: 400,
    idleFps: 8,
  },
};

function getSpriteFolder(cardId: string): string | null {
  const config = UNIT_SPRITE_CONFIG[cardId];
  return config ? config.folder : null;
}

export function getUnitSpriteBasePath(cardId: string): string | null {
  const folder = getSpriteFolder(cardId);
  return folder ? `/units/${folder}` : null;
}

export function getWalkFramePath(cardId: string, frame: number): string {
  const folder = getSpriteFolder(cardId);
  return folder ? `/units/${folder}/walk/${frame}.png` : "";
}

export function getAttackFramePath(cardId: string, frame: number): string {
  const folder = getSpriteFolder(cardId);
  return folder ? `/units/${folder}/attack/${frame}.png` : "";
}

export function getIdleFramePath(cardId: string, frame: number): string {
  const folder = getSpriteFolder(cardId);
  return folder ? `/units/${folder}/idle/${frame}.png` : "";
}
