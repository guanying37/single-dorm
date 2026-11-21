import fs from 'node:fs/promises';

/* One-shot view capture for iteration.
 *
 * Usage:
 *   node readingroom/tools/shot.mjs <name> <x> <z> <yaw> <pitch> [state]
 *   state: comma list like ladder:on,switch:off,lamp:off
 * Env: CDP_PORT (9223), WIDTH (1280), HEIGHT (720) */

const [name = 'shot', xs = '-1.45', zs = '4.3', yaws = '-0.08', pitchs = '-0.03', stateArg = ''] = process.argv.slice(2);
const port = process.env.CDP_PORT ?? '9223';
const width = Number(process.env.WIDTH ?? 1280);
const height = Number(process.env.HEIGHT ?? 720);
const x = Number(xs);
const z = Number(zs);
const yaw = Number(yaws);
const pitch = Number(pitchs);

const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page');
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ' ' + (result.exceptionDetails.exception?.description ?? ''));
  return result.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await call('Runtime.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Emulation.setFocusEmulationEnabled', { enabled: true });
await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
await call('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
await call('Page.navigate', { url: `http://127.0.0.1:8123/?capture=1&scene=readingroom&hud=0&v=${Date.now()}` });
const waitReady = async () => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await sleep(400);
    const ok = await evaluate('Boolean(window.__PREVIEW_READY__ && window.__PREVIEW__.getScene() === "readingroom")').catch(() => false);
    if (ok) return true;
  }
  return false;
};
let ready = await waitReady();
if (!ready) {
  // A covered/minimised window can suspend rAF before boot; reload once in the foreground.
  await call('Page.bringToFront');
  await sleep(600);
  await call('Page.reload', { ignoreCache: true });
  ready = await waitReady();
}
if (!ready) {
  console.error('not ready', errors);
  process.exit(3);
}
const states = stateArg
  .split(',')
  .filter(Boolean)
  .map((entry) => entry.split(':'));
if (states.length) {
  for (const [key, value] of states) {
    const map = { ladder: 'ladder', switch: 'light.switch', lamp: 'lamp.tables' };
    const interactiveId = map[key] ?? key;
    await evaluate(`(() => { window.__PREVIEW__.readingroom.setInteractive(${JSON.stringify(interactiveId)}, ${value !== 'off'}); return null; })()`);
  }
  await sleep(2200);
}
await evaluate(`window.__PREVIEW__.setView(${JSON.stringify({ x, z, yaw, pitch })})`);
await sleep(1200);
const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.mkdir(new URL('../preview/inspect/', import.meta.url), { recursive: true });
await fs.writeFile(new URL(`../preview/inspect/${name}.png`, import.meta.url), Buffer.from(shot.data, 'base64'));
const snapshot = await evaluate(`(() => {
  const p = window.__PREVIEW__;
  const s = p.getStats();
  return { view: p.getView(), calls: s.calls, triangles: s.triangles, fps: s.fps };
})()`);
console.log(name, JSON.stringify(snapshot));
console.log('errors', JSON.stringify(errors));
ws.close();
