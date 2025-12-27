import { Engine, Scene, Vector3, HemisphericLight, FollowCamera, DirectionalLight, Color3 } from '@babylonjs/core';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import HavokPhysics from '@babylonjs/havok';
import { Car } from './entities/Car.js';
import { InputManager } from './input/InputManager.js';
import { Track } from './tracks/Track.js';
import { ovalTrack } from './tracks/definitions/oval.js';
import { COLORS } from './utils/constants.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true);
    this.scene = null;
    this.car = null;
    this.track = null;
    this.inputManager = null;
    this.camera = null;
  }

  async init() {
    const havokInstance = await HavokPhysics();

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3(0.5, 0.7, 0.9); // Sky blue

    const havokPlugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);

    // Lighting
    const hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.6;
    
    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -2, -1), this.scene);
    dirLight.intensity = 0.4;

    // Create track
    this.track = new Track(this.scene, ovalTrack);

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

    const input = this.inputManager.getInput();
    this.car.update(input, dt);

    if (this.inputManager.isResetPressed()) {
      this.car.reset(this.track.getStartPosition(), this.track.getStartRotation());
    }
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
