import samples from "./sample-images.json" with { type: "json" };
export const SAMPLE_IMAGES = samples;
export function sampleFor(category) {
  const names = [
    "ไฟฟ้าส่องสว่าง",
    "ถนนชำรุด",
    "ขยะมูลฝอย",
    "ท่อระบายน้ำ",
    "กิ่งไม้/ความปลอดภัย",
  ];
  return samples[names.indexOf(category)] || samples[0];
}
export function expandDemo(db, count = 300, now = Date.now()) {
  const base = db.issues.slice(0, 5);
  for (const i of base) {
    if (i.history.some((h) => h.id === "seed-" + i.id.slice(3))) {
      i.isMock = true;
      if (!i.media.length)
        i.media = [{ ...sampleFor(i.category), id: "sample-" + i.id }];
    }
  }
  const templates = [
    "ไฟส่องสว่างดับ",
    "ถนนแตกร้าวและเป็นหลุม",
    "ขยะสะสมข้างทาง",
    "ท่อระบายน้ำอุดตัน",
    "ต้นไม้ล้มกีดขวางทาง",
  ];
  const places = [
    "ชุมชนตลาดระแหง",
    "ซอยเทศบาล",
    "ถนนเลียบคลอง",
    "ชุมชนร่วมใจ",
    "บริเวณโรงเรียน",
    "หมู่บ้านริมน้ำ",
  ];
  let num = 6;
  while (db.issues.length < count) {
    const id = "TT-" + String(num).padStart(3, "0");
    num++;
    if ([...db.issues, ...(db.retiredIssues || [])].some((i) => i.id === id)) continue;
    const n = num - 2,
      c = n % 5,
      category = [
        "ไฟฟ้าส่องสว่าง",
        "ถนนชำรุด",
        "ขยะมูลฝอย",
        "ท่อระบายน้ำ",
        "กิ่งไม้/ความปลอดภัย",
          ][c];
    const statuses = [
      "NEW",
      "SUPERVISOR",
      "ASSIGNED",
      "ACCEPTED",
      "IN_PROGRESS",
      "ON_SITE",
      "CLOSED",
      "BUDGET_PENDING",
    ];
    const status = statuses[Math.floor(n / 3) % 8],
      team = Math.floor(n / 8) % 2 ? "a" : "b";
    const at = new Date(
      now - (1 + (n % 85)) * 86400000 - (n % 24) * 3600000,
    ).toISOString();
    const source = status === "BUDGET_PENDING" ? base[1] : base[0];
    const i = structuredClone(source);
    Object.assign(i, {
      id,
      title:
        templates[c] +
        " · " +
        places[Math.floor(n / 6) % 6] +
        " " +
        (1 + (n % 35)),
      category,
      description:
        templates[c] +
        " บริเวณทางสัญจร ขอให้เจ้าหน้าที่ตรวจสอบและแก้ไข (ข้อมูลจำลอง)",
      place: places[Math.floor(n / 6) % 6] + " ซอย " + (1 + (n % 35)),
      location: {
        lat: 13.9919 + Math.sin(n * 2.399) * (0.002 + (n % 30) * 0.00035),
        lng: 100.4169 + Math.cos(n * 2.399) * (0.002 + (n % 25) * 0.0004),
      },
      isMock: true,
      createdAt: at,
      updatedAt: at,
      revision: 0,
      status,
      priority: n % 7 === 0 ? "urgent" : "normal",
      votes: 1 + ((n * 17) % 79),
      voters: [],
      followers: [],
      reportedBy: n % 11 === 0 ? "citizen-demo" : "mock-resident-" + num,
      reporterName: "ผู้แจ้งตัวอย่าง " + num,
      phone: "",
      supervisorId: [
        "SUPERVISOR",
        "ASSIGNED",
        "ACCEPTED",
        "IN_PROGRESS",
        "ON_SITE",
        "CLOSED",
      ].includes(status)
        ? "supervisor-" + team
        : null,
      workerId: [
        "ASSIGNED",
        "ACCEPTED",
        "IN_PROGRESS",
        "ON_SITE",
        "CLOSED",
      ].includes(status)
        ? "worker-" + team
        : null,
      media: [{ ...sampleFor(category), id: "sample-" + id }],
      reports: [],
      decisions: [],
      history: [
        {
          id: "demo-" + id,
          at,
          status,
          text: "ข้อมูลจำลองสำหรับทดสอบ · " + templates[c],
          actorName: "ระบบตัวอย่าง",
        },
      ],
      proposal:
        status === "BUDGET_PENDING"
          ? {
              ...structuredClone(base[1].proposal || {}),
              kind: "budget",
              amount: 5000 + n * 100,
              timeframe: "3 วัน",
              reason: templates[c],
              scope: "ตรวจสอบและแก้ไข " + category,
              reference: "DEMO-" + id,
              authorityId: "authority-" + team,
              submittedBy: "staff-demo",
              origin: "staff",
              versions: 1,
              evidence: [{ ...sampleFor(category), id: "proposal-" + id }],
            }
          : null,
      closedReason:
        status === "CLOSED" ? "แก้ไขและตรวจสอบแล้ว (ข้อมูลจำลอง)" : null,
    });
    db.issues.push(i);
  }
  // Give both citizen tracking tabs a completed case to try the rating flow.
  const followedClosed = db.issues.find((issue) => issue.id === "TT-005");
  if (followedClosed?.isMock) {
    if (!followedClosed.followers.includes("citizen-demo"))
      followedClosed.followers.push("citizen-demo");
    followedClosed.satisfaction ||= [{
      actorId: "resident-example", score: 4,
      comment: "เจ้าหน้าที่แจ้งความคืบหน้าชัดเจนและแก้ไขเรียบร้อย",
      at: followedClosed.updatedAt, relationship: "follower",
    }];
  }
  const ownClosed = db.issues.find(
    (issue) => issue.id !== "TT-005" && issue.isMock && issue.status === "CLOSED",
  );
  if (ownClosed) {
    ownClosed.reportedBy = "citizen-demo";
    if (!ownClosed.followers.includes("citizen-demo"))
      ownClosed.followers.push("citizen-demo");
  }
  db.demoDatasetVersion = 4;
  return db;
}
export function upgradeDemo(db) {
  if (db.demoDatasetVersion === 4) return db;
  const retired = db.issues.filter(i => i.category === "ไฟไหม้" && !i.isMock);
  db.retiredIssues = [...(db.retiredIssues || []), ...retired];
  db.issues = db.issues.filter(i => i.category !== "ไฟไหม้");
  for (const issue of db.issues) {
    if (issue.priority === "emergency") issue.priority = "urgent";
  }
  return expandDemo(db);
}
