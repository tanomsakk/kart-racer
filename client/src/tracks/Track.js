import { Vector3, MeshBuilder, StandardMaterial, Color3, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';
import { COLORS } from '../utils/constants.js';

export class Track {
  constructor(scene, definition) {
    this.scene = scene;
    this.definition = definition;
    this.meshes = [];
    this.walls = [];
    
    this.build();
  }

  build() {
    // Create ground/grass base
    const ground = MeshBuilder.CreateGround('ground', { width: 200, height: 200 }, this.scene);
    const grassMat = new StandardMaterial('grassMat', this.scene);
    grassMat.diffuseColor = Color3.FromHexString(COLORS.grass);
    ground.material = grassMat;
    ground.position.y = -0.1;
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.5 }, this.scene);
    this.meshes.push(ground);

    // Build track surface
    this.buildTrackSurface();
    
    // Build walls
    this.buildWalls();
  }

  buildTrackSurface() {
    const { innerRadius, outerRadius } = this.definition;
    const trackWidth = outerRadius - innerRadius;
    const centerRadius = (innerRadius + outerRadius) / 2;
    
    // Create track as a tube/ring
    const trackPath = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      trackPath.push(new Vector3(Math.cos(angle) * centerRadius, 0, Math.sin(angle) * centerRadius));
    }

    // Create track surface using ribbon
    const inner = [];
    const outer = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      inner.push(new Vector3(Math.cos(angle) * innerRadius, 0.01, Math.sin(angle) * innerRadius));
      outer.push(new Vector3(Math.cos(angle) * outerRadius, 0.01, Math.sin(angle) * outerRadius));
    }

    const track = MeshBuilder.CreateRibbon('track', {
      pathArray: [inner, outer],
      sideOrientation: 2
    }, this.scene);

    const trackMat = new StandardMaterial('trackMat', this.scene);
    trackMat.diffuseColor = Color3.FromHexString(COLORS.track);
    track.material = trackMat;
    this.meshes.push(track);

    // Add start/finish line
    this.addStartLine();
  }

  addStartLine() {
    const { innerRadius, outerRadius } = this.definition;
    const trackWidth = outerRadius - innerRadius;
    const centerRadius = (innerRadius + outerRadius) / 2;

    // Checkered start line
    const startLine = MeshBuilder.CreateBox('startLine', {
      width: trackWidth,
      height: 0.05,
      depth: 2
    }, this.scene);
    startLine.position = new Vector3(centerRadius, 0.02, 0);
    
    const startMat = new StandardMaterial('startMat', this.scene);
    startMat.diffuseColor = Color3.White();
    startLine.material = startMat;
    this.meshes.push(startLine);
  }

  buildWalls() {
    const { innerRadius, outerRadius, wallHeight } = this.definition;
    const segments = 48;

    // Inner wall
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * innerRadius;
      const z1 = Math.sin(angle1) * innerRadius;
      const x2 = Math.cos(angle2) * innerRadius;
      const z2 = Math.sin(angle2) * innerRadius;
      
      this.createWallSegment(x1, z1, x2, z2, wallHeight, `innerWall${i}`);
    }

    // Outer wall
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * outerRadius;
      const z1 = Math.sin(angle1) * outerRadius;
      const x2 = Math.cos(angle2) * outerRadius;
      const z2 = Math.sin(angle2) * outerRadius;
      
      this.createWallSegment(x1, z1, x2, z2, wallHeight, `outerWall${i}`);
    }
  }

  createWallSegment(x1, z1, x2, z2, height, name) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const wall = MeshBuilder.CreateBox(name, {
      width: 1,
      height: height,
      depth: length + 0.5
    }, this.scene);

    wall.position = new Vector3((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
    wall.rotation.y = angle;

    const wallMat = new StandardMaterial(`${name}Mat`, this.scene);
    wallMat.diffuseColor = Color3.FromHexString(COLORS.wall);
    wall.material = wallMat;

    new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass: 0, friction: 0.3, restitution: 0.5 }, this.scene);
    
    this.walls.push(wall);
    this.meshes.push(wall);
  }

  getStartPosition() {
    const { innerRadius, outerRadius } = this.definition;
    const centerRadius = (innerRadius + outerRadius) / 2;
    return new Vector3(centerRadius, 0, 0);
  }

  getStartRotation() {
    return 0; // Facing +Z direction (along the track, counter-clockwise)
  }

  dispose() {
    this.meshes.forEach(mesh => mesh.dispose());
  }
}
