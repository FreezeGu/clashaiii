/**
 * Core battle engine for the tower-battle card game.
 * Handles all game logic: grid, pathfinding, entities, combat, projectiles.
 */

import type { CardDef } from "./cards";
import { getAIBehaviorParams } from "./cards";
import {
  MAX_ELIXIR,
  ELIXIR_REGEN_MS,
  BATTLE_DURATION_S,
} from "./store-config";

// ─── Arena Constants ───────────────────────────────────────────────
export const GRID_W = 18;
export const GRID_H = 32;
export const RIVER_ROW_START = 15;
export const RIVER_ROW_END = 16;
export const BRIDGE_LEFT_COL_START = 3;
export const BRIDGE_LEFT_COL_END = 5;
export const BRIDGE_RIGHT_COL_START = 12;
export const BRIDGE_RIGHT_COL_END = 14;

// ─── Types ─────────────────────────────────────────────────────────
export type Team = "player" | "bot";
export type TowerType = "crown" | "king";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  team: Team;
  type: TowerType;
  pos: Vec2;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  attackSpeed: number;
  lastAttackTime: number;
  awake: boolean;
  destroyed: boolean;
  size: number; // radius in grid cells
}

export interface Unit {
  id: string;
  team: Team;
  cardDef: CardDef;
  pos: Vec2;
  hp: number;
  maxHp: number;
  damage: number;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  lastAttackTime: number;
  targetId: string | null;
  path: Vec2[];
  pathIndex: number;
  aiLevel: number;
  lastTargetRecheck: number;
  splashRadius: number;
  hasProjectile: boolean;
  alive: boolean;
  /** When > now, unit is frozen (cannot attack or move). Frost Mage applies this. */
  frozenUntil: number;
}

export interface Projectile {
  id: string;
  from: Vec2;
  to: Vec2;
  current: Vec2;
  speed: number;
  damage: number;
  splashRadius: number;
  targetTeam: Team;
  sourceId: string;
  alive: boolean;
}

export interface HandCard {
  cardDef: CardDef;
  aiLevel: number;
}

export interface BattleState {
  grid: number[][]; // 0=walkable, 1=blocked, 2=river, 3=bridge
  towers: Tower[];
  units: Unit[];
  projectiles: Projectile[];
  playerElixir: number;
  botElixir: number;
  lastElixirRegenPlayer: number;
  lastElixirRegenBot: number;
  timeRemaining: number;
  startTime: number;
  playerCrowns: number;
  botCrowns: number;
  gameOver: boolean;
  winner: Team | "tie" | null;
  playerDeckQueue: HandCard[];
  playerHand: HandCard[];
  botDeckQueue: HandCard[];
  botHand: HandCard[];
  selectedHandIndex: number | null;
  nextUnitId: number;
  nextProjectileId: number;
  botLastPlayTime: number;
  botTrophyLevel: number;
}

// ─── Grid Setup ────────────────────────────────────────────────────
export function createGrid(): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < GRID_H; y++) {
    const row: number[] = [];
    for (let x = 0; x < GRID_W; x++) {
      if (y >= RIVER_ROW_START && y <= RIVER_ROW_END) {
        // Check if on a bridge
        const onLeftBridge =
          x >= BRIDGE_LEFT_COL_START && x <= BRIDGE_LEFT_COL_END;
        const onRightBridge =
          x >= BRIDGE_RIGHT_COL_START && x <= BRIDGE_RIGHT_COL_END;
        row.push(onLeftBridge || onRightBridge ? 3 : 2);
      } else {
        row.push(0);
      }
    }
    grid.push(row);
  }
  return grid;
}

// Mark tower footprints on grid
function markTowerOnGrid(grid: number[][], tower: Tower) {
  const r = Math.ceil(tower.size);
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const gx = Math.floor(tower.pos.x + dx);
      const gy = Math.floor(tower.pos.y + dy);
      if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
        if (grid[gy][gx] === 0) grid[gy][gx] = 1;
      }
    }
  }
}

