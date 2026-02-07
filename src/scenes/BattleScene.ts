import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_WIDTH, TILE_HEIGHT, GRID_COLS, GRID_ROWS, HAND_SIZE, MAX_ELIXIR, MATCH_DURATION_SEC, SIM_DT } from '../game/config';
import { createSimWorld, getUnits, getTowers, getProjectiles, tileToWorldSafe } from '../sim/simWorld';
import type { SimWorldState } from '../sim/simWorld';
import { createCardCycle, playCard } from '../sim/systems/CardCycleSystem';
import type { CardCycleState } from '../sim/systems/CardCycleSystem';
import { createElixirState, updateElixir, spend } from '../sim/systems/ElixirSystem';
import type { ElixirState } from '../sim/systems/ElixirSystem';
import { runSimStep, spawnUnit } from '../sim/runSimStep';
import { createFixedTimestep } from '../sim/FixedTimestep';
import { decideBotPlay, getBotProfileForTrophies } from '../sim/systems/BotCommanderSystem';
import { canPlaceAt } from '../sim/systems/CollisionSystem';
import { COLORS, FONT } from '../ui/LuxuryTheme';
import { getCard, CARD_MAP } from '../data/cards';
import type { PlayerProfile } from '../state/PlayerProfile';
import botProfilesJson from '../data/botProfiles.json';
import type { BotProfile } from '../sim/systems/BotCommanderSystem';

const RIVER_TOP = 8;
const RIVER_BOTTOM = 9;
const BRIDGE_LEFT = 12;
const BRIDGE_RIGHT = 19;

