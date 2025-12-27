# Kart Racer Implementation Plan

## Project Overview

Browser-based 3D racing game using Babylon.js with Havok physics.

**Current State:** Documentation only - no code exists yet. **Language:** JavaScript (ES Modules) **Server:** Not needed for single-player (Colyseus is Phase 3 multiplayer only)

---

## Playable Milestone Steps

Each step ends with something you can interact with and verify.

---

## STEP 1: Driveable Car on Ground

**Goal:** Car you can drive around on a flat ground plane with WASD.

### Files to create:

```
.gitignore
client/package.json
client/vite.config.js
client/index.html
client/src/main.js
client/src/Game.js
client/src/utils/constants.js
client/src/entities/Car.js
client/src/input/InputManager.js
```

### What you'll see:

- Green ground plane (150x150)
- Blue box car in the center
- Drive with WASD keys
- Car has physics (gravity, can't fly)
- Camera follows the car

### Test:

- `cd client && bun install && bun dev`
- Open http://localhost:5173
- Press W to accelerate, A/D to turn, S to brake

---

## STEP 2: Track with Walls

**Goal:** Oval track with walls - car can't escape, collides with barriers.

### Files to create/modify:

```
shared/types.js
client/src/tracks/definitions/oval.js
client/src/tracks/Track.js
```

### What you'll see:

- Asphalt track sections (dark gray)
- Outer walls (brown) - can't drive off the track
- Inner walls - creates the oval shape
- Car bounces off walls

### Test:

- Drive into walls - car should stop/bounce
- Try to escape the track - walls prevent it

---

## STEP 3: Lap Counting & Timer

**Goal:** Checkpoints, lap counter, and race timer working.

### Files to create/modify:

```
client/src/entities/Checkpoint.js
```

Update Track.js and main game to use checkpoints.

### What you'll see:

- Yellow checkpoint markers on track (semi-transparent)
- Start/finish line (brighter checkpoint)
- Console logs when hitting checkpoints
- Lap counter increments after completing circuit

### Test:

- Drive through all checkpoints in order
- Lap should count when crossing start/finish
- Complete 3 laps

---

## STEP 4: HUD Display

**Goal:** On-screen display showing speed, lap, and timer.

### Files to create:

```
client/src/ui/HUD.js
```

### What you'll see:

- Top-left panel with:
  - Speed in km/h
  - Lap counter (Lap 1/3)
  - Race timer (M:SS.mmm)
  - Best lap time

### Test:

- Speed updates as you accelerate/brake
- Timer runs during race
- Best lap shows after completing first lap

---

## STEP 5: Complete Race Experience

**Goal:** Full race loop with countdown, racing, and finish screen.

### Files to create:

```
client/src/scenes/RaceScene.js
```

Update main.js to use RaceScene.

### What you'll see:

- Countdown: "3" → "2" → "1" → "GO!"
- Can't move during countdown
- Race timer starts on "GO!"
- "Lap 2", "Lap 3" messages on new laps
- Finish screen after 3 laps with:
  - Total time
  - Best lap
  - "Press SPACE to restart"
- R key resets car to last checkpoint

### Test:

- Complete full 3-lap race
- Press SPACE to restart
- Press R to reset if stuck

---

## Future Steps (After Phase 1)

### STEP 6: Local 2-Player (Phase 2)

- Second car with Arrow key controls
- Both players race together
- Winner determination

### STEP 7: Online Multiplayer (Phase 3)

- Colyseus server setup
- Room creation/joining
- Up to 4 players online

---

## File Reference

### Step 1 Files

| File                               | Purpose                      |
| ---------------------------------- | ---------------------------- |
| `.gitignore`                       | Ignore node_modules, dist    |
| `client/package.json`              | Babylon.js, Havok, Vite deps |
| `client/vite.config.js`            | Vite config, exclude Havok   |
| `client/index.html`                | Canvas element               |
| `client/src/main.js`               | Entry point                  |
| `client/src/Game.js`               | Engine, physics setup        |
| `client/src/utils/constants.js`    | CAR_CONFIG, COLORS           |
| `client/src/entities/Car.js`       | Car with physics             |
| `client/src/input/InputManager.js` | Keyboard input               |

### Step 2 Files

| File                                    | Purpose                         |
| --------------------------------------- | ------------------------------- |
| `shared/types.js`                       | Track type definitions          |
| `client/src/tracks/definitions/oval.js` | Oval track data                 |
| `client/src/tracks/Track.js`            | Builds 3D track from definition |

### Step 3-5 Files

| File                                | Purpose                   |
| ----------------------------------- | ------------------------- |
| `client/src/entities/Checkpoint.js` | Checkpoint/lap logic      |
| `client/src/ui/HUD.js`              | Speed, lap, timer display |
| `client/src/scenes/RaceScene.js`    | Full race orchestration   |

---

## Key Commands

```bash
# Setup (Step 1)
mkdir -p client/src/{scenes,entities,tracks/definitions,input,ui,utils}
mkdir -p client/public/assets
mkdir -p shared

# Install & Run
cd client
bun install
bun dev
# Open http://localhost:5173
```

---

## Controls

| Action                 | Key   |
| ---------------------- | ----- |
| Accelerate             | W     |
| Brake/Reverse          | S     |
| Turn Left              | A     |
| Turn Right             | D     |
| Reset to Checkpoint    | R     |
| Restart (after finish) | SPACE |
