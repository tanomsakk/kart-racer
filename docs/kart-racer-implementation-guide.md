# Kart Racer - Implementation Guide for Claude Code

This guide provides step-by-step instructions for building the racing game using JavaScript (ES Modules). Follow each section in order.

---

## Prerequisites

Before starting, ensure these tools are available:

- Bun
- Git

---

## Step 1: Project Initialization

### 1.1 Create Project Structure

```bash
mkdir kart-racer
cd kart-racer

# Create directories
mkdir -p client/src/{scenes,entities,tracks/definitions,input,network,ui,utils}
mkdir -p client/public/assets
mkdir -p server/src/{rooms,state,config}
mkdir -p shared

# Initialize git
git init
echo "node_modules\ndist\n.DS_Store" > .gitignore
```

### 1.2 Initialize Client Package

Create `client/package.json`:

```json
{
  "name": "kart-racer-client",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@babylonjs/core": "^7.0.0",
    "@babylonjs/havok": "^1.3.0",
    "@babylonjs/gui": "^7.0.0",
    "colyseus.js": "^0.15.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### 1.3 Initialize Server Package

Create `server/package.json`:

```json
{
  "name": "kart-racer-server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.js",
    "start": "bun src/index.js"
  },
  "dependencies": {
    "@colyseus/ws-transport": "^0.15.0",
    "colyseus": "^0.15.0"
  }
}
```

### 1.4 Vite Config

Create `client/vite.config.js`:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
  },
});
```

### 1.5 HTML Entry

Create `client/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kart Racer</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,
      body {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      #game-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    </style>
  </head>
  <body>
    <canvas id="game-canvas"></canvas>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

---

## Step 2: Babylon.js Setup with Havok Physics

### 2.1 Main Entry Point

Create `client/src/main.js`:

```javascript
import { Game } from './Game.js';

async function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) throw new Error('Canvas not found');

  const game = new Game(canvas);
  await game.init();
  game.run();
}

init().catch(console.error);
```

### 2.2 Game Class

Create `client/src/Game.js`:

```javascript
import { Engine, Scene, Vector3, HemisphericLight, ArcRotateCamera } from '@babylonjs/core';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true);
    this.scene = null;
  }

  async init() {
    // Initialize Havok physics
    const havokInstance = await HavokPhysics();

    // Create scene
    this.scene = new Scene(this.engine);

    // Enable physics
    const havokPlugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);

    // Basic lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.8;

    // Temporary camera (will be replaced with follow camera)
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 30, Vector3.Zero(), this.scene);
    camera.attachControl(this.canvas, true);

    // Handle window resize
    window.addEventListener('resize', () => this.engine.resize());
  }

  run() {
    if (!this.scene) return;

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  getScene() {
    return this.scene;
  }
}
```

---

## Step 3: Car Entity

### 3.1 Car Configuration

Create `client/src/utils/constants.js`:

```javascript
export const CAR_CONFIG = {
  maxSpeed: 50,
  acceleration: 35,
  deceleration: 15,
  brakeForce: 45,
  turnSpeed: 2.8,
  driftFactor: 0.12,
  grip: 0.92,
  // Physical dimensions
  width: 2,
  height: 0.8,
  length: 3.5,
};

export const COLORS = {
  player1: '#4A90D9',
  player2: '#D94A4A',
  player3: '#4AD94A',
  player4: '#D9D94A',
  track: '#555555',
  grass: '#3D8B3D',
  wall: '#8B4513',
  checkpoint: '#FFD700',
};