// ─── Tower Setup ───────────────────────────────────────────────────
function createTowers(): Tower[] {
  const towerBase = {
    damage: 50,
    range: 5,
    attackSpeed: 0.8,
    lastAttackTime: 0,
    destroyed: false,
    size: 1.5,
  };

  return [
    // Player towers (bottom)
    {
      ...towerBase,
      id: "p_crown_l",
      team: "player" as Team,
      type: "crown" as TowerType,
      pos: { x: 4, y: 24 },
      hp: 2000,
      maxHp: 2000,
      awake: true,
    },
    {
      ...towerBase,
      id: "p_crown_r",
      team: "player" as Team,
      type: "crown" as TowerType,
      pos: { x: 13, y: 24 },
      hp: 2000,
      maxHp: 2000,
      awake: true,
    },
    {
      ...towerBase,
      id: "p_king",
      team: "player" as Team,
      type: "king" as TowerType,
      pos: { x: 8.5, y: 28 },
      hp: 3500,
      maxHp: 3500,
      damage: 80,
      range: 6,
      awake: false,
      size: 2,
    },
    // Bot towers (top)
    {
      ...towerBase,
      id: "b_crown_l",
      team: "bot" as Team,
      type: "crown" as TowerType,
      pos: { x: 4, y: 7 },
      hp: 2000,
      maxHp: 2000,
      awake: true,
    },
    {
      ...towerBase,
      id: "b_crown_r",
      team: "bot" as Team,
      type: "crown" as TowerType,
      pos: { x: 13, y: 7 },
      hp: 2000,
      maxHp: 2000,
      awake: true,
    },
    {
      ...towerBase,
      id: "b_king",
      team: "bot" as Team,
      type: "king" as TowerType,
      pos: { x: 8.5, y: 3 },
      hp: 3500,
      maxHp: 3500,
      damage: 80,
      range: 6,
      awake: false,
      size: 2,
    },
  ];
}

// ─── Deck / Hand Management ───────────────────────────────────────
function createDeckAndHand(
  cards: { cardDef: CardDef; aiLevel: number }[]
): { deck: HandCard[]; hand: HandCard[] } {
  // Shuffle
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  const hand = shuffled.slice(0, 4);
  const deck = shuffled.slice(4);
  return { deck, hand };
}

// ─── A* Pathfinding ────────────────────────────────────────────────
interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

function heuristic(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(
  grid: number[][],
  start: Vec2,
  end: Vec2
): Vec2[] {
  const sx = Math.round(Math.max(0, Math.min(GRID_W - 1, start.x)));
  const sy = Math.round(Math.max(0, Math.min(GRID_H - 1, start.y)));
  const ex = Math.round(Math.max(0, Math.min(GRID_W - 1, end.x)));
  const ey = Math.round(Math.max(0, Math.min(GRID_H - 1, end.y)));

  // If start/end blocked, find nearest walkable
  const startNode: AStarNode = {
    x: sx,
    y: sy,
    g: 0,
    h: heuristic({ x: sx, y: sy }, { x: ex, y: ey }),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;

  const openList: AStarNode[] = [startNode];
  const closedSet = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];

  let iterations = 0;
  const maxIter = 1000;

  while (openList.length > 0 && iterations < maxIter) {
    iterations++;
    // Find node with lowest f
    let bestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[bestIdx].f) bestIdx = i;
    }
    const current = openList[bestIdx];
    openList.splice(bestIdx, 1);

    if (current.x === ex && current.y === ey) {
      // Reconstruct path
      const path: Vec2[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(key(current.x, current.y));

    for (const dir of dirs) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      if (closedSet.has(key(nx, ny))) continue;

      const cell = grid[ny][nx];
      // 1 = blocked (tower), 2 = river (blocked)
      if (cell === 1 || cell === 2) continue;

      const isDiag = dir.x !== 0 && dir.y !== 0;
      const moveCost = isDiag ? 1.414 : 1;
      const g = current.g + moveCost;
      const h = heuristic({ x: nx, y: ny }, { x: ex, y: ey });
      const f = g + h;

      // Check if already in open list with better g
      const existing = openList.find((n) => n.x === nx && n.y === ny);
      if (existing && existing.g <= g) continue;

      if (existing) {
        existing.g = g;
        existing.h = h;
        existing.f = f;
        existing.parent = current;
      } else {
        openList.push({ x: nx, y: ny, g, h, f, parent: current });
      }
    }
  }

  // No path found - return direct approach
  return [
    { x: sx, y: sy },
    { x: ex, y: ey },
  ];
}

