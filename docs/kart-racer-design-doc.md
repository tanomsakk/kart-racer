# Kart Racer - Design & Implementation Document

## Project Overview

A browser-based 3D racing game built with Babylon.js, featuring multiplayer support via Colyseus. Designed as a learning project for kids to understand game development, version control (git), and AI-assisted coding.

**Target:** Desktop browsers (Chrome, Firefox, Safari, Edge) **Style:** Low-poly / blocky (Minecraft/Roblox aesthetic) **Players:** 1-4 players **Inspiration:** Mario Kart (simplified)

---

## Tech Stack

| Component          | Technology              | Purpose                          |
| ------------------ | ----------------------- | -------------------------------- |
| Game Engine        | Babylon.js 7.x          | 3D rendering, physics, game loop |
| Physics            | Babylon.js + Havok      | Collision, car physics           |
| Build Tool         | Vite                    | Fast dev server, HMR, bundling   |
| Language           | JavaScript (ES Modules) | Simple, no build complexity      |
| Multiplayer Server | Colyseus 0.15.x         | Room management, state sync      |
| Server Runtime     | Bun                     | WebSocket server                 |
| Package Manager    | Bun                     | Fast, disk-efficient             |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Babylon   │  │    Game     │  │  Colyseus   │             │
│  │   Engine    │◄─┤   Logic     │◄─┤   Client    │             │
│  │  (Render)   │  │ (Controls)  │  │   (Sync)    │             │
│  └─────────────┘  └─────────────┘  └──────┬──────┘             │
└────────────────────────────────────────────┼────────────────────┘
                                             │ WebSocket
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Colyseus)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Room     │  │    Game     │  │    State    │             │
│  │  Manager    │──┤    State    │──┤    Sync     │             │
│  │  (Lobby)    │  │  (Players)  │  │  (Delta)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
kart-racer/
├── client/                    # Frontend game
│   ├── src/
│   │   ├── main.js           # Entry point
│   │   ├── Game.js           # Main game class
│   │   ├── scenes/
│   │   │   ├── MenuScene.js  # Main menu
│   │   │   ├── RaceScene.js  # Racing gameplay
│   │   │   └── ResultScene.js
│   │   ├── entities/
│   │   │   ├── Car.js        # Car entity with physics
│   │   │   └── Checkpoint.js
│   │   ├── tracks/
│   │   │   ├── TrackLoader.js
│   │   │   ├── Track.js      # Base track class
│   │   │   └── definitions/  # Code-defined tracks
│   │   │       ├── oval.js
│   │   │       └── figure8.js
│   │   ├── input/
│   │   │   └── InputManager.js
│   │   ├── network/
│   │   │   └── NetworkManager.js
│   │   ├── ui/
│   │   │   ├── HUD.js        # Speed, lap, timer
│   │   │   └── Lobby.js
│   │   └── utils/
│   │       └── constants.js
│   ├── public/
│   │   └── assets/           # 3D models, textures
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                    # Colyseus backend
│   ├── src/
│   │   ├── index.js          # Server entry
│   │   ├── rooms/
│   │   │   └── RaceRoom.js   # Game room logic
│   │   ├── state/
│   │   │   ├── GameState.js  # Room state schema
│   │   │   └── PlayerState.js
│   │   └── config/
│   │       └── tracks.js     # Track metadata
│   └── package.json
│
├── shared/                    # Shared types/constants
│   ├── types.ts
│   └── constants.ts
│
└── README.md
```

---

## Phase 1: Single Player Foundation

### Goal

Get a car driving on a track with basic physics, timer, and lap system.

### Features

#### 1.1 Project Setup

- Initialize monorepo with client/server/shared structure
- Configure Vite + TypeScript for client
- Configure Bun/Node + TypeScript for server
- Set up Babylon.js with Havok physics

#### 1.2 Car Entity

```typescript
// Core car properties
interface CarConfig {
  maxSpeed: number; // Units per second
  acceleration: number; // Units per second²
  deceleration: number; // Natural slowdown
  brakeForce: number; // Active braking
  turnSpeed: number; // Radians per second
  driftFactor: number; // 0-1, how much car slides
  grip: number; // Tire grip
}

