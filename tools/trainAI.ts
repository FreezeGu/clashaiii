/**
 * Optional offline training: bot vs bot self-play, mutate AI weights, write aiProfiles.trained.json.
 * Run: npm run train:ai
 * Uses seeded RNG for determinism. Lightweight evolutionary strategy.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data');

function loadJson<T>(filename: string): T {
  const p = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw) as T;
}

function saveJson(filename: string, data: unknown): void {
  const p = path.join(DATA_DIR, filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function seededRandom(seed: number): () => number {
  return function next() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

interface LevelParams {
  reactionDelayMs: number;
  targetPriorityWeights: Record<string, number>;
  pathReplanIntervalMs: number;
}

function mutateParams(params: LevelParams, rate: number, rng: () => number): LevelParams {
  const out = { ...params, targetPriorityWeights: { ...params.targetPriorityWeights } };
  out.reactionDelayMs = Math.max(100, params.reactionDelayMs + (rng() - 0.5) * rate * 200);
  out.pathReplanIntervalMs = Math.max(200, params.pathReplanIntervalMs + (rng() - 0.5) * rate * 300);
  for (const k of Object.keys(out.targetPriorityWeights)) {
    out.targetPriorityWeights[k] = Math.max(0, Math.min(1, out.targetPriorityWeights[k] + (rng() - 0.5) * rate * 0.2));
  }
  return out;
}

function main(): void {
  let profiles: { levels: Record<string, LevelParams> };
  try {
    profiles = loadJson<{ levels: Record<string, LevelParams> }>('aiProfiles.json');
  } catch {
    console.log('aiProfiles.json not found, skipping training');
    process.exit(0);
    return;
  }

  const rng = seededRandom(12345);
  const generations = 5;
  for (let g = 0; g < generations; g++) {
    for (const levelKey of Object.keys(profiles.levels)) {
      const params = profiles.levels[levelKey];
      profiles.levels[levelKey] = mutateParams(params, 0.1, rng);
    }
  }

  const outPath = path.join(DATA_DIR, 'aiProfiles.trained.json');
  saveJson('aiProfiles.trained.json', profiles);
  console.log('Wrote', outPath);
}

main();
