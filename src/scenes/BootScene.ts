import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    // Load Inter via CSS/font link; Phaser will use it if available
    // We'll add @fontsource in main or index
  }

  create(): void {
    this.scene.start('Preload');
  }
}
