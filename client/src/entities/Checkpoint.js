import { Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

export class CheckpointSystem {
  constructor(scene, trackDefinition, onLapComplete, onRaceFinish) {
    this.scene = scene;
    this.checkpoints = [];
    this.currentCheckpoint = 0;
    this.lapCount = 0;
    this.totalLaps = 3;
    this.raceStartTime = null;
    this.lapTimes = [];
    this.lastLapTime = null;
    this.bestLapTime = null;
    this.raceState = 'waiting'; // waiting, countdown, racing, finished
    this.countdownValue = 3;
    this.onLapComplete = onLapComplete;
    this.onRaceFinish = onRaceFinish;

    this.createCheckpoints(trackDefinition);
  }

  createCheckpoints(trackDef) {
    const { innerRadius, outerRadius } = trackDef;
    const trackWidth = outerRadius - innerRadius;
    const centerRadius = (innerRadius + outerRadius) / 2;

    // Place 4 checkpoints around the oval (every 90 degrees)
    const checkpointAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

    checkpointAngles.forEach((angle, index) => {
      const x = Math.cos(angle) * centerRadius;
      const z = Math.sin(angle) * centerRadius;

      // Create checkpoint marker (semi-transparent yellow gate spanning across track)
      const checkpoint = MeshBuilder.CreateBox(`checkpoint${index}`, {
        width: trackWidth + 2,
        height: 4,
        depth: 0.5,
      }, this.scene);

      checkpoint.position = new Vector3(x, 2, z);
      // Rotate to face along the track (perpendicular to radius)
      checkpoint.rotation.y = angle;

      const mat = new StandardMaterial(`checkpointMat${index}`, this.scene);
      if (index === 0) {
        // Start/finish line - brighter
        mat.diffuseColor = Color3.FromHexString('#FFD700');
        mat.emissiveColor = Color3.FromHexString('#FFD700').scale(0.3);
      } else {
        // Regular checkpoint - more subtle
        mat.diffuseColor = Color3.FromHexString('#FFFF00');
      }
      mat.alpha = 0.4;
      checkpoint.material = mat;

      this.checkpoints.push({
        mesh: checkpoint,
        index: index,
        position: new Vector3(x, 0, z),
        radius: trackWidth / 2 + 2, // Detection radius
        angle: angle,
      });
    });

    console.log(`Created ${this.checkpoints.length} checkpoints`);
  }

  update(carPosition) {
    if (this.raceState !== 'racing') return;
    if (this.lapCount >= this.totalLaps) return;

    // Start timer on first checkpoint hit
    if (!this.raceStartTime) {
      this.raceStartTime = performance.now();
    }

    // Check if car is near the current target checkpoint
    const targetCheckpoint = this.checkpoints[this.currentCheckpoint];
    const distance = Vector3.Distance(
      new Vector3(carPosition.x, 0, carPosition.z),
      targetCheckpoint.position
    );

    if (distance < targetCheckpoint.radius) {
      this.hitCheckpoint(this.currentCheckpoint);
    }
  }

  startCountdown(onTick, onGo) {
    this.raceState = 'countdown';
    this.countdownValue = 3;
    
    const tick = () => {
      if (this.countdownValue > 0) {
        onTick(this.countdownValue);
        this.countdownValue--;
        setTimeout(tick, 1000);
      } else {
        onGo();
        this.raceState = 'racing';
        this.raceStartTime = performance.now();
      }
    };
    
    setTimeout(tick, 500);
  }

  canMove() {
    return this.raceState === 'racing';
  }

  hitCheckpoint(index) {
    if (index !== this.currentCheckpoint) return;

    console.log(`Checkpoint ${index + 1}/${this.checkpoints.length}`);

    // Flash the checkpoint
    const cp = this.checkpoints[index];
    const originalAlpha = cp.mesh.material.alpha;
    cp.mesh.material.alpha = 0.8;
    setTimeout(() => {
      cp.mesh.material.alpha = originalAlpha;
    }, 200);

    // Move to next checkpoint
    this.currentCheckpoint++;

    // If we've hit all checkpoints, complete the lap
    if (this.currentCheckpoint >= this.checkpoints.length) {
      this.completeLap();
    }
  }

  completeLap() {
    this.lapCount++;
    this.currentCheckpoint = 0;

    const now = performance.now();
    const lapTime = this.lastLapTime 
      ? now - this.lastLapTime 
      : now - this.raceStartTime;
    this.lastLapTime = now;
    this.lapTimes.push(lapTime);

    // Track best lap
    if (!this.bestLapTime || lapTime < this.bestLapTime) {
      this.bestLapTime = lapTime;
    }

    if (this.onLapComplete) {
      this.onLapComplete(this.lapCount, lapTime);
    }

    if (this.lapCount >= this.totalLaps) {
      this.finishRace();
    }
  }

  finishRace() {
    this.raceState = 'finished';
    const totalTime = performance.now() - this.raceStartTime;
    
    if (this.onRaceFinish) {
      this.onRaceFinish(totalTime, this.bestLapTime);
    }
  }

  getTotalTime() {
    if (!this.raceStartTime) return 0;
    if (this.raceState === 'finished') {
      return this.lapTimes.reduce((a, b) => a + b, 0);
    }
    return performance.now() - this.raceStartTime;
  }

  formatTime(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000));
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  getCurrentLap() {
    return Math.min(this.lapCount + 1, this.totalLaps);
  }

  getTotalLaps() {
    return this.totalLaps;
  }

  getRaceTime() {
    return this.getTotalTime();
  }

  isRaceFinished() {
    return this.raceState === 'finished';
  }

  getState() {
    return this.raceState;
  }

  reset() {
    this.currentCheckpoint = 0;
    this.lapCount = 0;
    this.raceStartTime = null;
    this.lapTimes = [];
    this.lastLapTime = null;
    this.bestLapTime = null;
    this.raceState = 'waiting';
    this.countdownValue = 3;
  }
}
