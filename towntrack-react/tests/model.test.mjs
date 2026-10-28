import test from "node:test";
import assert from "node:assert/strict";
import {
  initialize,
  transition,
  nearby,
  CURRENT_CITIZEN,
  USER_LOCATION,
  roleIssues,
  publicIssue,
} from "../src/model.js";
const actors = {
  citizen: { role: "citizen", id: CURRENT_CITIZEN },
  staff: { role: "staff", id: "staff-demo" },
  supervisor: { role: "supervisor", id: "supervisor-a" },
  worker: { role: "worker", id: "worker-a" },
  authority: { role: "authority", id: "authority-a" },
};
const proof = { id: "proof", name: "photo.png", type: "image/png", size: 60 };
function harness() {
  let db = initialize(Date.now(),5);
  return {
    get db() {
      return db;
    },
    issue(id) {
      return db.issues.find((i) => i.id === id);
    },
    run(type, id, role, payload = {}) {
      const i = this.issue(id);
      const r = transition(
        db,
        { type, id, expectedRevision: i?.revision, payload },
        actors[role],
      );
      db = r.db;
      return r.issue;
    },
  };
}
test("100m radar includes only case 003 and 004, votes once and follows independently", () => {
  const h = harness();
  assert.deepEqual(
    nearby(h.db.issues)
      .map((i) => i.id)
      .sort(),
    ["TT-003", "TT-004"],
  );
  h.run("VOTE", "TT-003", "citizen");
  assert.equal(h.issue("TT-003").votes, 29);
  assert.throws(() => h.run("VOTE", "TT-003", "citizen"));
  h.run("FOLLOW", "TT-003", "citizen");
  assert(h.issue("TT-003").followers.includes(CURRENT_CITIZEN));
  h.run("FOLLOW", "TT-003", "citizen");
  assert(!h.issue("TT-003").followers.includes(CURRENT_CITIZEN));
});
test("staff → supervisor → worker → quality review → final review → closed; guards and rework", () => {
  const h = harness(),
    id = "TT-004";
  h.run("ACCEPT", id, "staff");
  h.run("ASSIGN_SUPERVISOR", id, "staff", {
    supervisorId: "supervisor-a",
    instruction: "เก็บขยะและทำความสะอาด",
  });
  assert.throws(() => h.run("START", id, "worker"));
  h.run("ASSIGN_WORKER", id, "supervisor", { workerId: "worker-a" });
  h.run("WORKER_REJECT", id, "worker", { reason: "ไม่พร้อม" });
  assert.equal(h.issue(id).workerId, null);
  h.run("ASSIGN_WORKER", id, "supervisor", { workerId: "worker-a" });
  h.run("WORKER_ACCEPT", id, "worker");
  h.run("START", id, "worker");
  assert.throws(() =>
    h.run("REPORT", id, "worker", { summary: "เสร็จ", before: [], after: [] }),
  );
  h.run("REPORT", id, "worker", {
    summary: "เก็บแล้ว",
    before: [proof],
    after: [proof],
  });
  assert.throws(() =>
    h.run("STAFF_CLOSE", id, "staff", { reason: "ข้ามตรวจ" }),
  );
  h.run("SUPERVISOR_REWORK", id, "supervisor", { reason: "ล้างจุดทิ้งด้วย" });
  h.run("START", id, "worker");
  h.run("REPORT", id, "worker", {
    summary: "ล้างแล้ว",
    before: [proof],
    after: [proof],
  });
  h.run("SUPERVISOR_PASS", id, "supervisor", { reason: "ตรวจครบ" });
  h.run("STAFF_REWORK", id, "staff", { reason: "ปรับป้ายจุดทิ้ง" });
  h.run("START", id, "worker");
  h.run("REPORT", id, "worker", {
    summary: "ปรับป้ายแล้ว",
    before: [proof],
    after: [proof],
  });
  h.run("SUPERVISOR_PASS", id, "supervisor", { reason: "ผ่าน" });
  h.run("STAFF_CLOSE", id, "staff", { reason: "แก้ไขครบ" });
  assert.equal(h.issue(id).status, "CLOSED");
  assert.throws(() => h.run("ACCEPT", id, "staff"));
  assert.equal(h.issue(id).reports.length, 3);
});
test("budget approval needs evidence of readiness and assigned authority; additional resource loop", () => {
  const h = harness(),
    id = "TT-002";
  assert.throws(() =>
    transition(
      h.db,
      { type: "APPROVE", id, payload: { reason: "ผ่าน", reference: "APP" } },
      { role: "authority", id: "authority-b" },
    ),
  );
  h.run("AUTHORITY_MORE", id, "authority", { reason: "เพิ่มราคา" });
  h.run("PROPOSE", id, "staff", {
    kind: "budget",
    amount: 9000,
    timeframe: "3 วัน",
    reason: "ต้องเปลี่ยน",
    scope: "ฝาท่อ",
    reference: "EST",
    authorityId: "authority-a",
  });
  h.run("APPROVE", id, "authority", { reason: "ผ่าน", reference: "APP" });
  assert.throws(() =>
    h.run("ASSIGN_SUPERVISOR", id, "staff", {
      supervisorId: "supervisor-a",
      instruction: "ซ่อม",
    }),
  );
  h.run("RESOURCE_READY", id, "staff", { reference: "READY" });
  h.run("ASSIGN_SUPERVISOR", id, "staff", {
    supervisorId: "supervisor-a",
    instruction: "ซ่อม",
  });
  h.run("ASSIGN_WORKER", id, "supervisor", { workerId: "worker-a" });
  h.run("WORKER_ACCEPT", id, "worker");
  h.run("REQUEST_RESOURCE", id, "worker", { reason: "ต้องใช้เครื่องยก" });
  h.run("PROPOSE", id, "supervisor", {
    amount: 500,
    timeframe: "1 วัน",
    scope: "เครื่องยก",
    reason: "ยกฝาท่อ",
    reference: "EST2",
    authorityId: "authority-a",
  });
  h.run("APPROVE", id, "authority", { reason: "ผ่าน", reference: "APP2" });
  assert.throws(() => h.run("START", id, "worker"));
  h.run("RESOURCE_READY", id, "staff", { reference: "READY2" });
  h.run("START", id, "worker");
  assert.equal(h.issue(id).status, "IN_PROGRESS");
});
test("legal orders, requests for more, declines, private contact, stale writes", () => {
  const h = harness(),
    id = "TT-004";
  h.run("ACCEPT", id, "staff");
  const p = {
    kind: "legal",
    scope: "ตรวจฐานอำนาจและแจ้งแก้ไข",
    reason: "พบข้อเท็จจริง",
    timeframe: "7 วัน",
    reference: "LEGAL1",
    authorityId: "authority-a",
  };
  h.run("PROPOSE", id, "staff", p);
  h.run("AUTHORITY_MORE", id, "authority", { reason: "เพิ่มหลักฐาน" });
  h.run("PROPOSE", id, "staff", { ...p, reference: "LEGAL2" });
  h.run("APPROVE", id, "authority", {
    reason: "ออกคำสั่ง",
    reference: "ORDER1",
  });
  assert.equal(h.issue(id).status, "LEGAL_ORDERED");
  const cmd = {
    type: "VOTE",
    id,
    expectedRevision: h.issue(id).revision,
    payload: {},
  };
  h.run("FOLLOW", id, "citizen");
  assert.throws(() => transition(h.db, cmd, actors.citizen), /ข้อมูลเปลี่ยน/);
  assert(!("phone" in publicIssue(h.issue(id))));
  assert.equal(roleIssues(h.db, { role: "worker", id: "worker-b" }).length, 0);
});
test("create validates input and rejects retired fire reports", () => {
  const h = harness(),
    p = {
      category: "ถนนชำรุด",
      location: USER_LOCATION,
      place: "โกดัง",
      phone: "081-234-5678",
      description: "พบควัน",
      media: [proof],
    };
  assert.throws(() =>
    h.run("CREATE", null, "citizen", { ...p, description: " " }),
  );
  assert.throws(() => h.run("CREATE", null, "citizen", { ...p, phone: "123" }));
  assert.throws(() =>
    h.run("CREATE", null, "citizen", {
      ...p,
      media: [{ ...proof, size: 10 * 1024 * 1024 }],
    }),
  );
  assert.throws(()=>h.run("CREATE",null,"citizen",{...p,media:[]}), /แนบรูปหลักฐาน/);
  const optional=h.run("CREATE",null,"citizen",{...p,phone:""});
  assert.equal(optional.phone,"");
  const i = h.run("CREATE", null, "citizen", p);
  assert.equal(i.priority, "normal");
  assert.equal(i.phone, "0812345678");
  assert.equal(h.run("REJECT_CASE", i.id, "staff", { reason: "นอกเขต" }).status, "CLOSED");
  assert.throws(() => h.run("CREATE", null, "citizen", { ...p, category: "ไฟไหม้" }), /เลือกประเภท/);
});

