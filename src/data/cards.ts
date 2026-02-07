/** Original unit roster: 15 cards with fixed stats. No copyrighted names. */
export type TargetType = 'ground' | 'air' | 'both';
export type ProjectileType = 'arrow' | 'bolt' | 'fireball' | 'none';

export interface CardDefinition {
  id: string;
  displayName: string;
  role: 'melee' | 'ranged' | 'tank' | 'support' | 'swarm' | 'building' | 'special';
  cost: number;
  hp: number;
  damage: number;
  attackRange: number; // tiles
  attackSpeed: number; // attacks per second
  moveSpeed: number; // tiles per second
  targetType: TargetType;
  splashRadius?: number;
  projectileType?: ProjectileType;
  description: string;
  /** For multi-unit cards, how many bodies */
  count?: number;
  /** Building duration in seconds (e.g. Spark Cannon) */
  deployDuration?: number;
  /** Special behavior flags */
  prefersTowers?: boolean;
  spawnsMinions?: boolean;
  charges?: boolean;
  slows?: boolean;
  buffsAllies?: boolean;
}

export const CARDS: CardDefinition[] = [
  {
    id: 'steel_squire',
    displayName: 'Steel Squire',
    role: 'melee',
    cost: 4,
    hp: 1200,
    damage: 280,
    attackRange: 1.2,
    attackSpeed: 1.0,
    moveSpeed: 2.5,
    targetType: 'ground',
    description: 'High single-target damage, slow and steady.',
  },
  {
    id: 'bone_trio',
    displayName: 'Bone Trio',
    role: 'swarm',
    cost: 2,
    hp: 180,
    damage: 60,
    attackRange: 1,
    attackSpeed: 1.2,
    moveSpeed: 3,
    targetType: 'ground',
    count: 3,
    description: 'Three weak melee units.',
  },
  {
    id: 'axe_matron',
    displayName: 'Axe Matron',
    role: 'melee',
    cost: 4,
    hp: 900,
    damage: 140,
    attackRange: 1.5,
    attackSpeed: 0.9,
    moveSpeed: 2.2,
    targetType: 'ground',
    splashRadius: 1.5,
    description: 'Medium tank with cleave AoE.',
  },
  {
    id: 'alley_gobbers',
    displayName: 'Alley Gobbers',
    role: 'swarm',
    cost: 2,
    hp: 120,
    damage: 50,
    attackRange: 1,
    attackSpeed: 1.5,
    moveSpeed: 3.5,
    targetType: 'ground',
    count: 4,
    description: 'Four quick stabbers, low HP.',
  },
  {
    id: 'hill_giant',
    displayName: 'Hill Giant',
    role: 'tank',
    cost: 5,
    hp: 2000,
    damage: 200,
    attackRange: 1.5,
    attackSpeed: 0.7,
    moveSpeed: 1.8,
    targetType: 'ground',
    prefersTowers: true,
    description: 'Tank that targets towers preferentially.',
  },
  {
    id: 'ember_archer',
    displayName: 'Ember Archer',
    role: 'ranged',
    cost: 3,
    hp: 320,
    damage: 120,
    attackRange: 6,
    attackSpeed: 0.8,
    moveSpeed: 2.2,
    targetType: 'ground',
    projectileType: 'arrow',
    description: 'Long range, single target, slow shots.',
  },
  {
    id: 'clockwork_spear',
    displayName: 'Clockwork Spear',
    role: 'ranged',
    cost: 3,
    hp: 380,
    damage: 90,
    attackRange: 5,
    attackSpeed: 1.2,
    moveSpeed: 2.5,
    targetType: 'ground',
    projectileType: 'bolt',
    description: 'Medium range, faster shots.',
  },
  {
    id: 'bomb_satchel',
    displayName: 'Bomb Satchel',
    role: 'special',
    cost: 3,
    hp: 280,
    damage: 0,
    attackRange: 0,
    attackSpeed: 0,
    moveSpeed: 3.2,
    targetType: 'ground',
    splashRadius: 2.5,
    description: 'Runs to target and explodes (AoE).',
  },
  {
    id: 'shield_bearer',
    displayName: 'Shield Bearer',
    role: 'tank',
    cost: 3,
    hp: 1400,
    damage: 70,
    attackRange: 1.2,
    attackSpeed: 0.9,
    moveSpeed: 2,
    targetType: 'ground',
    description: 'Low damage, high HP, draws aggro.',
  },
  {
    id: 'river_witch',
    displayName: 'River Witch',
    role: 'support',
    cost: 5,
    hp: 480,
    damage: 60,
    attackRange: 4,
    attackSpeed: 0.7,
    moveSpeed: 2,
    targetType: 'both',
    projectileType: 'fireball',
    spawnsMinions: true,
    description: 'Periodically spawns small minions.',
  },
  {
    id: 'duel_prince',
    displayName: 'Duel Prince',
    role: 'melee',
    cost: 4,
    hp: 800,
    damage: 180,
    attackRange: 1.3,
    attackSpeed: 1.0,
    moveSpeed: 2.8,
    targetType: 'ground',
    charges: true,
    description: 'Gains speed/damage after running straight.',
  },
  {
    id: 'frost_adept',
    displayName: 'Frost Adept',
    role: 'ranged',
    cost: 4,
    hp: 400,
    damage: 80,
    attackRange: 5,
    attackSpeed: 1.0,
    moveSpeed: 2.2,
    targetType: 'ground',
    projectileType: 'bolt',
    slows: true,
    description: 'Slows targets with attacks.',
  },
  {
    id: 'spark_cannon',
    displayName: 'Spark Cannon',
    role: 'building',
    cost: 4,
    hp: 600,
    damage: 100,
    attackRange: 5,
    attackSpeed: 1.0,
    moveSpeed: 0,
    targetType: 'ground',
    projectileType: 'bolt',
    deployDuration: 2,
    description: 'Stationary deployable turret.',
  },
  {
    id: 'sky_midge',
    displayName: 'Sky Midge',
    role: 'ranged',
    cost: 2,
    hp: 180,
    damage: 55,
    attackRange: 4,
    attackSpeed: 1.3,
    moveSpeed: 3.5,
    targetType: 'ground',
    projectileType: 'arrow',
    description: 'Fragile air unit, annoyer.',
  },
  {
    id: 'royal_courier',
    displayName: 'Royal Courier',
    role: 'support',
    cost: 3,
    hp: 350,
    damage: 50,
    attackRange: 1.2,
    attackSpeed: 1.0,
    moveSpeed: 2.8,
    targetType: 'ground',
    buffsAllies: true,
    description: 'Buffs nearby allies (speed/attack speed).',
  },
];

export const CARD_MAP: Record<string, CardDefinition> = Object.fromEntries(
  CARDS.map((c) => [c.id, c])
);

export function getCard(id: string): CardDefinition | undefined {
  return CARD_MAP[id];
}
