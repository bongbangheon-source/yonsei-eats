import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Uses an isolated headless browser profile, never the user's signed-in profile.
const browser = process.env.BROWSER_PATH || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync);
if (!browser) throw new Error('Chrome/Edge not found; set BROWSER_PATH to a local Chromium executable.');
const base = process.env.BASE_URL || 'http://127.0.0.1:3101';
const profile = mkdtempSync(path.join(tmpdir(), 'yonsei-eats-ui-'));
const processHandle = spawn(browser, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
let socket;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let id = 0;
const pending = new Map();
const errors = [];
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const requestId = ++id;
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(requestId, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}
async function evaluate(expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, description) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out: ${description}`);
}
async function navigate(route) {
  await call('Page.navigate', { url: `${base}${route}` });
  await waitFor('document.readyState === "complete"', route);
}
async function setSearch(value) {
  await evaluate(`(() => { const input = document.querySelector('#restaurant-search'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', {bubbles:true})); })()`);
}
async function chooseCategory(category) {
  await evaluate(`document.querySelector(${JSON.stringify(`button[data-category="${category}"]`)}).click()`);
}
const count = 'document.querySelectorAll("[data-restaurant-card]").length';
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await delay(100);
  if (!existsSync(portFile)) throw new Error('Browser did not expose DevTools; local process/sandbox policy may block launch.');
  const port = readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id); pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value || a.description).join(' '));
  });
  await call('Page.enable'); await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate('/');
  await waitFor(`${count} === 20`, '20 approved cards rendered');
  await waitFor('document.querySelector("[data-explorer-ready]")?.dataset.explorerReady === "true"', 'React explorer hydration');
  assert.equal(await evaluate('document.body.innerText.includes("오천집 신촌점") && document.body.innerText.includes("더도이축산직영점 신촌점") && !document.body.innerText.includes("정육면체")'), true);
  assert.equal(await evaluate('document.querySelectorAll("[data-restaurant-card]").length === [...document.querySelectorAll("[data-restaurant-card]")].filter(c => c.innerText.includes("아직 리뷰 없음")).length'), true);
  assert.equal(await evaluate('document.body.innerText.includes("0원") || document.body.innerText.includes("영업 중")'), false);
  assert.equal(await evaluate('[...document.querySelectorAll("[data-preparing]")].every(b => b.disabled)'), true);
  console.log('PASS: hydrated 20 cards, required restaurants, honest null/review and disabled states.');
  await setSearch('오천집');
  await waitFor(`${count} === 1`, 'name search');
  await chooseCategory('일식');
  await waitFor(`${count} === 0 && document.body.innerText.includes("검색 결과가 없어요")`, 'AND filter empty state');
  await chooseCategory('한식·국밥');
  await waitFor(`${count} === 1`, 'AND filter matching category');
  assert.equal(await evaluate('new URL(location.href).searchParams.get("q") === "오천집" && new URL(location.href).searchParams.get("category") === "한식·국밥"'), true);
  await call('Page.reload');
  await waitFor(`${count} === 1 && document.querySelector('#restaurant-search')?.value === '오천집'`, 'filters survive reload');
  await waitFor('document.querySelector("[data-explorer-ready]")?.dataset.explorerReady === "true"', 'hydration after reload');
  await evaluate('document.querySelector("[data-restaurant-card]").click()');
  await waitFor('location.pathname === "/restaurants/sinchon-02" && document.querySelector("h1")?.innerText === "오천집 신촌점"', 'card navigates to real detail');
  assert.equal(await evaluate('document.body.innerText.includes("위치 확인 중") && document.body.innerText.includes("영업 상태 확인 중")'), true);
  await evaluate('history.back()');
  await waitFor(`${count} === 1 && document.querySelector('#restaurant-search')?.value === '오천집'`, 'filters survive detail/back');
  await evaluate('document.querySelector("[data-reset-filters]").click()');
  await waitFor(`${count} === 20`, 'reset restores 20');
  await chooseCategory('일식');
  await waitFor(`${count} === 7`, 'category-only filter');
  await evaluate('document.querySelector("[data-reset-filters]").click()');
  await waitFor(`${count} === 20`, 'second reset');
  console.log('PASS: name/category/AND/empty/reset/count, URL reload and detail-back preservation.');
  for (const [width, expectedColumns] of [[1280, 3], [375, 1]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
    await delay(200);
    const layout = await evaluate(`({width:innerWidth, scroll:document.documentElement.scrollWidth, columns:getComputedStyle(document.querySelector('[data-restaurant-grid]')).gridTemplateColumns.split(' ').length})`);
    assert.equal(layout.columns, expectedColumns, JSON.stringify(layout));
    assert(layout.scroll <= layout.width, `horizontal overflow: ${JSON.stringify(layout)}`);
    await evaluate('document.querySelector("#restaurant-search").focus()');
    assert.equal(await evaluate('document.activeElement.id'), 'restaurant-search');
    const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    mkdirSync('.next/phase1-checks', { recursive: true });
    writeFileSync(`.next/phase1-checks/${width}.png`, Buffer.from(screenshot.data, 'base64'));
    console.log(`PASS: ${width}px, ${expectedColumns} columns, no horizontal overflow, input focus. Screenshot saved.`);
  }
  for (const item of JSON.parse(readFileSync('data/restaurants.json', 'utf8')).restaurants) {
    const response = await fetch(`${base}/restaurants/${item.id}`);
    assert.equal(response.status, 200, item.id);
    assert((await response.text()).includes(item.name), item.name);
  }
  const missing = await fetch(`${base}/restaurants/missing-id`);
  assert.equal(missing.status, 404);
  await navigate('/restaurants/missing-id');
  await waitFor('document.body.innerText.includes("식당을 찾을 수 없어요")', 'friendly 404');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: 20 detail HTTP pages, missing-ID 404, no captured browser runtime/console errors.');
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: ++id, method: 'Browser.close' }));
    socket.close();
  }
  processHandle.kill();
}
