/** All card definitions for the tower-battle game. 8 original units. */

export interface CardDef {
  id: string;
  name: string;
  cost: number;
  hp: number;
  damage: number;
  attackRange: number; // in grid cells
  attackSpeed: number; // attacks per second
  moveSpeed: number; // grid cells per second
  targetType: "ground" | "air" | "building" | "any";
  unitType: "melee" | "ranged" | "swarm" | "tank" | "splash";
  count: number; // how many units spawn
  splashRadius?: number;
  projectile?: boolean;
  color: string; // primary color for placeholder art
  icon: string; // simple shape descriptor
  description: string;
}

export const ALL_CARDS: CardDef[] = [
  {
    id: "lancia",
    name: "Lanceguard",
    cost: 3,
    hp: 600,
    damage: 75,
    attackRange: 1,
    attackSpeed: 1.2,
    moveSpeed: 2.0,
    targetType: "ground",
    unitType: "melee",
    count: 1,
    color: "#4A90D9",
    icon: "sword",
    description: "A stalwart knight with lance and shield.",
  },
  {
    id: "gladio",
    name: "Bladedancer",
    cost: 4,
    hp: 800,
    damage: 110,
    attackRange: 1,
    attackSpeed: 1.0,
    moveSpeed: 1.8,
    targetType: "ground",
    unitType: "melee",
    count: 1,
    color: "#C0392B",
    icon: "blade",
    description: "A fierce warrior who strikes with deadly precision.",
  },
  {
    id: "sciame",
    name: "Swarm Rats",
    cost: 2,
    hp: 150,
    damage: 40,
    attackRange: 1,
    attackSpeed: 1.5,
    moveSpeed: 2.8,
    targetType: "ground",
    unitType: "swarm",
    count: 4,
    color: "#8B7355",
    icon: "dots",
    description: "A horde of small creatures that overwhelm enemies.",
  },
  {
    id: "vespe",
    name: "Wasp Pack",
    cost: 3,
    hp: 200,
    damage: 55,
    attackRange: 1,
    attackSpeed: 1.3,
    moveSpeed: 2.5,
    targetType: "ground",
    unitType: "swarm",
    count: 3,
    color: "#F1C40F",
    icon: "triangles",
    description: "Agile strikers that attack in a buzzing frenzy.",
  },
  {
    id: "arciere",
    name: "Bowmaster",
    cost: 3,
    hp: 350,
    damage: 65,
    attackRange: 5,
    attackSpeed: 0.65,
    moveSpeed: 1.6,
    targetType: "any",
    unitType: "ranged",
    count: 1,
    projectile: true,
    color: "#27AE60",
    icon: "arrow",
    description: "An expert marksman who strikes from afar.",
  },
  {
    id: "maga",
    name: "Frost Mage",
    cost: 4,
    hp: 400,
    damage: 85,
    attackRange: 6,
    attackSpeed: 0.8,
    moveSpeed: 1.4,
    targetType: "any",
    unitType: "ranged",
    count: 1,
    projectile: true,
    splashRadius: 1.8,
    color: "#9B59B6",
    icon: "crystal",
    description: "A sorcerer who hurls icy bolts that freeze and splash onto two foes.",
  },
  {
    id: "colosso",
    name: "Stone Golem",
    cost: 6,
    hp: 2200,
    damage: 140,
    attackRange: 1,
    attackSpeed: 0.6,
    moveSpeed: 1.0,
    targetType: "building",
    unitType: "tank",
    count: 1,
    color: "#7F8C8D",
    icon: "shield",
    description: "A massive construct that relentlessly targets towers.",
  },
  {
    id: "bombarda",
    name: "Cannon Crew",
    cost: 5,
    hp: 500,
    damage: 120,
    attackRange: 5,
    attackSpeed: 0.7,
    moveSpeed: 1.2,
    targetType: "ground",
    unitType: "splash",
    count: 1,
    splashRadius: 1.5,
    projectile: true,
    color: "#E67E22",
    icon: "explosion",
    description: "A devastating artillery unit with area damage.",
  },
];

// 2 extra cards for collection (unlockable)
export const EXTRA_CARDS: CardDef[] = [
  {
    id: "fantasma",
    name: "Shadow Scout",
    cost: 2,
    hp: 250,
    damage: 90,
    attackRange: 1,
    attackSpeed: 1.4,
    moveSpeed: 3.0,
    targetType: "ground",
    unitType: "melee",
    count: 1,
    color: "#2C3E50",
    icon: "ghost",
    description: "A swift assassin that strikes from the shadows.",
  },
  {
    id: "catapulta",
    name: "Siege Hurler",
    cost: 5,
    hp: 600,
    damage: 150,
    attackRange: 7,
    attackSpeed: 0.5,
    moveSpeed: 0.8,
    targetType: "building",
    unitType: "ranged",
    count: 1,
    projectile: true,
    splashRadius: 1.0,
    color: "#D35400",
    icon: "boulder",
    description: "Long-range siege engine that rains boulders on towers.",
  },
];

export const COLLECTION_CARDS = [...ALL_CARDS, ...EXTRA_CARDS];

export const DEFAULT_DECK_IDS = [
  "lancia",
  "gladio",
  "sciame",
  "arciere",
  "colosso",
  "bombarda",
];

/** AI behavior params based on aiLevel (1-10) */
export function getAIBehaviorParams(aiLevel: number) {
  const level = Math.max(1, Math.min(10, aiLevel));
  return {
    reactionDelayMs: Math.max(100, 1200 - (level - 1) * 120),
    targetRecheckMs: Math.max(200, 2000 - (level - 1) * 180),
    kiteDistance: level >= 5 ? 1 + (level - 5) * 0.3 : 0,
  };
}

/** Cost to upgrade AI level */
export function getUpgradeCost(currentLevel: number): number {
  return 50 + currentLevel * 30;
}
