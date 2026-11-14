import * as THREE from 'three';
import { CollisionWorld } from '../../runtime/collision.js';

/**
 * Minimal walking dining-room adapter for the template.
 * Replace the room/table/chair builders with the project's modules.
 */
export function createDiningScene({ renderer }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x18130f);

  const collision = new CollisionWorld();

  const floorMat = new THREE.MeshStandardMaterial({ color: 0xd8cdbb, roughness: 0.82 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xefe8dc, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x9c6f4a, roughness: 0.58 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xc9d0b7, roughness: 0.9 });

  const room = new THREE.Group();
  scene.add(room);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 14), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4;
  room.add(ceiling);

  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 0.2), wallMat);
  wallBack.position.set(0, 2, -7);
  wallBack.receiveShadow = true;
  room.add(wallBack);

  const wallFrontLeft = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMat);
  wallFrontLeft.position.set(-6, 2, 7);
  wallFrontLeft.receiveShadow = true;
  room.add(wallFrontLeft);

  const wallFrontRight = wallFrontLeft.clone();
  wallFrontRight.position.x = 6;
  room.add(wallFrontRight);

  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 14), wallMat);
  wallLeft.position.set(-10, 2, 0);
  wallLeft.receiveShadow = true;
  room.add(wallLeft);

  const wallRight = wallLeft.clone();
  wallRight.position.x = 10;
  room.add(wallRight);

  collision.addBox({ x: 0, z: -7, hx: 10, hz: 0.12 });
  collision.addBox({ x: -6, z: 7, hx: 4, hz: 0.12 });
  collision.addBox({ x: 6, z: 7, hx: 4, hz: 0.12 });
  collision.addBox({ x: -10, z: 0, hx: 0.12, hz: 7 });
  collision.addBox({ x: 10, z: 0, hx: 0.12, hz: 7 });

  // Table + six chairs, with separate colliders (no giant cluster box).
  const table = new THREE.Group();
  table.position.set(0, 0, 0);
  room.add(table);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 1.1), clothMat);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  table.add(top);
  const legGeometry = new THREE.BoxGeometry(0.08, 0.72, 0.08);
  for (const x of [-0.8, 0.8]) {
    for (const z of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(legGeometry, woodMat);
      leg.position.set(x, 0.36, z);
      leg.castShadow = true;
      table.add(leg);
    }
  }
  collision.addBox({ x: 0, z: 0, hx: 0.95, hz: 0.55 });

  const chairGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.5);
  const backGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.07);
  const chairPositions = [
    [-0.45, -0.95],
    [0.45, -0.95],
    [-0.45, 0.95],
    [0.45, 0.95],
    [-1.25, 0],
    [1.25, 0],
  ];
  for (const [x, z] of chairPositions) {
    const chair = new THREE.Group();
    chair.position.set(x, 0, z);
    const seat = new THREE.Mesh(chairGeometry, woodMat);
    seat.position.y = 0.46;
    seat.castShadow = true;
    chair.add(seat);
    const back = new THREE.Mesh(backGeometry, woodMat);
    if (Math.abs(x) > Math.abs(z)) {
      back.position.set(x < 0 ? -0.2 : 0.2, 0.76, 0);
    } else {
      back.position.set(0, 0.76, z < 0 ? -0.2 : 0.2);
    }
    back.castShadow = true;
    chair.add(back);
    table.add(chair);
    collision.addBox({ x, z, hx: 0.29, hz: 0.29 });
  }

  // Door behind the player, hinged at the wall jamb.
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-1.4, 0, 6.85);
  room.add(doorPivot);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 0.08), woodMat);
  door.position.set(1.4, 1.3, 0);
  door.castShadow = false;
  door.receiveShadow = true;
  door.userData.interactiveId = 'door.main';
  doorPivot.add(door);

  const interactiveMeshes = [door];
  const interactiveById = new Map();
  const doorItem = {
    id: 'door.main',
    label: '正门',
    target: 0,
    open: false,
    locked: false,
    mesh: door,
    pivot: doorPivot,
  };
  interactiveById.set(doorItem.id, doorItem);

  const key = new THREE.DirectionalLight(0xfff6ea, 1.2);
  key.position.set(0, 12, 0);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -9;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.camera.up.set(0, 0, 1);
  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.03;
  scene.add(key, key.target);

  const hemisphere = new THREE.HemisphereLight(0xfff6e8, 0x8a7861, 1.0);
  scene.add(hemisphere);
  scene.add(new THREE.AmbientLight(0xfff2e1, 0.55));

  const spot = new THREE.SpotLight(0xfff5e8, 180, 12, 1.1, 0.9, 2);
  spot.position.set(0, 4, 0);
  spot.target.position.set(0, 0, 0);
  spot.castShadow = false;
  scene.add(spot, spot.target);

  const start = { x: 0, z: 5, yaw: 0, pitch: -0.05, fov: 68 };

  function toggleInteractive(id) {
    const item = interactiveById.get(id);
    if (!item) return null;
    item.target = item.target > 0.5 ? 0 : 1;
    item.open = item.target > 0.5;
    return item;
  }

  function setInteractive(id, open) {
    const item = interactiveById.get(id);
    if (!item) return null;
    item.target = open ? 1 : 0;
    item.open = Boolean(open);
    return item;
  }

  function update(dt) {
    const item = doorItem;
    const targetAngle = item.target > 0.5 ? -Math.PI * 0.55 : 0;
    item.pivot.rotation.y += (targetAngle - item.pivot.rotation.y) * Math.min(1, dt * 8);
  }

  return {
    title: '餐厅',
    eyebrow: 'ADV · DINING',
    scene,
    start,
    collision,
    eyeHeight: 1.8,
    playerRadius: 0.3,
    interactiveMeshes,
    interactiveById,
    update,
    toggleInteractive,
    setInteractive,
    getInteractiveState: () => Array.from(interactiveById.values()).map(({ id, label, target, open, locked }) => ({ id, label, target, open, locked })),
  };
}
