import fs from 'node:fs/promises';

/* Movement, collision, interaction and vent-sightline test for the storage
 * room. Runs inside the live page through the exposed preview API, so it
 * exercises the same controller the player uses. */

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
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=storage&v=${Date.now()}` });
for (let attempt = 0; attempt < 60; attempt += 1) {
  await sleep(600);
  const ok = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ok) break;
}
const ready = await evaluate(
  '({ ready: Boolean(window.__PREVIEW_READY__), storage: Boolean(window.__STORAGE_READY__), scene: window.__PREVIEW__?.getScene?.() })',
);
console.log('READY', ready);
if (!ready.ready || !ready.storage) process.exit(3);
if (ready.scene !== 'storage') await evaluate("window.__PREVIEW__.setScene('storage')");
await sleep(800);

// Real key events must feed the storage controller and not the others.
await key('keyDown', 'w', 'KeyW', 87);
await key('keyDown', 'Shift', 'ShiftLeft', 16);
const keysDown = await evaluate('Array.from(window.__PREVIEW__.storageControls.keys)');
const otherKeys = await evaluate(
  '({ kitchen: Array.from(window.__PREVIEW__.kitchenControls.keys), cold: Array.from(window.__PREVIEW__.coldStoreControls.keys), enabled: window.__PREVIEW__.storageControls.enabled })',
);
await key('keyUp', 'w', 'KeyW', 87);
await key('keyUp', 'Shift', 'ShiftLeft', 16);
console.log('KEYS_DOWN', keysDown, otherKeys);
await sleep(200);

const result = await evaluate(`(() => {
  const preview = window.__PREVIEW__;
  const controls = preview.storageControls;
  const scene = preview.storage;
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

  // 1. Start: free, eye height 1.80, zero roll.
  controls.setView({ x: 0.3, z: 1.9, yaw: 0.03, pitch: -0.02 });
  out.start = { view: controls.getView(), penetration: penetration(), roll: preview.camera.rotation.z };

  // 2. Walk 1 s up the aisle.
  controls.setView({ x: 0.3, z: 1.9, yaw: 0, pitch: 0 });
  const before = { ...controls.getView() };
  const walk = frame(60, ['KeyW']);
  out.walk = { distance: Math.hypot(walk.x - before.x, walk.z - before.z), view: walk, penetration: penetration() };

  // 3. Run 1 s up the same lane.
  controls.setView({ x: 0.3, z: 1.9, yaw: 0, pitch: 0 });
  const beforeRun = { ...controls.getView() };
  const run = frame(60, ['KeyW'], true);
  out.run = { distance: Math.hypot(run.x - beforeRun.x, run.z - beforeRun.z), view: run, penetration: penetration() };

  // 4. West shelf front: run straight into the rack for 3 s.
  controls.setView({ x: 0.2, z: 0.0, yaw: Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.westShelf = { view: controls.getView(), penetration: penetration() };

  // 5. East box stack: run into it from the aisle.
  controls.setView({ x: 0.2, z: 0.18, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.eastStack = { view: controls.getView(), penetration: penetration() };

  // 6. Door: run south into the closed leaf for 3 s.
  controls.setView({ x: 0.3, z: 1.2, yaw: Math.PI, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.door = { view: controls.getView(), penetration: penetration() };

  // 7. North-west corner: run north into the dead end.
  controls.setView({ x: 0.2, z: -0.8, yaw: 0, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.northEnd = { view: controls.getView(), penetration: penetration() };

  // 8. Sacks corner: run north-east into the sack pile.
  controls.setView({ x: 0.4, z: -0.8, yaw: -0.7, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.sacks = { view: controls.getView(), penetration: penetration() };

  // 9. Diagonal slide along the shelf.
  controls.setView({ x: 0.2, z: 1.0, yaw: 0, pitch: 0 });
  frame(150, ['KeyW', 'KeyA'], true);
  out.diagonal = { view: controls.getView(), penetration: penetration() };

  // 10. Pitch clamp and zero roll.
  controls.setView({ x: 0.2, z: 1.0, yaw: 0, pitch: 12 });
  out.pitchHigh = { pitch: controls.pitch, roll: preview.camera.rotation.z };
  controls.setView({ x: 0.2, z: 1.0, yaw: 0, pitch: -12 });
  out.pitchLow = { pitch: controls.pitch, roll: preview.camera.rotation.z };

  // 11. Step bob: height must stay near 1.80 and settle back.
  controls.setView({ x: 0.3, z: 1.9, yaw: 0, pitch: 0 });
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

  // 12. Mouse look through the hub path.
  controls.setView({ x: 0.3, z: 1.2, yaw: 0.0, pitch: 0.0 });
  const yawBefore = controls.yaw;
  controls.look(140, -90, 0.0022);
  out.look = { yawDelta: controls.yaw - yawBefore, pitch: controls.pitch, roll: preview.camera.rotation.z };

  // 13. Interactions: locked door, toolbox lid + tray, light switch.
  const doorItem = scene.toggleInteractive('door.storage');
  out.doorItem = { id: doorItem.id, locked: doorItem.locked, sceneId: doorItem.sceneId };
  scene.toggleInteractive('toolbox');
  for (let i = 0; i < 90; i += 1) scene.update(1 / 60, i / 60);
  out.toolboxOpen = {
    open: scene.toolboxItem.open,
    lid: Number(scene.clutter.toolbox.lid.rotation.z.toFixed(3)),
    trayY: Number(scene.clutter.toolbox.tray.position.y.toFixed(3)),
  };
  scene.toggleInteractive('toolbox');
  for (let i = 0; i < 120; i += 1) scene.update(1 / 60, 2 + i / 60);
  out.toolboxClosed = {
    open: scene.toolboxItem.open,
    lid: Number(scene.clutter.toolbox.lid.rotation.z.toFixed(3)),
    trayY: Number(scene.clutter.toolbox.tray.position.y.toFixed(3)),
  };
  scene.toggleInteractive('light.switch');
  for (let i = 0; i < 150; i += 1) scene.update(1 / 60, 4 + i / 60);
  out.lightOff = {
    on: scene.lightOn,
    level: Number(scene.lightLevel.toFixed(4)),
    bulb: Number(scene.lights.bulb.intensity.toFixed(3)),
    key: Number(scene.lights.key.intensity.toFixed(3)),
  };
  scene.toggleInteractive('light.switch');
  for (let i = 0; i < 150; i += 1) scene.update(1 / 60, 7 + i / 60);
  out.lightOn = { on: scene.lightOn, level: Number(scene.lightLevel.toFixed(3)) };

  // 14. Vent sightline probes.
  out.vent = scene.probeVent();

  // 15. Back to start.
  controls.setView({ x: 0.3, z: 1.9, yaw: 0.03, pitch: -0.02 });
  out.final = controls.getView();
  out.colliderCount = collision.boxes.length;
  out.sceneStats = scene.getStats();
  return out;
})()`);

console.log('MOTION', JSON.stringify(result, null, 2));

const switching = await evaluate(`(async () => {
  const p = window.__PREVIEW__;
  const log = [];
  for (const name of ['dining', 'kitchen', 'coldstore', 'storage', 'dorm', 'storage']) {
    p.setScene(name);
    await new Promise((r) => setTimeout(r, 260));
    log.push({ wanted: name, got: p.getScene(), view: p.getView() });
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
    fps: null,
    fpsNote: 'headless rAF is throttled; use tools/gpu-check.mjs with a visible Edge window',
    storage: s.storage,
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
