import fs from 'node:fs/promises';

/* Deterministic screenshot pass for the documentation images.
 * Launches the page in capture mode (preserveDrawingBuffer, fixed DPR),
 * hides the HUD for the clean shots and frames the authored views. */

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
await call('Emulation.setDeviceMetricsOverride', {
  width: 1600,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await call('Page.bringToFront');
await call('Page.navigate', {
  url: `http://127.0.0.1:8123/?capture=1&scene=kitchen&hud=0&v=${Date.now()}`,
});

let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  await sleep(700);
  ready = await evaluate(
    'Boolean(window.__PREVIEW_READY__ && window.__PREVIEW__ && window.__PREVIEW__.getScene() === "kitchen")',
  ).catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('Kitchen preview did not become ready');
  process.exit(3);
}
await sleep(2200);

const views = [
  { name: 'hero', x: 2.4, z: 4.0, yaw: 0.32, pitch: -0.03 },
  { name: 'island', x: 2.7, z: 2.1, yaw: 0.86, pitch: -0.12 },
  { name: 'island-top', x: 1.8, z: 1.4, yaw: 0.82, pitch: -0.34 },
  { name: 'cooking', x: -0.6, z: -8.2, yaw: 0.04, pitch: 0.02 },
  { name: 'wash', x: 0.0, z: 7.8, yaw: Math.PI, pitch: -0.02 },
  { name: 'pass', x: 3.2, z: 5.5, yaw: -Math.PI / 2, pitch: 0.02 },
  { name: 'return-door', x: 4.2, z: -7.0, yaw: -Math.PI / 2, pitch: 0.01 },
  { name: 'cold-room', x: 3.0, z: -8.5, yaw: -0.57, pitch: 0.02 },
  { name: 'elevator', x: -4.5, z: 3.0, yaw: Math.PI / 2, pitch: 0.02 },
  { name: 'wall-crt', x: 0.0, z: 8.4, yaw: Math.PI, pitch: 0.14 },
  { name: 'floor-crt', x: 3.1, z: 6.4, yaw: -2.44, pitch: 0.05 },
  { name: 'ceiling', x: 0.0, z: 3.2, yaw: 0.0, pitch: 0.52 },
];

const outDir = new URL('../preview/final/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const stats = [];
for (const view of views) {
  await evaluate(`window.__PREVIEW__.setView(${JSON.stringify(view)})`);
  await sleep(2200);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const s = window.__PREVIEW__.getStats();
    return { calls: s.renderer.calls, triangles: s.renderer.triangles, quality: s.quality };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
}

// Mid-transition: fully black with the destination title.
await evaluate("window.__PREVIEW__.setScene('kitchen')");
await sleep(500);
await evaluate('window.__PREVIEW__.setView({x:4.5,z:-7,yaw:-Math.PI/2,pitch:0})');
await sleep(600);
await clickCenter();
await sleep(340);
const transitionShot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.writeFile(new URL('transition.png', outDir), Buffer.from(transitionShot.data, 'base64'));
await sleep(1800);

// One clean HUD shot for the integration documentation.
await evaluate("window.__PREVIEW__.setScene('kitchen')");
await sleep(500);
await evaluate("document.body.classList.remove('hud-hidden'); document.querySelector('.status-row').style.display='none'");
await evaluate('window.__PREVIEW__.setView({"x":2.4,"z":4,"yaw":0.32,"pitch":-0.03})');
await sleep(2200);
const hud = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.writeFile(new URL('hero-ui.png', outDir), Buffer.from(hud.data, 'base64'));

console.log('STATS', JSON.stringify(stats, null, 2));
console.log('ERRORS', errors);
ws.close();
