import fs from 'node:fs/promises';

/* Deterministic screenshot pass for the storage room.
 * Usage: node tools/capture.mjs [inspect|final]
 * Requires the preview page to be open in Edge with --remote-debugging-port=9222
 * and the local server on http://127.0.0.1:8123. */

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
await call('Page.navigate', { url: `http://127.0.0.1:8123/?capture=1&scene=storage&hud=0&v=${Date.now()}` });

let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  await sleep(600);
  ready = await evaluate(
    'Boolean(window.__PREVIEW_READY__ && window.__PREVIEW__.getScene() === "storage")',
  ).catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('Storage preview did not become ready');
  console.error(errors);
  process.exit(3);
}
await sleep(2200);

const views = [
  { name: 'hero', x: 0.3, z: 1.9, yaw: 0.03, pitch: -0.02 },
  { name: 'aisle', x: 0.42, z: 0.55, yaw: -0.05, pitch: -0.03 },
  { name: 'door', x: 0.3, z: 0.55, yaw: Math.PI, pitch: 0.02 },
  { name: 'vent', x: 0.3, z: 1.95, yaw: Math.PI, pitch: -0.18 },
  { name: 'shelf', x: 0.3, z: -0.25, yaw: 1.45, pitch: -0.06 },
  { name: 'tools', x: 0.12, z: 0.05, yaw: 1.2, pitch: -0.16 },
  { name: 'sacks', x: 0.15, z: -1.05, yaw: -0.6, pitch: -0.78 },
  { name: 'jacket', x: 0.2, z: 0.2, yaw: -1.35, pitch: 0.02 },
  { name: 'camera', x: 0.45, z: 0.75, yaw: -0.26, pitch: 0.2 },
  { name: 'ceiling', x: 0.2, z: 1.15, yaw: 0.02, pitch: 0.5 },
  { name: 'floor', x: 0.3, z: 1.55, yaw: 0.02, pitch: -0.62 },
  { name: 'drain', x: 0.35, z: 1.5, yaw: -0.45, pitch: -1.0 },
  { name: 'broom', x: 0.2, z: 1.95, yaw: -0.85, pitch: -0.42 },
  { name: 'cleaning', x: 0.05, z: 0.7, yaw: 3.8, pitch: -0.48 },
  { name: 'switch', x: 0.6, z: 1.7, yaw: Math.PI - 0.35, pitch: 0.0 },
  { name: 'ventview', x: 0.3, z: 1.85, yaw: Math.PI, pitch: -0.2 },
  { name: 'toolbox-open', x: 0.2, z: 0.9, yaw: -0.72, pitch: -0.62, open: 'toolbox' },
  { name: 'toolbox-close', x: 0.5, z: 0.65, yaw: -0.72, pitch: -0.72, open: 'toolbox' },
  { name: 'light-off', x: 0.3, z: 1.9, yaw: 0.03, pitch: -0.02, off: 'light.switch' },
];

const outDir = new URL(mode === 'final' ? '../preview/final/' : '../preview/inspect/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const stats = [];
for (const view of views) {
  if (view.open) {
    await evaluate(`(() => { const p = window.__PREVIEW__; const s = p.storage; void p.toggle(${JSON.stringify(view.open)}); s.clutter.toolbox.lid.rotation.z = 1.62; s.clutter.toolbox.tray.position.y = 0.075; return null; })()`);
  }
  if (view.off) await evaluate(`(() => { const p = window.__PREVIEW__; const s = p.storage; if (s.switchItem.open) void p.toggle('light.switch'); s.lightLevel = 0; s.update(0.016, performance.now() / 1000); return null; })()`);
  await evaluate(`window.__PREVIEW__.setView(${JSON.stringify(view)})`);
  await sleep(1500);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const s = window.__PREVIEW__.getStats();
    return { calls: s.renderer.calls, triangles: s.renderer.triangles, quality: s.quality };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
  if (view.open) {
    await evaluate(`(() => { const p = window.__PREVIEW__; const s = p.storage; void p.toggle(${JSON.stringify(view.open)}); s.clutter.toolbox.lid.rotation.z = 0; s.clutter.toolbox.tray.position.y = 0; return null; })()`);
  }
  if (view.off) await evaluate(`(() => { const p = window.__PREVIEW__; const s = p.storage; if (!s.switchItem.open) void p.toggle('light.switch'); s.lightLevel = 1; s.update(0.016, performance.now() / 1000); return null; })()`);
}

console.log('STATS', JSON.stringify(stats));
console.log('ERRORS', errors);

if (mode === 'final') {
  // A HUD shot in the real combined page.
  await evaluate("document.body.classList.remove('hud-hidden')");
  await evaluate('window.__PREVIEW__.setView({"x":0.3,"z":1.9,"yaw":0.03,"pitch":-0.02})');
  await sleep(1800);
  const hud = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL('../preview/final/hero-ui.png', import.meta.url), Buffer.from(hud.data, 'base64'));
  const hudState = await evaluate('({ scene: window.__PREVIEW__.getScene(), title: document.getElementById("sceneTitle").textContent, tabs: Array.from(document.querySelectorAll(".scene-tab")).map((t) => t.textContent) })');
  console.log('HUD', hudState);
}

ws.close();
