/* 在已打开的 127.0.0.1:8123 页面上求值一个表达式。
 * 用法：node tools/eval.mjs "<expr>" */
const expression = process.argv[2] ?? 'document.title';
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
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});
const call = (method, params = {}) => {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};
const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(result, null, 2));
ws.close();