// ─── Distance Utility ──────────────────────────────────────────────
function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ─── Initialize Battle ────────────────────────────────────────────
export function initBattle(
  playerCards: { cardDef: CardDef; aiLevel: number }[],
  botCards: { cardDef: CardDef; aiLevel: number }[],
  trophies: number
): BattleState {
  const grid = createGrid();
  const towers = createTowers();

  // Mark tower footprints
  for (const tower of towers) {
    markTowerOnGrid(grid, tower);
  }

  const { deck: playerDeck, hand: playerHand } =
    createDeckAndHand(playerCards);
  const { deck: botDeck, hand: botHand } = createDeckAndHand(botCards);

  return {
    grid,
    towers,
    units: [],
    projectiles: [],
    playerElixir: 5,
    botElixir: 5,
    lastElixirRegenPlayer: 0,
    lastElixirRegenBot: 0,
    timeRemaining: BATTLE_DURATION_S,
    startTime: Date.now(),
    playerCrowns: 0,
    botCrowns: 0,
    gameOver: false,
    winner: null,
    playerDeckQueue: playerDeck,
    playerHand: playerHand,
    botDeckQueue: botDeck,
    botHand: botHand,
    selectedHandIndex: null,
    nextUnitId: 1,
    nextProjectileId: 1,
    botLastPlayTime: 0,
    botTrophyLevel: trophies,
  };
}

// ─── Spawn Unit ────────────────────────────────────────────────────
export function spawnUnit(
  state: BattleState,
  card: HandCard,
  pos: Vec2,
  team: Team
): Unit[] {
  const { cardDef, aiLevel } = card;
  const units: Unit[] = [];

  for (let i = 0; i < cardDef.count; i++) {
    const offset = {
      x: (i % 2) * 0.8 - (cardDef.count > 1 ? 0.4 : 0),
      y: Math.floor(i / 2) * 0.8,
    };

    units.push({
      id: `u_${state.nextUnitId++}`,
      team,
      cardDef,
      pos: { x: pos.x + offset.x, y: pos.y + offset.y },
      hp: cardDef.hp,
      maxHp: cardDef.hp,
      damage: cardDef.damage,
      attackRange: cardDef.attackRange,
      attackSpeed: cardDef.attackSpeed,
      moveSpeed: cardDef.moveSpeed,
      lastAttackTime: 0,
      targetId: null,
      path: [],
      pathIndex: 0,
      aiLevel,
      lastTargetRecheck: 0,
      splashRadius: cardDef.splashRadius || 0,
      hasProjectile: !!cardDef.projectile,
      alive: true,
      frozenUntil: 0,
    });
  }

  return units;
}

