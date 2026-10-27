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
const runtimeExceptions = [];
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
async function waitFor(expression, description, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
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
    if (message.method === 'Runtime.exceptionThrown') { errors.push(message.params.exceptionDetails.text); runtimeExceptions.push(message.params.exceptionDetails.text); }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value || a.description).join(' '));
  });
  await call('Page.enable'); await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  if (process.env.MAP_ONLY !== '1') {
  await navigate('/');
  await waitFor(`${count} === 20`, '20 approved cards rendered');
  await waitFor('document.querySelector("[data-explorer-ready]")?.dataset.explorerReady === "true"', 'React explorer hydration');
  assert.equal(await evaluate('document.body.innerText.includes("오천집 신촌점") && document.body.innerText.includes("더도이축산직영점 신촌점") && !document.body.innerText.includes("정육면체")'), true);
  assert.equal(await evaluate('[...document.querySelectorAll("[data-restaurant-card]")].every(c => c.innerText.includes("아직 리뷰 없음") || /[1-5]\\.[0-9]점 · 리뷰 [1-9][0-9]*개/.test(c.innerText))'), true);
  assert.equal(await evaluate('document.body.innerText.includes("0원") || document.body.innerText.includes("영업 중")'), false);
  assert.equal(await evaluate('[...document.querySelectorAll("[data-preparing]")].every(b => b.disabled)'), true);
  const recovering = await evaluate('!!document.querySelector(\'[data-source="local-recovery"]\')');
  if (process.env.EXPECTED_DATA_SOURCE) {
    assert.equal(await evaluate('document.querySelector("[data-source]")?.dataset.source'), process.env.EXPECTED_DATA_SOURCE, 'Home data source');
  }
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
    const detailHtml = await response.text();
    assert(detailHtml.includes(item.name), item.name);
    if (process.env.EXPECTED_DATA_SOURCE) assert(detailHtml.includes(`data-source="${process.env.EXPECTED_DATA_SOURCE}"`), `${item.id}: data source`);
  }
  const missing = await fetch(`${base}/restaurants/missing-id`);
  assert.equal(missing.status, recovering ? 200 : 404);
  await navigate('/restaurants/missing-id');
  await waitFor(`document.body.innerText.includes(${JSON.stringify(recovering ? '식당 정보를 확인할 수 없어요' : '식당을 찾을 수 없어요')})`, 'honest missing/unavailable state');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: 20 detail HTTP pages, honest missing/unavailable state, no captured browser runtime/console errors.');
  }
  if (process.env.COMMUNITY_SMOKE === '1') {
    await navigate('/restaurants/sinchon-02');
    await waitFor('!!document.querySelector("#restaurant-reviews")','public review section');
    assert.equal(await evaluate('document.querySelectorAll("[data-review-form]").length'),0,'guest cannot compose reviews');
    assert.equal(await evaluate('!!document.querySelector(\'a[aria-label="로그인 후 즐겨찾기"]\')'),true);
    assert.equal(await evaluate('document.body.innerText.includes("로그인 후 리뷰를 작성할 수 있습니다.")'),true);
    for(const width of [375,1280]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
      await delay(100);
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'detail community layout');
      const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      mkdirSync('.next/phase4-checks',{recursive:true});
      writeFileSync(`.next/phase4-checks/detail-${width}.png`,Buffer.from(screenshot.data,'base64'));
    }
    console.log('PASS: public reviews, anonymous write/favorite login guidance, community detail 375/1280px layouts. No real writes performed.');
  }
  if (process.env.AUTH_SMOKE === '1') {
    await navigate('/signup');
    await waitFor('!!document.querySelector("[data-auth-form=signup]")', 'signup form');
    const setField = async (name,value) => evaluate(`(() => { const input=document.querySelector('input[name="${name}"]'); input.value=${JSON.stringify(value)}; input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
    await setField('email','fixture@example.invalid');
    await setField('password','fixture-password');
    await setField('confirm','different-password');
    await setField('nickname','테스트사용자');
    await evaluate('document.querySelector("[data-auth-form]").requestSubmit()');
    await waitFor('document.querySelector("[role=alert]")?.innerText.includes("비밀번호 확인")', 'server-side mismatch validation');
    const formEntries=await evaluate('[...new FormData(document.querySelector("[data-auth-form]"))].map(([k,v])=>[k,String(v)])');
    const body=new FormData();for(const [key,value] of formEntries)body.append(key,value);
    const csrf=await fetch(base+'/signup',{method:'POST',headers:{Origin:'https://external.invalid'},body});
    assert(csrf.status>=400,'cross-origin Server Action must be rejected');
    await navigate('/login?next=https%3A%2F%2Fexternal.invalid');
    await waitFor('!!document.querySelector("[data-auth-form=login]")', 'login form');
    assert.equal(await evaluate('document.querySelector("input[name=next]").value'),'/mypage');
    for(const route of ['/login','/signup']) {
      await navigate(route);
      await waitFor('!!document.querySelector("[data-auth-form]")','auth form route');
      for(const width of [375,1280]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
        await delay(100);
        assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`${route} ${width} overflow`);
        const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
        mkdirSync('.next/phase3-checks',{recursive:true});
        writeFileSync(`.next/phase3-checks/${route.slice(1)}-${width}.png`,Buffer.from(screenshot.data,'base64'));
      }
    }
    await navigate('/mypage');
    await waitFor('location.pathname==="/login"','anonymous mypage redirect');
    console.log('PASS: auth forms server validation, safe next, anonymous mypage redirect, cross-origin POST rejection, 375/1280px auth layouts. No real signup/login performed.');
  }
  if (process.env.MAP_SMOKE === '1') {
    if(process.env.MAP_BLOCK_SDK==='1') {
      await call('Network.enable');
      await call('Network.setBlockedURLs',{urls:['*://oapi.map.naver.com/openapi/v3/maps.js*']});
    }
    await navigate('/?category='+encodeURIComponent('일식'));
    await waitFor('document.querySelector("[data-explorer-ready]")?.dataset.explorerReady==="true"','home ready before SPA map handoff');
    await evaluate('document.querySelector(\'header [data-view-link="/map"]\').click()');
    await waitFor('document.querySelector("[data-map-explorer]")?.dataset.mapInteractive==="true"','map hydration');
    await waitFor('["ready","error"].includes(document.querySelector("[data-map-sdk-state]")?.dataset.mapSdkState)','SDK terminal state',20000);
    const phase=await evaluate('document.querySelector("[data-map-sdk-state]").dataset.mapSdkState');
    const verified=await evaluate('[...document.querySelectorAll("[data-map-row][data-location-verified=true]")].map(node=>node.dataset.mapRow)');
    const registry=JSON.parse(readFileSync('data/restaurant-locations.json','utf8')).locations;
    assert(verified.every(id=>registry.some(row=>row.id===id&&row.status==='verified')),'no unverified markers');
    assert.equal(await evaluate('document.querySelectorAll("[data-map-row]").length'),7,'category filter');
    if(process.env.REQUIRE_REAL_MAP==='1') {
      assert.equal(phase,'ready','actual NAVER SDK must load successfully');
      await waitFor('[...document.querySelectorAll("[data-naver-map-canvas] img")].some(img=>img.complete&&img.naturalWidth>=128)','real map tile loaded',20000);
      assert(verified.length>0,'applied verified coordinates required for real marker test');
    }
    if(phase==='ready') {
      assert.equal(await evaluate('Number(document.querySelector("[data-map-marker-count]").dataset.mapMarkerCount)'),verified.length);
      if(verified.length) {
        await evaluate(`document.querySelector('[data-map-select="${verified[0]}"]').click()`);
        await waitFor(`document.querySelector('[data-naver-map-canvas] a[href="/restaurants/${verified[0]}"]')!==null`,'selected marker information window');
        if(process.env.REQUIRE_REAL_MAP==='1') {
          const target=registry.find(row=>row.id===verified.at(-1));
          await evaluate('document.querySelector("[data-map-reset]").click()');
          await waitFor(`!!document.querySelector('[data-naver-map-canvas] [title="${target.name}"]')`,'actual marker DOM');
          await evaluate('document.querySelector("[data-naver-map-canvas]").scrollIntoView({block:"center"})');
          await delay(800);
          const point=await evaluate(`(() => {const r=document.querySelector('[data-naver-map-canvas] [title="${target.name}"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height};})()`);
          assert(point.width>0&&point.height>0,'actual marker must be visible');
          await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
          await call('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});
          await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});
          await waitFor(`new URL(location.href).searchParams.get('selected')===${JSON.stringify(target.id)}`,'actual marker click synchronizes list and URL');
          await evaluate('document.querySelector(\'[data-map-category="일식"]\').click()');
        }
      }
    } else assert.equal(await evaluate('!!document.querySelector("[role=alert]")'),true,'explicit SDK error');
    for(const width of [375,1280]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
      await delay(150);
      if(width===375) {
        await evaluate('document.querySelector("[data-map-view=list]").click()');
        assert.equal(await evaluate('new URL(location.href).searchParams.get("view")'),'list');
        await evaluate('document.querySelector("[data-map-view=map]").click()');
      }
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'map layout no overflow');
      const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
      mkdirSync('.next/phase5-checks',{recursive:true});writeFileSync(`.next/phase5-checks/map-${phase}-${width}.png`,Buffer.from(shot.data,'base64'));
    }
    await evaluate(`(() => {const input=document.querySelector('#map-search');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'꼬숑');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await waitFor('document.querySelectorAll("[data-map-row]").length===1','map search AND');
    await call('Page.reload');
    await waitFor('document.querySelector("[data-map-explorer]")?.dataset.mapInteractive==="true"&&document.querySelectorAll("[data-map-row]").length===1','map reload preserves filter');
    await evaluate('document.querySelector("[data-map-list-link]").click()');
    await waitFor('!!document.querySelector("#restaurant-search")&&document.querySelectorAll("[data-restaurant-card]").length===1','list/map filter handoff');
    assert.equal(await evaluate('document.querySelector("#restaurant-search").value'),'꼬숑');
    await evaluate('document.querySelector(\'header [data-view-link="/map"]\').click()');
    await waitFor('document.querySelector("[data-map-explorer]")?.dataset.mapInteractive==="true"&&document.querySelectorAll("[data-map-row]").length===1','list back to map keeps search/category');
    assert.equal(await evaluate('document.querySelector("#map-search").value'),'꼬숑');
    assert.equal(runtimeExceptions.length,0,'no uncaught browser exceptions during map flow');
    console.log(`PASS: map/list/category/search/URL reload/selection/mobile layout; NAVER SDK state=${phase}. ${process.env.REQUIRE_REAL_MAP==='1'?'Actual SDK tile/marker checks passed.':'Actual SDK success is not required by this run.'}`);
  }
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ id: ++id, method: 'Browser.close' }));
    socket.close();
  }
  processHandle.kill();
}
