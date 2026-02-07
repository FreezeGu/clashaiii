/**
 * Generates placeholder PNG assets for Crown Rivals using SVG + sharp.
 * Run: npm run generate:assets (or npx tsx tools/generatePlaceholders.ts)
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public', 'assets');

const CARDS = [
  { id: 'steel_squire', name: 'Steel Squire', color: '#6b7b8a' },
  { id: 'bone_trio', name: 'Bone Trio', color: '#8a7a6b' },
  { id: 'axe_matron', name: 'Axe Matron', color: '#7a6b8a' },
  { id: 'alley_gobbers', name: 'Alley Gobbers', color: '#6b8a7a' },
  { id: 'hill_giant', name: 'Hill Giant', color: '#8a6b6b' },
  { id: 'ember_archer', name: 'Ember Archer', color: '#8a6b4a' },
  { id: 'clockwork_spear', name: 'Clockwork Spear', color: '#6a7a8a' },
  { id: 'bomb_satchel', name: 'Bomb Satchel', color: '#5a5a5a' },
  { id: 'shield_bearer', name: 'Shield Bearer', color: '#7a8a6b' },
  { id: 'river_witch', name: 'River Witch', color: '#6b6b8a' },
  { id: 'duel_prince', name: 'Duel Prince', color: '#8a7a4a' },
  { id: 'frost_adept', name: 'Frost Adept', color: '#6b8a8a' },
  { id: 'spark_cannon', name: 'Spark Cannon', color: '#8a8a6b' },
  { id: 'sky_midge', name: 'Sky Midge', color: '#8a6b8a' },
  { id: 'royal_courier', name: 'Royal Courier', color: '#8a7a6a' },
];

function ensureDir(p: string): void {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function svgToPng(svg: string, outPath: string): Promise<void> {
  try {
    const sharp = await import('sharp');
    const buf = Buffer.from(svg, 'utf8');
    await sharp.default(buf).png().toFile(outPath);
  } catch (err) {
    console.warn('sharp not available, writing SVG instead');
    const svgPath = outPath.replace(/\.png$/i, '.svg');
    fs.writeFileSync(svgPath, svg);
  }
}

async function generateUnit(_id: string, name: string, color: string, index: number): Promise<void> {
  const w = 64;
  const h = 64;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${color}" rx="8"/>
  <circle cx="32" cy="24" r="12" fill="#1a1a1a"/>
  <text x="32" y="52" font-family="sans-serif" font-size="8" fill="#f5f0e6" text-anchor="middle">${name.slice(0, 10)}</text>
</svg>`;
  const outPath = path.join(PUBLIC, 'units', `unit_${index + 1}.png`);
  await svgToPng(svg, outPath);
}

async function generateArenaAssets(): Promise<void> {
  const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#0f1a0f"/></svg>`;
  await svgToPng(tileSvg, path.join(PUBLIC, 'arena', 'tile.png'));
  const crownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#2a4a2a" rx="4"/><circle cx="20" cy="20" r="8" fill="#c9a227"/></svg>`;
  await svgToPng(crownSvg, path.join(PUBLIC, 'arena', 'tower_crown.png'));
  const kingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#3a3a2a" rx="4"/><circle cx="20" cy="20" r="10" fill="#c9a227"/></svg>`;
  await svgToPng(kingSvg, path.join(PUBLIC, 'arena', 'tower_king.png'));
}

async function generateUI(): Promise<void> {
  const cardBg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect width="80" height="100" fill="#111a12" rx="6" stroke="#352a0f"/></svg>`;
  await svgToPng(cardBg, path.join(PUBLIC, 'ui', 'card_bg.png'));
}

async function generateProjectiles(): Promise<void> {
  const arrow = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="8"><path d="M0 4 L14 4 L10 0 L14 4 L10 8 Z" fill="#c9a227"/></svg>`;
  await svgToPng(arrow, path.join(PUBLIC, 'projectiles', 'arrow.png'));
}

async function main(): Promise<void> {
  ensureDir(path.join(PUBLIC, 'units'));
  ensureDir(path.join(PUBLIC, 'arena'));
  ensureDir(path.join(PUBLIC, 'ui'));
  ensureDir(path.join(PUBLIC, 'projectiles'));
  ensureDir(path.join(PUBLIC, 'cards'));
  ensureDir(path.join(PUBLIC, 'sfx'));

  for (let i = 0; i < CARDS.length; i++) {
    const c = CARDS[i];
    await generateUnit(c.id, c.name, c.color, i);
  }
  await generateArenaAssets();
  await generateUI();
  await generateProjectiles();

  console.log('Placeholder assets written to public/assets/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