test("300 mock cases have evidence and assigned roles; migration preserves live cases", async()=>{const {upgradeDemo}=await import("../src/demo.js");const db=initialize();assert.equal(db.issues.length,300);assert.equal(new Set(db.issues.map(i=>i.id)).size,300);assert(db.issues.every(i=>i.media.length>0));assert(roleIssues(db,{role:"worker",id:"worker-b"}).every(i=>i.workerId==="worker-b"));const old=initialize(Date.now(),5);delete old.demoDatasetVersion;old.issues[0].votes=999;const upgraded=upgradeDemo(old);assert.equal(upgraded.issues.length,300);assert.equal(upgraded.issues[0].votes,999);assert.equal(upgradeDemo(upgraded).issues.length,300);});

test("V4 retires fire records without losing user data or reusing IDs", async () => {
  const { upgradeDemo } = await import("../src/demo.js");
  const db = initialize(Date.now(), 5);
  db.demoDatasetVersion = 2;
  db.issues.push({ ...structuredClone(db.issues[0]), id: "TT-900", category: "ไฟไหม้", isMock: false });
  db.issues.push({ ...structuredClone(db.issues[0]), id: "TT-901", category: "ไฟไหม้", isMock: true });
  db.issues[0].priority = "emergency";
  const updated = upgradeDemo(db);
  assert.equal(updated.demoDatasetVersion, 4);
  assert.equal(updated.issues.length, 300);
  assert(updated.issues.every(i => i.category !== "ไฟไหม้" && i.priority !== "emergency"));
  assert.equal(updated.retiredIssues.length, 1);
  assert.equal(updated.retiredIssues[0].id, "TT-900");
  assert.equal(upgradeDemo(updated).retiredIssues.length, 1);
  const created = transition(updated, { type: "CREATE", payload: { category: "ถนนชำรุด", description: "ถนนชำรุด", place: "ชุมชน", location: USER_LOCATION, media: [proof] } }, actors.citizen);
  assert(Number(created.db.issues.at(-1).id.split("-")[1]) > 900);
});

