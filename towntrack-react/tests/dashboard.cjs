const { chromium, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true }),
    c = await b.newContext(),
    p = await c.newPage();
  await p.goto(process.env.TOWNTRACK_URL || "http://127.0.0.1:8770/");
  await p.getByLabel("ค้นหาปัญหาสาธารณะ").fill("TT-002");
  await expect(p.locator(".public-case-card")).toHaveCount(1);
  await expect(p.locator(".public-case-card")).toContainText("TT-002");
  const [download] = await Promise.all([
    p.waitForEvent("download"),
    p.getByRole("button", { name: "ดาวน์โหลด CSV" }).click(),
  ]);
  const csv = await fs.readFile(await download.path(), "utf8");
  if (!csv.includes("TT-002") || csv.includes("TT-003") || csv.includes("081"))
    throw Error("CSV filter/privacy");
  await p.getByRole("button", { name: "ล้างตัวกรอง", exact: true }).click();
  await p.getByLabel("กรองประเภทปัญหา").selectOption("ขยะมูลฝอย");
  for (const title of await p
    .locator(".public-case-card .cover-category")
    .allTextContents())
    if (title !== "ขยะมูลฝอย") throw Error("category filter");
  await p.getByRole("button", { name: "ล้างตัวกรอง", exact: true }).click();
  await p.locator(".tile-green").click();
  for (const status of await p
    .locator(".public-case-card .badge")
    .allTextContents())
    if (status !== "ปิดเรื่องเรียบร้อย") throw Error("status filter");
  console.log(
    "PASS dashboard category/status/search and filtered CSV without phone",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
