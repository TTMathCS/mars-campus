// Headless checks for the palace. Build first with ../build.sh debug, and put three.js r128 at tools/three.min.js
// (or set THREE_JS). Usage: node shot.js OUTDIR ACTIONS_JSON [width height [mobile]]; START=beginBtn starts the journey.
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2] || 'shots';
  const actions = JSON.parse(process.argv[3] || '[]');
  const vw = +(process.argv[4] || 1440), vh = +(process.argv[5] || 900);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mob = process.argv[6] === 'mobile';
  const page = await browser.newPage(mob ? { viewport: { width: vw, height: vh }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { viewport: { width: vw, height: vh } });
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.includes('three.min.js')) return r.fulfill({ path: (process.env.THREE_JS || path.join(__dirname, 'three.min.js')), contentType: 'application/javascript' });
    if (u.startsWith('file:')) return r.continue();
    return r.abort();
  });
  const t0 = Date.now();
  await page.goto('file://' + path.join(__dirname, '..', 'palace-debug.html'));
  try { await page.waitForFunction(() => !document.getElementById('loadBtns').hidden || !document.getElementById('loadErr').hidden, null, { timeout: 240000 }); }
  catch (e) { logs.push('TIMEOUT waiting for load'); }
  logs.push('load ms ' + (Date.now() - t0));
  await page.evaluate(id => { const b = document.getElementById(id); if (b && !b.closest('[hidden]')) b.click(); }, process.env.START || 'skipLoadBtn');
  const err = await page.$eval('#loadErr', e => e.hidden ? '' : e.textContent);
  if (err) logs.push('LOADERR: ' + err);
  await page.waitForTimeout(1500);
  try { await page.screenshot({ path: out + '/00.png', timeout: 90000 }); } catch (e) { logs.push('SHOT FAIL ' + e.message.split('\n')[0]); }
  logs.push('stats ' + JSON.stringify(await page.evaluate(() => { const a = window.__arc; if (!a) return null; const r = a.renderer.info; return { calls: r.render.calls, tris: r.render.triangles, geos: r.memory.geometries, tex: r.memory.textures, lv: a.curLv(), zones: Object.keys(a.ZG).filter(k => a.ZG[k].all.visible), mode: a.state.mode }; })));
  let n = 1;
  for (const a of actions) {
    if (a.js) await page.evaluate(a.js);
    if (a.key) await page.keyboard.press(a.key);
    if (a.click) await page.click(a.click);
    if (a.hold) { await page.keyboard.down(a.hold); await page.waitForTimeout(a.ms || 1500); await page.keyboard.up(a.hold); }
    await page.waitForTimeout(a.wait || 4500);
    if (a.shot !== false) { try { await page.screenshot({ path: out + '/' + String(n).padStart(2, '0') + (a.name ? '-' + a.name : '') + '.png', timeout: 90000 }); } catch (e) { logs.push('SHOT FAIL ' + (a.name || n) + ' ' + e.message.split('\n')[0]); } n++; }
    if (a.log) logs.push((a.name || n) + ': ' + JSON.stringify(await page.evaluate(a.log)));
  }
  fs.writeFileSync(out + '/log.txt', logs.join('\n'));
  console.log(logs.slice(0, 60).join('\n'));
  await browser.close();
})();
