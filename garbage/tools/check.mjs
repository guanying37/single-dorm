import fs from 'node:fs/promises';

/* Acceptance pass for the standalone garbage-room preview.
 * Usage: node tools/check.mjs [port]
 * Reloads the page, checks console cleanliness, interactions, collision,
 * blind-spot geometry, performance and writes preview/check-report.json. */

const port = process.argv[2] ?? '9335';
const list = await (await fetch(`http://localhost:${port}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('garbage/standalone.html'));
if (!target) {
  console.error('No standalone garbage page');
  process.exit(2);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
  setTimeout(() => reject(new Error('ws timeout')), 8000);
});
let id = 1;
const pending = new Map();
const errors = [];
const warnings = [];
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    const text = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
    if (message.params.type === 'error') errors.push(text);
    if (message.params.type === 'warning') warnings.push(text);
  }
};
const call = (method, params = {}) => {
  const rid = id++;
  ws.send(JSON.stringify({ id: rid, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(rid, { resolve, reject });
    setTimeout(() => {
      if (!pending.has(rid)) return;
      pending.delete(rid);
      reject(new Error(`${method} timeout`));
    }, method === 'Page.captureScreenshot' ? 120000 : 60000);
  });
};
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
errors.length = 0;
warnings.length = 0;
await call('Page.reload', { ignoreCache: true });
let ready = false;
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__GARBAGE_READY__)').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('page did not become ready', errors, warnings);
  process.exit(3);
}
await sleep(2500);

const report = await evaluate(`(async () => {
  const p = window.__GARBAGE_PREVIEW__;
  const s = p.scene;
  const C = p.controls;
  const radius = C.radius;
  const boxes = s.collision.boxes;
  const out = {};

  const measureFps = () => new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames += 1;
      const span = performance.now() - start;
      if (span < 3000) requestAnimationFrame(tick);
      else resolve(Number((frames / (span / 1000)).toFixed(1)));
    };
    requestAnimationFrame(tick);
  });

  const penetration = (x, z) => {
    let worst = -1;
    let which = null;
    for (const box of boxes) {
      if (!box.active) continue;
      const cos = Math.cos(box.rot);
      const sin = Math.sin(box.rot);
      const dx = x - box.x;
      const dz = z - box.z;
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      const nx = Math.min(Math.max(lx, -box.hx), box.hx);
      const nz = Math.min(Math.max(lz, -box.hz), box.hz);
      const d = Math.hypot(lx - nx, lz - nz);
      const pen = radius - d;
      if (pen > worst) { worst = pen; which = box; }
    }
    return { pen: Number(worst.toFixed(4)), box: which ? { x: which.x, z: which.z, hx: which.hx, hz: which.hz } : null };
  };

  const drive = (from, waypoints, { run = true, maxSteps = 240 } = {}) => {
    C.setView({ x: from.x, z: from.z, yaw: from.yaw ?? 0, pitch: 0 });
    C.keys.clear();
    let steps = 0;
    let worst = 0;
    let worstBox = null;
    const samples = [];
    for (const target of waypoints) {
      let guard = 0;
      while (guard < maxSteps) {
        guard += 1;
        steps += 1;
        const dx = target.x - C.position.x;
        const dz = target.z - C.position.z;
        if (Math.hypot(dx, dz) < 0.06) break;
        C.yaw = Math.atan2(-dx, -dz);
        C.keys.add('KeyW');
        if (run) C.keys.add('Shift');
        C.update(1 / 60);
        const check = penetration(C.position.x, C.position.z);
        if (check.pen > worst) { worst = check.pen; worstBox = check.box; }
        if (steps % 20 === 0) samples.push({ x: Number(C.position.x.toFixed(2)), z: Number(C.position.z.toFixed(2)) });
      }
    }
    C.keys.clear();
    return { steps, worstPenetration: Number(worst.toFixed(4)), worstBox, samples };
  };

  out.start = C.getView();
  out.stats = p.getStats();
  out.interactives = s.getInteractiveState();
  out.blindSpot = s.probeBlindSpot();
  out.memory = { ...p.renderer.info.memory };

  // Route around the room at run speed.
  out.route = drive({ x: 0.62, z: 2.16, yaw: 0.1 }, [
    { x: 0.62, z: -1.4 },
    { x: -0.6, z: -1.2 },
    { x: -1.1, z: 0.3 },
    { x: -0.9, z: 1.7 },
    { x: 0.3, z: 1.7 },
    { x: 1.2, z: 1.2 },
    { x: 0.8, z: 0.1 },
    { x: 0.62, z: 2.16 },
  ]);

  // Deliberate pushes into the bins, walls and bag pile.
  out.impactBins = drive({ x: 0.2, z: -0.9, yaw: 0 }, [{ x: 2.6, z: -0.9 }], { run: true, maxSteps: 180 });
  out.impactNorthWall = drive({ x: 0.0, z: -1.0, yaw: 0 }, [{ x: 0.0, z: -3.4 }], { run: true, maxSteps: 180 });
  out.impactBags = drive({ x: -0.2, z: 1.4, yaw: 0 }, [{ x: -2.6, z: 1.4 }], { run: true, maxSteps: 180 });
  out.impactDoor = drive({ x: 0.6, z: 0.6, yaw: 0 }, [{ x: 0.6, z: 3.2 }], { run: true, maxSteps: 180 });
  out.afterImpacts = { x: Number(C.position.x.toFixed(2)), z: Number(C.position.z.toFixed(2)) };

  // Door: locked hook only.
  const doorItem = s.toggleInteractive('door.garbage');
  out.door = { locked: doorItem.locked, open: doorItem.open, sceneId: doorItem.sceneId };

  // Light switch off, wait, then back on.
  s.setInteractive('light.switch', false);
  await new Promise((r) => setTimeout(r, 900));
  out.lightOff = {
    lightOn: s.lightOn,
    level: Number(s.lightLevel.toFixed(2)),
    key: Number(s.lights.key.intensity.toFixed(2)),
    main: Number(s.lights.mainBulb.intensity.toFixed(2)),
    flicker: Number(s.lights.flickerTube.intensity.toFixed(2)),
  };
  s.setInteractive('light.switch', true);
  await new Promise((r) => setTimeout(r, 900));
  out.lightOn = {
    lightOn: s.lightOn,
    level: Number(s.lightLevel.toFixed(2)),
    key: Number(s.lights.key.intensity.toFixed(2)),
    main: Number(s.lights.mainBulb.intensity.toFixed(2)),
  };

  // Interactive bin lid opens and closes.
  s.setInteractive('bin.b', true);
  await new Promise((r) => setTimeout(r, 1600));
  const bin = s.bins.find((entry) => entry.config.interactive);
  out.binOpen = { open: s.binItem.open, angle: Number(bin.lidPivot.rotation.z.toFixed(2)) };
  s.setInteractive('bin.b', false);
  await new Promise((r) => setTimeout(r, 1600));
  out.binClosed = { open: s.binItem.open, angle: Number(bin.lidPivot.rotation.z.toFixed(2)) };

  // Idle frame rate at the hero view, no screenshots in flight.
  p.setView({ x: -1.7, z: -2.2, yaw: -2.3038, pitch: -0.1047 });
  await new Promise((r) => setTimeout(r, 700));
  out.fps = await measureFps();
  out.heroRender = { ...p.renderer.info.render };
  out.heroStats = s.getStats();
  return out;
})()`);

const result = {
  checkedAt: new Date().toISOString(),
  errors,
  warnings,
  ...report,
};
await fs.mkdir(new URL('../preview/', import.meta.url), { recursive: true });
await fs.writeFile(new URL('../preview/check-report.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
ws.close();
process.exit(errors.length ? 4 : 0);

