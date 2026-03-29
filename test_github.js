const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://github.com/tomotochi/tabmark/blob/main/packages/vscode/sample/sample.table.md');
  await page.waitForTimeout(5000);

  // Read our compiled injected bundle
  const code = fs.readFileSync('packages/chrome/dist/content.js', 'utf8');

  // Define mock chrome api
  await page.evaluate(`
    window.chrome = {
       runtime: {
          getURL: (url) => url
       }
    };
  `);

  await page.evaluate(code);

  await page.waitForTimeout(2000); // Give the extension time to inject

  const gridButtonHtml = await page.evaluate(() => {
    return document.getElementById('tabmark-grid-button')?.outerHTML || "NOT INJECTED";
  });
  console.log("Grid Button:\n", gridButtonHtml);

  const rootHtml = await page.evaluate(() => {
     return document.getElementById('tabmark-grid-root')?.outerHTML || "ROOT NOT FOUND";
  });
  console.log("Root container injected:", rootHtml !== "ROOT NOT FOUND");

  await browser.close();
})();
