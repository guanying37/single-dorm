/* Quick console/error check for the storage-room preview.
 * Usage: node tools/check.mjs [scene] */

const scene = process.argv[2] ?? 'storage';
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page');
if (!target) {
  console.error('No page target found');
  process.exit(2);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let id = 1;
const pending = new Map();
const events = [];
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
    events.push(`EXCEPTION: ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`);
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    const text = message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' ');
    if (message.params.type === 'error') events.push(`CONSOLE ERROR: ${text}`);
    else if (message.params.type === 'warning') events.push(`CONSOLE WARN: ${text}`);
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    events.push(`LOG: ${message.params.entry.text} ${message.params.entry.url ?? ''}`);
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
await call('Log.enable');
await call('Page.enable');
await call('Network.enable');
await call('Network.setCacheDisabled', { cacheDisabled: true });
await call('Network.clearBrowserCache');
await call('Emulation.setFocusEmulationEnabled', { enabled: true });
await call('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.bringToFront');
events.length = 0;
await call('Page.navigate', { url: `http://127.0.0.1:8123/?scene=${scene}&v=${Date.now()}` });

let ready = false;
for (let attempt = 0; attempt < 50; attempt += 1) {
  await sleep(500);
  ready = await evaluate('Boolean(window.__PREVIEW_READY__)').catch(() => false);
  if (ready) break;
}
if (!ready) {
  console.log('NOT READY');
  console.log(events.join('\n'));
  const html = await evaluate('document.getElementById("loader")?.innerText ?? ""');
  console.log('LOADER:', html);
  process.exit(3);
}

await sleep(1800);
const info = await evaluate(`(() => {
  const p = window.__PREVIEW__;
  const stats = p.getStats();
  return {
    scene: p.getScene(),
    stats: {
      calls: stats.renderer.calls,
      triangles: stats.renderer.triangles,
      textures: stats.memory.textures,
      geometries: stats.memory.geometries,
      quality: stats.quality,
    },
    storage: p.storage?.getStats?.() ?? null,
    interactives: p.getInteractives(),
    view: p.getView(),
    colliders: p.storage?.collision?.boxes?.length ?? null,
    ready: {
      dorm: window.__DORM_READY__, dining: window.__DINING_READY__,
      kitchen: window.__KITCHEN_READY__, coldstore: window.__COLDSTORE_READY__,
      storage: window.__STORAGE_READY__,
    },
  };
})()`);
console.log(JSON.stringify(info, null, 2));
console.log('EVENTS', JSON.stringify(events, null, 2));

ws.close();