export const RACE_CONFIG = {
  laps: 3,
  countdownSeconds: 3,
};
```

### 3.2 Car Entity Class

Create `client/src/entities/Car.js`:

```javascript
import { Vector3, MeshBuilder, StandardMaterial, Color3, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';
import { CAR_CONFIG } from '../utils/constants.js';

export class Car {
  constructor(scene, color, startPosition, startRotation = 0) {
    this.scene = scene;
    this.velocity = Vector3.Zero();
    this.currentSpeed = 0;
    this.steerAngle = 0;

    // Create car body (simple box for now)
    this.mesh = MeshBuilder.CreateBox(
      'car',
      {
        width: CAR_CONFIG.width,
        height: CAR_CONFIG.height,
        depth: CAR_CONFIG.length,
      },
      scene
    );

    // Position and rotate
    this.mesh.position = startPosition.clone();
    this.mesh.position.y = CAR_CONFIG.height / 2 + 0.5;
    this.mesh.rotation.y = startRotation;

    // Material
    const material = new StandardMaterial('carMat', scene);
    material.diffuseColor = Color3.FromHexString(color);
    this.mesh.material = material;

    // Add wheels (visual only)
    this.createWheels();

    // Physics
    this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, { mass: 1, friction: 0.3, restitution: 0.1 }, scene);

    // Lock rotation on X and Z axes (car doesn't flip)
    this.aggregate.body.setMassProperties({
      inertia: new Vector3(0, 1, 0),
    });
  }

  createWheels() {
    const wheelPositions = [
      { x: -0.9, z: 1.2 },
      { x: 0.9, z: 1.2 },
      { x: -0.9, z: -1.2 },
      { x: 0.9, z: -1.2 },
    ];

    wheelPositions.forEach((pos, i) => {
      const wheel = MeshBuilder.CreateBox(
        `wheel${i}`,
        {
          width: 0.3,
          height: 0.5,
          depth: 0.5,
        },
        this.scene
      );

      wheel.position = new Vector3(pos.x, -0.2, pos.z);
      wheel.parent = this.mesh;

      const mat = new StandardMaterial(`wheelMat${i}`, this.scene);
      mat.diffuseColor = Color3.FromHexString('#222222');
      wheel.material = mat;
    });
  }

  update(input, deltaTime) {
    // Get current forward direction
    const forward = this.mesh.forward.clone();
    forward.y = 0;
    forward.normalize();

    // Acceleration / Braking
    if (input.accelerate) {
      this.currentSpeed += CAR_CONFIG.acceleration * deltaTime;
    } else if (input.brake) {
      this.currentSpeed -= CAR_CONFIG.brakeForce * deltaTime;
    } else {
      // Natural deceleration
      if (this.currentSpeed > 0) {
        this.currentSpeed -= CAR_CONFIG.deceleration * deltaTime;
        if (this.currentSpeed < 0) this.currentSpeed = 0;
      } else if (this.currentSpeed < 0) {
        this.currentSpeed += CAR_CONFIG.deceleration * deltaTime;
        if (this.currentSpeed > 0) this.currentSpeed = 0;
      }
    }

    // Clamp speed
    this.currentSpeed = Math.max(-CAR_CONFIG.maxSpeed * 0.3, Math.min(CAR_CONFIG.maxSpeed, this.currentSpeed));

    // Steering (only when moving)
    if (Math.abs(this.currentSpeed) > 0.5) {
      const turnDirection = (input.turnLeft ? 1 : 0) - (input.turnRight ? 1 : 0);
      const speedFactor = Math.min(Math.abs(this.currentSpeed) / CAR_CONFIG.maxSpeed, 1);
      const turnAmount = turnDirection * CAR_CONFIG.turnSpeed * deltaTime * speedFactor;

      // Reverse steering when going backwards
      const steerMultiplier = this.currentSpeed >= 0 ? 1 : -1;
      this.mesh.rotation.y += turnAmount * steerMultiplier;
    }

    // Apply velocity
    const targetVelocity = forward.scale(this.currentSpeed);

    // Drift/slide effect
    const currentVel = this.aggregate.body.getLinearVelocity();
    const lateralVel = new Vector3(currentVel.x, 0, currentVel.z);

    const blendedVelocity = Vector3.Lerp(lateralVel, targetVelocity, CAR_CONFIG.grip);

    this.aggregate.body.setLinearVelocity(new Vector3(blendedVelocity.x, currentVel.y, blendedVelocity.z));

    // Keep car upright
    this.mesh.rotation.x = 0;
    this.mesh.rotation.z = 0;
  }

  getPosition() {
    return this.mesh.position.clone();
  }

  getRotationY() {
    return this.mesh.rotation.y;
  }

  getSpeed() {
    return this.currentSpeed;
  }

  getMesh() {
    return this.mesh;
  }

  reset(position, rotation) {
    this.mesh.position = position.clone();
    this.mesh.position.y = CAR_CONFIG.height / 2 + 0.5;
    this.mesh.rotation.y = rotation;
    this.currentSpeed = 0;
    this.aggregate.body.setLinearVelocity(Vector3.Zero());
    this.aggregate.body.setAngularVelocity(Vector3.Zero());
  }
}
```

---

## Step 4: Input Manager

Create `client/src/input/InputManager.js`:

```javascript
const DEFAULT_BINDINGS = {
  accelerate: 'KeyW',
  brake: 'KeyS',
  turnLeft: 'KeyA',
  turnRight: 'KeyD',
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
}
```

---

## Step 5: Track System

### 5.1 Track Definitions

Create `shared/types.js`:

```javascript
// Track segment types: 'straight' | 'curve'
// Direction for curves: 'left' | 'right'

