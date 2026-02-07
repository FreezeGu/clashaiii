import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { COLORS, FONT, SPACING } from '../ui/LuxuryTheme';
import { STRINGS } from '../data/strings';
import { loadProfile, saveProfile } from '../state/Storage';
import type { PlayerProfile } from '../state/PlayerProfile';
import { CARDS } from '../data/cards';
import { pickOne } from '../sim/rng';

export class StoreScene extends Phaser.Scene {
  private profile!: PlayerProfile;

  constructor() {
    super({ key: 'Store' });
  }

  init(data: { profile?: PlayerProfile }): void {
    this.profile = data.profile ?? loadProfile();
  }

  create(): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;

    this.add.rectangle(0, 0, w * 2, h * 2, 0x0a0f0a).setOrigin(0);

    const backBtn = this.add
      .text(SPACING.lg, 36, '← Back', {
        fontFamily: FONT.family,
        fontSize: '16px',
        color: COLORS.gold,
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MainMenu', { profile: this.profile }));

    const goldText = this.add
      .text(w - SPACING.lg, 36, `${STRINGS.GOLD}: ${this.profile.gold}`, {
        fontFamily: FONT.family,
        fontSize: '18px',
        color: COLORS.gold,
      })
      .setOrigin(1, 0.5);

    const centerX = w / 2;
    let y = 100;

    // Daily Deal
    const dailyCard = pickOne(CARDS, () => Math.random())!;
    this.add.text(centerX, y, STRINGS.DAILY_DEAL, {
      fontFamily: FONT.family,
      fontSize: '20px',
      color: COLORS.gold,
    }).setOrigin(0.5);
    y += 36;
    const dailyPrice = 80;
    const dailyBtn = this.add
      .rectangle(centerX, y, 200, 50, 0x111a12)
      .setStrokeStyle(2, 0xc9a227)
      .setInteractive({ useHandCursor: true });
    this.add.text(centerX, y, `${dailyCard.displayName} — ${dailyPrice} gold`, {
      fontFamily: FONT.family,
      fontSize: '14px',
      color: COLORS.ivory,
    }).setOrigin(0.5);
    dailyBtn.on('pointerdown', () => {
      if (this.profile.gold >= dailyPrice) {
        this.profile.gold -= dailyPrice;
        if (!this.profile.ownedCardIds.includes(dailyCard.id)) {
          this.profile.ownedCardIds.push(dailyCard.id);
          if (!this.profile.cardAILevel[dailyCard.id]) this.profile.cardAILevel[dailyCard.id] = 1;
        }
        saveProfile(this.profile);
        goldText.setText(`${STRINGS.GOLD}: ${this.profile.gold}`);
      }
    });
    y += 80;

    // Card Crate
    this.add.text(centerX, y, STRINGS.CARD_CRATE, {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: COLORS.ivory,
    }).setOrigin(0.5);
    y += 32;
    const cratePrice = 100;
    const crateBtn = this.add
      .rectangle(centerX, y, 220, 44, 0x111a12)
      .setStrokeStyle(2, 0xc9a227)
      .setInteractive({ useHandCursor: true });
    this.add.text(centerX, y, `${STRINGS.BUY} — ${cratePrice} gold`, {
      fontFamily: FONT.family,
      fontSize: '14px',
      color: COLORS.ivory,
    }).setOrigin(0.5);
    crateBtn.on('pointerdown', () => {
      if (this.profile.gold >= cratePrice) {
        this.profile.gold -= cratePrice;
        const missing = CARDS.filter((c) => !this.profile.ownedCardIds.includes(c.id));
        if (missing.length > 0) {
          const card = pickOne(missing, () => Math.random())!;
          this.profile.ownedCardIds.push(card.id);
          this.profile.cardAILevel[card.id] = 1;
        }
        saveProfile(this.profile);
        goldText.setText(`${STRINGS.GOLD}: ${this.profile.gold}`);
      }
    });
    y += 70;

    // AI Training Manual
    this.add.text(centerX, y, STRINGS.AI_MANUAL, {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: COLORS.ivory,
    }).setOrigin(0.5);
    y += 32;
    const manualPrice = 150;
    const manualBtn = this.add
      .rectangle(centerX, y, 220, 44, 0x111a12)
      .setStrokeStyle(2, 0xc9a227)
      .setInteractive({ useHandCursor: true });
    this.add.text(centerX, y, `${STRINGS.BUY} — ${manualPrice} gold (upgrade token)`, {
      fontFamily: FONT.family,
      fontSize: '12px',
      color: COLORS.ivory,
    }).setOrigin(0.5);
    manualBtn.on('pointerdown', () => {
      if (this.profile.gold >= manualPrice) {
        this.profile.gold -= manualPrice;
        saveProfile(this.profile);
        goldText.setText(`${STRINGS.GOLD}: ${this.profile.gold}`);
      }
    });
    y += 70;

    // Gold Pack
    this.add.text(centerX, y, STRINGS.GOLD_PACK, {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: COLORS.ivory,
    }).setOrigin(0.5);
    y += 32;
    const goldPackBtn = this.add
      .rectangle(centerX, y, 220, 44, 0x111a12)
      .setStrokeStyle(2, 0xc9a227)
      .setInteractive({ useHandCursor: true });
    this.add.text(centerX, y, 'Earn gold by winning battles', {
      fontFamily: FONT.family,
      fontSize: '12px',
      color: COLORS.ivoryDim,
    }).setOrigin(0.5);
    goldPackBtn.on('pointerdown', () => {});
  }
}
