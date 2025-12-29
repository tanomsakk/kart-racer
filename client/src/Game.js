import { Engine, Scene, Vector3, HemisphericLight, FollowCamera, DirectionalLight, Color3 } from '@babylonjs/core';
import { Car } from './entities/Car.js';
import { InputManager } from './input/InputManager.js';
import { Track } from './tracks/Track.js';
import { CheckpointSystem } from './entities/Checkpoint.js';
import { HUD } from './ui/HUD.js';
import { ovalTrack } from './tracks/definitions/oval.js';
import { COLORS } from './utils/constants.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true);
    this.scene = null;
    this.car = null;
    this.track = null;
    this.checkpoints = null;
    this.inputManager = null;
    this.camera = null;
    this.hud = null;
  }

  async init() {
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3(0.5, 0.7, 0.9); // Sky blue

    // Lighting
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.6;
    
    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene);
    dirLight.intensity = 0.4;

    // Create track
    this.track = new Track(this.scene, ovalTrack);

    // Create HUD first (needed for callbacks)
    this.hud = new HUD();

    // Create checkpoints with callbacks
    this.checkpoints = new CheckpointSystem(
      this.scene, 
      ovalTrack,
      (lap, lapTime) => this.onLapComplete(lap, lapTime),
      (totalTime, bestLap) => this.onRaceFinish(totalTime, bestLap)
    );

    // Create car at track start position
    const startPos = this.track.getStartPosition();
    const startRot = this.track.getStartRotation();
    this.car = new Car(this.scene, COLORS.player1, startPos, startRot);

    this.inputManager = new InputManager(1);
    this.setupCamera();

    this.scene.onBeforeRenderObservable.add(() => {
      this.update();
    });

    window.addEventListener('resize', () => this.engine.resize());

    // Start countdown
    this.startRace();
  }

  startRace() {
    this.checkpoints.startCountdown(
      (count) => this.hud.showMessage(count.toString(), 800),
      () => this.hud.showMessage('GO!', 1000)
    );
  }

  onLapComplete(lap, lapTime) {
    if (lap < this.checkpoints.getTotalLaps()) {
      this.hud.showMessage(`LAP ${lap + 1}`, 1500);
    }
  }

  onRaceFinish(totalTime, bestLap) {
    this.hud.showFinish(totalTime, bestLap);
  }

  setupCamera() {
    this.camera = new FollowCamera('followCam', new Vector3(0, 10, -20), this.scene);
    this.camera.lockedTarget = this.car.getMesh();
    this.camera.radius = 18;
    this.camera.heightOffset = 8;
    this.camera.rotationOffset = 180;
    this.camera.cameraAcceleration = 0.08;
    this.camera.maxCameraSpeed = 25;
  }

  update() {
    const dt = this.engine.getDeltaTime() / 1000;

    // Only allow car control when racing
    if (this.checkpoints.canMove()) {
      const input = this.inputManager.getInput();
      this.car.update(input, dt);
    }

    // Update checkpoint system
    this.checkpoints.update(this.car.getPosition());

    // Update HUD
    this.hud.update(
      this.car.getSpeed(),
      this.checkpoints.getCurrentLap(),
      this.checkpoints.getTotalLaps(),
      this.checkpoints.getRaceTime(),
      this.checkpoints.bestLapTime
    );

    // Reset with R
    if (this.inputManager.isResetPressed()) {
      this.restartRace();
    }

    // Restart with SPACE after finish
    if (this.checkpoints.isRaceFinished() && this.inputManager.isSpacePressed()) {
      this.restartRace();
    }
  }

  restartRace() {
    this.car.reset(this.track.getStartPosition(), this.track.getStartRotation());
    this.checkpoints.reset();
    this.hud.hideFinish();
    this.startRace();
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