// TrackDefinition structure:
// {
//   id: string,
//   name: string,
//   segments: TrackSegment[],
//   width: number,
//   wallHeight: number,
//   startPosition: { x, y, z },
//   startRotation: number,
//   checkpoints: [{ x, y, z }, ...]
// }

// TrackSegment structure:
// {
//   type: 'straight' | 'curve',
//   length: number,
//   width: number,
//   angle?: number,      // for curves, in degrees
//   radius?: number,     // for curves
//   direction?: 'left' | 'right'
// }
```

### 5.2 Track Definitions

Create `client/src/tracks/definitions/oval.js`:

```javascript
export const ovalTrack = {
  id: 'oval',
  name: 'Simple Oval',
  width: 12,
  wallHeight: 2,
  startPosition: { x: 0, y: 0, z: -40 },
  startRotation: 0,
  segments: [
    { type: 'straight', length: 80, width: 12 },
    { type: 'curve', length: 0, width: 12, angle: 180, radius: 20, direction: 'right' },
    { type: 'straight', length: 80, width: 12 },
    { type: 'curve', length: 0, width: 12, angle: 180, radius: 20, direction: 'right' },
  ],
  checkpoints: [
    { x: 0, y: 0, z: 0 },
    { x: 20, y: 0, z: 40 },
    { x: 0, y: 0, z: 80 },
    { x: -20, y: 0, z: 40 },
  ],
};
```

Create `client/src/tracks/definitions/figure8.js`:

```javascript
export const figure8Track = {
  id: 'figure8',
  name: 'Figure 8',
  width: 10,
  wallHeight: 2,
  startPosition: { x: 0, y: 0, z: -30 },
  startRotation: 0,
  segments: [
    { type: 'straight', length: 30, width: 10 },
    { type: 'curve', length: 0, width: 10, angle: 270, radius: 15, direction: 'right' },
    { type: 'straight', length: 30, width: 10 },
    { type: 'curve', length: 0, width: 10, angle: 270, radius: 15, direction: 'left' },
  ],
  checkpoints: [
    { x: 0, y: 0, z: -15 },
    { x: 15, y: 0, z: 15 },
    { x: 0, y: 0, z: 30 },
    { x: -15, y: 0, z: 15 },
  ],
};
```

### 5.3 Track Builder

Create `client/src/tracks/Track.js`:

```javascript
import { Vector3, MeshBuilder, StandardMaterial, Color3, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';
import { COLORS } from '../utils/constants.js';

export class Track {
  constructor(scene, definition) {
    this.scene = scene;
    this.definition = definition;
    this.groundMeshes = [];
    this.wallMeshes = [];
    this.checkpointMeshes = [];

    this.buildTrack();
  }

  buildTrack() {
    this.buildSimpleOval();
    this.buildCheckpoints();
  }

  buildSimpleOval() {
    // Ground plane
    const ground = MeshBuilder.CreateGround(
      'ground',
      {
        width: 150,
        height: 150,
      },
      this.scene
    );

    const grassMat = new StandardMaterial('grassMat', this.scene);
    grassMat.diffuseColor = Color3.FromHexString(COLORS.grass);
    ground.material = grassMat;

    // Ground physics
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, this.scene);

    this.createRectangularTrack();
  }

  createRectangularTrack() {
    const { width, wallHeight } = this.definition;

    // Bottom straight
    this.createTrackSection(new Vector3(0, 0.01, -40), 80, width, 0);

    // Top straight
    this.createTrackSection(new Vector3(0, 0.01, 40), 80, width, 0);

    // Curved ends (simplified as rectangles)
    this.createTrackSection(new Vector3(25, 0.01, 0), width, 80 + width, Math.PI / 2);

    this.createTrackSection(new Vector3(-25, 0.01, 0), width, 80 + width, Math.PI / 2);

    this.createWalls();
  }

  createTrackSection(position, length, width, rotation) {
    const section = MeshBuilder.CreateGround(
      'trackSection',
      {
        width: width,
        height: length,
      },
      this.scene
    );

    section.position = position;
    section.rotation.y = rotation;

    const trackMat = new StandardMaterial('trackMat', this.scene);
    trackMat.diffuseColor = Color3.FromHexString(COLORS.track);
    section.material = trackMat;

    this.groundMeshes.push(section);
  }

  createWalls() {
    const { wallHeight } = this.definition;

    // Outer walls
    const wallPositions = [
      { pos: new Vector3(0, wallHeight / 2, -50), size: { w: 70, h: wallHeight, d: 2 } },
      { pos: new Vector3(0, wallHeight / 2, 50), size: { w: 70, h: wallHeight, d: 2 } },
      { pos: new Vector3(-35, wallHeight / 2, 0), size: { w: 2, h: wallHeight, d: 100 } },
      { pos: new Vector3(35, wallHeight / 2, 0), size: { w: 2, h: wallHeight, d: 100 } },
    ];

    wallPositions.forEach((wall, i) => {
      const mesh = MeshBuilder.CreateBox(
        `wall${i}`,
        {
          width: wall.size.w,
          height: wall.size.h,
          depth: wall.size.d,
        },
        this.scene
      );

      mesh.position = wall.pos;

      const wallMat = new StandardMaterial(`wallMat${i}`, this.scene);
      wallMat.diffuseColor = Color3.FromHexString(COLORS.wall);
      mesh.material = wallMat;

      new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.3, restitution: 0.5 }, this.scene);

      this.wallMeshes.push(mesh);
    });

    // Inner walls
    const innerWallPositions = [
      { pos: new Vector3(0, wallHeight / 2, -30), size: { w: 30, h: wallHeight, d: 2 } },
      { pos: new Vector3(0, wallHeight / 2, 30), size: { w: 30, h: wallHeight, d: 2 } },
      { pos: new Vector3(-15, wallHeight / 2, 0), size: { w: 2, h: wallHeight, d: 60 } },
      { pos: new Vector3(15, wallHeight / 2, 0), size: { w: 2, h: wallHeight, d: 60 } },
    ];

    innerWallPositions.forEach((wall, i) => {
      const mesh = MeshBuilder.CreateBox(
        `innerWall${i}`,
        {
          width: wall.size.w,
          height: wall.size.h,
          depth: wall.size.d,
        },
        this.scene
      );

      mesh.position = wall.pos;

      const wallMat = new StandardMaterial(`innerWallMat${i}`, this.scene);
      wallMat.diffuseColor = Color3.FromHexString(COLORS.wall);
      mesh.material = wallMat;

      new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.3, restitution: 0.5 }, this.scene);

      this.wallMeshes.push(mesh);
    });
  }

  buildCheckpoints() {
    this.definition.checkpoints.forEach((cp, i) => {
      const checkpoint = MeshBuilder.CreateBox(
        `checkpoint${i}`,
        {
          width: this.definition.width + 2,
          height: 0.5,
          depth: 1,
        },
        this.scene
      );

      checkpoint.position = new Vector3(cp.x, 0.25, cp.z);

      const mat = new StandardMaterial(`cpMat${i}`, this.scene);
      mat.diffuseColor = Color3.FromHexString(COLORS.checkpoint);
      mat.alpha = 0.5;
      checkpoint.material = mat;

      // First checkpoint is start/finish
      if (i === 0) {
        mat.alpha = 0.8;
        checkpoint.scaling.y = 2;
        checkpoint.position.y = 0.5;
      }

      this.checkpointMeshes.push(checkpoint);
    });
  }

  getStartPosition() {
    const sp = this.definition.startPosition;
    return new Vector3(sp.x, sp.y, sp.z);
  }

  getStartRotation() {
    return this.definition.startRotation;
  }

  getCheckpoints() {
    return this.definition.checkpoints.map((cp) => new Vector3(cp.x, cp.y, cp.z));
  }

  getCheckpointMesh(index) {
    return this.checkpointMeshes[index];
  }
}
```

---

## Step 6: Race Logic

### 6.1 Checkpoint System

Create `client/src/entities/Checkpoint.js`:

```javascript
import { Vector3 } from '@babylonjs/core';