// ─── Play Card from Hand ──────────────────────────────────────────
export function playCardFromHand(
  state: BattleState,
  handIndex: number,
  pos: Vec2,
  team: Team
): boolean {
  const hand = team === "player" ? state.playerHand : state.botHand;
  const deck = team === "player" ? state.playerDeckQueue : state.botDeckQueue;
  const elixir =
    team === "player" ? state.playerElixir : state.botElixir;

  if (handIndex < 0 || handIndex >= hand.length) return false;
  const card = hand[handIndex];
  if (card.cardDef.cost > elixir) return false;

  // Validate placement (player can only place on their half)
  if (team === "player" && pos.y < RIVER_ROW_END + 1) return false;
  if (team === "bot" && pos.y > RIVER_ROW_START - 1) return false;

  // Check grid is walkable at placement
  const gx = Math.round(pos.x);
  const gy = Math.round(pos.y);
  if (
    gx < 0 ||
    gx >= GRID_W ||
    gy < 0 ||
    gy >= GRID_H
  )
    return false;
  if (state.grid[gy][gx] === 1 || state.grid[gy][gx] === 2) return false;

  // Deduct elixir
  if (team === "player") {
    state.playerElixir -= card.cardDef.cost;
  } else {
    state.botElixir -= card.cardDef.cost;
  }

  // Spawn units
  const newUnits = spawnUnit(state, card, pos, team);
  state.units.push(...newUnits);

  // Cycle: remove from hand, push to back of deck, draw next
  deck.push(card);
  const nextCard = deck.shift();
  hand[handIndex] = nextCard!;

  return true;
}

// ─── Find Target for Unit ─────────────────────────────────────────
function findTargetForUnit(
  state: BattleState,
  unit: Unit
): string | null {
  const enemyTeam = unit.team === "player" ? "bot" : "player";
  const isTank = unit.cardDef.unitType === "tank";

  // For tanks, prioritize towers
  if (isTank) {
    let nearestTower: Tower | null = null;
    let nearestDist = Infinity;
    for (const tower of state.towers) {
      if (tower.team !== enemyTeam || tower.destroyed) continue;
      if (!tower.awake && tower.type === "king") {
        // Only target king if both crowns are destroyed or king is awake
        const crowns = state.towers.filter(
          (t) =>
            t.team === enemyTeam && t.type === "crown" && !t.destroyed
        );
        if (crowns.length > 0 && !tower.awake) continue;
      }
      const d = dist(unit.pos, tower.pos);
      if (d < nearestDist) {
        nearestDist = d;
        nearestTower = tower;
      }
    }
    if (nearestTower) return nearestTower.id;
  }

  // Check for nearby enemy units first
  let nearestUnit: Unit | null = null;
  let nearestUnitDist = Infinity;
  for (const other of state.units) {
    if (other.team === unit.team || !other.alive) continue;
    const d = dist(unit.pos, other.pos);
    if (d < nearestUnitDist && d < 8) {
      nearestUnitDist = d;
      nearestUnit = other;
    }
  }
  if (nearestUnit) return nearestUnit.id;

  // Target nearest crown tower
  let nearestTower: Tower | null = null;
  let nearestDist = Infinity;
  for (const tower of state.towers) {
    if (tower.team !== enemyTeam || tower.destroyed) continue;
    if (tower.type === "king") {
      const crowns = state.towers.filter(
        (t) =>
          t.team === enemyTeam && t.type === "crown" && !t.destroyed
      );
      if (crowns.length > 0) continue;
    }
    const d = dist(unit.pos, tower.pos);
    if (d < nearestDist) {
      nearestDist = d;
      nearestTower = tower;
    }
  }
  if (nearestTower) return nearestTower.id;

  return null;
}

// ─── Get Entity Position ──────────────────────────────────────────
function getEntityPos(state: BattleState, id: string): Vec2 | null {
  const unit = state.units.find((u) => u.id === id && u.alive);
  if (unit) return unit.pos;
  const tower = state.towers.find((t) => t.id === id && !t.destroyed);
  if (tower) return tower.pos;
  return null;
}

function isEntityAlive(state: BattleState, id: string): boolean {
  const unit = state.units.find((u) => u.id === id);
  if (unit) return unit.alive;
  const tower = state.towers.find((t) => t.id === id);
  if (tower) return !tower.destroyed;
  return false;
}

