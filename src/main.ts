import 'phaser';
import { createGame } from './game/createGame';

const container = document.getElementById('game-container');
if (!container) throw new Error('game-container not found');

createGame(container);
