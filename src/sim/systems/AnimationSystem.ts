/**
 * Animation state flags for renderer. Actual animation is in Phaser (BattleScene).
 * This module can hold animation event triggers if we want sim to drive FX.
 */
export type AnimState = 'idle' | 'walk' | 'attack' | 'hit' | 'death';

export function getUnitAnimState(
  _unitId: string,
  isMoving: boolean,
  isAttacking: boolean,
  justHit: boolean,
  isDead: boolean
): AnimState {
  if (isDead) return 'death';
  if (justHit) return 'hit';
  if (isAttacking) return 'attack';
  if (isMoving) return 'walk';
  return 'idle';
}
