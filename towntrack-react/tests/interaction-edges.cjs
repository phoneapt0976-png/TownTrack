const { chromium } = require("@playwright/test");
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true }),
    c = await b.newContext({ viewport: { width: 390, height: 844 } }),
    p = await c.newPage(),
    other = await c.newPage();
  const { initialize } = await import("../src/model.js");
  await c.addInitScript(
    (seed) => {
      if (!localStorage.getItem("towntrack-react-v1"))
        localStorage.setItem("towntrack-react-v1", JSON.stringify(seed));
    },
    initialize(Date.now(), 5),
  );
  await p.goto(process.env.TOWNTRACK_URL || "http://127.0.0.1:8770/");
  await other.goto(process.env.TOWNTRACK_URL || "http://127.0.0.1:8770/");
  await p.getByRole("button", { name: "แจ้งปัญหาใหม่", exact: true }).click();
  await p.getByRole("button", { name: "โหวต TT-003", exact: true }).click();
  await other.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("towntrack-react-v1")).issues.find(
        (i) => i.id === "TT-003",
      ).votes === 29,
  );
  if (
    !(await other.locator(".rank-votes").allTextContents()).some((v) =>
      v.includes("29"),
    )
  )
    throw Error("cross tab context did not update");
  await p.getByRole("button", { name: /ไม่พบปัญหาที่ต้องการ/ }).click();
  await p.getByRole("button", { name: "เลือกประเภท ไฟไหม้ / เหตุฉุกเฉิน" }).click();
  await p.getByRole("button", { name: "ยืนยันส่งข้อมูล", exact: true }).click();
  if (await p.getByRole("dialog").count())
    throw Error("emergency popup appeared before successful submission");
  if (await p.locator(".receipt-id").count())
    throw Error("invalid form created issue");
  await p.getByRole("button", { name: "เลือกประเภท ขยะ / สิ่งสกปรก" }).click();
  await p
    .locator("input[type=file]")
    .setInputFiles({
      name: "within-limit.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from([0]),
    });
  await p.getByText("within-limit.mp4").waitFor();
  await p.getByRole("button", { name: "ลบ within-limit.mp4" }).click();
  await p
    .getByRole("button", { name: "ผู้มีอำนาจ / ผู้บริหาร", exact: true })
    .click();
  await p.getByLabel("บัญชีทดลองของบทบาท").selectOption("authority-b");
  if (await p.locator(".queue-item").count())
    throw Error("foreign authority pending");
  console.log(
    "PASS cross-tab live sync, fire popup waits for successful report, files within the 1 GB limit are accepted, authority isolation",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
