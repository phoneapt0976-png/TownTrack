const { chromium, expect } = require("@playwright/test");

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 13.9919, longitude: 100.4169, accuracy: 9 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  let overpassRequest = "";
  await page.route(
    /https:\/\/(overpass-api\.de|overpass\.kumi\.systems)\/api\/interpreter/,
    async (route) => {
      overpassRequest = route.request().postData() || "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          elements: [
            {
              type: "node",
              id: 101,
              lat: 13.994,
              lon: 100.418,
              tags: {
                amenity: "hospital",
                "name:th": "โรงพยาบาลทดสอบใกล้ฉัน",
                phone: "02-111-2222",
              },
            },
            {
              type: "node",
              id: 102,
              lat: 13.997,
              lon: 100.421,
              tags: {
                amenity: "police",
                "name:th": "สถานีตำรวจทดสอบใกล้ฉัน",
                phone: "02-333-4444",
              },
            },
            {
              type: "node",
              id: 103,
              lat: 14.001,
              lon: 100.423,
              tags: { amenity: "fire_station", "name:th": "สถานีดับเพลิงทดสอบ" },
            },
          ],
        }),
      });
    },
  );
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.TOWNTRACK_URL || "http://127.0.0.1:8770/");

  await expect(page.locator(".public-dashboard")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูประชาชน" })).toBeVisible();
  await expect(page.getByRole("button", { name: "หน้าหลัก", exact: true })).toHaveClass(/active/);

  await page.getByRole("button", { name: "ติดตาม", exact: true }).click();
  await expect(page.locator(".tracking-card")).toHaveCount(5);
  await expect(page.getByRole("navigation", { name: "หน้ารายการติดตาม" })).toBeVisible();
  const firstPageFirst = await page.locator(".tracking-card .case-id").first().textContent();
  await page.getByRole("button", { name: "หน้าถัดไป" }).click();
  await expect(page.getByRole("button", { name: "หน้า 2" })).toHaveAttribute("aria-current", "page");
  const secondPageFirst = await page.locator(".tracking-card .case-id").first().textContent();
  if (firstPageFirst === secondPageFirst) throw Error("pagination did not change the list");

  await page.getByRole("button", { name: "ฉุกเฉิน", exact: true }).click();
  await expect(page.getByRole("heading", { name: "เบอร์ฉุกเฉินใกล้คุณ" })).toBeVisible();
  for (const phone of ["191", "1669", "199", "1155"]) {
    await expect(page.locator(`a[href="tel:${phone}"]`)).toBeVisible();
  }
  await expect(page.getByText("ได้รับตำแหน่ง GPS แล้ว")).toBeVisible();
  await expect(page.getByText("โรงพยาบาลทดสอบใกล้ฉัน", { exact: true })).toBeVisible();
  await expect(page.getByText("สถานีตำรวจทดสอบใกล้ฉัน", { exact: true })).toBeVisible();
  await expect(page.getByText("สถานีดับเพลิงทดสอบ", { exact: true })).toBeVisible();
  await expect(page.locator('a[href="tel:021112222"]')).toBeVisible();
  if (!decodeURIComponent(overpassRequest).includes("13.9919,100.4169"))
    throw Error("GPS coordinates were not sent to the Overpass lookup");

  const workflowWidth = await page.locator(".phone-frame").evaluate((el) =>
    Math.round(el.getBoundingClientRect().width),
  );
  await page.getByRole("button", { name: "หน้าหลัก", exact: true }).click();
  const homeWidth = await page.locator(".citizen-portal-shell").evaluate((el) =>
    Math.round(el.getBoundingClientRect().width),
  );
  if (workflowWidth !== homeWidth) {
    throw Error(`citizen widths differ: workflow=${workflowWidth}, home=${homeWidth}`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  const desktopHomeWidth = await page.locator(".citizen-portal-shell").evaluate((el) =>
    Math.round(el.getBoundingClientRect().width),
  );
  await page.getByRole("button", { name: "ฉุกเฉิน", exact: true }).click();
  const desktopWorkflowWidth = await page.locator(".phone-frame").evaluate((el) =>
    Math.round(el.getBoundingClientRect().width),
  );
  if (desktopWorkflowWidth !== desktopHomeWidth || desktopHomeWidth !== 1220) {
    throw Error(
      `desktop widths differ: workflow=${desktopWorkflowWidth}, home=${desktopHomeWidth}`,
    );
  }

  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    throw Error("citizen mobile layout overflows viewport");
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log("PASS shared citizen menu, five-item tracking pagination, GPS emergency directory");
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