export class BattleScene extends Phaser.Scene {
  private state!: SimWorldState;
  private cardCyclePlayer!: CardCycleState;
  private cardCycleBot!: CardCycleState;
  private elixirPlayer!: ElixirState;
  private elixirBot!: ElixirState;
  private profile!: PlayerProfile;
  private simTime = 0;
  private tick!: (elapsedMs: number) => void;
  private unitSprites: Map<string, Phaser.GameObjects.Shape> = new Map();
  private towerSprites: Map<string, Phaser.GameObjects.Shape> = new Map();
  private projectileSprites: Map<string, Phaser.GameObjects.Shape> = new Map();
  private handSprites: Phaser.GameObjects.Rectangle[] = [];
  private handTexts: Phaser.GameObjects.Text[] = [];
  private elixirText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private nextCardText!: Phaser.GameObjects.Text;
  private botNextPlayTime = 2;
  private seed = 0;
  private draggedHandIndex: number | null = null;
  private ghostSprite: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super({ key: 'Battle' });
  }

  init(data: { profile: PlayerProfile }): void {
    this.profile = data.profile;
    this.seed = Date.now();
  }

  create(): void {
    this.state = createSimWorld();
    const deckSize = Math.max(6, this.profile.deckCardIds.length);
    this.cardCyclePlayer = createCardCycle(this.profile.deckCardIds.slice(0, deckSize), HAND_SIZE);
    const botProfile = getBotProfileForTrophies(this.profile.trophies, botProfilesJson as unknown as { tiers: BotProfile[] });
    const botDeck = botProfile.deckPoolIds.slice(0, 6);
    this.cardCycleBot = createCardCycle(botDeck, HAND_SIZE);
    this.elixirPlayer = createElixirState(MAX_ELIXIR, 1 / 2.8, 0);
    this.elixirBot = createElixirState(MAX_ELIXIR, 1 / 2.8, 0);

    this.tick = createFixedTimestep((dt) => {
      this.simTime += dt;
      runSimStep(this.state, this.cardCyclePlayer, this.cardCycleBot, this.elixirPlayer, this.elixirBot, this.simTime, botProfile);
      if (this.state.gameOver) return;
      this.botPlay(botProfile, dt);
    }, { dt: SIM_DT });

    this.drawArena();
    this.drawTowers();
    this.drawHand();
    this.elixirText = this.add.text(GAME_WIDTH / 2, 42, `Elixir: ${this.elixirPlayer.current.toFixed(1)}`, {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: COLORS.gold,
    }).setOrigin(0.5);
    this.timerText = this.add.text(GAME_WIDTH - 20, 42, `${Math.ceil(MATCH_DURATION_SEC - this.simTime)}s`, {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: COLORS.ivory,
    }).setOrigin(1, 0.5);
    this.nextCardText = this.add.text(GAME_WIDTH / 2 + 200, GAME_HEIGHT - 55, '', {
      fontFamily: FONT.family,
      fontSize: '12px',
      color: COLORS.ivoryDim,
    }).setOrigin(0.5);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  private drawArena(): void {
    const g = this.add.graphics();
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * TILE_WIDTH;
        const y = row * TILE_HEIGHT;
        const isRiver = row >= RIVER_TOP && row <= RIVER_BOTTOM;
        const isBridge = isRiver && ((col >= BRIDGE_LEFT && col <= BRIDGE_LEFT + 2) || (col >= BRIDGE_RIGHT && col <= BRIDGE_RIGHT + 2));
        if (isRiver && !isBridge) {
          g.fillStyle(0x1a3a4a, 0.9);
        } else {
          g.fillStyle(row < GRID_ROWS / 2 ? 0x1a2a1a : 0x0f1a0f, 1);
        }
        g.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
      }
    }
  }

  private drawTowers(): void {
    const towers = getTowers(this.state);
    for (const t of towers) {
      const rect = this.add.rectangle(t.x, t.y, 36, 36, t.owner === 'player' ? 0x2a4a2a : 0x4a2a2a)
        .setStrokeStyle(2, 0xc9a227);
      this.towerSprites.set(t.id, rect);
    }
  }

  private drawHand(): void {
    const startX = GAME_WIDTH / 2 - (HAND_SIZE * 95) / 2 + 45;
    const y = GAME_HEIGHT - 70;
    for (let i = 0; i < HAND_SIZE; i++) {
      const x = startX + i * 95;
      const rect = this.add.rectangle(x, y, 80, 100, 0x111a12).setStrokeStyle(2, 0xc9a227).setInteractive({ useHandCursor: true });
      this.handSprites.push(rect);
      const cardId = this.cardCyclePlayer.hand[i];
      const card = cardId ? getCard(cardId) : null;
      const cost = card?.cost ?? 0;
      const text = this.add.text(x, y, card ? `${card.displayName}\n${cost}` : '', {
        fontFamily: FONT.family,
        fontSize: '11px',
        color: COLORS.ivory,
        align: 'center',
      }).setOrigin(0.5);
      this.handTexts.push(text);
    }
    this.updateNextCardText();
  }

  private updateNextCardText(): void {
    const next = this.cardCyclePlayer.deckQueue[0];
    const card = next ? getCard(next) : null;
    this.nextCardText.setText(card ? `Next: ${card.displayName}` : '');
  }

  update(_time: number, delta: number): void {
    if (this.state.gameOver) {
      this.scene.start('Results', {
        profile: this.profile,
        playerCrowns: this.state.playerCrowns,
        botCrowns: this.state.botCrowns,
        winner: this.state.winner,
      });
      return;
    }
    this.tick(delta);
    updateElixir(this.elixirPlayer, this.simTime);
    this.elixirText.setText(`Elixir: ${this.elixirPlayer.current.toFixed(1)}`);
    this.timerText.setText(`${Math.max(0, Math.ceil(MATCH_DURATION_SEC - this.simTime))}s`);

    // Sync sprites to sim
    const units = getUnits(this.state);
    const seen = new Set<string>();
    for (const u of units) {
      seen.add(u.id);
      let sprite = this.unitSprites.get(u.id);
      if (!sprite) {
        sprite = this.add.circle(u.x, u.y, 14, 0x4a7a4a).setStrokeStyle(2, 0xc9a227);
        this.unitSprites.set(u.id, sprite);
      }
      sprite.setPosition(u.x, u.y);
      sprite.setVisible(true);
    }
    for (const [id, sprite] of this.unitSprites) {
      if (!seen.has(id)) sprite.setVisible(false);
    }

    const projectiles = getProjectiles(this.state);
    const projSeen = new Set<string>();
    for (const p of projectiles) {
      projSeen.add(p.id);
      let sprite = this.projectileSprites.get(p.id);
      if (!sprite) {
        sprite = this.add.circle(p.x, p.y, 4, 0xffaa00);
        this.projectileSprites.set(p.id, sprite);
      }
      sprite.setPosition(p.x, p.y);
    }
    for (const [id, sprite] of this.projectileSprites) {
      if (!projSeen.has(id)) sprite.destroy();
      this.projectileSprites.delete(id);
    }

    const towers = getTowers(this.state);
    for (const t of towers) {
      const sprite = this.towerSprites.get(t.id);
      if (sprite) sprite.setVisible(true);
    }
    for (const e of this.state.entities) {
      if (e.kind === 'tower' && e.dead) {
        const s = this.towerSprites.get(e.id);
        if (s) s.setVisible(false);
      }
    }

    for (let i = 0; i < this.cardCyclePlayer.hand.length; i++) {
      const cardId = this.cardCyclePlayer.hand[i];
      const card = cardId ? getCard(cardId) : null;
      this.handTexts[i].setText(card ? `${card.displayName}\n${card.cost}` : '');
    }
    this.updateNextCardText();
  }

  private botPlay(botProfile: { reactionDelayMs: number; deckPoolIds: string[]; mistakeRate: number; commanderWeights: Record<string, number> }, dt: number): void {
    this.botNextPlayTime -= dt;
    if (this.botNextPlayTime > 0) return;
    this.botNextPlayTime = botProfile.reactionDelayMs / 1000 + Math.random() * 2;
    const cardCosts: Record<string, number> = {};
    for (const id of botProfile.deckPoolIds) {
      const c = CARD_MAP[id];
      if (c) cardCosts[id] = c.cost;
    }
    const decision = decideBotPlay(this.state, this.cardCycleBot.hand, cardCosts, this.elixirBot, botProfile as Parameters<typeof decideBotPlay>[4], this.seed + this.simTime * 1000);
    if (!decision) return;
    const cost = CARD_MAP[decision.cardId]?.cost ?? 5;
    if (!spend(this.elixirBot, cost)) return;
    const played = playCard(this.cardCycleBot, decision.cardHandIndex);
    if (!played) return;
    const { x, y } = tileToWorldSafe(decision.tileX, decision.tileY);
    spawnUnit(this.state, played, 'bot', x, y, 3, `bot_${this.simTime}`);
  }

  private getHandIndexAt(x: number, y: number): number {
    const startX = GAME_WIDTH / 2 - (HAND_SIZE * 95) / 2 + 45;
    const handY = GAME_HEIGHT - 70;
    for (let i = 0; i < HAND_SIZE; i++) {
      const rx = startX + i * 95;
      if (x >= rx - 40 && x <= rx + 40 && y >= handY - 50 && y <= handY + 50) return i;
    }
    return -1;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const idx = this.getHandIndexAt(pointer.x, pointer.y);
    if (idx >= 0) this.draggedHandIndex = idx;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.draggedHandIndex === null) return;
    if (!this.ghostSprite) {
      this.ghostSprite = this.add.rectangle(pointer.x, pointer.y, 60, 80, 0x2a4a2a, 0.8).setStrokeStyle(2, 0xc9a227);
    }
    this.ghostSprite.setPosition(pointer.x, pointer.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.draggedHandIndex === null) {
      if (this.ghostSprite) {
        this.ghostSprite.destroy();
        this.ghostSprite = null;
      }
      return;
    }
    const cardId = this.cardCyclePlayer.hand[this.draggedHandIndex];
    const card = cardId ? getCard(cardId) : null;
    const tileRow = Math.floor(pointer.y / TILE_HEIGHT);
    if (card && canPlaceAt(this.state.grid, pointer.x, pointer.y) && tileRow >= GRID_ROWS / 2) {
      if (this.elixirPlayer.current >= card.cost) {
        const spent = spend(this.elixirPlayer, card.cost);
        if (spent) {
          const played = playCard(this.cardCyclePlayer, this.draggedHandIndex);
          if (played) {
            const level = this.profile.cardAILevel[played] ?? 1;
            spawnUnit(this.state, played, 'player', pointer.x, pointer.y, level, `player_${this.simTime}`);
          }
        }
      }
    }
    this.draggedHandIndex = null;
    if (this.ghostSprite) {
      this.ghostSprite.destroy();
      this.ghostSprite = null;
    }
  }
}