// Default arcade-style config
const DEFAULT_CAR: CarConfig = {
  maxSpeed: 50,
  acceleration: 30,
  deceleration: 10,
  brakeForce: 40,
  turnSpeed: 2.5,
  driftFactor: 0.15,
  grip: 0.9,
};
```

**Physics approach:**

- Use Babylon.js physics impostor for collision
- Custom arcade physics for driving feel (not realistic simulation)
- Apply forces based on input, not direct velocity setting
- Simple drift: blend between forward velocity and turn direction

#### 1.3 Input System

```typescript
interface InputState {
  accelerate: boolean; // W or Up Arrow
  brake: boolean; // S or Down Arrow
  turnLeft: boolean; // A or Left Arrow
  turnRight: boolean; // D or Right Arrow
  reset: boolean; // R - reset to last checkpoint
}
```

- Keyboard input with configurable bindings
- Touch controls deferred to later phase

#### 1.4 Track System (Code-Defined)

Tracks defined as data structures:

```typescript
interface TrackDefinition {
  id: string;
  name: string;
  // Track is built from segments
  segments: TrackSegment[];
  // Checkpoint positions for lap counting
  checkpoints: Vector3[];
  // Start/finish line
  startPosition: Vector3;
  startRotation: number;
  // Visual properties
  groundTexture: string;
  wallHeight: number;
}

interface TrackSegment {
  type: 'straight' | 'curve' | 'chicane';
  length: number;
  width: number;
  // For curves
  angle?: number; // Degrees
  radius?: number;
  direction?: 'left' | 'right';
}
```

**Initial tracks:**

1. **Oval** - Simple loop for testing
2. **Figure-8** - Introduces crossing paths

#### 1.5 Race Logic

- Checkpoint system (must hit all checkpoints in order)
- Lap counter
- Race timer (starts on crossing start line)
- Best lap time tracking
- Race completion detection

#### 1.6 Basic UI (HUD)

- Current speed
- Lap counter (Lap 1/3)
- Race timer
- Best lap time
- Simple "Race Complete" screen with times

#### 1.7 Camera

- Follow camera behind car
- Smooth interpolation
- Optional: rear-view mirror or look-back button

### Phase 1 Deliverables

- [ ] Playable single-player race
- [ ] Two track options
- [ ] Working lap/timer system
- [ ] Basic HUD
- [ ] Car physics that feel good

---

## Phase 2: Local Multiplayer (Same Screen)

### Goal

Two players racing on the same computer with split controls.

### Features

#### 2.1 Player 2 Input

```typescript
// Player 1: WASD
// Player 2: Arrow Keys
const PLAYER_BINDINGS = {
  player1: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  player2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
};
```

#### 2.2 Camera Options

- **Split screen** (horizontal or vertical split)
- **Shared view** (zoomed out to show both cars)

Recommend starting with shared view (simpler).

#### 2.3 Race Logic Updates

- Track both players' progress
- Determine winner
- Handle ties (by time differential)

### Phase 2 Deliverables

- [ ] Two-player local multiplayer
- [ ] Split controls working
- [ ] Winner determination
- [ ] Updated results screen

---

## Phase 3: Online Multiplayer (Colyseus)

### Goal

Up to 4 players racing across different devices via Colyseus.

### Colyseus Architecture

#### 3.1 State Schema

```typescript
import { Schema, type, MapSchema } from '@colyseus/schema';

class PlayerState extends Schema {
  @type('string') id: string;
  @type('string') name: string;
  @type('number') x: number;
  @type('number') y: number;
  @type('number') z: number;
  @type('number') rotationY: number;
  @type('number') speed: number;
  @type('number') currentLap: number;
  @type('number') currentCheckpoint: number;
  @type('boolean') finished: boolean;
  @type('number') finishTime: number;
  @type('number') position: number; // 1st, 2nd, etc.
}

class GameState extends Schema {
  @type('string') status: 'waiting' | 'countdown' | 'racing' | 'finished';
  @type('string') trackId: string;
  @type('number') countdown: number;
  @type('number') raceStartTime: number;
  @type('number') maxLaps: number;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
```

#### 3.2 Room Logic

```typescript
class RaceRoom extends Room<GameState> {
  maxClients = 4;

  onCreate(options: { trackId: string }) {
    this.setState(new GameState());
    this.state.trackId = options.trackId;
    this.state.status = 'waiting';

    // Game loop for server-side validation
    this.setSimulationInterval((dt) => this.update(dt), 1000 / 20); // 20 tick
  }

  onJoin(client: Client, options: { name: string }) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.name = options.name;
    // Set starting position based on join order
    this.state.players.set(client.sessionId, player);
  }

  // Handle player input
  onMessage(client: Client, type: string, message: any) {
    if (type === 'input') {
      // Validate and apply input
    }
    if (type === 'ready') {
      // Check if all players ready, start countdown
    }
  }
}
```

#### 3.3 Client-Server Sync Strategy

**Client-side prediction:**

1. Client applies input immediately (responsive feel)
2. Sends input to server
3. Server validates and broadcasts authoritative state
4. Client reconciles with server state

**State sync frequency:**

- Player positions: 20 Hz (50ms)
- Game events (lap, finish): Immediate

**Interpolation:**

- Other players' cars interpolate between received positions
- Smooths out network jitter

#### 3.4 Lobby Flow

```
1. Main Menu
   └── "Create Room" → Creates room, shows room code
   └── "Join Room" → Enter room code

