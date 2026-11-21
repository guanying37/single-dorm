import fs from 'node:fs/promises';

/* Final deterministic screenshot pass for the garbage room.
 * Usage: node tools/capture.mjs [port]
 * Writes 1600×900 PNGs to preview/final/. Convert with Pillow afterwards. */

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
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
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
    }, method === 'Page.captureScreenshot' ? 180000 : 60000);
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
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(500);
  if (await evaluate('Boolean(window.__GARBAGE_READY__)').catch(() => false)) break;
}
await sleep(2000);

const views = [
  { name: 'hero', x: -1.7, z: -2.2, yaw: -132, pitch: -6, wait: 1800 },
  { name: 'bins', x: 0.35, z: 0.6, yaw: -58, pitch: -9, wait: 1600 },
  { name: 'rack', x: 0.35, z: -0.9, yaw: 25, pitch: 6, wait: 1600 },
  { name: 'camera', x: -0.55, z: -1.25, yaw: 35, pitch: 8, wait: 1600 },
  { name: 'door', x: 0.3, z: -0.4, yaw: 179, pitch: -4, wait: 1600 },
  { name: 'sign', x: 1.02, z: 1.94, yaw: 196, pitch: -1, wait: 1600 },
  { name: 'bags', x: -0.1, z: 0.9, yaw: 121, pitch: -20, wait: 1600 },
  { name: 'puddle', x: -0.6, z: 1.3, yaw: 41, pitch: -35, wait: 1600 },
  { name: 'floor', x: 0.5, z: 1.55, yaw: 8, pitch: -46, wait: 1600 },
  { name: 'ceiling', x: -0.1, z: 0.9, yaw: 4, pitch: 46, wait: 1600 },
  { name: 'bin-open', x: 0.0, z: 1.16, yaw: -62, pitch: -13, wait: 2200, binOpen: true },
  { name: 'light-off', x: -1.7, z: -2.2, yaw: -132, pitch: -6, wait: 2200, lightOff: true },
  { name: 'hero-ui', x: -1.7, z: -2.2, yaw: -132, pitch: -6, wait: 1800, hud: true },
];

const outDir = new URL('../preview/final/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });
const stats = [];
const reset = async () => {
  await evaluate(`(() => {
    const p = window.__GARBAGE_PREVIEW__;
    if (!p.scene.lightOn) p.scene.setInteractive('light.switch', true);
    p.scene.setInteractive('bin.b', false);
    p.scene.lightLevel = 1;
    document.getElementById('hud')?.classList.add('is-hidden');
    return true;
  })()`);
  await sleep(500);
};

for (const view of views) {
  await reset();
  if (view.lightOff) {
    await evaluate(`(() => {
      const p = window.__GARBAGE_PREVIEW__;
      p.scene.setInteractive('light.switch', false);
      p.scene.lightLevel = 0;
      return p.scene.lightOn;
    })()`);
    await sleep(900);
  }
  if (view.binOpen) {
    await evaluate("(() => { window.__GARBAGE_PREVIEW__.setInteractive('bin.b', true); return true; })()");
    await sleep(1700);
  }
  if (view.hud) {
    await evaluate("document.getElementById('hud').classList.remove('is-hidden')");
  }
  await evaluate(`window.__GARBAGE_PREVIEW__.setView(${JSON.stringify({
    x: view.x,
    z: view.z,
    yaw: (view.yaw * Math.PI) / 180,
    pitch: (view.pitch * Math.PI) / 180,
  })})`);
  await sleep(view.wait ?? 1500);
  const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(shot.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const p = window.__GARBAGE_PREVIEW__;
    return { calls: p.renderer.info.render.calls, triangles: p.renderer.info.render.triangles, fps: p.getStats().fps };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
}

console.log('STATS', JSON.stringify(stats));
console.log('ERRORS', JSON.stringify(errors));
ws.close();
process.exit(errors.length ? 4 : 0);
