import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/app.png', fullPage: false });
  console.log('Screenshot saved to screenshots/app.png');
  await browser.close();
}

takeScreenshot().catch(console.error);
