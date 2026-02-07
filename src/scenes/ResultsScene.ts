import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { COLORS, FONT } from '../ui/LuxuryTheme';
import { STRINGS } from '../data/strings';
import { loadProfile, saveProfile } from '../state/Storage';
import type { PlayerProfile } from '../state/PlayerProfile';

const TROPHY_WIN = 28;
const TROPHY_LOSS = -26;

export class ResultsScene extends Phaser.Scene {
  private profile!: PlayerProfile;
  private playerCrowns = 0;
  private botCrowns = 0;
  private winner: 'player' | 'bot' | null = null;

  constructor() {
    super({ key: 'Results' });
  }

  init(data: { profile: PlayerProfile; playerCrowns: number; botCrowns: number; winner: 'player' | 'bot' | null }): void {
    this.profile = data.profile ?? loadProfile();
    this.playerCrowns = data.playerCrowns ?? 0;
    this.botCrowns = data.botCrowns ?? 0;
    this.winner = data.winner ?? null;
  }

  create(): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    this.add.rectangle(0, 0, w * 2, h * 2, 0x0a0f0a).setOrigin(0);

    const won = this.winner === 'player';
    const draw = this.winner === null;
    const title = draw ? 'Draw' : won ? STRINGS.VITTORIA : STRINGS.SCONFITTA;
    this.add.text(w / 2, 120, title, {
      fontFamily: FONT.family,
      fontSize: '32px',
      color: draw ? COLORS.ivory : won ? COLORS.valid : COLORS.invalid,
    }).setOrigin(0.5);

    this.add.text(w / 2, 200, `Crowns: ${this.playerCrowns} - ${this.botCrowns}`, {
      fontFamily: FONT.family,
      fontSize: '20px',
      color: COLORS.ivory,
    }).setOrigin(0.5);

    const trophyChange = won ? TROPHY_WIN : this.winner === 'bot' ? TROPHY_LOSS : 0;
    const newTrophies = Math.max(0, this.profile.trophies + trophyChange);
    const goldReward = won ? 50 : this.winner === 'bot' ? 15 : 25;
    this.profile.trophies = newTrophies;
    this.profile.gold += goldReward;
    saveProfile(this.profile);

    this.add.text(w / 2, 260, `Trofei: ${this.profile.trophies} (${trophyChange >= 0 ? '+' : ''}${trophyChange})`, {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: COLORS.gold,
    }).setOrigin(0.5);

    this.add.text(w / 2, 300, `Gold: +${goldReward}`, {
      fontFamily: FONT.family,
      fontSize: '16px',
      color: COLORS.ivoryDim,
    }).setOrigin(0.5);

    const btn = this.add
      .rectangle(w / 2, 400, 200, 50, 0x111a12)
      .setStrokeStyle(2, 0xc9a227)
      .setInteractive({ useHandCursor: true });
    this.add.text(w / 2, 400, 'Back to Menu', {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: COLORS.ivory,
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('MainMenu', { profile: this.profile }));
  }
}