export class CheckpointManager {
  constructor(checkpoints, maxLaps = 3) {
    this.checkpoints = checkpoints;
    this.maxLaps = maxLaps;
    this.currentCheckpoint = 0;
    this.currentLap = 0;
    this.lapTimes = [];
    this.lapStartTime = 0;
    this.raceStartTime = 0;
    this.finished = false;
  }

  startRace() {
    this.raceStartTime = performance.now();
    this.lapStartTime = this.raceStartTime;
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    this.lapTimes = [];
    this.finished = false;
  }

  checkProgress(carPosition) {
    if (this.finished) return { newLap: false, finished: true };

    const checkpoint = this.checkpoints[this.currentCheckpoint];
    const distance = Vector3.Distance(new Vector3(carPosition.x, 0, carPosition.z), new Vector3(checkpoint.x, 0, checkpoint.z));

    // Checkpoint radius
    if (distance < 10) {
      this.currentCheckpoint++;

      // Completed all checkpoints
      if (this.currentCheckpoint >= this.checkpoints.length) {
        this.currentCheckpoint = 0;

        const lapTime = performance.now() - this.lapStartTime;
        this.lapTimes.push(lapTime);
        this.lapStartTime = performance.now();

        if (this.currentLap >= this.maxLaps) {
          this.finished = true;
          return { newLap: true, finished: true };
        }

        this.currentLap++;
        return { newLap: true, finished: false };
      }
    }

    return { newLap: false, finished: false };
  }

