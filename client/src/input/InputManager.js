const DEFAULT_BINDINGS = {
  accelerate: 'KeyW',
  brake: 'KeyS',
  turnLeft: 'KeyQ',
  turnRight: 'KeyE',
  reset: 'KeyR',
};

const PLAYER2_BINDINGS = {
  accelerate: 'ArrowUp',
  brake: 'ArrowDown',
  turnLeft: 'ArrowLeft',
  turnRight: 'ArrowRight',
  reset: 'Backspace',
};

export class InputManager {
  constructor(playerNumber = 1) {
    this.keysPressed = new Set();
    this.bindings = playerNumber === 1 ? DEFAULT_BINDINGS : PLAYER2_BINDINGS;

    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
    });

    // Prevent default for arrow keys (scrolling)
    window.addEventListener('keydown', (e) => {
      if (e.code.startsWith('Arrow')) {
        e.preventDefault();
      }
    });
  }

  getInput() {
    return {
      accelerate: this.keysPressed.has(this.bindings.accelerate),
      brake: this.keysPressed.has(this.bindings.brake),
      turnLeft: this.keysPressed.has(this.bindings.turnLeft),
      turnRight: this.keysPressed.has(this.bindings.turnRight),
    };
  }

  isResetPressed() {
    return this.keysPressed.has(this.bindings.reset);
  }

  isSpacePressed() {
    return this.keysPressed.has('Space');
  }
}