2. Lobby (in room)
   └── See connected players (1-4)
   └── Select track (host only)
   └── "Ready" button
   └── When all ready → countdown starts

3. Race
   └── 3-2-1 countdown
   └── Race until all finish or timeout

4. Results
   └── Show placements, times
   └── "Play Again" or "Leave"
```

### Phase 3 Deliverables

- [ ] Colyseus server running
- [ ] Room creation/joining with codes
- [ ] Player state sync
- [ ] Multiplayer race working
- [ ] Results screen with all players

---

## Phase 4: Track Editor & Levels

### Goal

Allow kids to create custom tracks visually and save them as levels.

### Options Explored

#### Option A: Babylon.js Editor

- Full 3D editor in browser
- Complex, might be overwhelming

#### Option B: Custom Simple Editor

- Top-down 2D view
- Drag waypoints to create track path
- Auto-generate 3D track from path
- Much simpler, kids-friendly

**Recommendation: Option B (Custom Editor)**

### Track Editor Design

```typescript
interface EditorTrack {
  id: string;
  name: string;
  author: string;
  // Path defined by control points
  pathPoints: { x: number; z: number }[];
  // Width at each point
  widths: number[];
  // Track properties
  lapCount: number;
  environment: 'grass' | 'desert' | 'snow' | 'night';
}
```

#### Editor Features (MVP)

1. Top-down canvas view
2. Click to add path points
3. Drag points to adjust
4. Preview in 3D
5. Save/Load tracks
6. Export as JSON

#### Track Storage

- Local: localStorage for quick saves
- Server: POST to Colyseus server, stored in JSON files
- Later: Database for persistent storage

### Level System

```typescript
interface Level {
  id: string;
  name: string;
  track: EditorTrack | TrackDefinition;
  difficulty: 'easy' | 'medium' | 'hard';
  unlockCondition?: string; // e.g., "complete level 2"
  bestTimes: { name: string; time: number }[];
}
```

**Built-in Levels:**

1. Tutorial Oval (Easy)
2. Figure-8 (Easy)
3. Serpentine (Medium)
4. Mountain Pass (Medium)
5. Grand Prix (Hard)

**Custom Levels:**

- Kids can create and share track JSON files
- Load custom tracks from file picker

### Phase 4 Deliverables

- [ ] Simple track editor (2D path drawing)
- [ ] 3D preview
- [ ] Save/Load tracks
- [ ] Level selection screen
- [ ] 5 built-in levels
- [ ] Custom level loading

---

## Phase 5: Power-ups (Future)

### Power-up Ideas

| Item        | Effect                   | Duration  |
| ----------- | ------------------------ | --------- |
| Speed Boost | 1.5x speed               | 3 seconds |
| Oil Slick   | Drop behind, causes spin | Instant   |
| Shield      | Immune to obstacles      | 5 seconds |
| Rocket      | Big speed burst          | 1 second  |

### Implementation Approach

- Pickup boxes on track
- Random item assignment
- Use item with Space/Shift
- Network sync for effects

_Details deferred until Phase 5_

---

## Visual Style Guide

### Color Palette

```
Primary:    #4A90D9 (Blue - player 1)
Secondary:  #D94A4A (Red - player 2)
Tertiary:   #4AD94A (Green - player 3)
Quaternary: #D9D94A (Yellow - player 4)
Track:      #555555 (Asphalt gray)
Grass:      #3D8B3D (Green)
UI:         #1A1A2E (Dark blue-gray)
```

### Car Design

- Blocky kart shape
- Distinct player colors
- Simple geometry (~100 triangles)
- No detailed textures, rely on vertex colors

### Track Design

- Flat racing surface
- Low-poly barriers/walls
- Simple environment props (trees, rocks as cubes)
- Checkered start/finish line

---

## Implementation Guide for Claude Code

### Getting Started

```bash
# Create project structure
mkdir kart-racer && cd kart-racer
mkdir client server shared

# Initialize client
cd client
pnpm init
pnpm add babylonjs @babylonjs/core @babylonjs/havok
pnpm add -D vite

# Initialize server
cd ../server
pnpm init
pnpm add colyseus @colyseus/ws-transport
pnpm add -D nodemon

