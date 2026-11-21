import fs from 'node:fs/promises';

/* 在已连接的预览页里执行一段表达式并打印结果。
 * 用法：node tools/eval.mjs "<expression>" [cdpPort] */

const expression = process.argv[2] ?? '1';
const cdpPort = process.argv[3] ?? process.env.CDP_PORT ?? '9222';

const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = list.find((entry) => entry.type === 'page' && entry.url.includes('127.0.0.1:8123'));
if (!target) {
  console.error('No preview page found');
  process.exit(2);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
let nextId = 1;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve } = pending.get(message.id);
    pending.delete(message.id);
    resolve(message.result);
  }
});
const call = (method, params = {}) => {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, { resolve }));
};

await call('Runtime.enable');
const result = await call('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: true,
  userGesture: true,
});
console.log(JSON.stringify(result.result?.value ?? result, null, 2));
if (result.exceptionDetails) console.log('EXCEPTION', result.exceptionDetails.text, result.exceptionDetails.exception?.description);
ws.close();
