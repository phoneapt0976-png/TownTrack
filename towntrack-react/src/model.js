import { expandDemo } from "./demo.js";
export const USER_LOCATION = { lat: 13.9919, lng: 100.4169 };
export const CURRENT_CITIZEN = "citizen-demo";
export const CITIZEN_EDIT_WINDOW_DAYS = 7;
export const MUNICIPALITY = "เทศบาลตำบลระแหง";
export const MUNICIPAL_PHONE = "02-599-1543";
export const STATUS = {
  NEW: "รอดำเนินการ",
  RECEIVED: "รับคำร้องแล้ว",
  NEEDS_INFO: "รอประชาชนส่งข้อมูล",
  BUDGET_PENDING: "รอการจัดสรรงบประมาณ",
  BUDGET_MORE: "รอข้อมูลข้อเสนอเพิ่มเติม",
  APPROVED: "อนุมัติงบประมาณแล้ว",
  SUPERVISOR: "รอหัวหน้าจัดทีม",
  RESOURCE_SUPERVISOR: "รอหัวหน้าตรวจคำขอทรัพยากร",
  RESOURCE_STAFF: "รอเจ้าหน้าที่ส่งคำขอทรัพยากร",
  ASSIGNED: "มอบหมายผู้ลงพื้นที่แล้ว",
  ACCEPTED: "รับงานแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  ON_SITE: "เจ้าหน้าที่กำลังลงพื้นที่",
  SUPERVISOR_REVIEW: "รอหัวหน้าตรวจรายงาน",
  STAFF_REVIEW: "รอเทศบาลตรวจปิด",
  REWORK: "รอแก้ไขเพิ่มเติม",
  LEGAL_PENDING: "รอผู้มีอำนาจพิจารณาคำสั่ง",
  LEGAL_MORE: "รอเอกสารคำสั่งเพิ่มเติม",
  LEGAL_ORDERED: "ออกคำสั่งแล้ว รอติดตาม",
  CLOSED: "ปิดเรื่องเรียบร้อย",
};
export const CATEGORIES = [
  "ไฟฟ้าส่องสว่าง",
  "ถนนชำรุด",
  "ขยะมูลฝอย",
  "ท่อระบายน้ำ",
  "กิ่งไม้/ความปลอดภัย",
  "อื่นๆ",
];
export const PEOPLE = {
  staff: [{ id: "staff-demo", name: "เจ้าหน้าที่รับเรื่อง" }],
  supervisor: [
    { id: "supervisor-a", name: "หัวหน้าช่าง · ทีม A" },
    { id: "supervisor-b", name: "หัวหน้าช่าง · ทีม B" },
  ],
  worker: [
    { id: "worker-a", name: "ช่างภาคสนาม · ทีม A" },
    { id: "worker-b", name: "ช่างภาคสนาม · ทีม B" },
  ],
  authority: [
    { id: "authority-a", name: "ผู้มีอำนาจพิจารณา A" },
    { id: "authority-b", name: "ผู้มีอำนาจพิจารณา B" },
  ],
};
export const TERMINAL = ["CLOSED"];
export const REVIEW_STAGES = ["SUPERVISOR_REVIEW", "STAFF_REVIEW"];
export function distance(a, b) {
  const r = Math.PI / 180,
    dy = (a.lat - b.lat) * r,
    dx = (a.lng - b.lng) * r,
    n =
      Math.sin(dy / 2) ** 2 +
      Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dx / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(n), Math.sqrt(1 - n));
}
export function nearby(issues, loc = USER_LOCATION) {
  return issues
    .filter((i) => i.status !== "CLOSED" && distance(i.location, loc) <= 100)
    .sort((a, b) => distance(a.location, loc) - distance(b.location, loc));
}
export function initialize(now = Date.now(), count = 300) {
  const seeds = [
    [
      "001",
      "เสาไฟส่องสว่างดับท้ายซอย 4",
      "ไฟฟ้าส่องสว่าง",
      42,
      "IN_PROGRESS",
      0.00135,
      0,
      "ท้ายซอยร่วมใจ 4",
      "ไฟส่องสว่างดับติดต่อกัน 3 คืน คนเดินกลับบ้านมองไม่เห็นทาง",
    ],
    [
      "002",
      "ฝาท่อระบายน้ำแตก ชำรุด",
      "ท่อระบายน้ำ",
      35,
      "BUDGET_PENDING",
      0,
      0.0017,
      "หน้าตลาดระแหง",
      "ฝาท่อคอนกรีตแตก มีช่องกว้าง เสี่ยงตก ต้องเปลี่ยนฝาท่อใหม่",
    ],
    [
      "003",
      "ถนนเป็นหลุมลึกขนาดใหญ่ สัญจรอันตราย",
      "ถนนชำรุด",
      28,
      "ON_SITE",
      0.00065,
      0.0001,
      "ซอยเทศบาล 3 ใกล้ปากทาง",
      "หลุมลึกประมาณ 15 ซม. รถจักรยานยนต์ต้องหักหลบ มีน้ำขังหลังฝนตก",
    ],
    [
      "004",
      "ขยะตกค้างไม่ได้เก็บมากกว่า 4 วัน",
      "ขยะมูลฝอย",
      19,
      "NEW",
      -0.00042,
      0.0002,
      "จุดรวมขยะชุมชนริมน้ำ",
      "ถังขยะเต็มและล้นลงบนถนน มีกลิ่นรบกวนและแมลงจำนวนมาก",
    ],
    [
      "005",
      "กิ่งไม้ใหญ่พาดสายไฟแรงสูง",
      "กิ่งไม้/ความปลอดภัย",
      14,
      "CLOSED",
      -0.0019,
      -0.0006,
      "ถนนเลียบคลองหน้าโรงเรียน",
      "กิ่งไม้พาดสายไฟ เจ้าหน้าที่ประสานเจ้าของระบบและตัดแต่งแล้ว",
    ],
  ];
  const db = {
    schema: 1,
    issues: seeds.map((s, k) => {
      const [
          num,
          title,
          category,
          votes,
          status,
          lat,
          lng,
          place,
          description,
        ] = s,
        at = new Date(now - (6 - k) * 86400000).toISOString();
      return {
        id: "TT-" + num,
        title,
        category,
        description,
        place,
        location: {
          lat: USER_LOCATION.lat + lat,
          lng: USER_LOCATION.lng + lng,
        },
        votes,
        voters: [],
        followers: k === 0 ? [CURRENT_CITIZEN] : [],
        reportedBy: k === 2 ? CURRENT_CITIZEN : "resident-" + num,
        reporterName: k === 2 ? "สมชาย ใจดี" : "ประชาชนตัวอย่าง",
        phone: "0812345678",
        priority: k === 4 ? "urgent" : "normal",
        status,
        createdAt: at,
        updatedAt: at,
        revision: 0,
        supervisorId: ["IN_PROGRESS", "ON_SITE", "CLOSED"].includes(status)
          ? "supervisor-a"
          : null,
        workerId: ["IN_PROGRESS", "ON_SITE", "CLOSED"].includes(status)
          ? "worker-a"
          : null,
        scheduleDate: new Date(now).toISOString().slice(0, 10),
        instruction:
          "ตรวจพื้นที่และกั้นบริเวณที่มีความเสี่ยง ปฏิบัติงานตามมาตรการความปลอดภัย",
        warnings: category.includes("ไฟ")
          ? "ประสานการไฟฟ้า ห้ามสัมผัสสายไฟ"
          : "กั้นพื้นที่และสวมอุปกรณ์ป้องกัน",
        media: [],
        reports: [],
        history: [
          {
            id: "seed-" + num,
            at,
            status: "NEW",
            text: "รับเรื่องตัวอย่างในระบบ",
            actorName: "ระบบ",
          },
          {
            id: "seed-status-" + num,
            at,
            status,
            text:
              status === "CLOSED"
                ? "แก้ไขแล้ว ตรวจความปลอดภัยและแจ้งผลผู้ร้อง"
                : "สถานะปัจจุบันของข้อมูลตัวอย่าง",
            actorName: "เทศบาล",
          },
        ],
        proposal:
          status === "BUDGET_PENDING"
            ? {
                kind: "budget",
                amount: 8500,
                timeframe: "3 วัน",
                reason: "เปลี่ยนฝาท่อที่ชำรุดเพื่อป้องกันอุบัติเหตุ",
                scope: "ฝาท่อคอนกรีต 2 ชุด พร้อมติดตั้ง",
                budgetSource: "งบซ่อมบำรุงสาธารณูปโภค",
                reference: "ประมาณการ ช.002/2569",
                evidence: [],
                submittedBy: "staff-demo",
                authorityId: "authority-a",
                origin: "staff",
                versions: 1,
              }
            : null,
        decisions: [],
        closedReason:
          status === "CLOSED" ? "ประสานการไฟฟ้าและตัดกิ่งไม้เรียบร้อย" : null,
      };
    }),
  };
  return expandDemo(db, count, now);
}
const requireText = (v, msg) => {
  if (!String(v || "").trim()) throw Error(msg);
  return String(v).trim();
};
const actorName = (a) =>
  a.role === "citizen"
    ? "ผู้แจ้ง"
    : PEOPLE[a.role]?.find((p) => p.id === a.id)?.name || a.id;
