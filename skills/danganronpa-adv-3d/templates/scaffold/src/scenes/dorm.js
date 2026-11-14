import * as THREE from 'three';

/**
 * Minimal look-only dorm adapter for the template.
 * Replace the geometry/materials with the project's dorm.
 */
export function createDormScene({ renderer }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14100d);

  const room = new THREE.Group();
  scene.add(room);

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x8a5d3b, roughness: 0.7 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8c27d, roughness: 0.85 });
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xe7dfd2, roughness: 0.95 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 2.8;
  room.add(ceiling);

  const wallGeometry = new THREE.BoxGeometry(6, 2.8, 0.12);
  const back = new THREE.Mesh(wallGeometry, wallMat);
  back.position.set(0, 1.4, -3);
  back.receiveShadow = true;
  room.add(back);
  const front = back.clone();
  front.position.z = 3;
  room.add(front);
  const sideGeometry = new THREE.BoxGeometry(0.12, 2.8, 6);
  const left = new THREE.Mesh(sideGeometry, wallMat);
  left.position.set(-3, 1.4, 0);
  left.receiveShadow = true;
  room.add(left);
  const right = left.clone();
  right.position.x = 3;
  room.add(right);

  const pendant = new THREE.PointLight(0xffd09a, 18, 8, 2);
  pendant.position.set(0, 2.45, 0);
  scene.add(pendant);

  const fill = new THREE.HemisphereLight(0xfff2d8, 0x5a4634, 0.55);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xfff2e1, 0.16));

  const key = new THREE.DirectionalLight(0xffd2a0, 1.15);
  key.position.set(0, 2.6, 0);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 0.05;
  key.shadow.camera.far = 4.8;
  key.shadow.camera.up.set(0, 0, 1);
  scene.add(key, key.target);

  const wardrobe = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.8, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x7d5738, roughness: 0.62 }),
  );
  wardrobe.position.set(0, 0.9, -2.7);
  wardrobe.castShadow = true;
  wardrobe.receiveShadow = true;
  scene.add(wardrobe);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 1.6, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x9a6c44, roughness: 0.58 }),
  );
  door.position.set(-0.3, 0.9, -2.45);
  door.castShadow = true;
  door.receiveShadow = true;
  door.userData.interactiveId = 'wardrobe.door';
  scene.add(door);

  const interactiveMeshes = [door];
  const interactiveById = new Map();
  const item = {
    id: 'wardrobe.door',
    label: '衣柜门',
    target: 0,
    open: false,
    mesh: door,
  };
  interactiveById.set(item.id, item);

  const cameraHome = {
    position: new THREE.Vector3(0, 1.7, 2.2),
    yaw: 0,
    pitch: -0.02,
    fov: 70,
  };

  function toggleInteractive(id) {
    const target = interactiveById.get(id);
    if (!target) return null;
    target.target = target.target > 0.5 ? 0 : 1;
    target.open = target.target > 0.5;
    renderer.shadowMap.needsUpdate = true;
    return target;
  }

  function setInteractive(id, open) {
    const target = interactiveById.get(id);
    if (!target) return null;
    target.target = open ? 1 : 0;
    target.open = Boolean(open);
    renderer.shadowMap.needsUpdate = true;
    return target;
  }

  function update(dt) {
    for (const entry of interactiveById.values()) {
      const closedX = -0.3;
      const openX = 0.36;
      const targetX = entry.target > 0.5 ? openX : closedX;
      entry.mesh.position.x += (targetX - entry.mesh.position.x) * Math.min(1, dt * 10);
    }
  }

  return {
    title: '宿舍',
    eyebrow: 'ADV · DORM',
    scene,
    cameraHome,
    interactiveMeshes,
    interactiveById,
    update,
    toggleInteractive,
    setInteractive,
    getInteractiveState: () => Array.from(interactiveById.values()).map(({ id, label, target, open, locked }) => ({ id, label, target, open, locked })),
  };
}