  getCurrentLap() {
    return this.currentLap;
  }

  getMaxLaps() {
    return this.maxLaps;
  }

  getCurrentCheckpoint() {
    return this.currentCheckpoint;
  }

  getTotalTime() {
    return performance.now() - this.raceStartTime;
  }

  getCurrentLapTime() {
    return performance.now() - this.lapStartTime;
  }

  getLapTimes() {
    return [...this.lapTimes];
  }

  getBestLapTime() {
    if (this.lapTimes.length === 0) return null;
    return Math.min(...this.lapTimes);
  }

  isFinished() {
    return this.finished;
  }

  getLastCheckpoint() {
    const idx = this.currentCheckpoint === 0 ? this.checkpoints.length - 1 : this.currentCheckpoint - 1;
    return this.checkpoints[idx];
  }
}
```

---

## Step 7: HUD

Create `client/src/ui/HUD.js`:

```javascript
import { AdvancedDynamicTexture, TextBlock, Rectangle, Control, StackPanel } from '@babylonjs/gui';

export class HUD {
  constructor() {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // Create HUD panel
    const panel = new StackPanel();
    panel.width = '250px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.paddingTop = '20px';
    panel.paddingLeft = '20px';
    this.ui.addControl(panel);

    // Speed display
    this.speedText = this.createTextBlock('Speed: 0 km/h', '24px');
    panel.addControl(this.speedText);

    // Lap counter
    this.lapText = this.createTextBlock('Lap: 0/3', '24px');
    panel.addControl(this.lapText);

    // Timer
    this.timerText = this.createTextBlock('Time: 0:00.000', '24px');
    panel.addControl(this.timerText);

    // Best lap
    this.bestLapText = this.createTextBlock('Best: --:--.---', '20px');
    this.bestLapText.color = '#FFD700';
    panel.addControl(this.bestLapText);

    // Center message
    this.messageText = this.createTextBlock('', '72px');
    this.messageText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.messageText.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.messageText.color = '#FFFFFF';
    this.messageText.outlineWidth = 3;
    this.messageText.outlineColor = '#000000';
    this.ui.addControl(this.messageText);
  }

  createTextBlock(text, fontSize) {
    const tb = new TextBlock();
    tb.text = text;
    tb.color = 'white';
    tb.fontSize = fontSize;
    tb.height = '40px';
    tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    tb.shadowColor = 'black';
    tb.shadowBlur = 2;
    tb.shadowOffsetX = 2;
    tb.shadowOffsetY = 2;
    return tb;
  }

