import fs from 'node:fs/promises';

/* Minimal Chrome DevTools Protocol driver for headless preview checks.
 * Node 24 provides WebSocket globally; no npm dependencies. */

const targetFilter = '127.0.0.1:8123';
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes(targetFilter));
if (!target) {
  console.error('No matching page target');
  process.exit(2);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let nextId = 1;
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
  if (message.method === 'Runtime.consoleAPICalled') {
    events.push({
      type: message.params.type,
      text: message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
    });
  }
  if (message.method === 'Runtime.exceptionThrown') {
    events.push({
      type: 'exception',
      text: message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text,
    });
  }
  if (message.method === 'Log.entryAdded') {
    events.push({ type: message.params.entry.level, text: message.params.entry.text });
  }
});

function call(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function screenshot(path) {
  const result = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(path, Buffer.from(result.data, 'base64'));
}

await call('Runtime.enable');
await call('Log.enable');
await call('Page.enable');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await sleep(3500);

const ready = await evaluate('({ready: Boolean(window.__PREVIEW_READY__), kitchen: Boolean(window.__KITCHEN_READY__), scene: window.__PREVIEW__?.getScene?.()})');
console.log('READY', ready);

if (process.argv[2] && ready.ready) {
  const view = {
    x: Number(process.argv[2]),
    z: Number(process.argv[3]),
    yaw: Number(process.argv[4]),
    pitch: Number(process.argv[5]),
  };
  await evaluate(`window.__PREVIEW__.setView(${JSON.stringify(view)})`);
  await sleep(2600);
}

const stats = await evaluate('(() => window.__PREVIEW__ ? window.__PREVIEW__.getStats() : null)()');
console.log('STATS', JSON.stringify(stats, null, 2));

const view = await evaluate('(() => window.__PREVIEW__ ? window.__PREVIEW__.getView() : null)()');
console.log('VIEW', view);

await screenshot(new URL('./last-check.png', import.meta.url));
console.log('SCREENSHOT tools/last-check.png');

console.log('EVENTS', JSON.stringify(events, null, 2));
ws.close();
