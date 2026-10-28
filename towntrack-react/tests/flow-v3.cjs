const { chromium, expect } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const listeners = new Set();
      const permission = { state: 'prompt', addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
      Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: async () => permission } });
      window.setGpsPermission = value => { permission.state = value; listeners.forEach(fn => fn()); };
      navigator.geolocation.getCurrentPosition = (success, failure) => {
        if (permission.state === 'granted') success({ coords: { latitude: 13.9919, longitude: 100.4169, accuracy: 10 } });
        else failure({ code: 1 });
      };
    });
    let nearbyRequests = 0;
    await page.route('https://**/*', route => route.abort());
    await page.route(/https:\/\/(overpass-api\.de|overpass\.kumi\.systems)\/api\/interpreter/, async route => {
      nearbyRequests++;
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ elements: [{ type: 'node', id: 888, lat: 13.992, lon: 100.418, tags: { amenity: 'hospital', 'name:th': 'โรงพยาบาลทดสอบ V3', phone: '02-111-2222' } }] }) });
    });
    const base = process.env.TOWNTRACK_URL || 'http://127.0.0.1:8773';
    const navigate = async name => {
      await page.locator('.citizen-menu-trigger').click();
      await page.locator('#citizen-sidebar').getByRole('button', { name, exact: true }).click();
    };
    await page.goto(`${base}/citizen`);
    await navigate('เบอร์ช่วยเหลือ');
    await expect(page.getByRole('heading', { name: 'เบอร์ช่วยเหลือ', exact: true })).toBeVisible();
    await expect(page.locator('.local-service-list')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'โรงพยาบาล ตำรวจ และกู้ภัยใกล้พิกัด' })).toHaveCount(0);
    expect(nearbyRequests).toBe(0);
    await page.evaluate(() => window.setGpsPermission('denied'));
    await page.getByRole('button', { name: 'ใช้ตำแหน่งของฉัน', exact: true }).click();
    await expect(page.locator('.local-service-list')).toHaveCount(0);
    expect(nearbyRequests).toBe(0);
    await expect(page.locator('a[href="tel:191"]')).toBeVisible();
    await navigate('แจ้งปัญหา');
    await page.getByRole('button', { name: 'ไม่พบเรื่องนี้? แจ้งปัญหาใหม่' }).click();
    await expect(page.locator('.category-option')).toHaveCount(5);
    await expect(page.getByRole('button', { name: /เลือกประเภท.*ไฟไหม้/ })).toHaveCount(0);
    await page.getByLabel('สถานที่เกิดเหตุ', { exact: false }).fill('ทดสอบระบุตำแหน่งเอง');
    await page.getByLabel('รายละเอียดปัญหา', { exact: false }).fill('ทดสอบส่งคำร้องเมื่อไม่อนุญาตตำแหน่ง');
    await page.getByLabel('ละติจูด', { exact: true }).fill('13.99');
    await page.getByLabel('ลองจิจูด', { exact: true }).fill('100.41');
    await page.locator('input[type="file"]').setInputFiles({ name: 'proof.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
    await page.getByRole('button', { name: 'ยืนยันส่งข้อมูล', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ขอบคุณที่ช่วยดูแลชุมชน' })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await navigate('เบอร์ช่วยเหลือ');
    await page.evaluate(() => window.setGpsPermission('granted'));
    await page.getByRole('button', { name: 'ใช้ตำแหน่งของฉัน', exact: true }).click();
    await expect(page.getByText('โรงพยาบาลทดสอบ V3', { exact: true })).toBeVisible();
    expect(nearbyRequests).toBeGreaterThan(0);
    const previousCount = nearbyRequests;
    await page.evaluate(() => window.setGpsPermission('denied'));
    await expect(page.locator('.local-service-list')).toHaveCount(0);
    await expect(page.getByText('โรงพยาบาลทดสอบ V3', { exact: true })).toHaveCount(0);
    expect(nearbyRequests).toBe(previousCount);
    for (const role of ['staff', 'supervisor', 'worker', 'authority']) {
      await page.goto(`${base}/${role}`);
      await expect(page.locator('.desk-priority-views button')).toHaveCount(3);
      await expect(page.locator('.desk-priority-views')).not.toContainText('ฉุกเฉิน');
    }
    expect(errors).toEqual([]);
    console.log('PASS: denied GPS allows report submission; no nearby requests/results without permission; grant loads services; revoke removes results; fire category/dialog/emergency queues removed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
