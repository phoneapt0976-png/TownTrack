const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.gpsRequests = 0;
      navigator.geolocation.getCurrentPosition = () => { window.gpsRequests++; };
    });
    await page.route('https://**/*', route => route.abort());
    const base = process.env.TOWNTRACK_URL || 'http://127.0.0.1:8773';
    await page.goto(`${base}/information?section=guide`);
    await expect(page.locator('h1')).toHaveText('คู่มือบริการ');
    await page.getByRole('searchbox').fill('GPS');
    await expect(page.locator('.information-card')).toHaveCount(2);
    await page.getByRole('searchbox').fill('zz-no-match');
    await expect(page.getByRole('status')).toContainText('0');
    await page.getByRole('searchbox').fill('');
    await page.locator('.information-header').getByRole('link', { name: 'English' }).click();
    await expect(page.locator('.information-page')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('Service guide');
    for (const section of ['guide', 'contact', 'privacy', 'terms', 'security', 'accessibility', 'sitemap']) {
      await page.goto(`${base}/information?section=${section}`);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.government-footer')).toBeVisible();
      if (['privacy', 'terms', 'security'].includes(section)) await expect(page.locator('.information-notice')).toContainText('ยังไม่ใช่นโยบาย');
    }
    await page.goto(`${base}/information?section=guide`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) { console.log(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => ({tag:e.tagName, cls:e.className, width:e.getBoundingClientRect().width})).slice(0,20))); throw Error(`Information overflow at ${width}`); }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.display-settings summary').click();
    await page.getByRole('button', { name: 'ใหญ่พิเศษ', exact: true }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'largest');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw Error('Enlarged information overflow');
    await page.locator('.display-settings summary').click();
    await page.getByRole('button', { name: 'คืนค่าเริ่มต้น' }).click();
    await page.keyboard.press('Escape');
    await page.goto(`${base}/citizen`);
    await expect(page.locator('.public-dashboard')).toBeVisible();
    if (await page.evaluate(() => window.gpsRequests) !== 0) throw Error('GPS requested without action');
    const trigger = page.locator('.citizen-menu-trigger');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.citizen-portal-shell')).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await page.locator('#citizen-sidebar').getByRole('button', { name: 'แจ้งปัญหา', exact: true }).click();
    // All five role pages must keep a reachable public footer and main landmark.
    for (const role of ['citizen', 'staff', 'supervisor', 'worker', 'authority']) {
      await page.goto(`${base}/${role}`);
      await expect(page.locator('main#main-content')).toHaveCount(1);
      await expect(page.locator('.government-footer')).toHaveCount(1);
      await expect(page.getByRole('link', { name: 'การคุ้มครองข้อมูลส่วนบุคคล', exact: true })).toHaveAttribute('href', '/information?section=privacy&lang=th');
    }
    fs.mkdirSync('/tmp/towntrack-government', { recursive: true });
    await page.goto(`${base}/information?section=guide`);
    await page.screenshot({ path: '/tmp/towntrack-government/mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: '/tmp/towntrack-government/desktop.png', fullPage: true });
    expect(errors).toEqual([]);
    console.log('PASS: information routes, English guide, search, 320–1440px layouts, reading preference persistence, no automatic GPS, drawer keyboard, and all five role footers.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
