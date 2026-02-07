import Phaser from 'phaser';
import { phaserConfig } from './config';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { DeckScene } from '../scenes/DeckScene';
import { StoreScene } from '../scenes/StoreScene';
import { BattleScene } from '../scenes/BattleScene';
import { ResultsScene } from '../scenes/ResultsScene';

const scenes = [
  BootScene,
  PreloadScene,
  MainMenuScene,
  DeckScene,
  StoreScene,
  BattleScene,
  ResultsScene,
];

export function createGame(container: HTMLElement): Phaser.Game {
  const config = {
    ...phaserConfig,
    parent: container,
    scene: scenes,
  };
  return new Phaser.Game(config);
}
