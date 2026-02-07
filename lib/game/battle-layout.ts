/**
 * Battle screen layout constants (Clash Royale style).
 * Three zones: Top HUD → Arena → Bottom HUD. Canvas never under Bottom HUD.
 */

/** Top HUD height (timer, crowns). ~8–12% in portrait. */
export const TOP_HUD_H_PX = 56;
export const TOP_HUD_H_PX_MAX = 88;

/** Bottom HUD height (cards + elixir). ~22–30% in portrait. */
export const BOTTOM_HUD_H_PX = 180;
export const BOTTOM_HUD_H_PX_MAX = 240;

/** Minimum arena height so gameplay stays visible on small screens. */
export const ARENA_MIN_H_PX = 420;

/** Safe padding inside arena viewport (towers never at the very edge). */
export const SAFE_TOP_PADDING_PX = 32;
export const SAFE_BOTTOM_PADDING_PX = 32;
export const SAFE_SIDE_PADDING_PX = 24;

/** Logical canvas size (game grid 18×32). */
export const CANVAS_LOGICAL_W = 360;
export const CANVAS_LOGICAL_H = 640;