# Initialize shared
cd ../shared
pnpm init
```

### Phase 1 Implementation Order

1. **Setup & Hello World** (Day 1)

   - Vite + Babylon.js working
   - Render a box on screen
   - Camera controls working

2. **Car & Physics** (Day 1-2)

   - Car mesh (box for now)
   - Keyboard input
   - Basic movement (no physics yet)
   - Add physics, collision with ground

3. **Track** (Day 2)

   - Create oval track from segments
   - Add walls/barriers
   - Car collides with walls

4. **Checkpoints & Laps** (Day 3)

   - Invisible checkpoint triggers
   - Lap counting logic
   - Timer system

5. **UI & Polish** (Day 3)

   - HUD overlay
   - Race complete screen
   - Camera smoothing
   - Sound effects (optional)

### Key Babylon.js Patterns

```typescript
// Scene setup with Havok physics
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';

const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);

// Car with physics
const car = MeshBuilder.CreateBox('car', { width: 2, height: 1, depth: 4 });
const carAggregate = new PhysicsAggregate(car, PhysicsShapeType.BOX, { mass: 1, friction: 0.5 }, scene);

// Apply force for movement
carAggregate.body.applyForce(car.forward.scale(acceleration), car.getAbsolutePosition());

// Game loop
scene.onBeforeRenderObservable.add(() => {
  const dt = engine.getDeltaTime() / 1000;
  // Update game logic
});
```

### Key Colyseus Patterns

```typescript
// Server: Room definition
import { Room, Client } from 'colyseus';

export class RaceRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage('input', (client, input) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        // Apply input to player state
      }
    });
  }
}

// Client: Connecting
import { Client } from 'colyseus.js';

const client = new Client('ws://localhost:2567');
const room = await client.joinOrCreate('race', { name: 'Player1' });

room.state.players.onAdd((player, key) => {
  // Spawn car for this player
});

room.state.listen('status', (value) => {
  if (value === 'countdown') startCountdown();
  if (value === 'racing') startRace();
});
```

---

## Git Learning Integration

### Suggested Git Workflow for Kids

1. **Start of session:** `git pull` (get latest)
2. **Before big change:** Create branch `git checkout -b feature/cool-car`
3. **Save progress:** `git add . && git commit -m "Added turbo boost"`
4. **Share work:** `git push`
5. **See history:** `git log --oneline`

### Commit Message Examples

- "Add car movement with arrow keys"
- "Fix car going through walls"
- "Make car go faster"
- "Add lap counter to screen"

### Teaching Moments

- Show `git diff` to see what changed
- Use `git blame` to see who wrote what (fun when working together)
- Create pull requests for code review practice

---

## Testing Checklist

### Phase 1 Acceptance Criteria

- [ ] Car accelerates and decelerates smoothly
- [ ] Car turns without spinning out
- [ ] Car collides with walls and stops
- [ ] Lap counter increments correctly
- [ ] Timer starts and stops correctly
- [ ] Can complete 3 laps
- [ ] Best lap time saves
- [ ] Works in Chrome, Firefox, Safari

### Phase 3 Acceptance Criteria

- [ ] Can create room and get code
- [ ] Second player can join with code
- [ ] Both players see each other's cars
- [ ] Race starts after countdown
- [ ] Winner determined correctly
- [ ] Handles player disconnect gracefully

---

## Open Questions / Future Decisions

1. **Asset pipeline:** Use free low-poly packs or procedural geometry?
2. **Mobile support:** Add touch controls later?
3. **Persistence:** Save player profiles/times to database?
4. **Deployment:** Where to host (Vercel + your server)?
5. **AI opponents:** Add simple bots for single player?

---

## Resources

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Babylon.js Playground](https://playground.babylonjs.com/)
- [Colyseus Documentation](https://docs.colyseus.io/)
- [Colyseus Examples](https://github.com/colyseus/colyseus-examples)
- [Kenney Assets](https://kenney.nl/assets) - Free low-poly game assets
- [Three.js Racing Game Example](https://github.com/nickyvanurk/3d-multiplayer-browser-shooter) - Reference architecture

---

## Appendix: Quick Reference

### Keyboard Controls

| Action              | Player 1 | Player 2  |
| ------------------- | -------- | --------- |
| Accelerate          | W        | ↑         |
| Brake/Reverse       | S        | ↓         |
| Turn Left           | A        | ←         |
| Turn Right          | D        | →         |
| Reset to Checkpoint | R        | Backspace |
| Pause               | Escape   | Escape    |

### Room Codes

- 4-character alphanumeric (e.g., "RACE", "XK9M")
- Case-insensitive
- Valid characters: A-Z, 0-9 (no confusing ones: 0/O, 1/I/L)

### Network Ports

- Client dev server: 5173 (Vite default)
- Colyseus server: 2567 (Colyseus default)
