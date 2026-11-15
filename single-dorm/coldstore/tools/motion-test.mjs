/* Movement, collision, look and portal test for the cold store.
 * Runs entirely inside the live page through the exposed preview API so
 * it exercises exactly the same controller the player uses. */

const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
if (!target) process.exit(2);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let id = 1;
const pending = new Map();
const events = [];
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
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
await call('Page.bringToFront');
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=coldstore&v=${Date.now()}` });
for (let attempt = 0; attempt < 50; attempt += 1) {
  await sleep(700);
  const ok = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ok) break;
}

const ready = await evaluate(
  '({ ready: Boolean(window.__PREVIEW_READY__), cold: Boolean(window.__COLDSTORE_READY__), kitchen: Boolean(window.__KITCHEN_READY__), scene: window.__PREVIEW__?.getScene?.() })',
);
console.log('READY', ready);
if (!ready.ready || !ready.cold) process.exit(3);
if (ready.scene !== 'coldstore') await evaluate("window.__PREVIEW__.setScene('coldstore')");
await sleep(800);

// Real key events must feed the cold-store controller and not the others.
await key('keyDown', 'w', 'KeyW', 87);
await key('keyDown', 'Shift', 'ShiftLeft', 16);
const keysDown = await evaluate('Array.from(window.__PREVIEW__.coldStoreControls.keys)');
const otherKeys = await evaluate(
  '({ kitchen: Array.from(window.__PREVIEW__.kitchenControls.keys), coldEnabled: window.__PREVIEW__.coldStoreControls.enabled })',
);
await key('keyUp', 'w', 'KeyW', 87);
await key('keyUp', 'Shift', 'ShiftLeft', 16);
console.log('KEYS_DOWN', keysDown, otherKeys);
await sleep(300);

const result = await evaluate(`(() => {
  const preview = window.__PREVIEW__;
  const controls = preview.coldStoreControls;
  const collision = preview.coldstore.collision;
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
  controls.setView({ x: 0.26, z: 2.3, yaw: 0, pitch: -0.02 });
  out.start = { view: controls.getView(), penetration: penetration(), roll: preview.camera.rotation.z };

  // 2. Walk 1 s straight up the aisle.
  controls.setView({ x: 0.2, z: 2.2, yaw: 0, pitch: 0 });
  const before = { ...controls.getView() };
  const walk = frame(60, ['KeyW']);
  out.walk = { distance: Math.hypot(walk.x - before.x, walk.z - before.z), view: walk, penetration: penetration() };

  // 3. Run 1 s up the same lane (stops before the garment rack).
  controls.setView({ x: 0.2, z: 2.2, yaw: 0, pitch: 0 });
  const beforeRun = { ...controls.getView() };
  const run = frame(60, ['KeyW'], true);
  out.run = { distance: Math.hypot(run.x - beforeRun.x, run.z - beforeRun.z), view: run, penetration: penetration() };

  // 4. East shelf front edge: run straight into the rack for 3 s.
  controls.setView({ x: 0, z: 0.0, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.eastShelf = { view: controls.getView(), penetration: penetration() };

  // 5. West shelf front edge: run straight into the rack for 3 s.
  controls.setView({ x: 0, z: 0.0, yaw: Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.westShelf = { view: controls.getView(), penetration: penetration() };

  // 6. Cold door: run south into the leaf for 3 s.
  controls.setView({ x: 0.3, z: 1.6, yaw: Math.PI, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.door = { view: controls.getView(), penetration: penetration() };

  // 7. CRT corner: run south-west into the monitor shelf.
  controls.setView({ x: -0.6, z: 1.5, yaw: Math.PI - 0.5, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.crt = { view: controls.getView(), penetration: penetration() };

  // 8. Aisle end: walk north into the hanging garments.
  controls.setView({ x: 0, z: -1.2, yaw: 0, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.garments = { view: controls.getView(), penetration: penetration() };

  // 9. Diagonal strafe into the shelf corner (should slide, never stick).
  controls.setView({ x: 0, z: 1.2, yaw: 0, pitch: 0 });
  frame(150, ['KeyW', 'KeyD'], true);
  out.diagonal = { view: controls.getView(), penetration: penetration() };

  // 10. Pitch clamp and zero roll.
  controls.setView({ x: 0.2, z: 1.0, yaw: 0, pitch: 12 });
  out.pitchHigh = controls.pitch;
  out.pitchHighRoll = preview.camera.rotation.z;
  controls.setView({ x: 0.2, z: 1.0, yaw: 0, pitch: -12 });
  out.pitchLow = controls.pitch;
  out.pitchLowRoll = preview.camera.rotation.z;

  // 11. Step bob: height must stay near 1.80 and settle back.
  controls.setView({ x: 0.2, z: 2.0, yaw: 0, pitch: 0 });
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
  controls.setView({ x: 0.2, z: 1.0, yaw: 0.0, pitch: 0.0 });
  const yawBefore = controls.yaw;
  controls.look(140, -90, 0.0022);
  out.look = { yawDelta: controls.yaw - yawBefore, pitch: controls.pitch, roll: preview.camera.rotation.z };

  // 13. Portals: both doors must resolve to the other scene.
  const coldItem = preview.coldstore.toggleInteractive('door.kitchen');
  const kitchenItem = preview.kitchen.toggleInteractive('door.coldstore');
  out.portals = {
    coldStore: coldItem ? { id: coldItem.id, sceneId: coldItem.sceneId, portal: coldItem.portal } : null,
    kitchen: kitchenItem ? { id: kitchenItem.id, sceneId: kitchenItem.sceneId, portal: kitchenItem.portal } : null,
    coldInteractiveCount: preview.coldstore.getInteractiveState().length,
    kitchenInteractiveIds: preview.kitchen.getInteractiveState().map((item) => item.id),
  };

  // 14. Back to start.
  controls.setView({ x: 0.26, z: 2.3, yaw: 0.06, pitch: -0.02 });
  out.final = controls.getView();
  out.colliderCount = collision.boxes.length;
  out.bounds = preview.coldstore.getStats();
  return out;
})()`);

console.log('MOTION', JSON.stringify(result, null, 2));

// 15. Tab switching from the hub: every scene must come back without error.
const switching = await evaluate(`(async () => {
  const p = window.__PREVIEW__;
  const log = [];
  for (const name of ['kitchen', 'dining', 'dorm', 'coldstore', 'kitchen', 'coldstore']) {
    p.setScene(name);
    await new Promise((r) => setTimeout(r, 260));
    log.push({ wanted: name, got: p.getScene(), view: p.getView() });
  }
  return log;
})()`);
console.log('SWITCH', JSON.stringify(switching, null, 2));

console.log('EVENTS', events);
ws.close();