// ─── Update Battle State (one tick) ───────────────────────────────
export function updateBattle(state: BattleState, dt: number): void {
  if (state.gameOver) return;

  const now = Date.now();
  const FREEZE_DURATION_MS = 600;

  // Update timer
  state.timeRemaining = Math.max(
    0,
    BATTLE_DURATION_S - (now - state.startTime) / 1000
  );

  // Check time up
  if (state.timeRemaining <= 0) {
    state.gameOver = true;
    if (state.playerCrowns > state.botCrowns) state.winner = "player";
    else if (state.botCrowns > state.playerCrowns) state.winner = "bot";
    else state.winner = "tie";
    return;
  }

  // Regen elixir
  if (now - state.lastElixirRegenPlayer >= ELIXIR_REGEN_MS) {
    state.playerElixir = Math.min(MAX_ELIXIR, state.playerElixir + 1);
    state.lastElixirRegenPlayer = now;
  }
  if (now - state.lastElixirRegenBot >= ELIXIR_REGEN_MS) {
    state.botElixir = Math.min(MAX_ELIXIR, state.botElixir + 1);
    state.lastElixirRegenBot = now;
  }

  // Update units
  for (const unit of state.units) {
    if (!unit.alive) continue;
    if (unit.frozenUntil > now) continue;

    const aiParams = getAIBehaviorParams(unit.aiLevel);

    // Recheck target
    if (
      !unit.targetId ||
      !isEntityAlive(state, unit.targetId) ||
      now - unit.lastTargetRecheck > aiParams.targetRecheckMs
    ) {
      unit.targetId = findTargetForUnit(state, unit);
      unit.lastTargetRecheck = now;
      // Recalculate path
      if (unit.targetId) {
        const targetPos = getEntityPos(state, unit.targetId);
        if (targetPos) {
          unit.path = findPath(state.grid, unit.pos, targetPos);
          unit.pathIndex = 0;
        }
      }
    }

    if (!unit.targetId) continue;

    const targetPos = getEntityPos(state, unit.targetId);
    if (!targetPos) continue;

    const distToTarget = dist(unit.pos, targetPos);

    // Attack if in range
    if (distToTarget <= unit.attackRange + 0.5) {
      const attackInterval = 1000 / unit.attackSpeed;
      if (now - unit.lastAttackTime >= attackInterval) {
        unit.lastAttackTime = now;

        if (unit.hasProjectile) {
          // Fire projectile
          state.projectiles.push({
            id: `p_${state.nextProjectileId++}`,
            from: { ...unit.pos },
            to: { ...targetPos },
            current: { ...unit.pos },
            speed: 8,
            damage: unit.damage,
            splashRadius: unit.splashRadius,
            targetTeam: unit.team === "player" ? "bot" : "player",
            sourceId: unit.id,
            alive: true,
          });
        } else {
          // Direct damage
          applyDamage(state, unit.targetId, unit.damage, unit.splashRadius, unit.pos, unit.team === "player" ? "bot" : "player");
        }
      }
    } else {
      // Move toward target
      if (unit.path.length > 0 && unit.pathIndex < unit.path.length) {
        const nextPoint = unit.path[unit.pathIndex];
        const dx = nextPoint.x - unit.pos.x;
        const dy = nextPoint.y - unit.pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 0.3) {
          unit.pathIndex++;
        } else {
          const speed = unit.moveSpeed * dt;
          unit.pos.x += (dx / d) * speed;
          unit.pos.y += (dy / d) * speed;
        }
      } else {
        // Direct move
        const dx = targetPos.x - unit.pos.x;
        const dy = targetPos.y - unit.pos.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0.1) {
          const speed = unit.moveSpeed * dt;
          unit.pos.x += (dx / d) * speed;
          unit.pos.y += (dy / d) * speed;
        }
      }
    }
  }

  // Update towers (shoot at nearest enemy)
  for (const tower of state.towers) {
    if (tower.destroyed || !tower.awake) continue;

    const enemyTeam = tower.team === "player" ? "bot" : "player";
    let nearestEnemy: Unit | null = null;
    let nearestDist = Infinity;

    for (const unit of state.units) {
      if (unit.team !== enemyTeam || !unit.alive) continue;
      const d = dist(tower.pos, unit.pos);
      if (d < tower.range && d < nearestDist) {
        nearestDist = d;
        nearestEnemy = unit;
      }
    }

    if (nearestEnemy) {
      const attackInterval = 1000 / tower.attackSpeed;
      if (now - tower.lastAttackTime >= attackInterval) {
        tower.lastAttackTime = now;
        // Fire projectile
        state.projectiles.push({
          id: `tp_${state.nextProjectileId++}`,
          from: { ...tower.pos },
          to: { ...nearestEnemy.pos },
          current: { ...tower.pos },
          speed: 10,
          damage: tower.damage,
          splashRadius: 0,
          targetTeam: enemyTeam,
          sourceId: tower.id,
          alive: true,
        });
      }
    }
  }

  // Update projectiles
  for (const proj of state.projectiles) {
    if (!proj.alive) continue;

    const dx = proj.to.x - proj.current.x;
    const dy = proj.to.y - proj.current.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < 0.5) {
      // Hit
      proj.alive = false;
      const damagedUnits: Unit[] = [];
      if (proj.splashRadius > 0) {
        for (const unit of state.units) {
          if (unit.team !== proj.targetTeam || !unit.alive) continue;
          if (dist(unit.pos, proj.to) <= proj.splashRadius) {
            dealDamageToUnit(state, unit, proj.damage);
            damagedUnits.push(unit);
          }
        }
      } else {
        let nearest: Unit | null = null;
        let nearestD = 2;
        for (const unit of state.units) {
          if (unit.team !== proj.targetTeam || !unit.alive) continue;
          const ud = dist(unit.pos, proj.to);
          if (ud < nearestD) {
            nearestD = ud;
            nearest = unit;
          }
        }
        if (nearest) {
          dealDamageToUnit(state, nearest, proj.damage);
          damagedUnits.push(nearest);
        }
      }
      const sourceUnit = state.units.find((u) => u.id === proj.sourceId);
      if (sourceUnit?.cardDef.id === "maga") {
        for (const u of damagedUnits) {
          u.frozenUntil = now + FREEZE_DURATION_MS;
        }
      }
    } else {
      const speed = proj.speed * dt;
      proj.current.x += (dx / d) * speed;
      proj.current.y += (dy / d) * speed;
    }
  }

  // Clean up dead projectiles
  state.projectiles = state.projectiles.filter((p) => p.alive);

  // Run bot AI
  updateBotAI(state, now);

  // Check win conditions (all crowns or king destroyed)
  checkWinConditions(state);
}

