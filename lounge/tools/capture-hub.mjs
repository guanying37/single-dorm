import fs from 'node:fs/promises';

/* 同页预览（六场景 hub）里的休息厅最终截图。
 * 用法：node tools/capture-hub.mjs [cdpPort]
 * 需要已开启远程调试的可见 Edge（默认 9224）。 */

const cdpPort = process.argv[2] ?? process.env.CDP_PORT ?? '9224';

const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
if (!target) {
  console.error('No 127.0.0.1:8123 page found');
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
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
errors.length = 0;
await call('Page.navigate', {
  url: `http://127.0.0.1:8123/?capture=1&hud=0&scene=lounge&v=${Date.now()}`,
});

let ready = false;
for (let attempt = 0; attempt < 80; attempt += 1) {
  await sleep(500);
  ready = await evaluate("Boolean(window.__PREVIEW_READY__ && window.__PREVIEW__.getScene() === 'lounge')").catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.error('hub preview did not become ready', errors);
  process.exit(3);
}
await sleep(1500);

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

const outDir = new URL('../preview/final/', import.meta.url);
await fs.mkdir(outDir, { recursive: true });

const setView = (view) =>
  evaluate(
    `window.__PREVIEW__.setView({ x: ${view.x}, z: ${view.z}, yaw: ${view.yaw} * Math.PI / 180, pitch: ${view.pitch} * Math.PI / 180 })`,
  );

const stats = [];
for (const view of views) {
  await setView(view);
  await sleep(700);
  const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(new URL(`${view.name}.png`, outDir), Buffer.from(shot.data, 'base64'));
  const snapshot = await evaluate(`(() => {
    const s = window.__PREVIEW__.getStats();
    return { calls: s.renderer.calls, triangles: s.renderer.triangles, fps: Math.round(s.fps) };
  })()`);
  stats.push({ name: view.name, ...snapshot });
  console.log(view.name, snapshot);
}

/* 大门全开 */
await evaluate("(() => { window.__PREVIEW__.lounge.setInteractive('door.main', true); return true; })()");
await setView({ x: -10.4, z: 0.35, yaw: 90, pitch: 2 });
await sleep(700);
let shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.writeFile(new URL('door-open.png', outDir), Buffer.from(shot.data, 'base64'));
await evaluate("(() => { window.__PREVIEW__.lounge.setInteractive('door.main', false); return true; })()");

/* 宿管检测机刷卡反馈 */
await setView({ x: -11.2, z: -2.2, yaw: -10, pitch: 2 });
await sleep(400);
await evaluate("(() => { window.__PREVIEW__.toggle('reader.male'); return true; })()");
await sleep(180);
shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.writeFile(new URL('reader-flash.png', outDir), Buffer.from(shot.data, 'base64'));

/* 带 HUD 的同页切换图 */
await evaluate("document.body.classList.remove('hud-hidden')");
await setView({ x: -10.6, z: 0.7, yaw: -87.5, pitch: -1.2 });
await sleep(900);
shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.writeFile(new URL('hero-ui.png', outDir), Buffer.from(shot.data, 'base64'));

console.log('STATS', JSON.stringify(stats, null, 2));
console.log('ERRORS', errors);
ws.close();
process.exit(errors.length === 0 ? 0 : 1);
