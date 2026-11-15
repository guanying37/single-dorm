import fs from 'node:fs/promises';

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
await call('Page.bringToFront');
await call('Page.reload', { ignoreCache: true });
await sleep(9000);

const ready = await evaluate('({ready: Boolean(window.__PREVIEW_READY__), kitchen: Boolean(window.__KITCHEN_READY__), scene: window.__PREVIEW__?.getScene?.()})');
console.log('READY', ready);
if (!ready.ready) process.exit(3);
if (ready.scene !== 'kitchen') await evaluate("window.__PREVIEW__.setScene('kitchen')");
await sleep(1200);

// Verify that the real keydown/keyup handlers feed the kitchen controller.
await key('keyDown', 'w', 'KeyW', 87);
await key('keyDown', 'Shift', 'ShiftLeft', 16);
const keysDown = await evaluate("Array.from(window.__PREVIEW__.kitchenControls.keys)");
console.log('KEYS_DOWN', keysDown);
await key('keyUp', 'w', 'KeyW', 87);
await key('keyUp', 'Shift', 'ShiftLeft', 16);
const keysUp = await evaluate("Array.from(window.__PREVIEW__.kitchenControls.keys)");
console.log('KEYS_UP', keysUp);

const result = await evaluate(`(() => {
  const preview = window.__PREVIEW__;
  const controls = preview.kitchenControls;
  const collision = preview.kitchen.collision;
  const out = {};

  const frame = (count, keys, shift = false) => {
    controls.keys.clear();
    for (const k of keys) controls.keys.add(k);
    if (shift) controls.keys.add('Shift');
    for (let i = 0; i < count; i += 1) controls.update(1 / 60);
    const view = controls.getView();
    controls.keys.clear();
    return view;
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
      const ox = lx - nx;
      const oz = lz - nz;
      const dist = Math.hypot(ox, oz);
      if (dist < radius - 0.0005) worst = Math.max(worst, radius - dist);
    }
    return worst;
  };

  // 1. Start position: free, eye height 1.80 m, no roll.
  controls.setView({ x: 2.4, z: 4.0, yaw: 0.32, pitch: -0.03 });
  out.start = { view: controls.getView(), penetration: penetration(), roll: preview.camera.rotation.z };

  // 2. Walk forward for 1.0 s in a clear north-south lane.
  controls.setView({ x: 3.2, z: 9.5, yaw: 0, pitch: 0 });
  const before = { ...controls.getView() };
  const walk = frame(60, ['KeyW']);
  out.walkDistance = Math.hypot(walk.x - before.x, walk.z - before.z);
  out.walk = { ...walk, penetration: penetration() };

  // 3. Run forward for 1.0 s from the same clear lane.
  controls.setView({ x: 3.2, z: 9.5, yaw: 0, pitch: 0 });
  const beforeRun = { ...controls.getView() };
  const run = frame(60, ['KeyW'], true);
  out.runDistance = Math.hypot(run.x - beforeRun.x, run.z - beforeRun.z);
  out.run = { ...run, penetration: penetration() };

  // 4. Island east edge, walk straight west for 2 s.
  controls.setView({ x: 3.6, z: 0, yaw: Math.PI / 2, pitch: 0 });
  frame(120, ['KeyW']);
  out.island = { view: controls.getView(), penetration: penetration() };

  // 5. Wok range front edge, run straight north for 3 s.
  controls.setView({ x: -3.2, z: -7.0, yaw: 0, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.range = { view: controls.getView(), penetration: penetration() };

  // 6. Sink front edge, walk south for 3 s.
  controls.setView({ x: -3.2, z: 6.0, yaw: Math.PI, pitch: 0 });
  frame(180, ['KeyW']);
  out.sink = { view: controls.getView(), penetration: penetration() };

  // 7. Wall collision: run east into the return-door wall for 3 s.
  controls.setView({ x: 3.0, z: 1.0, yaw: -Math.PI / 2, pitch: 0 });
  frame(180, ['KeyW'], true);
  out.wall = { view: controls.getView(), penetration: penetration() };

  // 8. Pitch clamp and zero roll.
  controls.setView({ x: 2.4, z: 4.0, yaw: 0, pitch: 12 });
  out.pitchHigh = controls.pitch;
  controls.setView({ x: 2.4, z: 4.0, yaw: 0, pitch: -12 });
  out.pitchLow = controls.pitch;
  out.rollAfterPitch = preview.camera.rotation.z;

  // 9. Head bob: walk 1.2 s and sample eye heights, then stop and settle.
  controls.setView({ x: 3.2, z: 9.5, yaw: 0, pitch: 0 });
  controls.bobAmount = 0;
  controls.bobOffset = 0;
  controls.lateral = 0;
  controls.keys.clear();
  controls.keys.add('KeyW');
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < 72; i += 1) {
    controls.update(1 / 60);
    const y = preview.camera.position.y;
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  out.bob = { minY, maxY, range: maxY - minY, roll: preview.camera.rotation.z };
  controls.keys.clear();
  for (let i = 0; i < 120; i += 1) controls.update(1 / 60);
  out.bobSettle = { y: preview.camera.position.y, roll: preview.camera.rotation.z };

  // 10. Mouse look through the same controller (hub uses this path).
  controls.setView({ x: 2.4, z: 4.0, yaw: 0.32, pitch: -0.03 });
  const yawBefore = controls.yaw;
  controls.look(120, -80, 0.0022);
  out.look = {
    yawDelta: controls.yaw - yawBefore,
    pitch: controls.pitch,
    roll: preview.camera.rotation.z,
  };

  // 11. Return to start.
  controls.setView({ x: 2.4, z: 4.0, yaw: 0.32, pitch: -0.03 });
  out.final = controls.getView();
  out.colliderCount = collision.boxes.length;
  return out;
})()`);

console.log('MOTION', JSON.stringify(result, null, 2));
console.log('EVENTS', events);
const screenshot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.writeFile(new URL('./last-motion.png', import.meta.url), Buffer.from(screenshot.data, 'base64'));
ws.close();
