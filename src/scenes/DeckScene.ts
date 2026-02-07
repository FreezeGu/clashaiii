import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { MIN_DECK_SIZE } from '../game/config';
import { COLORS, FONT, SPACING } from '../ui/LuxuryTheme';
import { STRINGS } from '../data/strings';
import { loadProfile, saveProfile } from '../state/Storage';
import type { PlayerProfile } from '../state/PlayerProfile';
import { CARDS, getCard } from '../data/cards';
import { MAX_AI_LEVEL } from '../game/config';

export class DeckScene extends Phaser.Scene {
  private profile!: PlayerProfile;

  constructor() {
    super({ key: 'Deck' });
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

    this.add
      .text(w / 2, 48, STRINGS.CURRENT_DECK, {
        fontFamily: FONT.family,
        fontSize: '18px',
        color: COLORS.ivory,
      })
      .setOrigin(0.5);

    const deckSlots: Phaser.GameObjects.Rectangle[] = [];
    const deckLabels: Phaser.GameObjects.Text[] = [];
    const slotW = 90;
    const slotH = 110;
    const startX = w / 2 - (MIN_DECK_SIZE * (slotW + SPACING.sm)) / 2 + slotW / 2 + SPACING.sm / 2;
    const deckY = 100;

    for (let i = 0; i < MIN_DECK_SIZE; i++) {
      const x = startX + i * (slotW + SPACING.sm);
      const rect = this.add
        .rectangle(x, deckY, slotW, slotH, 0x111a12)
        .setStrokeStyle(1, 0xc9a227)
        .setInteractive({ useHandCursor: true });
      deckSlots.push(rect);
      const cardId = this.profile.deckCardIds[i];
      const card = cardId ? getCard(cardId) : null;
      const level = cardId ? (this.profile.cardAILevel[cardId] ?? 1) : 0;
      const label = this.add
        .text(x, deckY, card ? `${card.displayName}\nAI ${level}` : 'Empty', {
          fontFamily: FONT.family,
          fontSize: '11px',
          color: COLORS.ivoryDim,
          align: 'center',
        })
        .setOrigin(0.5);
      deckLabels.push(label);
    }

    this.add
      .text(w / 2, 240, STRINGS.COLLECTION, {
        fontFamily: FONT.family,
        fontSize: '16px',
        color: COLORS.ivory,
      })
      .setOrigin(0.5);

    const cardW = 80;
    const cardH = 100;
    const cols = 5;
    const collectionY = 280;
    const owned = this.profile.ownedCardIds;
    const collectionCards = CARDS.filter((c) => owned.includes(c.id));
    for (let i = 0; i < collectionCards.length; i++) {
      const c = collectionCards[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = SPACING.lg + col * (cardW + SPACING.sm) + cardW / 2 + SPACING.sm / 2;
      const y = collectionY + row * (cardH + SPACING.sm) + cardH / 2 + SPACING.sm / 2;
      const bg = this.add
        .rectangle(x, y, cardW, cardH, 0x0d1510)
        .setStrokeStyle(1, 0x352a0f)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y - 20, c.displayName, {
        fontFamily: FONT.family,
        fontSize: '10px',
        color: COLORS.ivory,
        align: 'center',
      }).setOrigin(0.5);
      this.add.text(x, y + 20, `AI ${this.profile.cardAILevel[c.id] ?? 1}`, {
        fontFamily: FONT.family,
        fontSize: '12px',
        color: COLORS.gold,
      }).setOrigin(0.5);
      bg.on('pointerdown', () => this.openCardDetail(c));
    }

    const canBattle = this.profile.deckCardIds.length >= MIN_DECK_SIZE;
    this.add
      .text(w / 2, h - 90, canBattle ? 'Deck ready. Start from Main Menu.' : `Add at least ${MIN_DECK_SIZE} cards to deck.`, {
        fontFamily: FONT.family,
        fontSize: '14px',
        color: canBattle ? COLORS.valid : COLORS.invalid,
      })
      .setOrigin(0.5);
  }

  private openCardDetail(card: { id: string; displayName: string; cost: number }): void {
    const w = GAME_WIDTH;
    const h = GAME_HEIGHT;
    const modal = this.add.rectangle(w / 2, h / 2, 400, 320, 0x0d1510).setStrokeStyle(2, 0xc9a227);
    const nameText = this.add.text(w / 2, h / 2 - 100, card.displayName, {
      fontFamily: FONT.family,
      fontSize: '22px',
      color: COLORS.gold,
    }).setOrigin(0.5);
    const costText = this.add.text(w / 2, h / 2 - 60, `Cost: ${card.cost}`, {
      fontFamily: FONT.family,
      fontSize: '16px',
      color: COLORS.ivoryDim,
    }).setOrigin(0.5);
    const level = this.profile.cardAILevel[card.id] ?? 1;
    const levelText = this.add.text(w / 2, h / 2 - 20, `AI Level: ${level}`, {
      fontFamily: FONT.family,
      fontSize: '16px',
      color: COLORS.ivory,
    }).setOrigin(0.5);

    const addToDeck = (): void => {
      if (this.profile.deckCardIds.length >= 8) return;
      if (!this.profile.deckCardIds.includes(card.id)) {
        this.profile.deckCardIds.push(card.id);
        saveProfile(this.profile);
      }
      modal.destroy();
      nameText.destroy();
      costText.destroy();
      levelText.destroy();
      this.scene.restart({ profile: this.profile });
    };

    const upgradeCost = 100 + (level - 1) * 50;
    const canUpgrade = level < MAX_AI_LEVEL && this.profile.gold >= upgradeCost;
    const upgradeBtn = this.add
      .text(w / 2, h / 2 + 40, canUpgrade ? `${STRINGS.UPGRADE_AI} (${upgradeCost} gold)` : (level >= MAX_AI_LEVEL ? 'AI Max' : `Need ${upgradeCost} gold`), {
        fontFamily: FONT.family,
        fontSize: '14px',
        color: canUpgrade ? COLORS.gold : COLORS.ivoryDim,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    upgradeBtn.on('pointerdown', () => {
      if (!canUpgrade) return;
      this.profile.gold -= upgradeCost;
      this.profile.cardAILevel[card.id] = level + 1;
      saveProfile(this.profile);
      modal.destroy();
      nameText.destroy();
      costText.destroy();
      levelText.destroy();
      upgradeBtn.destroy();
      closeBtn.destroy();
      this.scene.restart({ profile: this.profile });
    });

    const closeBtn = this.add
      .text(w / 2, h / 2 + 100, 'Close', {
        fontFamily: FONT.family,
        fontSize: '16px',
        color: COLORS.ivory,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      modal.destroy();
      nameText.destroy();
      costText.destroy();
      levelText.destroy();
      upgradeBtn.destroy();
      closeBtn.destroy();
      this.scene.restart({ profile: this.profile });
    });

    const addBtn = this.add
      .text(w / 2, h / 2 + 70, this.profile.deckCardIds.includes(card.id) ? 'In Deck' : STRINGS.ADD_TO_DECK, {
        fontFamily: FONT.family,
        fontSize: '14px',
        color: this.profile.deckCardIds.includes(card.id) ? COLORS.ivoryDim : COLORS.gold,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    addBtn.on('pointerdown', addToDeck);
  }
}
