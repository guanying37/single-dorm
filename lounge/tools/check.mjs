import fs from 'node:fs/promises';

/* 连接已开启远程调试的 Edge，检查休息厅预览页是否有报错，并截一张图。
 * 用法：node tools/check.mjs [url] [screenshot] */

const urlArg = process.argv[2] ?? 'http://127.0.0.1:8123/lounge/standalone.html?capture=1&hud=0';
const shotArg = process.argv[3] ?? '../preview/_debug/check.png';
const cdpPort = process.env.CDP_PORT ?? '9222';

const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
if (!target) {
  console.error('No 127.0.0.1:8123 page found in Edge');
  process.exit(2);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let nextId = 1;
const pending = new Map();
const errors = [];
const logs = [];

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
  if (message.method === 'Runtime.consoleAPICalled') {
    const text = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
    if (message.params.type === 'error') errors.push(text);
    else logs.push(`${message.params.type}: ${text}`);
  }
  if (message.method === 'Log.entryAdded') {
    const entry = message.params.entry;
    if (entry.level === 'error') errors.push(`${entry.source}: ${entry.text}`);
  }
});

const call = (method, params = {}) => {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await call('Runtime.enable');
await call('Log.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
errors.length = 0;
logs.length = 0;
const [baseUrl, hashPart] = urlArg.split('#');
const cacheBusted = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}v=${Date.now()}${hashPart ? `#${hashPart}` : ''}`;
await call('Page.navigate', { url: cacheBusted });

let ready = false;
for (let attempt = 0; attempt < 40; attempt += 1) {
  await sleep(500);
  ready = await evaluate("Boolean(window.__LOUNGE_READY__)").catch(() => false);
  if (ready) break;
}
await sleep(1800);

const stats = ready
  ? await evaluate(`(() => {
      const api = window.__LOUNGE__ || window.__PREVIEW__;
      if (!api) return null;
      const s = api.getStats();
      return {
        scene: s.scene ?? 'lounge',
        calls: s.renderer?.calls ?? s.calls,
        triangles: s.renderer?.triangles ?? s.triangles,
        textures: s.memory?.textures ?? s.textures,
        fps: Math.round(s.fps ?? 0),
        batches: s.batches,
        loungeTriangles: s.triangles,
        clock: s.clock,
      };
    })()`)
  : null;

const out = new URL(shotArg, import.meta.url);
await fs.mkdir(new URL('.', out), { recursive: true });
const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await fs.writeFile(out, Buffer.from(shot.data, 'base64'));

console.log('READY', ready);
console.log('STATS', JSON.stringify(stats, null, 2));
console.log('ERRORS', JSON.stringify(errors, null, 2));
if (logs.length) console.log('LOGS', JSON.stringify(logs.slice(-12), null, 2));
ws.close();
process.exit(ready && errors.length === 0 ? 0 : 1);