export function normalizePhone(v) {
  const n = String(v)
    .replace(/[๐-๙]/g, (c) => "๐๑๒๓๔๕๖๗๘๙".indexOf(c))
    .replace(/[\s()-]/g, "")
    .replace(/^\+?66/, "0");
  if (!/^0[689]\d{8}$/.test(n))
    throw Error("กรุณากรอกเบอร์มือถือ 10 หลัก เช่น 0812345678");
  return n;
}
export function expireIncompleteCases(db, now = new Date().toISOString()) {
  const nowMs = new Date(now).getTime();
  const overdue = (issue) => {
    const deadline = new Date(issue.citizenEditDeadline || "").getTime();
    return !Number.isFinite(deadline) || deadline <= nowMs;
  };
  const due = db.issues.some(
    (issue) =>
      issue.status === "NEEDS_INFO" &&
      overdue(issue),
  );
  if (!due) return { db, changed: false };

  const next = structuredClone(db);
  for (const issue of next.issues) {
    if (
      issue.status !== "NEEDS_INFO" ||
      !overdue(issue)
    )
      continue;
    issue.status = "CLOSED";
    issue.closedReason = `ปิดเรื่องอัตโนมัติ เนื่องจากไม่ได้รับข้อมูลเพิ่มเติมภายใน ${CITIZEN_EDIT_WINDOW_DAYS} วัน`;
    issue.revision++;
    issue.updatedAt = now;
    issue.history.push({
      id: crypto.randomUUID(),
      at: now,
      status: "CLOSED",
      text: issue.closedReason,
      actorName: "ระบบ",
    });
  }
  return { db: next, changed: true };
}
function authorizedPerson(a) {
  if (a.role === "citizen")
    return a.id === CURRENT_CITIZEN || String(a.id).startsWith("line:");
  return PEOPLE[a.role]?.some((p) => p.id === a.id);
}
function validMedia(list = []) {
  if (
    !Array.isArray(list) ||
    list.length > 5 ||
    list.some(
      (m) =>
        !m.id ||
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "video/webm",
          "video/quicktime",
        ].includes(m.type) ||
        m.size <= 0 ||
        m.size >= 10 * 1024 * 1024,
    )
  )
    throw Error("ไฟล์แนบไม่ถูกต้อง ต้องน้อยกว่า 10 MB สูงสุด 5 ไฟล์");
}
export function transition(db, cmd, actor, now = new Date().toISOString()) {
  if (!authorizedPerson(actor)) throw Error("ไม่มีสิทธิ์ดำเนินการ");
  const next = structuredClone(db),
    p = cmd.payload || {},
    kind = cmd.type;
  if (kind === "CREATE") {
    if (actor.role !== "citizen") throw Error("เฉพาะประชาชนส่งคำร้อง");
    const description = requireText(p.description, "กรุณากรอกรายละเอียดปัญหา");
    if (!CATEGORIES.includes(p.category)) throw Error("เลือกประเภทปัญหา");
    if (
      !p.location ||
      !Number.isFinite(p.location.lat) ||
      !Number.isFinite(p.location.lng) ||
      Math.abs(p.location.lat) > 90 ||
      Math.abs(p.location.lng) > 180
    )
      throw Error("ตำแหน่งไม่ถูกต้อง");
    validMedia(p.media);
    if (!p.media?.length)
      throw Error("กรุณาแนบรูปหลักฐานหรือวิดีโออย่างน้อย 1 ไฟล์");
    const max = Math.max(
        5,
        ...[...next.issues, ...(next.retiredIssues || [])].map((i) => Number(i.id.split("-")[1]) || 0),
      ),
      id = "TT-" + String(max + 1).padStart(3, "0");
    next.issues.push({
      id,
      title: p.title?.trim() || description.slice(0, 60),
      description,
      category: p.category,
      phone: p.phone?.trim() ? normalizePhone(p.phone) : "",
      reporterName: p.reporterName?.trim() || "",
      location: p.location,
      place: requireText(p.place, "ระบุจุดสังเกตหรือสถานที่"),
      reportedBy: actor.id,
      votes: 0,
      voters: [],
      followers: [actor.id],
      priority: "normal",
      status: "NEW",
      media: p.media || [],
      reports: [],
      history: [
        {
          id: crypto.randomUUID(),
          at: now,
          status: "NEW",
          text: "ส่งคำร้องพร้อมพิกัดแล้ว",
          actorName: "ผู้แจ้ง",
        },
      ],
      decisions: [],
      createdAt: now,
      updatedAt: now,
      revision: 0,
    });
    return { db: next, issue: next.issues.at(-1) };
  }
  const issue = next.issues.find((i) => i.id === cmd.id);
  if (!issue) throw Error("ไม่พบคำร้อง");
  if (
    cmd.expectedRevision !== undefined &&
    cmd.expectedRevision !== issue.revision
  )
    throw Error("ข้อมูลเปลี่ยนจากอีกหน้าแล้ว โปรดเปิดคำร้องล่าสุด");
  let text = "",
    event = true;
  if (["VOTE", "FOLLOW", "RATE"].includes(kind)) {
    if (actor.role !== "citizen") throw Error("เฉพาะประชาชนใช้รายการนี้ได้");
    if (kind === "RATE") {
      if (issue.status !== "CLOSED") throw Error("ประเมินได้เมื่อปิดเรื่องแล้ว");
      if (issue.reportedBy !== actor.id && !issue.followers.includes(actor.id))
        throw Error("ประเมินได้เฉพาะเรื่องที่แจ้งเองหรือกำลังติดตาม");
      if (issue.satisfaction?.some((entry) => entry.actorId === actor.id))
        throw Error("คุณประเมินเรื่องนี้แล้ว");
      if (!Number.isInteger(p.score) || p.score < 1 || p.score > 5)
        throw Error("กรุณาเลือกคะแนน 1 ถึง 5");
      const comment = String(p.comment || "").trim();
      if (comment.length > 300) throw Error("ความคิดเห็นต้องไม่เกิน 300 ตัวอักษร");
      issue.satisfaction = [
        ...(issue.satisfaction || []),
        { actorId: actor.id, score: p.score, comment, at: now,
          relationship: issue.reportedBy === actor.id ? "reporter" : "follower" },
      ];
    } else if (kind === "VOTE") {
      if (issue.status === "CLOSED") throw Error("เรื่องนี้ปิดแล้ว");
      if (issue.voters.includes(actor.id)) throw Error("คุณโหวตเรื่องนี้แล้ว");
      issue.voters.push(actor.id);
      issue.votes++;
    } else {
      if (issue.followers.includes(actor.id))
        issue.followers = issue.followers.filter((id) => id !== actor.id);
      else issue.followers.push(actor.id);
    }
    event = false;
  } else {
    if (issue.status === "CLOSED")
      throw Error("ปิดเรื่องแล้ว ไม่สามารถแก้ไขได้");
    const isStaff = actor.role === "staff",
      isSup = actor.role === "supervisor" && issue.supervisorId === actor.id,
      isWorker = actor.role === "worker" && issue.workerId === actor.id,
      isAuthority =
        actor.role === "authority" && issue.proposal?.authorityId === actor.id;
    const ensure = (allowed, statuses) => {
      if (!allowed) throw Error("ไม่ใช่งานที่คุณมีสิทธิ์ดำเนินการ");
      if (statuses && !statuses.includes(issue.status))
        throw Error("ดำเนินการได้เฉพาะขั้นที่กำหนด ห้ามข้ามหรือย้อนสถานะ");
    };
    const set = (status, msg) => {
      issue.status = status;
      text = msg;
    };
    switch (kind) {
      case "STAFF_REQUEST_CITIZEN_INFO": {
        ensure(isStaff, ["NEW", "RECEIVED"]);
        const requestedAt = now,
          deadline = new Date(
            new Date(now).getTime() +
              CITIZEN_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
          ).toISOString();
        issue.requestedInfo = requireText(
          p.reason,
          "ระบุข้อมูลที่ประชาชนต้องเพิ่มเติม",
        );
        issue.citizenEditRequestedAt = requestedAt;
        issue.citizenEditDeadline = deadline;
        issue.infoRequestHistory = [
          ...(issue.infoRequestHistory || []),
          {
            at: requestedAt,
            deadline,
            note: issue.requestedInfo,
            actorId: actor.id,
          },
        ];
        set(
          "NEEDS_INFO",
          `ขอข้อมูลเพิ่มเติมจากประชาชน ให้แก้ไขภายใน ${CITIZEN_EDIT_WINDOW_DAYS} วัน`,
        );
        break;
      }
      case "CITIZEN_UPDATE": {
        if (actor.role !== "citizen" || issue.reportedBy !== actor.id)
          throw Error("แก้ไขได้เฉพาะคำร้องของบัญชีประชาชนนี้");
        ensure(true, ["NEEDS_INFO"]);
        const deadline = new Date(issue.citizenEditDeadline || "").getTime();
        if (!Number.isFinite(deadline) || deadline <= new Date(now).getTime())
          throw Error("หมดเวลาแก้ไขข้อมูลแล้ว ระบบปิดเรื่องเรียบร้อย");
        const addedMedia = p.media || [];
        validMedia(addedMedia);
        validMedia([...(issue.media || []), ...addedMedia]);
        const before = {
          title: issue.title,
          description: issue.description,
          place: issue.place,
          phone: issue.phone,
          reporterName: issue.reporterName,
        };
        issue.description = requireText(p.description, "กรอกรายละเอียดปัญหา");
        issue.title = p.title?.trim() || issue.description.slice(0, 60);
        issue.place = requireText(p.place, "ระบุจุดสังเกตหรือสถานที่");
        issue.phone = p.phone?.trim() ? normalizePhone(p.phone) : "";
        if (p.reporterName !== undefined)
          issue.reporterName = String(p.reporterName).trim();
        issue.media = [...(issue.media || []), ...addedMedia];
        issue.correctionHistory = [
          ...(issue.correctionHistory || []),
          { at: now, actorId: actor.id, before, addedMedia },
        ];
        issue.citizenEditDeadline = null;
        set("RECEIVED", "ประชาชนส่งข้อมูลเพิ่มเติมแล้ว ส่งกลับให้เจ้าหน้าที่ตรวจ");
        break;
      }
      case "ACCEPT":
        ensure(isStaff, ["NEW"]);
        set("RECEIVED", "เทศบาลรับคำร้องและตรวจสอบข้อเท็จจริง");
        break;
      case "REJECT_CASE":
        ensure(isStaff, ["NEW"]);
        issue.closedReason = requireText(p.reason, "ระบุเหตุผลปฏิเสธ");
        set("CLOSED", "ไม่รับคำร้อง: " + issue.closedReason);
        break;
      case "ASSESS":
        ensure(isStaff, ["RECEIVED"]);
        if (!["normal", "urgent"].includes(p.priority))
          throw Error("ระดับความเร่งด่วนไม่ถูกต้อง");
        issue.priority = p.priority;
        issue.assessment = requireText(p.reason, "ระบุผลประเมิน");
        text = "เทศบาลประเมินผลกระทบและความเร่งด่วนแล้ว";
        break;
      case "STAFF_ASSESS_ASSIGN":
        ensure(isStaff, ["NEW", "RECEIVED", "APPROVED"]);
        if (issue.status === "APPROVED" && !issue.readyReference)
          throw Error("บันทึกหลักฐานทรัพยากรพร้อมก่อนมอบหมาย");
        if (!["normal", "urgent"].includes(p.priority))
          throw Error("เลือกระดับความเร่งด่วน");
        if (!PEOPLE.supervisor.some((v) => v.id === p.supervisorId))
          throw Error("เลือกหัวหน้าทีมรับผิดชอบ");
        issue.priority = p.priority;
        issue.assessment = requireText(p.reason, "ระบุผลตรวจและเหตุผล");
        issue.supervisorId = p.supervisorId;
        issue.scheduleDate = requireText(p.scheduleDate, "เลือกวันที่นัดลงพื้นที่");
        issue.instruction = requireText(p.instruction, "ระบุขอบเขตงานและแผนเส้นทาง");
        issue.warnings = String(p.warnings || "").trim();
        set("SUPERVISOR", "ประเมินความเร่งด่วนและมอบหมายหัวหน้าทีมแล้ว");
        break;
      case "ASSIGN_SUPERVISOR":
        ensure(isStaff, ["RECEIVED", "APPROVED", "LEGAL_ORDERED"]);
        if (!PEOPLE.supervisor.some((v) => v.id === p.supervisorId))
          throw Error("เลือกหัวหน้าทีม");
        if (issue.status === "APPROVED" && !issue.readyReference)
          throw Error("บันทึกหลักฐานทรัพยากรพร้อมก่อนมอบหมาย");
        issue.supervisorId = p.supervisorId;
        issue.instruction = requireText(
          p.instruction,
          "ระบุขอบเขตและแผนเส้นทาง",
        );
        issue.warnings = p.warnings || "";
        issue.scheduleDate = p.scheduleDate || now.slice(0, 10);
        set("SUPERVISOR", "ส่งงานไปยังหัวหน้าทีมเพื่อวางแผนและจัดผู้ลงพื้นที่");
        break;
      case "PROPOSE": {
        ensure(isStaff || isSup, [
          "NEW",
          "RECEIVED",
          "BUDGET_MORE",
          "LEGAL_MORE",
          "SUPERVISOR",
          "ACCEPTED",
        ]);
        const proposalKind = p.kind || "budget";
        if (!["budget", "legal"].includes(proposalKind))
          throw Error("ประเภทข้อเสนอไม่ถูกต้อง");
        if (proposalKind === "legal" && !isStaff)
          throw Error("เจ้าหน้าที่เป็นผู้เสนอคำสั่ง");
        const amount = Number(p.amount);
        if (
          proposalKind === "budget" &&
          (!String(p.amount ?? "").trim() ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 1e12)
        )
          throw Error("ระบุวงเงินมากกว่า 0");
        if (!PEOPLE.authority.some((v) => v.id === p.authorityId))
          throw Error("เลือกผู้รับพิจารณา");
        validMedia(p.evidence);
        const reason = requireText(p.reason, "ระบุเหตุผลข้อเสนอ"),
          scope = requireText(
            p.scope,
            proposalKind === "legal"
              ? "ระบุข้อเสนอคำสั่งและฐานกฎหมาย"
              : "ระบุรายการทรัพยากร",
          ),
          timeframe = requireText(p.timeframe, "ระบุระยะเวลา"),
          reference = requireText(p.reference, "ระบุหลักฐานหรือเลขอ้างอิง");
        const previous = issue.proposal;
        delete issue.readyReference;
        issue.proposal = {
          kind: proposalKind,
          amount: proposalKind === "budget" ? amount : 0,
          scope,
          reason,
          timeframe,
          reference,
          budgetSource: p.budgetSource || "",
          evidence: p.evidence || [],
          authorityId: p.authorityId,
          submittedBy: actor.id,
          origin: ["BUDGET_MORE", "LEGAL_MORE"].includes(issue.status)
            ? previous?.origin
            : isStaff
              ? "staff"
              : "supervisor",
          returnStatus: ["BUDGET_MORE", "LEGAL_MORE"].includes(issue.status)
            ? previous?.returnStatus
            : issue.status,
          versions: (previous?.versions || 0) + 1,
          submittedAt: now,
        };
        issue.proposalVersions = [
          ...(issue.proposalVersions || []),
          structuredClone(issue.proposal),
        ];
        set(
          proposalKind === "legal" ? "LEGAL_PENDING" : "BUDGET_PENDING",
          proposalKind === "legal"
            ? "ส่งข้อเสนอคำสั่งให้ผู้มีอำนาจพิจารณา"
            : "ส่งข้อเสนองบและทรัพยากรให้ผู้มีอำนาจพิจารณา",
        );
        break;
      }
      case "AUTHORITY_MORE":
        ensure(isAuthority, ["BUDGET_PENDING", "LEGAL_PENDING"]);
        issue.decisions.push({
          actorId: actor.id,
          at: now,
          decision: "more",
          note: requireText(p.reason, "ระบุข้อมูลที่ต้องเพิ่มเติม"),
          version: issue.proposal.versions,
        });
        set(issue.proposal.origin === "worker" ? "RESOURCE_STAFF" : issue.proposal.kind === "legal" ? "LEGAL_MORE" : "BUDGET_MORE", "ขอข้อมูลเพิ่มเติมประกอบการพิจารณา");
        break;
      case "RESUBMIT_LEGAL":
        ensure(isStaff, ["LEGAL_MORE"]);
        throw Error("จัดทำข้อเสนอคำสั่งฉบับใหม่ผ่านแบบฟอร์มข้อเสนอ");
      case "APPROVE":
        ensure(isAuthority, ["BUDGET_PENDING", "LEGAL_PENDING"]);
        if (issue.proposal.submittedBy === actor.id)
          throw Error("ผู้เสนออนุมัติตนเองไม่ได้");
        issue.decisions.push({
          actorId: actor.id,
          at: now,
          decision: "approved",
          note: requireText(p.reason, "ระบุเหตุผลพิจารณา"),
          reference: requireText(p.reference, "ระบุเลขเอกสารอนุมัติหรือคำสั่ง"),
          version: issue.proposal.versions,
        });
        if (issue.proposal.kind === "legal")
          set("LEGAL_ORDERED", "ออกคำสั่งและบันทึกหลักฐานแจ้งคู่กรณีแล้ว");
        else
          set(
            "APPROVED",
            "อนุมัติข้อเสนอแล้ว รอเตรียมทรัพยากรและขั้นตอนที่เกี่ยวข้อง",
          );
        break;
      case "DECLINE":
        ensure(isAuthority, ["BUDGET_PENDING", "LEGAL_PENDING"]);
        issue.closedReason = requireText(
          p.reason,
          "ระบุเหตุผลไม่อนุมัติหรือไม่ออกคำสั่ง",
        );
        issue.decisions.push({
          actorId: actor.id,
          at: now,
          decision: "declined",
          note: issue.closedReason,
          reference: requireText(p.reference, "ระบุเลขเอกสารผลพิจารณา"),
          version: issue.proposal.versions,
        });
        if (issue.proposal.origin === "worker") {
          set("RESOURCE_SUPERVISOR", "ไม่อนุมัติทรัพยากร · ส่งกลับให้หัวหน้าทีมทบทวน: " + issue.closedReason);
        } else {
          set("CLOSED", (issue.proposal.kind === "legal" ? "ไม่ออกคำสั่ง" : "ไม่อนุมัติข้อเสนอ") + " · " + issue.closedReason);
        }
        break;
      case "RESOURCE_READY":
        ensure(isStaff, ["APPROVED"]);
        issue.readyReference = requireText(
          p.reference,
          "ระบุหลักฐานงบ/พัสดุหรือทรัพยากรพร้อม",
        );
        if (["supervisor", "worker"].includes(issue.proposal.origin))
          set(
            issue.workerId ? "ACCEPTED" : "SUPERVISOR",
            "ทรัพยากรพร้อม ส่งกลับทีมลงพื้นที่",
          );
        else {
          text = "บันทึกหลักฐานพร้อมมอบหมายงาน";
        }
        break;
      case "RESOURCE_NOT_NEEDED":
        ensure(isSup, ["SUPERVISOR", "RESOURCE_SUPERVISOR"]);
        if (!issue.workerId) throw Error("จัดทีมก่อนเริ่มงาน");
        issue.resourceDecision = requireText(p.reason, "ระบุผลประเมินทรัพยากร");
        issue.resourceWaived = true;
        set(
          "ACCEPTED",
          "หัวหน้าประเมินว่าใช้ทรัพยากรเดิมได้ ให้ทีมดำเนินงานต่อ",
        );
        break;
      case "ASSIGN_WORKER":
        ensure(isSup, ["SUPERVISOR"]);
        if (!PEOPLE.worker.some((v) => v.id === p.workerId))
          throw Error("เลือกผู้ลงพื้นที่");
        issue.workerId = p.workerId;
        issue.scheduleDate = p.scheduleDate || now.slice(0, 10);
        set("ASSIGNED", "หัวหน้าทีมมอบหมายผู้ลงพื้นที่และกำหนดวันนัด");
        break;
      case "WORKER_ACCEPT":
        ensure(isWorker, ["ASSIGNED"]);
        set("ACCEPTED", "ผู้ลงพื้นที่รับงานแล้ว");
        break;
      case "WORKER_REJECT":
        ensure(isWorker, ["ASSIGNED"]);
        issue.refusals = [
          ...(issue.refusals || []),
          {
            at: now,
            workerId: actor.id,
            reason: requireText(p.reason, "ระบุเหตุผลปฏิเสธ"),
          },
        ];
        issue.workerId = null;
        set("SUPERVISOR", "ผู้ลงพื้นที่ปฏิเสธงาน หัวหน้าต้องจัดทีมใหม่");
        break;
      case "START":
        ensure(isWorker, ["ACCEPTED", "REWORK"]);
        if (
          issue.proposal?.kind === "budget" &&
          ["supervisor", "worker"].includes(issue.proposal.origin) &&
          !issue.readyReference &&
          !issue.resourceWaived
        )
          throw Error("ทรัพยากรยังไม่พร้อม");
        set("IN_PROGRESS", "ทีมลงพื้นที่เริ่มปฏิบัติงานตามขอบเขต");
        break;
      case "REQUEST_RESOURCE":
        ensure(isWorker, ["ACCEPTED"]);
        issue.resourceRequest = {
          items: requireText(p.items, "ระบุรายการทรัพยากร"),
          quantity: requireText(p.quantity, "ระบุจำนวนหรือปริมาณ"),
          reason: requireText(p.reason, "ระบุเหตุผลและความจำเป็น"),
          amount: Number(p.amount),
          timeframe: requireText(p.timeframe, "ระบุเวลาที่ต้องใช้"),
          requestedBy: actor.id,
          requestedAt: now,
        };
        if (!Number.isFinite(issue.resourceRequest.amount) || issue.resourceRequest.amount <= 0)
          throw Error("ระบุวงเงินประมาณการมากกว่า 0");
        delete issue.readyReference;
        issue.resourceWaived = false;
        set("RESOURCE_SUPERVISOR", "ทีมส่งคำขอทรัพยากรเพิ่มเติมให้หัวหน้าตรวจ");
        break;
      case "SUPERVISOR_APPROVE_RESOURCE":
        ensure(isSup, ["RESOURCE_SUPERVISOR"]);
        issue.resourceRequest.supervisorReview = {
          actorId: actor.id,
          note: requireText(p.reason, "ระบุผลตรวจคำขอ"),
          at: now,
        };
        set("RESOURCE_STAFF", "หัวหน้าอนุมัติคำขอทรัพยากรและส่งให้เจ้าหน้าที่รับเรื่อง");
        break;
      case "STAFF_FORWARD_RESOURCE": {
        ensure(isStaff, ["RESOURCE_STAFF"]);
        if (!PEOPLE.authority.some((v) => v.id === p.authorityId))
          throw Error("เลือกผู้อนุมัติ");
        const request = issue.resourceRequest;
        if (!request?.supervisorReview) throw Error("หัวหน้าทีมยังไม่ได้ตรวจคำขอ");
        const previous = issue.proposal;
        issue.proposal = {
          kind: "budget",
          origin: "worker",
          amount: request.amount,
          scope: `${request.items} · จำนวน ${request.quantity}`,
          reason: String(p.staffNote || "").trim() ? `${request.reason}\nคำชี้แจงเจ้าหน้าที่: ${String(p.staffNote).trim()}` : request.reason,
          timeframe: request.timeframe,
          reference: requireText(p.reference, "ระบุเลขเอกสารส่งพิจารณา"),
          budgetSource: "",
          evidence: [],
          authorityId: p.authorityId,
          submittedBy: actor.id,
          returnStatus: "ACCEPTED",
          versions: (previous?.versions || 0) + 1,
          submittedAt: now,
        };
        issue.proposalVersions = [...(issue.proposalVersions || []), structuredClone(issue.proposal)];
        set("BUDGET_PENDING", "เจ้าหน้าที่ตรวจคำขอทรัพยากรและส่งผู้อนุมัติพิจารณา");
        break;
      }
      case "REPORT":
        ensure(isWorker, ["IN_PROGRESS", "ON_SITE"]);
        validMedia(p.before);
        validMedia(p.after);
        if (!p.before?.length || !p.after?.length)
          throw Error("แนบภาพหรือวิดีโอก่อนและหลังอย่างน้อยอย่างละ 1 ไฟล์");
        issue.reports.push({
          id: crypto.randomUUID(),
          at: now,
          workerId: actor.id,
          summary: requireText(p.summary, "กรอกผลการดำเนินงาน"),
          before: p.before,
          after: p.after,
        });
        set(
          "SUPERVISOR_REVIEW",
          "ผู้ลงพื้นที่ส่งรายงานและหลักฐานก่อน/หลังให้หัวหน้าตรวจ",
        );
        break;
      case "SUPERVISOR_PASS":
        ensure(isSup, ["SUPERVISOR_REVIEW"]);
        issue.supervisorReviews = [
          ...(issue.supervisorReviews || []),
          {
            at: now,
            id: actor.id,
            note: requireText(p.reason, "ระบุผลตรวจคุณภาพ"),
            result: "pass",
          },
        ];
        set("STAFF_REVIEW", "หัวหน้าทีมตรวจผ่าน ส่งเทศบาลตรวจปิด");
        break;
      case "SUPERVISOR_REWORK":
        ensure(isSup, ["SUPERVISOR_REVIEW"]);
        issue.reworkComment = requireText(p.reason, "ระบุสิ่งที่ต้องแก้ไข");
        set("REWORK", "หัวหน้าทีมให้แก้ไขรายงานหรือผลงานเพิ่มเติม");
        break;
      case "STAFF_CLOSE":
        ensure(isStaff, ["STAFF_REVIEW"]);
        issue.closedReason = requireText(p.reason, "ระบุผลตรวจสุดท้าย");
        set("CLOSED", "เทศบาลตรวจผลและปิดเรื่อง · " + issue.closedReason);
        break;
      case "STAFF_REWORK":
        ensure(isStaff, ["STAFF_REVIEW"]);
        issue.reworkComment = requireText(p.reason, "ระบุสิ่งที่ต้องแก้ไข");
        set("REWORK", "เทศบาลตรวจพบข้อแก้ไข ส่งทีมดำเนินการเพิ่มเติม");
        break;
      default:
        throw Error("ไม่รู้จักการดำเนินการ");
    }
  }
  issue.revision++;
  if (kind !== "RATE") issue.updatedAt = now;
  if (event)
    issue.history.push({
      id: crypto.randomUUID(),
      at: now,
      status: issue.status,
      text,
      actorName: actorName(actor),
    });
  return { db: next, issue };
}
export function roleIssues(db, a) {
  if (a.role === "citizen") return db.issues;
  if (a.role === "staff") return db.issues;
  if (a.role === "supervisor")
    return db.issues.filter((i) => i.supervisorId === a.id);
  if (a.role === "worker")
    return db.issues.filter(
      (i) =>
        i.workerId === a.id || i.refusals?.some((r) => r.workerId === a.id),
    );
  if (a.role === "authority")
    return db.issues.filter(
      (i) =>
        (["BUDGET_PENDING", "LEGAL_PENDING"].includes(i.status) &&
          i.proposal?.authorityId === a.id) ||
        i.decisions?.some((d) => d.actorId === a.id),
    );
  return [];
}
export function publicIssue(i) {
  return {
    id: i.id,
    title: i.title,
    category: i.category,
    description: i.description,
    place: i.place,
    location: i.location,
    status: i.status,
    priority: i.priority,
    votes: i.votes,
    voters: i.voters,
    followers: i.followers,
    reportedBy: i.reportedBy,
    createdAt: i.createdAt,
    history: i.history,
    media: i.media,
    isMock: i.isMock,
    revision: i.revision,
  };
}

export function stageOf(status) {
  return (
    {
      NEW: 0,
      NEEDS_INFO: 1,
      RECEIVED: 1,
      SUPERVISOR: 1,
      RESOURCE_SUPERVISOR: 1,
      RESOURCE_STAFF: 1,
      ASSIGNED: 1,
      ACCEPTED: 1,
      BUDGET_PENDING: 1,
      BUDGET_MORE: 1,
      APPROVED: 1,
      LEGAL_PENDING: 1,
      LEGAL_MORE: 1,
      LEGAL_ORDERED: 1,
      IN_PROGRESS: 2,
      ON_SITE: 2,
      REWORK: 2,
      SUPERVISOR_REVIEW: 3,
      STAFF_REVIEW: 3,
      CLOSED: 4,
    }[status] ?? 0
  );
}
