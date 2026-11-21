import fs from 'node:fs/promises';

/* Movement, collision, pitch/roll, bob and interaction test for the
 * reading room. Runs inside the live page through the exposed API, so it
 * exercises the same controller the player uses. */

const port = process.env.CDP_PORT ?? '9223';
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
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
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=readingroom&v=${Date.now()}` });
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(500);
  const ok = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ok) break;
}
const ready = await evaluate(
  '({ ready: Boolean(window.__PREVIEW_READY__), readingroom: Boolean(window.__READINGROOM_READY__), scene: window.__PREVIEW__?.getScene?.() })',
);
console.log('READY', ready);
if (!ready.ready || !ready.readingroom) process.exit(3);
if (ready.scene !== 'readingroom') await evaluate("window.__PREVIEW__.setScene('readingroom')");
await sleep(900);

// Real key events must feed the reading-room controller and not the others.
await key('keyDown', 'w', 'KeyW', 87);
await key('keyDown', 'Shift', 'ShiftLeft', 16);
const keysDown = await evaluate('Array.from(window.__PREVIEW__.readingroomControls.keys)');
const otherKeys = await evaluate(
  '({ kitchen: Array.from(window.__PREVIEW__.kitchenControls.keys), cold: Array.from(window.__PREVIEW__.coldStoreControls.keys), garbage: Array.from(window.__PREVIEW__.garbageControls.keys), enabled: window.__PREVIEW__.readingroomControls.enabled })',
);
await key('keyUp', 'w', 'KeyW', 87);
await key('keyUp', 'Shift', 'ShiftLeft', 16);
console.log('KEYS_DOWN', keysDown, otherKeys);
await sleep(250);

const result = await evaluate(`(() => {
  const preview = window.__PREVIEW__;
  const controls = preview.readingroomControls;
  const scene = preview.readingroom;
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

  const shot = (name) => ({ view: controls.getView(), penetration: penetration() });

  // 1. Start.
  controls.setView({ x: -1.45, z: 4.3, yaw: -0.08, pitch: -0.03 });
  out.start = { ...shot('start'), roll: preview.camera.rotation.z };

  // 2. Walk 1 s north up the west aisle.
  controls.setView({ x: -1.9, z: 3.4, yaw: 0, pitch: 0 });
  const before = { ...controls.getView() };
  const walk = frame(60, ['KeyW']);
  out.walk = { distance: Math.hypot(walk.x - before.x, walk.z - before.z), ...shot() };

  // 3. Run 1 s up the same lane.
  controls.setView({ x: -1.9, z: 3.4, yaw: 0, pitch: 0 });
  const beforeRun = { ...controls.getView() };
  const run = frame(60, ['KeyW'], true);
  out.run = { distance: Math.hypot(run.x - beforeRun.x, run.z - beforeRun.z), ...shot() };

  // 4. West shelf front, run west 3 s.
  controls.setView({ x: -1.4, z: -2.3, yaw: Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.westShelf = shot();

  // 5. East shelf front, run east 3 s.
  controls.setView({ x: 1.4, z: -2.3, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.eastShelf = shot();

  // 6. Window bench, run north 3 s.
  controls.setView({ x: -0.7, z: -3.3, yaw: 0, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.bench = shot();

  // 7. South door, run south 3 s.
  controls.setView({ x: -1.45, z: 3.5, yaw: Math.PI, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.door = shot();

  // 8. Reading table + chair, run east into the chair backs.
  controls.setView({ x: -1.5, z: 0.25, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.tableChair = shot();

  // 9. Stepladder, run west into it.
  controls.setView({ x: -1.45, z: 1.35, yaw: Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.ladder = shot();

  // 10. Globe corner, run east into the globe.
  controls.setView({ x: 0.9, z: -4.3, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.globe = shot();

  // 11. Coat rack corner, run west.
  controls.setView({ x: -1.7, z: 4.5, yaw: Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.coatRack = shot();

  // 12. Diagonal slide along the west shelf.
  controls.setView({ x: -1.9, z: 2.6, yaw: 0, pitch: 0 });
  frame(150, ['KeyW', 'KeyA'], true);
  out.diagonal = shot();

  // 13. Pitch clamp and zero roll.
  controls.setView({ x: -0.8, z: 1.4, yaw: 0, pitch: 12 });
  out.pitchHigh = { pitch: controls.pitch, roll: preview.camera.rotation.z };
  controls.setView({ x: -0.8, z: 1.4, yaw: 0, pitch: -12 });
  out.pitchLow = { pitch: controls.pitch, roll: preview.camera.rotation.z };

  // 14. Step bob: height stays near 1.80 and settles back.
  controls.setView({ x: -1.9, z: 3.4, yaw: 0, pitch: 0 });
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

  // 15. Mouse look.
  controls.setView({ x: -1.9, z: 2.0, yaw: 0, pitch: 0 });
  const yawBefore = controls.yaw;
  controls.look(140, -90, 0.0022);
  out.look = { yawDelta: controls.yaw - yawBefore, pitch: controls.pitch, roll: preview.camera.rotation.z };

  // 16. Interactions.
  const doorItem = scene.toggleInteractive('door.readingroom');
  out.doorItem = { id: doorItem.id, locked: doorItem.locked, sceneId: doorItem.sceneId };
  scene.setInteractive('ladder', true);
  for (let i = 0; i < 90; i += 1) scene.update(1 / 60, i / 60);
  out.ladderOpen = {
    open: scene.ladderItem.open,
    front: Number(scene.shelves.ladder.front.rotation.z.toFixed(3)),
    back: Number(scene.shelves.ladder.back.rotation.z.toFixed(3)),
  };
  scene.setInteractive('ladder', false);
  for (let i = 0; i < 120; i += 1) scene.update(1 / 60, 2 + i / 60);
  out.ladderClosed = {
    open: scene.ladderItem.open,
    front: Number(scene.shelves.ladder.front.rotation.z.toFixed(3)),
    back: Number(scene.shelves.ladder.back.rotation.z.toFixed(3)),
  };
  scene.toggleInteractive('light.switch');
  for (let i = 0; i < 150; i += 1) scene.update(1 / 60, 4 + i / 60);
  out.lightOff = {
    on: scene.lightOn,
    level: Number(scene.lightLevel.toFixed(4)),
    pendant: Number(scene.lights.pendants[0].intensity.toFixed(3)),
    key: Number(scene.lights.key.intensity.toFixed(3)),
  };
  scene.toggleInteractive('light.switch');
  for (let i = 0; i < 150; i += 1) scene.update(1 / 60, 7 + i / 60);
  out.lightOn = { on: scene.lightOn, level: Number(scene.lightLevel.toFixed(3)) };
  scene.toggleInteractive('lamp.tables');
  for (let i = 0; i < 150; i += 1) scene.update(1 / 60, 9 + i / 60);
  out.tableOff = {
    on: scene.tableLampsOn,
    level: Number(scene.tableLevel.toFixed(4)),
    point: Number(scene.lights.bankers[0].intensity.toFixed(3)),
  };
  scene.toggleInteractive('lamp.tables');
  for (let i = 0; i < 150; i += 1) scene.update(1 / 60, 12 + i / 60);
  out.tableOn = { on: scene.tableLampsOn, level: Number(scene.tableLevel.toFixed(3)) };

  // 17. Back to start.
  controls.setView({ x: -1.45, z: 4.3, yaw: -0.08, pitch: -0.03 });
  out.final = controls.getView();
  out.colliderCount = collision.boxes.length;
  out.sceneStats = scene.getStats();
  out.cameraNearFar = { near: preview.camera.near, far: preview.camera.far };
  return out;
})()`);
console.log('MOTION', JSON.stringify(result, null, 2));

const switching = await evaluate(`(async () => {
  const p = window.__PREVIEW__;
  const log = [];
  for (const name of ['dining', 'kitchen', 'coldstore', 'storage', 'garbage', 'lounge', 'dorm', 'readingroom']) {
    p.setScene(name);
    await new Promise((r) => setTimeout(r, 280));
    log.push({ wanted: name, got: p.getScene(), view: p.getView() });
  }
  return log;
})()`);
console.log('SWITCH', JSON.stringify(switching, null, 2));

const stats = await evaluate(`(() => {
  const p = window.__PREVIEW__;
  const s = p.getStats();
  return {
    calls: s.renderer.calls,
    triangles: s.renderer.triangles,
    textures: s.memory.textures,
    geometries: s.memory.geometries,
    fps: Math.round(s.fps),
    readingroom: s.readingroom,
  };
})()`);
console.log('STATS', JSON.stringify(stats, null, 2));
console.log('EVENTS', JSON.stringify(events));

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
