import fs from 'node:fs/promises';

/* Movement, collision, interaction and switching test for the infirmary.
 * Runs inside the live combined page through the preview API, so it uses
 * the same controller, collision world and interaction path as a player. */

const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page');
if (!target) process.exit(2);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let id = 1;
const pending = new Map();
let events = [];
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    events.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    events.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
  }
});
const call = (method, params = {}) => {
  const rid = id++;
  ws.send(JSON.stringify({ id: rid, method, params }));
  return new Promise((resolve, reject) => pending.set(rid, { resolve, reject }));
};
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const key = async (type, keyName, code, vk) => {
  await call('Input.dispatchKeyEvent', {
    type,
    key: keyName,
    code,
    windowsVirtualKeyCode: vk,
    nativeVirtualKeyCode: vk,
  });
};

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Network.clearBrowserCache');
await call('Emulation.setFocusEmulationEnabled', { enabled: true });
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
events = [];
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=infirmary&v=${Date.now()}` });
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(600);
  const ok = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ok) break;
}
const ready = await evaluate(
  '({ ready: Boolean(window.__PREVIEW_READY__), infirmary: Boolean(window.__INFIRMARY_READY__), scene: window.__PREVIEW__?.getScene?.() })',
);
console.log('READY', ready);
if (!ready.ready || !ready.infirmary) process.exit(3);
if (ready.scene !== 'infirmary') await evaluate("window.__PREVIEW__.setScene('infirmary')");
await sleep(900);

// Real key events must feed only the infirmary controller.
await key('keyDown', 'w', 'KeyW', 87);
await key('keyDown', 'Shift', 'ShiftLeft', 16);
const keysDown = await evaluate('Array.from(window.__PREVIEW__.infirmaryControls.keys)');
const otherKeys = await evaluate(
  `(() => {
    const p = window.__PREVIEW__;
    return {
      kitchen: Array.from(p.kitchenControls.keys),
      storage: Array.from(p.storageControls.keys),
      lounge: Array.from(p.loungeControls.keys),
      enabled: p.infirmaryControls.enabled,
    };
  })()`,
);
await key('keyUp', 'w', 'KeyW', 87);
await key('keyUp', 'Shift', 'ShiftLeft', 16);
console.log('KEYS_DOWN', keysDown, otherKeys);
await sleep(200);

const result = await evaluate(`(() => {
  const preview = window.__PREVIEW__;
  const controls = preview.infirmaryControls;
  const scene = preview.infirmary;
  const collision = scene.collision;
  const out = {};

  const frame = (count, keys, shift = false) => {
    controls.keys.clear();
    for (const k of keys) controls.keys.add(k);
    if (shift) controls.keys.add('Shift');
    for (let i = 0; i < count; i += 1) controls.update(1 / 60);
    controls.keys.clear();
    return controls.getView();
  };

  const penetration = () => {
    let worst = 0;
    const radius = controls.radius;
    for (const box of collision.boxes) {
      if (!box.active) continue;
      const cos = Math.cos(box.rot);
      const sin = Math.sin(box.rot);
      const dx = controls.position.x - box.x;
      const dz = controls.position.z - box.z;
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      const nx = Math.min(box.hx, Math.max(-box.hx, lx));
      const nz = Math.min(box.hz, Math.max(-box.hz, lz));
      const dist = Math.hypot(lx - nx, lz - nz);
      if (dist < radius - 0.0005) worst = Math.max(worst, radius - dist);
    }
    return worst;
  };

  // 1. Start: eye height 1.80, no roll, free.
  controls.setView({ x: 1.15, z: 3.48, yaw: 0, pitch: -0.02 });
  out.start = { view: controls.getView(), penetration: penetration(), roll: preview.camera.rotation.z };

  // 2. Walk north down the treatment aisle.
  controls.setView({ x: 1.15, z: 3.48, yaw: 0, pitch: 0 });
  const before = { ...controls.getView() };
  const walk = frame(60, ['KeyW']);
  out.walk = { distance: Math.hypot(walk.x - before.x, walk.z - before.z), view: walk, penetration: penetration() };

  // 3. Run north down the same lane.
  controls.setView({ x: 1.15, z: 3.48, yaw: 0, pitch: 0 });
  const beforeRun = { ...controls.getView() };
  const run = frame(60, ['KeyW'], true);
  out.run = { distance: Math.hypot(run.x - beforeRun.x, run.z - beforeRun.z), view: run, penetration: penetration() };

  // 4. West into the bed row.
  controls.setView({ x: 0.55, z: 1.5, yaw: Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.bed = { view: controls.getView(), penetration: penetration() };

  // 5. East into the medicine cabinet (approach from its north side,
  // clear of the doctor's stool).
  controls.setView({ x: 1.45, z: 0.8, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.cabinet = { view: controls.getView(), penetration: penetration() };

  // 6. East into the hand basin.
  controls.setView({ x: 1.1, z: 3.34, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.sink = { view: controls.getView(), penetration: penetration() };

  // 7. North into the operating table.
  controls.setView({ x: 0.95, z: 0.55, yaw: 0, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.opTable = { view: controls.getView(), penetration: penetration() };

  // 8. South into the closed door / wall.
  controls.setView({ x: 1.15, z: 2.4, yaw: Math.PI, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.door = { view: controls.getView(), penetration: penetration() };

  // 9. North-west corner behind the beds.
  controls.setView({ x: 0.2, z: 0.2, yaw: Math.PI / 4, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.northWest = { view: controls.getView(), penetration: penetration() };

  // 10. Diagonal slide along the bed row.
  controls.setView({ x: 0.6, z: 2.6, yaw: 0, pitch: 0 });
  frame(150, ['KeyW', 'KeyA'], true);
  out.diagonal = { view: controls.getView(), penetration: penetration() };

  // 11. Pitch clamp and zero roll.
  controls.setView({ x: 1.15, z: 2.6, yaw: 0, pitch: 12 });
  out.pitchHigh = { pitch: controls.pitch, roll: preview.camera.rotation.z };
  controls.setView({ x: 1.15, z: 2.6, yaw: 0, pitch: -12 });
  out.pitchLow = { pitch: controls.pitch, roll: preview.camera.rotation.z };

  // 12. Step bob.
  controls.setView({ x: 1.15, z: 3.48, yaw: 0, pitch: 0 });
  controls.bobAmount = 0;
  controls.bobOffset = 0;
  controls.lateral = 0;
  controls.keys.clear();
  controls.keys.add('KeyW');
  let minY = Infinity;
  let maxY = -Infinity;
  let maxRoll = 0;
  for (let i = 0; i < 90; i += 1) {
    controls.update(1 / 60);
    minY = Math.min(minY, preview.camera.position.y);
    maxY = Math.max(maxY, preview.camera.position.y);
    maxRoll = Math.max(maxRoll, Math.abs(preview.camera.rotation.z));
  }
  out.bob = { minY, maxY, range: maxY - minY, maxRoll };
  controls.keys.clear();
  for (let i = 0; i < 150; i += 1) controls.update(1 / 60);
  out.bobSettle = { y: preview.camera.position.y, roll: preview.camera.rotation.z };

  // 13. Mouse look.
  controls.setView({ x: 1.15, z: 2.6, yaw: 0, pitch: 0 });
  const yawBefore = controls.yaw;
  controls.look(140, -90, 0.0022);
  out.look = { yawDelta: controls.yaw - yawBefore, pitch: controls.pitch, roll: preview.camera.rotation.z };

  // 14. Interactions.
  const doorItem = scene.toggleInteractive('door.infirmary');
  out.doorItem = { id: doorItem.id, locked: doorItem.locked, sceneId: doorItem.sceneId };

  const curtainBefore = scene.curtains[1].panels[0].mesh.scale.x;
  scene.toggleInteractive('curtain.2');
  for (let i = 0; i < 100; i += 1) scene.update(1 / 60, i / 60);
  out.curtainClosed = {
    open: scene.curtains[1].open,
    scaleBefore: Number(curtainBefore.toFixed(3)),
    scaleAfter: Number(scene.curtains[1].panels[0].mesh.scale.x.toFixed(3)),
    x: Number(scene.curtains[1].panels[0].mesh.position.x.toFixed(3)),
  };
  scene.toggleInteractive('curtain.2');
  for (let i = 0; i < 100; i += 1) scene.update(1 / 60, 2 + i / 60);
  out.curtainOpen = {
    open: scene.curtains[1].open,
    scale: Number(scene.curtains[1].panels[0].mesh.scale.x.toFixed(3)),
    x: Number(scene.curtains[1].panels[0].mesh.position.x.toFixed(3)),
  };

  scene.toggleInteractive('cabinet.glass');
  scene.toggleInteractive('cabinet.drawer.1');
  scene.toggleInteractive('cabinet.drawer.2');
  scene.toggleInteractive('cabinet.drawer.3');
  for (let i = 0; i < 120; i += 1) scene.update(1 / 60, 4 + i / 60);
  out.cabinetOpen = {
    glass: scene.glassItem.open,
    glassZ: Number(scene.furniture.cabinet.panelA.position.z.toFixed(3)),
    drawers: scene.drawerItems.map((item) => item.open),
    drawerX: scene.furniture.cabinet.drawers.map((d) => Number(d.position.x.toFixed(3))),
  };

  scene.toggleInteractive('waste.bin');
  for (let i = 0; i < 100; i += 1) scene.update(1 / 60, 7 + i / 60);
  out.wasteOpen = {
    open: scene.wasteItem.open,
    lid: Number(scene.furniture.waste.lidGroup.rotation.x.toFixed(3)),
  };

  // 15. Mirror reflection is baked.
  out.mirror = {
    hasEnvMap: Boolean(scene.room.mirrorMesh?.material?.envMap),
    target: Boolean(scene.mirrorTarget),
  };

  // 16. Restore and report.
  controls.setView({ x: 1.15, z: 3.48, yaw: 0, pitch: -0.02 });
  out.final = controls.getView();
  out.colliderCount = collision.boxes.length;
  out.sceneStats = scene.getStats();
  return out;
})()`);

console.log('MOTION', JSON.stringify(result, null, 2));

const switching = await evaluate(`(async () => {
  const p = window.__PREVIEW__;
  const log = [];
  for (const name of ['dining', 'garbage', 'readingroom', 'lounge', 'infirmary']) {
    p.setScene(name);
    await new Promise((r) => setTimeout(r, 300));
    log.push({ wanted: name, got: p.getScene(), view: p.getView(), title: document.getElementById('sceneTitle')?.textContent });
  }
  return log;
})()`);
console.log('SWITCH', JSON.stringify(switching, null, 2));

const stats = await evaluate(`(() => {
  const s = window.__PREVIEW__.getStats();
  return {
    calls: s.renderer.calls,
    triangles: s.renderer.triangles,
    textures: s.memory.textures,
    geometries: s.memory.geometries,
    fps: Math.round(s.fps),
    infirmary: s.infirmary,
  };
})()`);
console.log('STATS', JSON.stringify(stats, null, 2));
console.log('EVENTS', events);

const report = {
  generatedAt: new Date().toISOString(),
  ready,
  keysDown,
  otherKeys,
  motion: result,
  switching,
  stats,
  events,
};
await fs.mkdir(new URL('../preview/', import.meta.url), { recursive: true });
await fs.writeFile(new URL('../preview/motion-report.json', import.meta.url), JSON.stringify(report, null, 2));
ws.close();