  updateSpeed(speed) {
    const kmh = Math.abs(Math.round(speed * 3.6));
    this.speedText.text = `Speed: ${kmh} km/h`;
  }

  updateLap(current, total) {
    this.lapText.text = `Lap: ${current}/${total}`;
  }

  updateTimer(timeMs) {
    this.timerText.text = `Time: ${this.formatTime(timeMs)}`;
  }

  updateBestLap(timeMs) {
    if (timeMs === null) {
      this.bestLapText.text = 'Best: --:--.---';
    } else {
      this.bestLapText.text = `Best: ${this.formatTime(timeMs)}`;
    }
  }

  showMessage(message, duration = 0) {
    this.messageText.text = message;

    if (duration > 0) {
      setTimeout(() => {
        this.messageText.text = '';
      }, duration);
    }
  }

  clearMessage() {
    this.messageText.text = '';
  }

  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }

  showFinishScreen(totalTime, lapTimes, bestLap) {
    const overlay = new Rectangle();
    overlay.width = '400px';
    overlay.height = '300px';
    overlay.background = 'rgba(0, 0, 0, 0.8)';
    overlay.cornerRadius = 20;
    overlay.thickness = 2;
    overlay.color = '#FFD700';
    this.ui.addControl(overlay);

    const panel = new StackPanel();
    panel.paddingTop = '20px';
    overlay.addControl(panel);

    const title = this.createTextBlock('RACE COMPLETE!', '36px');
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.color = '#FFD700';
    panel.addControl(title);

    const totalTimeText = this.createTextBlock(`Total: ${this.formatTime(totalTime)}`, '28px');
    totalTimeText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.addControl(totalTimeText);

    const bestLapTextFinal = this.createTextBlock(`Best Lap: ${this.formatTime(bestLap)}`, '24px');
    bestLapTextFinal.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    bestLapTextFinal.color = '#FFD700';
    panel.addControl(bestLapTextFinal);

    const restartText = this.createTextBlock('Press SPACE to restart', '20px');
    restartText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    restartText.paddingTop = '30px';
    panel.addControl(restartText);
  }
}
```

---

## Step 8: Race Scene

Create `client/src/scenes/RaceScene.ts`:

```typescript
import { Scene, Engine, Vector3, FollowCamera, HemisphericLight } from '@babylonjs/core';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';
import { Car } from '../entities/Car';
import { Track } from '../tracks/Track';
import { CheckpointManager } from '../entities/Checkpoint';
import { InputManager } from '../input/InputManager';
import { HUD } from '../ui/HUD';
import { ovalTrack } from '../tracks/definitions/oval';
import { COLORS, RACE_CONFIG } from '../utils/constants';

type RaceState = 'countdown' | 'racing' | 'finished';

