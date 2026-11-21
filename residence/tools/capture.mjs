import fs from 'node:fs/promises';

/* 确定性截图：连接已开启远程调试的 Edge，按预设机位抓取住宿区。
 * 用法：node tools/capture.mjs [inspect|final] [cdpPort] */

const mode = process.argv[2] ?? 'inspect';
const cdpPort = process.argv[3] ?? process.env.CDP_PORT ?? '9222';
const shotWidth = Number(process.env.SHOT_W ?? (mode === 'final' ? 1600 : 1280));
const shotHeight = Number(process.env.SHOT_H ?? (mode === 'final' ? 900 : 720));
const onlyViews = process.env.VIEWS ? process.env.VIEWS.split(',') : null;

const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
if (!target) {
  console.error('No 127.0.0.1:8123 page found in Edge');
  process.exit(2);
}
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
await call('Emulation.setDeviceMetricsOverride', { width: shotWidth, height: shotHeight, deviceScaleFactor: 1, mobile: false });
await call('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
await call('Page.bringToFront');
await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
try {
  const { windowId } = await call('Browser.getWindowForTarget', { targetId: target.id });
  await call('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } });
  await call('Browser.setWindowBounds', { windowId, bounds: { left: 80, top: 60, width: shotWidth + 80, height: shotHeight + 120 } });
} catch {
  // 窗口控制失败时仍可继续。
}
errors.length = 0;
await call('Page.navigate', {
  url: `http://127.0.0.1:8123/residence/standalone.html?capture=1&hud=0&v=${Date.now()}`,
});
await call('Page.bringToFront').catch(() => {});
await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
await call('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});

let ready = false;
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__RESIDENCE_READY__)').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('Residence preview did not become ready');
  console.error(errors);
  process.exit(3);
}
await sleep(1600);

const views = [
  { name: 'hero', x: 5.6, z: 7.1, yaw: -90, pitch: -1.2 },
  { name: 'north-corridor', x: 12.0, z: 7.1, yaw: -90, pitch: -1.2 },
  { name: 'lounge-portal', x: 10.2, z: 6.06, yaw: 180, pitch: -3 },
  { name: 'male-facilities', x: 10.8, z: 7.1, yaw: 90, pitch: -3 },
  { name: 'male-shower-door', x: 2.5, z: 6.9, yaw: 180, pitch: -4 },
  { name: 'male-wc-door', x: 7.14, z: 6.9, yaw: 180, pitch: -4 },
  { name: 'female-facilities', x: 10.8, z: 23.3, yaw: 90, pitch: -3 },
  { name: 'gate', x: 50.7, z: 12.2, yaw: 180, pitch: -3 },
  { name: 'east-corridor', x: 50.7, z: 9.6, yaw: 180, pitch: -1.5 },
  { name: 'lift', x: 50.7, z: 18.65, yaw: -90, pitch: -2 },
  { name: 'south-corridor', x: 30.0, z: 23.3, yaw: 90, pitch: -1.2 },
  { name: 'stair', x: 54.0, z: 25.35, yaw: 180, pitch: -40 },
  { name: 'storage', x: 54.0, z: 7.4, yaw: 0, pitch: -2 },
];
const outDir = new URL(mode === 'final' ? '../preview/final/' : '../preview/inspect/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const stats = [];
for (const view of (onlyViews ? views.filter((entry) => onlyViews.includes(entry.name)) : views)) {
  await evaluate(
    `window.__RESIDENCE__.setView({ x: ${view.x}, z: ${view.z}, yaw: ${view.yaw} * Math.PI / 180, pitch: ${view.pitch} * Math.PI / 180 })`,
  );
  await sleep(900);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const s = window.__RESIDENCE__.getStats();
    return { calls: s.renderer.calls, triangles: s.renderer.triangles, quality: s.quality };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
}

const extras = [
  {
    name: 'gate-open-detail',
    before: "(() => { window.__RESIDENCE__.tablet.unlock(); window.__RESIDENCE__.residence.setInteractive('gate.iron', true); return true; })()",
    view: { x: 50.7, z: 14.2, yaw: 180, pitch: -4 },
    after: "(() => { window.__RESIDENCE__.residence.setInteractive('gate.iron', false); return true; })()",
  },
  {
    name: 'gate-locked',
    before: "(() => { window.__RESIDENCE__.tablet.lock(); return true; })()",
    view: { x: 50.7, z: 13.3, yaw: 180, pitch: -4 },
    after: "(() => { window.__RESIDENCE__.tablet.unlock(); return true; })()",
  },
];

for (const extra of extras) {
  if (extra.before) await evaluate(extra.before);
  if (onlyViews && !onlyViews.includes(extra.name)) {
    if (extra.after) await evaluate(extra.after);
    continue;
  }
  await evaluate(
    `window.__RESIDENCE__.setView({ x: ${extra.view.x}, z: ${extra.view.z}, yaw: ${extra.view.yaw} * Math.PI / 180, pitch: ${extra.view.pitch} * Math.PI / 180 })`,
  );
  await sleep(900);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${extra.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  if (extra.after) await evaluate(extra.after);
  console.log(extra.name, 'captured');
}

console.log('STATS', JSON.stringify(stats, null, 2));
console.log('ERRORS', errors);
ws.close();
