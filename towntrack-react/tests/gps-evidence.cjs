const { chromium, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true }),
    c = await b.newContext({
      viewport: { width: 1280, height: 900 },
      geolocation: { latitude: 13.9919, longitude: 100.4169, accuracy: 8 },
      permissions: ["geolocation"],
    }),
    p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.TOWNTRACK_URL || "http://127.0.0.1:8770/");
  await expect(p.locator(".public-dashboard")).toBeVisible();
  await expect
    .poll(() =>
      p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("towntrack-react-v1")).issues.length,
      ),
    )
    .toBe(300);
  await expect(p.locator(".public-case-card")).toHaveCount(24);
  await expect
    .poll(() =>
      p
        .locator(".case-photo img")
        .evaluateAll(
          (images) =>
            images.filter((i) => i.complete && i.naturalWidth > 0).length,
        ),
    )
    .toBeGreaterThan(10);
  await p.getByRole("button", { name: /ดูเพิ่ม/ }).click();
  await expect(p.locator(".public-case-card")).toHaveCount(48);
  await p.getByLabel("ค้นหาปัญหาสาธารณะ").fill("TT-003");
  await expect(p.locator(".public-case-card")).toHaveCount(1);
  await p.getByRole("button", { name: "ล้างตัวกรอง", exact: true }).click();
  await p.getByRole("button", { name: "ปัญหาใกล้ฉัน", exact: true }).click();
  await expect(
    p.getByRole("button", { name: "ภายใน 100 ม.", exact: true }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Heatmap", exact: true }).click();
  await expect(p.locator(".leaflet-overlay-pane svg")).toBeVisible();
  await p.getByRole("button", { name: "Clustering", exact: true }).click();
  await expect(p.locator(".leaflet-marker-pane .real-map-pin")).toHaveCount(2);
  await p.getByRole("button", { name: "แจ้งปัญหาใหม่", exact: true }).click();
  await p.getByRole("button", { name: "ใช้ GPS ของฉัน", exact: true }).click();
  await expect(p.locator(".gps-box")).toContainText("13.991900");
  await p.getByRole("button", { name: /ไม่พบปัญหาที่ต้องการ/ }).click();
  await expect(p.getByLabel(/เบอร์มือถือ/)).not.toHaveAttribute("required");
  await p.getByLabel(/รายละเอียดปัญหา/).fill("ทดสอบคำร้องใหม่พร้อมหลักฐาน");
  await p.getByLabel(/ชื่อเรื่อง/).fill("ทดสอบเพิ่มปัญหาหน้าหลัก");
  await p.getByRole("button", { name: "ยืนยันส่งข้อมูล", exact: true }).click();
  await expect(p.getByRole("alert")).toContainText("แนบรูปหลักฐาน");
  const count = await p.evaluate(
    () => JSON.parse(localStorage.getItem("towntrack-react-v1")).issues.length,
  );
  if (count !== 300) throw Error("Created without evidence");
  await p
    .locator("input[type=file]")
    .setInputFiles({
      name: "test-proof.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7yUAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await p.locator(".geo-map").click({ position: { x: 120, y: 110 } });
  const lat = Number(
    await p.getByLabel("ละติจูด", { exact: true }).inputValue(),
  );
  if (lat === 13.9919) throw Error("Map pick did not update coordinates");
  await p.getByRole("button", { name: "ยืนยันส่งข้อมูล", exact: true }).click();
  await expect(p.locator(".receipt-id")).toContainText("TT-301");
  await p.getByRole("button", { name: "กลับหน้าหลัก", exact: true }).click();
  await expect(p.locator(".public-case-card").first()).toContainText(
    "ทดสอบเพิ่มปัญหาหน้าหลัก",
  );
  await p
    .getByRole("button", { name: "เปิดรายละเอียด TT-301", exact: true })
    .click();
  await expect(p.locator(".summary-description")).toContainText(
    "ทดสอบคำร้องใหม่",
  );
  await expect(p.locator(".media-grid img")).toBeVisible();
  await p.reload();
  await p
    .getByRole("button", { name: "เปิดรายละเอียด TT-301", exact: true })
    .click();
  await expect(p.locator(".media-grid img")).toBeVisible();
  await p.getByRole("button", { name: "หน้าหลัก", exact: true }).click();
  const roles = [
    "ประชาชน",
    "เจ้าหน้าที่เทศบาล",
    "หัวหน้าผู้ลงพื้นที่",
    "ผู้ลงพื้นที่",
    "ผู้มีอำนาจ / ผู้บริหาร",
  ];
  for (const width of [390, 768, 1280]) {
    await p.setViewportSize({ width, height: 900 });
    for (const name of roles) {
      await p.getByRole("button", { name, exact: true }).click();
      if (
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error("overflow " + name + " " + width);
      if (await p.locator(".fatal-error").count()) throw Error("role crash");
      await p.screenshot({
        path: "../docs/theme-" + roles.indexOf(name) + "-" + width + ".png",
        fullPage: width !== 390,
      });
    }
  }
  await c.clearPermissions();
  await p.getByRole("button", { name: "ประชาชน", exact: true }).click();
  await p.getByRole("button", { name: "แจ้งปัญหาใหม่", exact: true }).click();
  await p.getByRole("button", { name: "ใช้ GPS ของฉัน", exact: true }).click();
  await expect(p.locator(".gps-error")).toBeVisible({ timeout: 18000 });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS 300 seeds/photos, GPS success/denied, map selection, required evidence and optional phone, homepage/detail/reload, 15 role viewport checks",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
