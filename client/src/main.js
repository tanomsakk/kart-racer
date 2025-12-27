import { Game } from './Game.js';

async function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) throw new Error('Canvas not found');

  const game = new Game(canvas);
  await game.init();
  game.run();
}

init().catch(console.error);
