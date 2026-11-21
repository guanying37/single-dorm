import fs from 'node:fs/promises';

/* Deterministic screenshot pass for the reading room.
 *
 * Usage: node readingroom/tools/capture.mjs [inspect|final]
 * Needs the local server on http://127.0.0.1:8123 and an Edge/Chromium
 * with --remote-debugging-port (CDP_PORT, default 9223).
 */

const mode = process.argv[2] ?? 'inspect';
const port = process.env.CDP_PORT ?? '9223';
const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page');
if (!target) throw new Error('no page target');
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
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text + ' ' + (result.exceptionDetails.exception?.description ?? ''));
  }
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
await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
errors.length = 0;
await call('Page.navigate', { url: `http://127.0.0.1:8123/?capture=1&scene=readingroom&hud=0&v=${Date.now()}` });

let ready = false;
for (let attempt = 0; attempt < 120; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__PREVIEW_READY__ && window.__PREVIEW__.getScene() === "readingroom")').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('Reading-room preview did not become ready');
  console.error(errors);
  process.exit(3);
}
await sleep(2000);

const views = [
  { name: 'hero', x: -1.45, z: 4.3, yaw: -0.08, pitch: -0.03 },
  { name: 'tables', x: -1.95, z: 1.25, yaw: -0.95, pitch: -0.12 },
  { name: 'window', x: -0.35, z: -2.55, yaw: 0.06, pitch: -0.05 },
  { name: 'bench', x: -0.7, z: -3.5, yaw: 0.0, pitch: -0.12 },
  { name: 'globe', x: 0.6, z: -2.6, yaw: -0.8, pitch: -0.16 },
  { name: 'shelf-west', x: -1.55, z: -2.3, yaw: 1.46, pitch: -0.04 },
  { name: 'books', x: -2.05, z: -0.45, yaw: 1.4, pitch: -0.02 },
  { name: 'ladder', x: -1.55, z: 1.35, yaw: 1.5, pitch: -0.16 },
  { name: 'ladder-open', x: -1.55, z: 1.35, yaw: 1.5, pitch: -0.16, state: [['ladder', true]] },
  { name: 'monitor', x: 1.15, z: 3.25, yaw: -2.52, pitch: 0.42 },
  { name: 'camera', x: -0.4, z: 3.2, yaw: 3.05, pitch: 0.4 },
  { name: 'door', x: -1.35, z: 2.6, yaw: Math.PI, pitch: 0.01 },
  { name: 'coatrack', x: -1.9, z: 3.85, yaw: 2.22, pitch: -0.12 },
  { name: 'lamp-close', x: -1.25, z: 0.25, yaw: -1.02, pitch: -0.42 },
  { name: 'ceiling', x: 0.4, z: 2.55, yaw: 0.06, pitch: 0.86 },
  { name: 'floor', x: -0.5, z: 1.2, yaw: 0.2, pitch: -0.92 },
  { name: 'lamps-off', x: -1.45, z: 4.3, yaw: -0.08, pitch: -0.03, state: [['light.switch', false], ['lamp.tables', false]] },
  { name: 'bankers-only', x: -1.45, z: 4.3, yaw: -0.08, pitch: -0.03, state: [['light.switch', false], ['lamp.tables', true]] },
];

const outDir = new URL(mode === 'final' ? '../preview/final/' : '../preview/inspect/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const setState = async (state) => {
  if (!state) return;
  for (const [id, value] of state) {
    await evaluate(`(() => { window.__PREVIEW__.readingroom.setInteractive(${JSON.stringify(id)}, ${value}); return null; })()`);
  }
  await sleep(1800);
};

const stats = [];
for (const view of views) {
  await setState(view.state);
  await evaluate(`window.__PREVIEW__.setView(${JSON.stringify({ x: view.x, z: view.z, yaw: view.yaw, pitch: view.pitch })})`);
  await sleep(1400);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const p = window.__PREVIEW__;
    const s = p.getStats();
    return { view: p.getView(), calls: s.calls, triangles: s.triangles, quality: s.quality, fps: s.fps };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, JSON.stringify(snapshot));
  // Reset state between views so the next shot starts from the default.
  if (view.state) {
    await evaluate("(() => { const r = window.__PREVIEW__.readingroom; r.setInteractive('light.switch', true); r.setInteractive('lamp.tables', true); r.setInteractive('ladder', false); return null; })()");
    await sleep(1400);
  }
}

console.log('ERRORS', JSON.stringify(errors));

if (mode === 'final') {
  await evaluate("document.body.classList.remove('hud-hidden')");
  await evaluate('window.__PREVIEW__.setView({"x":-1.45,"z":4.3,"yaw":-0.08,"pitch":-0.03})');
  await sleep(2000);
  const hud = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL('../preview/final/hero-ui.png', import.meta.url), Buffer.from(hud.data, 'base64'));
  const hudState = await evaluate('({ scene: window.__PREVIEW__.getScene(), title: document.getElementById("sceneTitle").textContent, tabs: Array.from(document.querySelectorAll(".scene-tab")).map((t) => t.textContent) })');
  console.log('HUD', JSON.stringify(hudState));
}

console.log('STATS', JSON.stringify(stats));
ws.close();