export class RaceScene {
  private scene: Scene;
  private engine: Engine;
  private car: Car;
  private track: Track;
  private checkpointManager: CheckpointManager;
  private inputManager: InputManager;
  private hud: HUD;
  private camera: FollowCamera;
  private raceState: RaceState = 'countdown';
  private countdownValue: number = 3;

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.scene = new Scene(engine);
    this.inputManager = new InputManager(1);
    this.hud = new HUD();
  }

  async init(): Promise<void> {
    // Initialize physics
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);

    // Lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.9;

    // Build track
    this.track = new Track(this.scene, ovalTrack);

    // Create car
    this.car = new Car(this.scene, COLORS.player1, this.track.getStartPosition(), this.track.getStartRotation());

    // Setup checkpoint manager
    this.checkpointManager = new CheckpointManager(this.track.getCheckpoints(), RACE_CONFIG.laps);

    // Setup camera
    this.setupCamera();

    // Start countdown
    this.startCountdown();

    // Game loop
    this.scene.onBeforeRenderObservable.add(() => {
      this.update();
    });

    // Restart handler
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.raceState === 'finished') {
        this.restart();
      }
    });
  }

  private setupCamera(): void {
    this.camera = new FollowCamera('followCam', new Vector3(0, 10, -20), this.scene);

    this.camera.lockedTarget = this.car.getMesh();
    this.camera.radius = 15;
    this.camera.heightOffset = 6;
    this.camera.rotationOffset = 180;
    this.camera.cameraAcceleration = 0.05;
    this.camera.maxCameraSpeed = 20;
  }

  private startCountdown(): void {
    this.raceState = 'countdown';
    this.countdownValue = 3;
    this.hud.showMessage('3');

    const countdownInterval = setInterval(() => {
      this.countdownValue--;

      if (this.countdownValue > 0) {
        this.hud.showMessage(this.countdownValue.toString());
      } else if (this.countdownValue === 0) {
        this.hud.showMessage('GO!');
        this.raceState = 'racing';
        this.checkpointManager.startRace();

        setTimeout(() => {
          this.hud.clearMessage();
        }, 1000);

        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  private update(): void {
    const dt = this.engine.getDeltaTime() / 1000;

    // Update car if racing
    if (this.raceState === 'racing') {
      const input = this.inputManager.getInput();
      this.car.update(input, dt);

      // Check reset
      if (this.inputManager.isResetPressed()) {
        const lastCp = this.checkpointManager.getLastCheckpoint();
        this.car.reset(lastCp, this.track.getStartRotation());
      }

      // Check checkpoint progress
      const progress = this.checkpointManager.checkProgress(this.car.getPosition());

      if (progress.newLap && !progress.finished) {
        this.hud.showMessage(`Lap ${this.checkpointManager.getCurrentLap()}`, 1500);
      }

      if (progress.finished) {
        this.raceState = 'finished';
        const lapTimes = this.checkpointManager.getLapTimes();
        const bestLap = this.checkpointManager.getBestLapTime()!;
        const totalTime = this.checkpointManager.getTotalTime();

        this.hud.showFinishScreen(totalTime, lapTimes, bestLap);
      }

      // Update HUD
      this.hud.updateSpeed(this.car.getSpeed());
      this.hud.updateLap(this.checkpointManager.getCurrentLap(), this.checkpointManager.getMaxLaps());
      this.hud.updateTimer(this.checkpointManager.getTotalTime());
      this.hud.updateBestLap(this.checkpointManager.getBestLapTime());
    }
  }

  private restart(): void {
    // Reset car
    this.car.reset(this.track.getStartPosition(), this.track.getStartRotation());

    // Create new HUD
    this.hud = new HUD();

    // Restart race
    this.startCountdown();
  }

  getScene(): Scene {
    return this.scene;
  }
}
```

---

## Step 9: Update Main Entry

Update `client/src/main.js`:

```javascript
import { Engine } from '@babylonjs/core';
import { RaceScene } from './scenes/RaceScene.js';

async function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) throw new Error('Canvas not found');

  const engine = new Engine(canvas, true);
  const raceScene = new RaceScene(engine, canvas);

  await raceScene.init();

  // Handle resize
  window.addEventListener('resize', () => engine.resize());

  // Run game loop
  engine.runRenderLoop(() => {
    raceScene.getScene().render();
  });
}

init().catch(console.error);
```

---

## Step 10: Install and Run

```bash
cd client
bun install
bun dev
```

Open `http://localhost:5173` in browser.

---

## Phase 3: Colyseus Server Setup

### 10.1 Server Entry

Create `server/src/index.js`:

```javascript
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer } from 'http';
import { RaceRoom } from './rooms/RaceRoom.js';

const port = Number(process.env.PORT) || 2567;

const server = new Server({
  transport: new WebSocketTransport({
    server: createServer(),
  }),
});

// Register room handlers
server.define('race', RaceRoom);

server.listen(port).then(() => {
  console.log(`🏎️  Kart Racer server running on ws://localhost:${port}`);
});
```

### 10.2 Game State Schema

Create `server/src/state/PlayerState.js`:

```javascript
import { Schema, type } from '@colyseus/schema';

export class PlayerState extends Schema {}