// ─── Apply Damage ──────────────────────────────────────────────────
function applyDamage(
  state: BattleState,
  targetId: string,
  damage: number,
  splashRadius: number,
  sourcePos: Vec2,
  targetTeam: Team
) {
  // Try unit first
  const unit = state.units.find((u) => u.id === targetId && u.alive);
  if (unit) {
    if (splashRadius > 0) {
      for (const u of state.units) {
        if (u.team !== targetTeam || !u.alive) continue;
        if (dist(u.pos, unit.pos) <= splashRadius) {
          dealDamageToUnit(state, u, damage);
        }
      }
    } else {
      dealDamageToUnit(state, unit, damage);
    }
    return;
  }

  // Try tower
  const tower = state.towers.find((t) => t.id === targetId && !t.destroyed);
  if (tower) {
    dealDamageToTower(state, tower, damage);
  }
}

function dealDamageToUnit(state: BattleState, unit: Unit, damage: number) {
  unit.hp -= damage;
  if (unit.hp <= 0) {
    unit.alive = false;
  }
}

function dealDamageToTower(
  state: BattleState,
  tower: Tower,
  damage: number
) {
  tower.hp -= damage;

  // Wake up king tower if it takes damage
  if (tower.type === "king" && !tower.awake) {
    tower.awake = true;
  }

  // If a crown tower is hit, wake king
  if (tower.type === "crown") {
    const king = state.towers.find(
      (t) => t.team === tower.team && t.type === "king"
    );
    if (king && !king.awake) {
      // King wakes when it takes damage directly, but for prototype
      // let's also wake it when crown towers are under heavy attack
    }
  }

  if (tower.hp <= 0) {
    tower.destroyed = true;
    // Award crown
    if (tower.team === "bot") {
      state.playerCrowns++;
    } else {
      state.botCrowns++;
    }

    // Wake up king tower of same team
    const king = state.towers.find(
      (t) => t.team === tower.team && t.type === "king" && !t.destroyed
    );
    if (king) king.awake = true;
  }
}

