const { chromium } = require("@playwright/test");
const fs = require("fs"),
  path = require("path");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 1050 } }),
    p = await c.newPage();
  const { initialize } = await import("../src/model.js");
  await c.addInitScript(
    (seed) => {
      if (!localStorage.getItem("towntrack-react-v1"))
        localStorage.setItem("towntrack-react-v1", JSON.stringify(seed));
    },
    initialize(Date.now(), 5),
  );
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.TOWNTRACK_URL || "http://127.0.0.1:8770/");
  const db = () =>
    p.evaluate(() => JSON.parse(localStorage.getItem("towntrack-react-v1")));
  const role = (name) => p.getByRole("button", { name, exact: true }).click();
  const queue = (txt) =>
    p.locator(".queue-item").filter({ hasText: txt }).click();
  const confirm = () =>
    p
      .locator(".modal form")
      .getByRole("button", { name: "ยืนยัน", exact: true })
      .click();
  const png = {
    name: "proof.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7yUAAAAASUVORK5CYII=",
      "base64",
    ),
  };
  await p.getByRole("button", { name: "แจ้งปัญหาใหม่", exact: true }).click();
  const cards = p.locator(".nearby-card");
  if ((await cards.count()) !== 2) throw Error("100m list incorrect");
  await p.getByRole("button", { name: "โหวต TT-003", exact: true }).click();
  if ((await db()).issues.find((i) => i.id === "TT-003").votes !== 29)
    throw Error("vote");
  if (
    await p
      .getByRole("button", { name: "โหวต TT-003", exact: true })
      .isEnabled()
  )
    throw Error("vote button not disabled");
  await p.getByRole("button", { name: "ติดตาม TT-004", exact: true }).click();
  await p.reload();
  if (
    !(await db()).issues
      .find((i) => i.id === "TT-004")
      .followers.includes("citizen-demo")
  )
    throw Error("follow persistence");
  await role("เจ้าหน้าที่เทศบาล");
  await queue("TT-004");
  await p.getByRole("button", { name: "รับคำร้อง", exact: true }).click();
  await p
    .getByRole("button", { name: "ไม่ต้อง · มอบหมายหัวหน้าทีม", exact: true })
    .click();
  await confirm();
  await role("หัวหน้าผู้ลงพื้นที่");
  await queue("TT-004");
  await p
    .getByRole("button", { name: "มอบหมายทีมผู้ลงพื้นที่", exact: true })
    .click();
  await confirm();
  await role("ผู้ลงพื้นที่");
  await queue("TT-004");
  await p.getByRole("button", { name: "กดรับงาน", exact: true }).click();
  await p.getByRole("button", { name: "เริ่มปฏิบัติงาน", exact: true }).click();
  await p
    .getByRole("button", { name: "ส่งรายงานพร้อมภาพก่อน / หลัง", exact: true })
    .click();
  await p.getByLabel(/ผลที่พบ/).fill("เก็บขยะและล้างจุดทิ้งแล้ว ตรวจปลอดภัย");
  const upload = p.locator(".modal input[type=file]");
  await upload.nth(0).setInputFiles(png);
  await upload.nth(1).setInputFiles(png);
  await p
    .locator(".modal")
    .getByRole("button", { name: "ส่งรายงาน", exact: true })
    .click();
  await role("หัวหน้าผู้ลงพื้นที่");
  await queue("TT-004");
  await p
    .getByRole("button", { name: "ผ่าน · ส่งเทศบาลตรวจปิด", exact: true })
    .click();
  await p.getByLabel(/เหตุผล \/ ผลตรวจ/).fill("ตรวจคุณภาพและหลักฐานครบแล้ว");
  await p
    .locator(".modal")
    .getByRole("button", { name: "ผ่าน · ส่งให้เทศบาลตรวจปิด", exact: true })
    .click();
  await role("เจ้าหน้าที่เทศบาล");
  await queue("TT-004");
  await p
    .getByRole("button", { name: "ผ่าน · ปิดเรื่อง", exact: true })
    .click();
  await p.getByLabel(/ผลตรวจและคำอธิบาย/).fill("ตรวจความสะอาดและปิดเรื่อง");
  await p
    .locator(".modal")
    .getByRole("button", { name: "ยืนยันปิดเรื่อง", exact: true })
    .click();
  if ((await db()).issues.find((i) => i.id === "TT-004").status !== "CLOSED")
    throw Error("close");
  await p.getByRole("button", { name: "ประวัติ", exact: true }).click();
  await queue("TT-004");
  await p.reload();
  await p.getByRole("button", { name: "ประวัติ", exact: true }).click();
  await queue("TT-004");
  await p.locator(".before-after img").first().waitFor({ state: "visible" });
  if ((await p.locator(".before-after img").count()) !== 2)
    throw Error("media persistence missing");
  await role("ผู้มีอำนาจ / ผู้บริหาร");
  await queue("TT-002");
  await p.getByRole("button", { name: "อนุมัติ", exact: true }).click();
  await p.getByLabel(/เหตุผล \/ ผลตรวจ/).fill("อนุมัติตามประมาณการ");
  await p.getByLabel(/เลขเอกสาร \/ หลักฐาน/).fill("APP-002");
  await p
    .locator(".modal")
    .getByRole("button", { name: "อนุมัติ", exact: true })
    .click();
  if ((await db()).issues.find((i) => i.id === "TT-002").status !== "APPROVED")
    throw Error("approval");
  await role("เจ้าหน้าที่เทศบาล");
  await queue("TT-002");
  await p
    .getByRole("button", { name: "บันทึกหลักฐานพร้อมใช้", exact: true })
    .click();
  await p.getByLabel(/เลขเอกสาร \/ หลักฐาน/).fill("READY-002");
  await confirm();
  await p
    .getByRole("button", { name: "มอบหมายหัวหน้าทีม", exact: true })
    .click();
  await confirm();
  await role("ประชาชน");
  await p.getByRole("button", { name: "แจ้งปัญหาใหม่", exact: true }).click();
  await p.getByRole("button", { name: /ไม่พบปัญหาที่ต้องการ/ }).click();
  await p.getByRole("button", { name: "เลือกประเภท ไฟไหม้ / เหตุฉุกเฉิน" }).click();
  await p.getByLabel(/รายละเอียดปัญหา/).fill("ไฟไหม้บริเวณโกดังตัวอย่าง");
  await p.locator("input[type=file]").setInputFiles(png);
  await p.getByRole("button", { name: "ยืนยันส่งข้อมูล", exact: true }).click();
  await p
    .getByRole("dialog", { name: "แจ้งเหตุด่วน: ไฟไหม้ / อัคคีภัย" })
    .waitFor();
  if (!(await p.locator('.modal a[href="tel:199"]').count()))
    throw Error("199 link missing");
  if (!(await p.locator('.modal a[href="tel:025991543"]').count()))
    throw Error("municipal link missing");
  await p.getByRole("button", { name: "รับทราบและปิด", exact: true }).click();
  const fire = (await db()).issues.at(-1);
  if (fire.priority !== "emergency") throw Error("fire priority");
  await role("ผู้ลงพื้นที่");
  await p.getByLabel("บัญชีทดลองของบทบาท").selectOption("worker-b");
  if (await p.locator(".queue-item").count())
    throw Error("foreign worker visible");
  await p.setViewportSize({ width: 390, height: 844 });
  for (const name of [
    "ประชาชน",
    "เจ้าหน้าที่เทศบาล",
    "หัวหน้าผู้ลงพื้นที่",
    "ผู้ลงพื้นที่",
    "ผู้มีอำนาจ / ผู้บริหาร",
  ]) {
    await role(name);
    if (
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    )
      throw Error("overflow " + name);
  }
  const out = path.resolve("../docs/react-prototype");
  fs.mkdirSync(out, { recursive: true });
  await role("ประชาชน");
  await p.screenshot({
    path: path.join(out, "citizen-mobile.png"),
    fullPage: true,
  });
  await p.setViewportSize({ width: 1440, height: 1050 });
  await role("เจ้าหน้าที่เทศบาล");
  await queue("TT-001");
  await p.screenshot({
    path: path.join(out, "staff-desktop.png"),
    fullPage: true,
  });
  await role("ผู้มีอำนาจ / ผู้บริหาร");
  await p.screenshot({
    path: path.join(out, "authority-desktop.png"),
    fullPage: true,
  });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: radar, vote/follow persistence, five-role workflow, reports and photos after reload, budget readiness, fire modal, role isolation, responsive 390px",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
