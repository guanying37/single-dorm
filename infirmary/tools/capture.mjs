import fs from 'node:fs/promises';

/* Deterministic screenshot pass for the infirmary standalone page.
 * Usage: node tools/capture.mjs [inspect|final]
 * Requires Edge with --remote-debugging-port=9222 and the local server on
 * http://127.0.0.1:8123. */

const mode = process.argv[2] ?? 'inspect';
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page');
if (!target) process.exit(2);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let id = 1;
const pending = new Map();
const errors = [];
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
    errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
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

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Network.clearBrowserCache');
await call('Emulation.setFocusEmulationEnabled', { enabled: true });
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
errors.length = 0;
await call('Page.navigate', { url: `http://127.0.0.1:8123/infirmary/standalone.html?capture=1&hud=0&v=${Date.now()}` });

let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('Infirmary preview did not become ready');
  console.error(errors);
  process.exit(3);
}
await sleep(1800);

const views = [
  { name: 'hero', x: 1.15, z: 3.48, yaw: 0, pitch: -0.02 },
  { name: 'hero-lower', x: 1.1, z: 3.2, yaw: 0.1, pitch: -0.12 },
  { name: 'beds', x: 0.55, z: 2.55, yaw: 1.18, pitch: -0.08 },
  { name: 'beds-north', x: 0.45, z: 0.3, yaw: 1.3, pitch: -0.1 },
  { name: 'cart', x: -0.05, z: 2.32, yaw: 1.5, pitch: -0.35 },
  { name: 'cabinet', x: 0.95, z: 1.3, yaw: -1.45, pitch: 0.02 },
  { name: 'cabinet-open', x: 0.95, z: 1.3, yaw: -1.45, pitch: 0.02, open: ['cabinet.glass', 'cabinet.drawer.1', 'cabinet.drawer.2', 'cabinet.drawer.3'] },
  { name: 'cabinet-low', x: 1.0, z: 1.3, yaw: -1.42, pitch: -0.3, open: ['cabinet.drawer.1', 'cabinet.drawer.2', 'cabinet.drawer.3'] },
  { name: 'sink', x: 1.05, z: 2.45, yaw: -2.18, pitch: -0.25 },
  { name: 'sink-close', x: 1.75, z: 2.95, yaw: -1.5, pitch: -0.3 },
  { name: 'sink-basin', x: 1.55, z: 3.35, yaw: -1.57, pitch: -0.55 },
  { name: 'mirror', x: 1.45, z: 3.5, yaw: -1.57, pitch: 0.02 },
  { name: 'op', x: 0.95, z: 0.9, yaw: 0.0, pitch: -0.22 },
  { name: 'op-side', x: 1.95, z: 0.55, yaw: 0.75, pitch: -0.28 },
  { name: 'tray', x: 1.0, z: -0.25, yaw: -0.45, pitch: -0.55 },
  { name: 'lamp', x: 0.95, z: 0.4, yaw: 0.0, pitch: 0.38 },
  { name: 'plant', x: -0.6, z: 2.7, yaw: 2.2, pitch: -0.16 },
  { name: 'plant-corner', x: -0.2, z: 2.3, yaw: 2.45, pitch: -0.22 },
  { name: 'north-wall', x: 1.0, z: -2.3, yaw: 0.0, pitch: 0.26 },
  { name: 'door', x: 1.15, z: 2.35, yaw: Math.PI, pitch: 0.0 },
  { name: 'ceiling', x: 0.4, z: 1.7, yaw: 0.1, pitch: 0.55 },
  { name: 'floor', x: 0.7, z: 1.6, yaw: 0.0, pitch: -0.62 },
  { name: 'curtain-closed', x: 0.65, z: 1.15, yaw: 1.15, pitch: -0.05, close: ['curtain.2', 'curtain.3'] },
  { name: 'curtain', x: 0.2, z: 0.35, yaw: 1.35, pitch: -0.02 },
  { name: 'waste-open', x: 1.0, z: 0.98, yaw: -1.42, pitch: -0.38, open: ['waste.bin'] },
];

const only = (process.argv[3] ?? '').split(',').filter(Boolean);
const outDir = new URL(mode === 'final' ? '../preview/' : '../preview/inspect/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const stats = [];
for (const view of views) {
  if (only.length && !only.includes(view.name)) continue;
  if (view.open) {
    for (const entry of view.open) {
      await evaluate(`(() => { window.__PREVIEW__.setInteractive(${JSON.stringify(entry)}, true); return null; })()`);
    }
  }
  if (view.close) {
    for (const entry of view.close) {
      await evaluate(`(() => { window.__PREVIEW__.setInteractive(${JSON.stringify(entry)}, false); return null; })()`);
    }
  }
  await evaluate(`window.__PREVIEW__.setView(${JSON.stringify(view)})`);
  await sleep(1300);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const s = window.__PREVIEW__.getStats();
    return { calls: s.renderer.calls, triangles: s.renderer.triangles };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
  if (view.open) {
    for (const entry of view.open) {
      await evaluate(`(() => { window.__PREVIEW__.setInteractive(${JSON.stringify(entry)}, false); return null; })()`);
    }
  }
  if (view.close) {
    for (const entry of view.close) {
      await evaluate(`(() => { window.__PREVIEW__.setInteractive(${JSON.stringify(entry)}, true); return null; })()`);
    }
  }
}

console.log('STATS', JSON.stringify(stats));
console.log('ERRORS', errors);

if (mode === 'final') {
  await evaluate("document.body.classList.remove('hud-hidden')");
  await evaluate('window.__PREVIEW__.setView({"x":1.15,"z":3.48,"yaw":0,"pitch":-0.02})');
  await sleep(1600);
  const hud = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL('../preview/hero-ui.png', import.meta.url), Buffer.from(hud.data, 'base64'));
}

ws.close();
