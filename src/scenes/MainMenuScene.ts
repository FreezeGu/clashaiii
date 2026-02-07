import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { COLORS, FONT, SPACING } from '../ui/LuxuryTheme';
import { STRINGS } from '../data/strings';
import { loadProfile, saveProfile, resetProgress } from '../state/Storage';

export class MainMenuScene extends Phaser.Scene {
  private profile = loadProfile();

  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    this.profile = loadProfile();
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    this.add.rectangle(0, 0, w * 2, h * 2, 0x0a0f0a).setOrigin(0);

    // Top bar
    const topBar = this.add.rectangle(0, 0, w, 56, 0x0d1510).setOrigin(0, 0);
    this.add.existing(topBar);
    const nameText = this.add
      .text(SPACING.lg, 28, this.profile.playerName || STRINGS.PLAYER_NAME, {
        fontFamily: FONT.family,
        fontSize: '18px',
        color: COLORS.ivory,
      })
      .setOrigin(0, 0.5);
    this.add
      .text(w - SPACING.lg, 28, `${this.profile.trophies} ${STRINGS.TROFEI}`, {
        fontFamily: FONT.family,
        fontSize: '16px',
        color: COLORS.gold,
      })
      .setOrigin(1, 0.5);

    const openProfile = (): void => {
      const name = window.prompt('Player name', this.profile.playerName) ?? this.profile.playerName;
      if (name) {
        this.profile.playerName = name;
        saveProfile(this.profile);
        nameText.setText(name);
      }
    };
    nameText.setInteractive({ useHandCursor: true }).on('pointerdown', openProfile);

    // Battle button
    const battleBtn = this.add
      .rectangle(w / 2, h / 2 - 20, 280, 80, 0x111a12)
      .setStrokeStyle(2, 0xc9a227)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(w / 2, h / 2 - 28, STRINGS.BATTLE, {
        fontFamily: FONT.family,
        fontSize: '28px',
        color: COLORS.gold,
      })
      .setOrigin(0.5);
    this.add
      .text(w / 2, h / 2 + 12, STRINGS.BATTAGLIA, {
        fontFamily: FONT.family,
        fontSize: '14px',
        color: COLORS.ivoryDim,
      })
      .setOrigin(0.5);
    battleBtn.on('pointerover', () => battleBtn.setStrokeStyle(3, 0xe5c84a));
    battleBtn.on('pointerout', () => battleBtn.setStrokeStyle(2, 0xc9a227));
    battleBtn.on('pointerdown', () => {
      this.scene.start('Battle', { profile: this.profile });
    });

    // Bottom nav
    const navH = 64;
    const navY = h - navH;
    this.add.rectangle(0, navY, w, navH, 0x0d1510).setOrigin(0, 0);
    const tabW = w / 3;
    const homeTab = this.add
      .text(tabW / 2, navY + navH / 2, STRINGS.HOME, {
        fontFamily: FONT.family,
        fontSize: '14px',
        color: COLORS.gold,
      })
      .setOrigin(0.5);
    const deckTab = this.add
      .text(tabW + tabW / 2, navY + navH / 2, STRINGS.MAZZO, {
        fontFamily: FONT.family,
        fontSize: '14px',
        color: COLORS.ivoryDim,
      })
      .setOrigin(0.5);
    const storeTab = this.add
      .text(tabW * 2 + tabW / 2, navY + navH / 2, STRINGS.NEGOZIO, {
        fontFamily: FONT.family,
        fontSize: '14px',
        color: COLORS.ivoryDim,
      })
      .setOrigin(0.5);

    homeTab.setInteractive({ useHandCursor: true }).on('pointerdown', () => {});
    deckTab.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('Deck', { profile: this.profile }));
    storeTab.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('Store', { profile: this.profile }));

    const resetBtn = this.add
      .text(w - SPACING.lg, h - navH - 24, STRINGS.RESET_PROGRESS, {
        fontFamily: FONT.family,
        fontSize: '12px',
        color: COLORS.ivoryDim,
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    resetBtn.on('pointerdown', () => {
      if (window.confirm('Reset all progress? This cannot be undone.')) {
        this.profile = resetProgress();
        this.scene.restart();
      }
    });
  }
}
