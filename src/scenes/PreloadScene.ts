import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config';
import { FONT } from '../ui/LuxuryTheme';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preload' });
  }

  preload(): void {
    const w = GAME_WIDTH / 2;
    const h = GAME_HEIGHT / 2;
    const barW = 320;
    const barH = 24;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0d1510, 1);
    graphics.fillRoundedRect(w - barW / 2 - 4, h - barH / 2 - 4, barW + 8, barH + 8, 4);
    graphics.fillStyle(0x111a12, 1);
    graphics.fillRoundedRect(w - barW / 2, h - barH / 2, barW, barH, 4);

    const progressBar = this.add.graphics();
    const text = this.add.text(w, h - 48, 'Loading...', {
      fontFamily: FONT.family,
      fontSize: '18px',
      color: '#f5f0e6',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xc9a227, 1);
      progressBar.fillRoundedRect(w - barW / 2, h - barH / 2, barW * value, barH, 4);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      graphics.destroy();
      text.setText('Ready');
    });

    // Placeholder assets: if files exist they load; otherwise we use graphics at runtime
    try {
      this.load.image('arena_tile', 'assets/arena/tile.png');
    } catch {
      // ignore
    }
    try {
      this.load.image('card_bg', 'assets/ui/card_bg.png');
    } catch {
      // ignore
    }
    for (let i = 1; i <= 15; i++) {
      this.load.image(`unit_${i}`, `assets/units/unit_${i}.png`);
    }
    this.load.image('tower_crown', 'assets/arena/tower_crown.png');
    this.load.image('tower_king', 'assets/arena/tower_king.png');
    this.load.image('projectile_arrow', 'assets/projectiles/arrow.png');

    // If assets don't exist, load will still complete (we use fallbacks in battle)
    this.load.on('loaderror', () => {});
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