// ─── Win Conditions ────────────────────────────────────────────────
function checkWinConditions(state: BattleState) {
  // Check if king tower destroyed (instant win)
  for (const tower of state.towers) {
    if (tower.type === "king" && tower.destroyed) {
      state.gameOver = true;
      state.winner = tower.team === "bot" ? "player" : "bot";
      return;
    }
  }

  // Check 3 crowns
  if (state.playerCrowns >= 3) {
    state.gameOver = true;
    state.winner = "player";
  } else if (state.botCrowns >= 3) {
    state.gameOver = true;
    state.winner = "bot";
  }
}

// ─── Bot AI ────────────────────────────────────────────────────────
function updateBotAI(state: BattleState, now: number) {
  const trophyLevel = state.botTrophyLevel;

  // Bot reaction time based on trophies
  const baseDelay = Math.max(2000, 6000 - trophyLevel * 8);
  const timeSinceLast = now - state.botLastPlayTime;

  if (timeSinceLast < baseDelay) return;
  if (state.botElixir < 3) return;

  // Find a card to play
  const playableCards = state.botHand
    .map((c, i) => ({ card: c, index: i }))
    .filter((c) => c.card.cardDef.cost <= state.botElixir);

  if (playableCards.length === 0) return;

  // At higher trophies, bot makes smarter choices
  let chosenIdx: number;

  if (trophyLevel > 300) {
    // Check if player has units pushing - defend that lane
    const playerUnits = state.units.filter(
      (u) => u.team === "player" && u.alive && u.pos.y < RIVER_ROW_START
    );

    if (playerUnits.length > 0) {
      // Play a defensive card near the threat
      const defensiveCards = playableCards.filter(
        (c) =>
          c.card.cardDef.unitType === "ranged" ||
          c.card.cardDef.unitType === "splash" ||
          c.card.cardDef.unitType === "swarm"
      );
      chosenIdx =
        defensiveCards.length > 0
          ? defensiveCards[Math.floor(Math.random() * defensiveCards.length)]
              .index
          : playableCards[Math.floor(Math.random() * playableCards.length)]
              .index;
    } else {
      chosenIdx =
        playableCards[Math.floor(Math.random() * playableCards.length)]
          .index;
    }
  } else {
    // Low trophies: random card
    chosenIdx =
      playableCards[Math.floor(Math.random() * playableCards.length)].index;
  }

  // Choose placement position (bot half = y 0 to RIVER_ROW_START-1)
  const isLeftLane = Math.random() > 0.5;
  const placeX = isLeftLane
    ? 3 + Math.random() * 4
    : 11 + Math.random() * 4;
  const placeY = 8 + Math.random() * 4; // Behind river on bot side

  const success = playCardFromHand(
    state,
    chosenIdx,
    { x: placeX, y: placeY },
    "bot"
  );

  if (success) {
    state.botLastPlayTime = now;
  }
}
