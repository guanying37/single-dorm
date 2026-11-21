import fs from 'node:fs/promises';

/* 确定性截图：连接已开启远程调试的 Edge，按预设机位抓取休息厅。
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
await call('Page.bringToFront');
errors.length = 0;
await call('Page.navigate', {
  url: `http://127.0.0.1:8123/lounge/standalone.html?capture=1&hud=0&v=${Date.now()}`,
});

let ready = false;
for (let attempt = 0; attempt < 60; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__LOUNGE_READY__)').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('Lounge preview did not become ready');
  console.error(errors);
  process.exit(3);
}
await sleep(1600);

const views = [
  { name: 'hero', x: -10.6, z: 0.7, yaw: -87.5, pitch: -1.2 },
  { name: 'entry', x: -14.6, z: 0, yaw: -90, pitch: 0 },
  { name: 'table', x: -5.4, z: 1.3, yaw: -80, pitch: -24 },
  { name: 'tabletop', x: -2.4, z: 1.2, yaw: -72, pitch: -34 },
  { name: 'door-main', x: -9.6, z: 0.4, yaw: 90, pitch: 2 },
  { name: 'reader', x: -11.2, z: -2.2, yaw: -10, pitch: 2 },
  { name: 'sofa', x: -3.2, z: 1.4, yaw: 168, pitch: -4 },
  { name: 'ceiling', x: -6.2, z: 0.4, yaw: -86, pitch: 28 },
  { name: 'clock', x: 8.6, z: 0.9, yaw: -90, pitch: 6 },
  { name: 'east', x: 13.6, z: 0, yaw: -90, pitch: 0 },
  { name: 'west-side', x: 6.4, z: 0.6, yaw: 92, pitch: -2 },
];

const outDir = new URL(mode === 'final' ? '../preview/final/' : '../preview/inspect/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const stats = [];
for (const view of (onlyViews ? views.filter((entry) => onlyViews.includes(entry.name)) : views)) {
  await evaluate(
    `window.__LOUNGE__.setView({ x: ${view.x}, z: ${view.z}, yaw: ${view.yaw} * Math.PI / 180, pitch: ${view.pitch} * Math.PI / 180 })`,
  );
  await sleep(900);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const s = window.__LOUNGE__.getStats();
    return { calls: s.renderer.calls, triangles: s.renderer.triangles, quality: s.quality };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
}

/* 附加状态图：大门全开、检测机刷卡反馈。 */
const extras = [
  {
    name: 'door-open',
    before: "(() => { window.__LOUNGE__.lounge.setInteractive('door.main', true); return true; })()",
    view: { x: -10.4, z: 0.35, yaw: 90, pitch: 2 },
    after: "(() => { window.__LOUNGE__.lounge.setInteractive('door.main', false); return true; })()",
  },
  {
    name: 'reader-flash',
    before: "(() => { window.__LOUNGE__.toggle('reader.male'); return true; })()",
    view: { x: -11.2, z: -2.2, yaw: -10, pitch: 2 },
    after: null,
  },
];

for (const extra of extras) {
  if (onlyViews && !onlyViews.includes(extra.name)) continue;
  await evaluate(extra.before);
  await evaluate(
    `window.__LOUNGE__.setView({ x: ${extra.view.x}, z: ${extra.view.z}, yaw: ${extra.view.yaw} * Math.PI / 180, pitch: ${extra.view.pitch} * Math.PI / 180 })`,
  );
  await sleep(800);
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${extra.name}.png`, outDir), Buffer.from(result.data, 'base64'));
  if (extra.after) await evaluate(extra.after);
  console.log(extra.name, 'captured');
}

console.log('STATS', JSON.stringify(stats, null, 2));
console.log('ERRORS', errors);
ws.close();