// Define schema
Schema.defineTypes(PlayerState, {
  id: 'string',
  name: 'string',
  x: 'number',
  y: 'number',
  z: 'number',
  rotationY: 'number',
  speed: 'number',
  currentLap: 'number',
  currentCheckpoint: 'number',
  finished: 'boolean',
  finishTime: 'number',
  position: 'number',
  ready: 'boolean',
});
```

Create `server/src/state/GameState.js`:

```javascript
import { Schema, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState.js';

export class GameState extends Schema {
  constructor() {
    super();
    this.status = 'waiting';
    this.trackId = 'oval';
    this.countdown = 3;
    this.raceStartTime = 0;
    this.maxLaps = 3;
    this.players = new MapSchema();
  }
}

// Define schema
Schema.defineTypes(GameState, {
  status: 'string',
  trackId: 'string',
  countdown: 'number',
  raceStartTime: 'number',
  maxLaps: 'number',
  players: { map: PlayerState },
});
```

### 10.3 Race Room

Create `server/src/rooms/RaceRoom.js`:

```javascript
import { Room } from 'colyseus';
import { GameState } from '../state/GameState.js';
import { PlayerState } from '../state/PlayerState.js';

export class RaceRoom extends Room {
  maxClients = 4;

  startPositions = [
    { x: -3, z: -45, rot: 0 },
    { x: 3, z: -45, rot: 0 },
    { x: -3, z: -50, rot: 0 },
    { x: 3, z: -50, rot: 0 },
  ];

  onCreate(options) {
    this.setState(new GameState());
    this.state.trackId = options.trackId || 'oval';

    // Handle player input
    this.onMessage('input', (client, input) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.status === 'racing') {
        player.x = input.x;
        player.y = input.y;
        player.z = input.z;
        player.rotationY = input.rotationY;
        player.speed = input.speed;
        player.currentLap = input.currentLap;
        player.currentCheckpoint = input.currentCheckpoint;
      }
    });

    // Player ready
    this.onMessage('ready', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.ready = true;
        this.checkAllReady();
      }
    });

    // Player finished
    this.onMessage('finished', (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.finished = true;
        player.finishTime = data.time;
        this.updatePositions();
        this.checkAllFinished();
      }
    });

    console.log(`Room ${this.roomId} created`);
  }

  onJoin(client, options) {
    console.log(`${client.sessionId} joined`);

    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;

    // Assign start position
    const posIndex = this.state.players.size;
    const startPos = this.startPositions[posIndex];
    player.x = startPos.x;
    player.z = startPos.z;
    player.rotationY = startPos.rot;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client) {
    console.log(`${client.sessionId} left`);
    this.state.players.delete(client.sessionId);

    if (this.state.status !== 'finished' && this.state.players.size === 0) {
      this.state.status = 'waiting';
    }
  }

  checkAllReady() {
    if (this.state.players.size < 1) return;

    let allReady = true;
    this.state.players.forEach((player) => {
      if (!player.ready) allReady = false;
    });

    if (allReady) {
      this.startCountdown();
    }
  }

  startCountdown() {
    this.state.status = 'countdown';
    this.state.countdown = 3;

    const interval = setInterval(() => {
      this.state.countdown--;

      if (this.state.countdown <= 0) {
        clearInterval(interval);
        this.state.status = 'racing';
        this.state.raceStartTime = Date.now();
      }
    }, 1000);
  }

  updatePositions() {
    const finishedPlayers = [];
    this.state.players.forEach((p) => {
      if (p.finished) finishedPlayers.push(p);
    });

    finishedPlayers.sort((a, b) => a.finishTime - b.finishTime);
    finishedPlayers.forEach((p, i) => {
      p.position = i + 1;
    });
  }

  checkAllFinished() {
    let allFinished = true;
    this.state.players.forEach((player) => {
      if (!player.finished) allFinished = false;
    });

    if (allFinished) {
      this.state.status = 'finished';
    }
  }
}
```

### 10.4 Run Server

```bash
cd server
bun install
bun dev
```

---

## Next Steps After Phase 1

1. Test single player thoroughly
2. Add second player (local) - Phase 2
3. Integrate Colyseus client - Phase 3
4. Build lobby UI - Phase 3
5. Track editor - Phase 4

---

## Common Issues & Solutions

### Car Falls Through Ground

- Ensure physics aggregate is created AFTER mesh positioning
- Check ground has mass: 0 (static body)

### Car Spins Out of Control

- Reduce turnSpeed in CAR_CONFIG
- Increase grip value
- Lock X/Z rotation on physics body

### Laggy Multiplayer

- Reduce state sync frequency
- Only sync changed properties
- Use client-side prediction

### Havok Not Loading

- Check WASM file is accessible
- May need to configure Vite to handle WASM properly
