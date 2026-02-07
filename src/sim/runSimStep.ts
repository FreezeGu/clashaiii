/**
 * Single fixed-timestep simulation update. Called by BattleScene.
 */
import type { SimWorldState } from './simWorld';
import { getUnits, getTowers } from './simWorld';
import type { UnitEntity } from './entities/Unit';
import type { TowerEntity } from './entities/Tower';
import type { CardCycleState } from './systems/CardCycleSystem';
import type { ElixirState } from './systems/ElixirSystem';
import { updateElixir } from './systems/ElixirSystem';
import { findTargetForTower } from './systems/TargetingSystem';
import { moveUnitAlongPath } from './systems/MovementSystem';
import { computeUnitPath } from './systems/PathfindingSystem';
import { updateProjectiles, createProjectile } from './systems/ProjectileSystem';
import { chooseTarget, getMoveTarget, getWeightsForLevel } from './systems/AISystem';
import { dealDamage } from './systems/CombatSystem';
import { CARD_MAP } from '../data/cards';
import { MATCH_DURATION_SEC } from '../game/config';

const TILE_PX = 40;

export function runSimStep(
  state: SimWorldState,
  cardCyclePlayer: CardCycleState,
  cardCycleBot: CardCycleState,
  elixirPlayer: ElixirState,
  elixirBot: ElixirState,
  simTime: number,
  _botProfile: unknown
): void {
  state.matchTimeSec = simTime;

  updateElixir(elixirPlayer, simTime);
  updateElixir(elixirBot, simTime);
  void cardCyclePlayer;
  void cardCycleBot;

  // Remove dead (units/projectiles only; tower death handled below)
  state.entities = state.entities.filter((e) => !e.dead);

  const units = getUnits(state);
  const towers = getTowers(state);

  // Tower attacks
  for (const tower of towers) {
    if (!tower.active) continue;
    const target = findTargetForTower(state, tower, tower.range);
    if (!target) continue;
    const attackInterval = 1 / (tower.attackInterval || 1);
    if (simTime - tower.lastAttackTime >= attackInterval) {
      tower.lastAttackTime = simTime;
      const projId = `proj_${tower.id}_${simTime}`;
      createProjectile(
        state,
        projId,
        tower.x,
        tower.y,
        target.id,
        tower.damage,
        12,
        0,
        'arrow'
      );
    }
  }

  // Unit AI: acquire target, path, move, attack
  for (const unit of units) {
    const def = CARD_MAP[unit.cardId];
    if (!def) continue;
    const weights = getWeightsForLevel(unit.aiLevel, {});
    const target = chooseTarget(state, unit, weights);
    if (target) {
      unit.targetId = target.id;
      const dist = Math.hypot(target.x - unit.x, target.y - unit.y);
      const rangePx = (unit.attackRange || def.attackRange) * TILE_PX;
      if (dist <= rangePx) {
        if (simTime - unit.lastAttackTime >= 1 / (unit.attackSpeed || def.attackSpeed)) {
          unit.lastAttackTime = simTime;
          if (def.projectileType && def.projectileType !== 'none') {
            createProjectile(
              state,
              `proj_${unit.id}_${simTime}`,
              unit.x,
              unit.y,
              target.id,
              unit.damage,
              15,
              unit.splashRadius || 0,
              def.projectileType
            );
          } else {
            dealDamage(state, target.id, unit.damage);
          }
        }
      } else {
        if (unit.path.length === 0 || unit.pathIndex >= unit.path.length) {
          computeUnitPath(state, unit, target.x, target.y);
        }
        moveUnitAlongPath(unit, 1 / 60, state);
      }
    } else {
      unit.targetId = null;
      const moveTarget = getMoveTarget(state, unit);
      if (moveTarget && (unit.path.length === 0 || unit.pathIndex >= unit.path.length)) {
        computeUnitPath(state, unit, moveTarget.x, moveTarget.y);
      }
      moveUnitAlongPath(unit, 1 / 60, state);
    }
  }

  updateProjectiles(state, 1 / 60);

  // Crowns and game over (after projectiles have applied damage)
  for (const e of state.entities) {
    if (e.kind !== 'tower' || !e.dead) continue;
    const tower = e as TowerEntity;
    if (tower.towerType === 'crown_left' || tower.towerType === 'crown_right') {
      if (tower.owner === 'bot') state.playerCrowns++;
      else state.botCrowns++;
    } else if (tower.towerType === 'king') {
      state.gameOver = true;
      state.winner = tower.owner === 'bot' ? 'player' : 'bot';
    }
  }
  if (state.matchTimeSec >= MATCH_DURATION_SEC && !state.gameOver) {
    state.gameOver = true;
    if (state.playerCrowns > state.botCrowns) state.winner = 'player';
    else if (state.botCrowns > state.playerCrowns) state.winner = 'bot';
    else state.winner = null;
  }
  state.entities = state.entities.filter((e) => !e.dead);
}

/** Spawn a unit from a card play. */
export function spawnUnit(
  state: SimWorldState,
  cardId: string,
  owner: 'player' | 'bot',
  worldX: number,
  worldY: number,
  aiLevel: number,
  unitId: string
): void {
  const def = CARD_MAP[cardId];
  if (!def) return;
  const count = def.count ?? 1;
  for (let i = 0; i < count; i++) {
    const ox = count > 1 ? (i - (count - 1) / 2) * 24 : 0;
    const u: UnitEntity = {
      id: count > 1 ? `${unitId}_${i}` : unitId,
      kind: 'unit',
      x: worldX + ox,
      y: worldY,
      owner,
      dead: false,
      cardId,
      aiLevel,
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
      attackRange: def.attackRange,
      attackSpeed: def.attackSpeed,
      moveSpeed: def.moveSpeed,
      targetType: def.targetType,
      splashRadius: def.splashRadius ?? 0,
      targetId: null,
      path: [],
      pathIndex: 0,
      lastAttackTime: 0,
      lane: worldX < 640 ? 'left' : 'right',
      state: 'idle',
      stateTime: 0,
      projectileType: def.projectileType ?? 'none',
      slowUntil: 0,
      buffUntil: 0,
    };
    state.entities.push(u);
    const moveTarget = getMoveTarget(state, u);
    if (moveTarget) computeUnitPath(state, u, moveTarget.x, moveTarget.y);
  }
}
