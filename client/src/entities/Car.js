import { Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';
import { CAR_CONFIG } from '../utils/constants.js';

export class Car {
  constructor(scene, color, startPosition, startRotation = 0) {
    this.scene = scene;
    this.currentSpeed = 0;
    this.rotation = startRotation;

    // Main body is the root mesh (physics will be on this)
    this.mesh = MeshBuilder.CreateBox('carBody', {
      width: CAR_CONFIG.width,
      height: CAR_CONFIG.height,
      depth: CAR_CONFIG.length * 0.5,
    }, scene);
    this.mesh.position = startPosition.clone();
    this.mesh.position.y = CAR_CONFIG.height / 2 + 0.1;
    this.mesh.rotation.y = startRotation;

    const bodyMat = new StandardMaterial('bodyMat', scene);
    bodyMat.diffuseColor = Color3.FromHexString(color);
    this.mesh.material = bodyMat;

    // Front nose - narrower, shows direction clearly
    const nose = MeshBuilder.CreateBox('nose', {
      width: CAR_CONFIG.width * 0.5,
      height: CAR_CONFIG.height * 0.6,
      depth: CAR_CONFIG.length * 0.4,
    }, scene);
    nose.position.z = CAR_CONFIG.length * 0.45;
    nose.position.y = -0.1;
    nose.parent = this.mesh;
    nose.material = bodyMat;

    // Yellow nose tip - very visible front indicator
    const noseTip = MeshBuilder.CreateBox('noseTip', {
      width: CAR_CONFIG.width * 0.3,
      height: CAR_CONFIG.height * 0.4,
      depth: 0.5,
    }, scene);
    noseTip.position.z = CAR_CONFIG.length * 0.75;
    noseTip.position.y = -0.15;
    noseTip.parent = this.mesh;

    const yellowMat = new StandardMaterial('yellowMat', scene);
    yellowMat.diffuseColor = Color3.Yellow();
    yellowMat.emissiveColor = Color3.Yellow().scale(0.4);
    noseTip.material = yellowMat;

    // Red rear - brake lights style
    const rear = MeshBuilder.CreateBox('rear', {
      width: CAR_CONFIG.width,
      height: CAR_CONFIG.height * 0.4,
      depth: 0.3,
    }, scene);
    rear.position.z = -CAR_CONFIG.length * 0.3;
    rear.position.y = 0.15;
    rear.parent = this.mesh;

    const redMat = new StandardMaterial('redMat', scene);
    redMat.diffuseColor = Color3.Red();
    redMat.emissiveColor = Color3.Red().scale(0.3);
    rear.material = redMat;

    // Add wheels
    this.createWheels();
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
    // === STEERING ===
    // Q/E rotates the car - responsive turning even at low speeds
    const minSpeedToTurn = 0.5;
    if (Math.abs(this.currentSpeed) > minSpeedToTurn) {
      // Q = left (negative rotation), E = right (positive rotation)
      const turnDirection = (input.turnRight ? 1 : 0) - (input.turnLeft ? 1 : 0);
      
      // Full turn rate always - arcade style!
      const turnRate = CAR_CONFIG.turnSpeed;
      
      // Reverse steering when going backwards
      const reverseMultiplier = this.currentSpeed >= 0 ? 1 : -1;
      
      this.rotation += turnDirection * turnRate * reverseMultiplier * deltaTime;
    }

    // === ACCELERATION ===
    if (input.accelerate) {
      this.currentSpeed += CAR_CONFIG.acceleration * deltaTime;
    } else if (input.brake) {
      this.currentSpeed -= CAR_CONFIG.brakeForce * deltaTime;
    } else {
      // Natural deceleration (friction)
      if (this.currentSpeed > 0) {
        this.currentSpeed = Math.max(0, this.currentSpeed - CAR_CONFIG.deceleration * deltaTime);
      } else if (this.currentSpeed < 0) {
        this.currentSpeed = Math.min(0, this.currentSpeed + CAR_CONFIG.deceleration * deltaTime);
      }
    }

    // Clamp speed
    const maxReverse = CAR_CONFIG.maxSpeed * 0.3;
    this.currentSpeed = Math.max(-maxReverse, Math.min(CAR_CONFIG.maxSpeed, this.currentSpeed));

    // === MOVEMENT ===
    // Calculate forward direction from our rotation
    const forward = new Vector3(
      Math.sin(this.rotation),
      0,
      Math.cos(this.rotation)
    );

    // Calculate new position
    const moveAmount = forward.scale(this.currentSpeed * deltaTime);
    const newPos = this.mesh.position.add(moveAmount);

    // Simple oval track collision (keep car between inner and outer radius)
    const distFromCenter = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
    const innerRadius = 25 + 2; // track inner + car buffer
    const outerRadius = 45 - 2; // track outer - car buffer

    if (distFromCenter >= innerRadius && distFromCenter <= outerRadius) {
      // Within track bounds - allow movement
      this.mesh.position = newPos;
    } else {
      // Hit wall - stop and push back slightly
      this.currentSpeed *= -0.3; // Bounce back
      
      // Push car back into valid area
      const angle = Math.atan2(this.mesh.position.x, this.mesh.position.z);
      const clampedDist = Math.max(innerRadius + 1, Math.min(outerRadius - 1, distFromCenter));
      this.mesh.position.x = Math.sin(angle) * clampedDist;
      this.mesh.position.z = Math.cos(angle) * clampedDist;
    }

    // Apply rotation to mesh
    this.mesh.rotation.y = this.rotation;
    this.mesh.rotation.x = 0;
    this.mesh.rotation.z = 0;
  }

  getPosition() {
    return this.mesh.position.clone();
  }

  getRotationY() {
    return this.rotation;
  }

  getSpeed() {
    return this.currentSpeed;
  }

  getMesh() {
    return this.mesh;
  }

  reset(position, rotation) {
    this.mesh.position = position.clone();
    this.mesh.position.y = CAR_CONFIG.height / 2 + 0.1;
    this.rotation = rotation;
    this.mesh.rotation.y = rotation;
    this.currentSpeed = 0;
  }
}
