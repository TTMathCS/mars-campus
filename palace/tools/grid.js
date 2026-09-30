// Contact sheet of the PNGs in a folder: node grid.js DIR [per-sheet]
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const dir = path.resolve(process.argv[2]), per = +(process.argv[3] || 4);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') && !f.startsWith('grid')).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (let g = 0; g * per < files.length; g++) {
    const set = files.slice(g * per, g * per + per);
    const html = '<body style="margin:0;background:#000;display:grid;grid-template-columns:1fr 1fr;gap:4px">' +
      set.map(f => '<div style="position:relative"><img style="width:100%;display:block" src="file://' + dir + '/' + f + '"><span style="position:absolute;left:6px;top:4px;color:#fff;font:14px monospace;background:#000a;padding:1px 4px">' + f + '</span></div>').join('') + '</body>';
    fs.writeFileSync(dir + '/_g.html', html);
    await page.goto('file://' + dir + '/_g.html');
    await page.waitForTimeout(300);
    await page.screenshot({ path: dir + '/grid' + g + '.png' });
  }
  await browser.close();
})();
