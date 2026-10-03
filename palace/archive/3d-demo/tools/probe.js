// Evaluates one JS expression in the loaded debug page and prints the result: node probe.js "expression"
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.route('**/*', r => { const u = r.request().url(); if (u.includes('three.min.js')) return r.fulfill({ path: (process.env.THREE_JS || path.join(__dirname, 'three.min.js')), contentType: 'application/javascript' }); if (u.startsWith('file:')) return r.continue(); return r.abort(); });
  await page.goto('file://' + path.join(__dirname, '..', 'palace-debug.html'));
  await page.waitForFunction(() => !document.getElementById('loadBtns').hidden || !document.getElementById('loadErr').hidden, null, { timeout: 240000 }); await page.evaluate(id => { const b = document.getElementById(id); if (b && !b.closest('[hidden]')) b.click(); }, process.env.START || 'skipLoadBtn'); await page.waitForTimeout(1500);
  const res = await page.evaluate(process.argv[2]);
  console.log(typeof res === 'string' ? res : JSON.stringify(res, null, 1));
  await browser.close();
})();
