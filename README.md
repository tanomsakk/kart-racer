# Kart Racer

A 3D kart racing game built with Babylon.js.

## Features

- Arcade-style car physics with acceleration, braking, and steering
- Oval track with collision boundaries
- Checkpoint system with lap tracking
- HUD displaying speed, lap count, and race timer
- Best lap time tracking
- Countdown start sequence
- Follow camera

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake / Reverse |
| Q | Turn Left |
| E | Turn Right |
| R | Restart Race |
| Space | Restart (after finish) |

## Tech Stack

- [Babylon.js](https://www.babylonjs.com/) - 3D rendering engine
- [Vite](https://vitejs.dev/) - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
cd client
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

## Project Structure

```
client/
├── src/
│   ├── entities/
│   │   ├── Car.js          # Car physics and rendering
│   │   └── Checkpoint.js   # Lap tracking system
│   ├── input/
│   │   └── InputManager.js # Keyboard input handling
│   ├── tracks/
│   │   ├── Track.js        # Track rendering
│   │   └── definitions/
│   │       └── oval.js     # Oval track definition
│   ├── ui/
│   │   └── HUD.js          # Speed, lap, and timer display
│   ├── utils/
│   │   └── constants.js    # Game configuration
│   ├── Game.js             # Main game loop
│   └── main.js             # Entry point
└── index.html
```

## License

MIT
