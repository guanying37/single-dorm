import fs from 'node:fs/promises';

/* Deterministic screenshot pass for the cold store.
 * Usage: node tools/capture.mjs [inspect|final]
 * Requires the preview page to be open in Edge with --remote-debugging-port=9222
 * and the local server on http://127.0.0.1:8123. */

const mode = process.argv[2] ?? 'inspect';
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
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
const clickCenter = async () => {
  const center = await evaluate('({ x: innerWidth / 2, y: innerHeight / 2 })');
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: center.x, y: center.y, button: 'left', clickCount: 1 });
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: center.x, y: center.y, button: 'left', clickCount: 1 });
};

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Network.clearBrowserCache');
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
await call('Page.navigate', { url: `http://127.0.0.1:8123/?capture=1&scene=coldstore&hud=0&v=${Date.now()}` });

let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  await sleep(600);
  ready = await evaluate(
    'Boolean(window.__PREVIEW_READY__ && window.__PREVIEW__.getScene() === "coldstore")',
  ).catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('Cold store preview did not become ready');
  console.error(errors);
  process.exit(3);
}
await sleep(2200);

const views = [
  { name: 'hero', x: 0.26, z: 2.3, yaw: 0.06, pitch: -0.02 },
  { name: 'aisle', x: 0.05, z: 0.55, yaw: 0.0, pitch: -0.04 },
  { name: 'door', x: 0.0, z: 0.35, yaw: Math.PI + 0.04, pitch: 0.0 },
  { name: 'monitor', x: -0.25, z: 0.9, yaw: 2.75, pitch: 0.0 },
  { name: 'shelf-west', x: 0.28, z: -0.15, yaw: 1.35, pitch: -0.04 },
  { name: 'shelf-east', x: -0.25, z: 0.35, yaw: -1.35, pitch: -0.06 },
  { name: 'evaporator', x: 0.24, z: -1.0, yaw: 0.42, pitch: 0.34 },
  { name: 'ceiling', x: 0.0, z: 0.7, yaw: 0.0, pitch: 0.5 },
  { name: 'coats', x: 0.0, z: -1.15, yaw: 0.0, pitch: 0.05 },
  { name: 'floor', x: 0.0, z: 1.3, yaw: 0.0, pitch: -0.55 },
  { name: 'camera', x: 0.1, z: 1.0, yaw: 2.57, pitch: 0.32 },
];

const outDir = new URL(mode === 'final' ? '../preview/final/' : '../preview/inspect/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const stats = [];
for (const view of views) {
  await evaluate(`window.__PREVIEW__.setView(${JSON.stringify(view)})`);
  await sleep(1600);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const s = window.__PREVIEW__.getStats();
    return { calls: s.renderer.calls, triangles: s.renderer.triangles, quality: s.quality };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
}

if (mode === 'final') {
  // The bidirectional door transition, captured mid-fade.
  await evaluate("window.__PREVIEW__.setScene('coldstore')");
  await sleep(400);
  await evaluate('window.__PREVIEW__.setView({x:0.42,z:1.35,yaw:Math.PI,pitch:0})');
  await sleep(700);
  await clickCenter();
  await sleep(330);
  const mid = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL('transition.png', outDir), Buffer.from(mid.data, 'base64'));
  await sleep(2200);
  const arrived = await evaluate('({ scene: window.__PREVIEW__.getScene(), view: window.__PREVIEW__.getView() })');
  console.log('ARRIVED', arrived);

  // HUD shot in the actual four-tab page.
  await evaluate("window.__PREVIEW__.setScene('coldstore')");
  await sleep(500);
  await evaluate("document.body.classList.remove('hud-hidden')");
  await evaluate('window.__PREVIEW__.setView({"x":0.26,"z":2.3,"yaw":0.06,"pitch":-0.02})');
  await sleep(1800);
  const hud = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL('hero-ui.png', outDir), Buffer.from(hud.data, 'base64'));
}

console.log('STATS', JSON.stringify(stats, null, 2));
console.log('ERRORS', errors);
ws.close();
