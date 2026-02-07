export type EntityKind = 'unit' | 'tower' | 'projectile' | 'building';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  kind: EntityKind;
  /** World position (pixels or tile-based) */
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  /** Owner: 'player' | 'bot' */
  owner: string;
  /** For removal */
  dead: boolean;
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
