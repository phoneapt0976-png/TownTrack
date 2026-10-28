import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Siren,
  ClipboardList,
  Users,
  HardHat,
  Wrench,
  Scale,
  Wallet,
  FileText,
  CalendarDays,
  MapPin,
  AlertTriangle,
  Plus,
  Send,
  Check,
  X,
  RotateCcw,
  Navigation,
  BarChart3,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import { useStore } from "./store";
import { getLanguage } from "./i18n";
import { STATUS, PEOPLE, roleIssues } from "./model";
import {
  Button,
  Badge,
  Priority,
  Empty,
  Field,
  Uploader,
  IssueSummary,
  Timeline,
  ReportView,
  Gallery,
  cx,
  money,
  date,
  Modal,
} from "./components";
const TODAY = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" }).format(
    new Date(),
  );
const TITLES = {
  staff: [
    "ศูนย์รับเรื่อง",
    "รับเรื่องและส่งต่อได้ครบ",
    "ตรวจข้อมูล แล้วส่งต่อให้ทีมที่เหมาะสม",
  ],
  supervisor: [
    "หัวหน้าทีมภาคสนาม",
    "วางแผนงาน ดูแลทีม",
    "จัดทีมและทรัพยากร พร้อมติดตามคุณภาพงาน",
  ],
  worker: [
    "งานภาคสนาม",
    "งานที่ได้รับมอบหมาย",
    "ดูนัดหมาย ลงพื้นที่ และส่งผลพร้อมหลักฐาน",
  ],
  authority: [
    "ผู้บริหารและผู้อนุมัติ",
    "ภาพรวมเพื่อการตัดสินใจ",
    "พิจารณางบประมาณ คำสั่ง และความคืบหน้า",
  ],
};
function Stats() {
  const { db, role } = useStore();
  const all = db.issues,
    closed = all.filter((i) => i.status === "CLOSED"),
    active = all.length - closed.length,
    pending = all.filter((i) =>
      ["BUDGET_PENDING", "LEGAL_PENDING"].includes(i.status),
    ),
    votes = all.reduce((a, i) => a + i.votes, 0);
  return (
    <div className="stats-grid">
      {[
        [
          ClipboardList,
          "คำร้องทั้งหมด",
          all.length,
          "ทั้งหมดในเขตเทศบาล",
          "blue",
        ],
        [Clock3, "ยังไม่ปิด", active, "รอดำเนินการ", "amber"],
        [
          CheckCircle2,
          "ปิดเรื่องแล้ว",
          closed.length,
          "เก็บประวัติครบถ้วน",
          "green",
        ],
        [
          role === "authority" ? Wallet : Users,
          role === "authority" ? "รอพิจารณา" : "เสียงสนับสนุน",
          role === "authority" ? pending.length : votes,
          role === "authority" ? "งบประมาณและคำสั่ง" : "รวมทุกคำร้อง",
          "purple",
        ],
      ].map(([Icon, label, note, sub, color]) => (
        <article className="stat-card" key={label}>
          <span className={"stat-icon " + color}>
            <Icon size={20} />
          </span>
          <div>
            <span>{label}</span>
            <strong>{note}</strong>
            <small>{sub}</small>
          </div>
        </article>
      ))}
    </div>
  );
}
function Analytics() {
  const { db } = useStore();
  const total = db.issues.length,
    closed = db.issues.filter((i) => i.status === "CLOSED").length,
    budget = db.issues
      .filter((i) => i.proposal?.kind === "budget")
      .reduce((n, i) => n + i.proposal.amount, 0);
  const categories = [...new Set(db.issues.map((i) => i.category))].map((c) => [
    c,
    db.issues.filter((i) => i.category === c).length,
  ]);
  return (
    <section className="analytics card">
      <div>
        <div className="section-title">
          <BarChart3 size={18} />
          <h2>ภาพรวมเทศบาล</h2>
        </div>
        <p className="muted text-sm">
          ข้อมูลตัวอย่าง อัปเดตตามการทำงานของทุกบทบาท
        </p>
        <div className="analytics-summary">
          <div>
            <strong>
              {Math.round((closed / Math.max(1, total)) * 100)}
              <span>%</span>
            </strong>
            <small>สัดส่วนคำร้องที่ปิดแล้ว</small>
          </div>
          <div>
            <strong className="text-2xl">{money(budget)}</strong>
            <small>วงเงินเสนอรวม · ไม่ใช่ยอดเบิกจ่าย</small>
          </div>
        </div>
      </div>
      <div className="category-bars">
        {categories.map(([c, n]) => (
          <div key={c}>
            <span>{c}</span>
            <div>
              <i style={{ width: (n / Math.max(1, total)) * 100 + "%" }} />
            </div>
            <b>{n}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
function ActionModal({ config, issue, onClose }) {
  const { act, busy } = useStore();
  const [data, setData] = useState({
    reason: "",
    reference: "",
    supervisorId: "supervisor-a",
    authorityId: issue.proposal?.authorityId || "authority-a",
    workerId: "worker-a",
    scheduleDate: TODAY(),
    instruction:
      issue.instruction || "สำรวจจุดเกิดเหตุ กั้นพื้นที่ และดำเนินการตามแผน",
    warnings: issue.warnings || "",
    priority: issue.priority,
  });
  return (
    <Modal title={config.title} onClose={onClose}>
      <p className="muted mb-4">
        {issue.id} · {issue.title}
      </p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await act(
            config.action,
            issue,
            data,
            config.success || "บันทึกผลแล้ว",
          );
          if (result) onClose();
        }}
      >
        {config.priorityFirst && (
          <>
            <Field label="ผลประเมินความเร่งด่วน" required>
              <select value={data.priority} onChange={(e) => setData({ ...data, priority: e.target.value })}>
                <option value="normal">ทั่วไป</option>
                <option value="urgent">เร่งด่วน</option>
              </select>
            </Field>
            <Field label="เหตุผล / ผลตรวจ / สิ่งที่ต้องเพิ่มเติม" required>
              <textarea required rows={3} maxLength={2000} value={data.reason}
                placeholder="สรุปผลตรวจและเหตุผลประกอบการมอบหมาย"
                onChange={(e) => setData({ ...data, reason: e.target.value })} />
            </Field>
          </>
        )}
        {config.person && (
          <Field
            label={
              config.person === "authority"
                ? "ผู้อนุมัติรับพิจารณา"
                : config.person === "supervisor"
                ? "หัวหน้าทีมรับผิดชอบ"
                : "ผู้ลงพื้นที่"
            }
            required
          >
            <select
              value={data[config.person + "Id"]}
              onChange={(e) =>
                setData({ ...data, [config.person + "Id"]: e.target.value })
              }
            >
              {PEOPLE[config.person].map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {config.schedule && (
          <Field label="วันที่นัดลงพื้นที่">
            <input
              type="date"
              value={data.scheduleDate}
              onChange={(e) =>
                setData({ ...data, scheduleDate: e.target.value })
              }
            />
          </Field>
        )}
        {config.instruction && (
          <>
            <Field label="ขอบเขตงาน / แผนเส้นทาง" required>
              <textarea
                rows={3}
                required
                value={data.instruction}
                onChange={(e) =>
                  setData({ ...data, instruction: e.target.value })
                }
              />
            </Field>
            <Field label="คำเตือนและข้อควรระวัง">
              <textarea
                rows={2}
                value={data.warnings}
                onChange={(e) => setData({ ...data, warnings: e.target.value })}
              />
            </Field>
          </>
        )}
        {config.priority && !config.priorityFirst && (
          <Field label="ผลประเมินความเร่งด่วน">
            <select
              value={data.priority}
              onChange={(e) => setData({ ...data, priority: e.target.value })}
            >
              <option value="normal">ทั่วไป</option>
              <option value="urgent">เร่งด่วน</option>
            </select>
          </Field>
        )}
        {config.reason !== false && !config.priorityFirst && (
          <Field
            label={
              config.reasonLabel || "เหตุผล / ผลตรวจ / สิ่งที่ต้องเพิ่มเติม"
            }
            required
          >
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={data.reason}
              placeholder="ระบุข้อมูลให้ผู้รับผิดชอบขั้นถัดไปเข้าใจ"
              onChange={(e) => setData({ ...data, reason: e.target.value })}
            />
          </Field>
        )}
        {config.reference && (
          <Field label="เลขเอกสาร / หลักฐานอ้างอิง" required>
            <input
              required
              value={data.reference}
              placeholder="เช่น อนุมัติ ช.015/2569"
              onChange={(e) => setData({ ...data, reference: e.target.value })}
            />
          </Field>
        )}
        {config.note && <p className="notice notice-amber">{config.note}</p>}
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            variant={config.danger ? "danger" : "primary"}
            disabled={busy}
            type="submit"
          >
            {busy ? "กำลังบันทึก…" : config.confirm || "ยืนยัน"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function ProposalForm({ issue, kind = "budget", onClose }) {
  const { actor, act, busy, notify } = useStore(),
    draftKey = "towntrack-proposal-" + issue.id + "-" + actor.id;
  const [data, setData] = useState(() => {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(draftKey));
    } catch {}
    return (
      saved || {
        kind,
        amount: issue.proposal?.amount || "",
        reason: issue.proposal?.reason || issue.resourceRequest?.reason || "",
        scope: issue.proposal?.scope || "",
        timeframe: issue.proposal?.timeframe || "",
        reference: "",
        budgetSource: issue.proposal?.budgetSource || "",
        authorityId: issue.proposal?.authorityId || "authority-a",
      }
    );
  });
  const [evidence, setEvidence] = useState([]);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(data));
      notify("เก็บแบบร่างแล้ว ยังไม่ส่งผู้มีอำนาจ");
    } catch {
      notify("เก็บแบบร่างไม่ได้", true);
    }
  };
  return (
    <Modal
      title={
        kind === "legal"
          ? "เสนอคำสั่งตามกฎหมาย / ข้อพิพาท"
          : "ข้อเสนอขอใช้งบประมาณ / ทรัพยากร"
      }
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await act(
            "PROPOSE",
            issue,
            { ...data, kind, evidence },
            "ส่งข้อเสนอให้ผู้มีอำนาจแล้ว",
          );
          if (result) {
            localStorage.removeItem(draftKey);
            onClose();
          }
        }}
      >
        <p className="muted">
          {issue.id} · ข้อเสนอจะส่งเฉพาะผู้รับพิจารณาที่เลือก
        </p>
        {kind === "budget" && (
          <div className="form-grid">
            <Field label="วงเงินประมาณการ (บาท)" required>
              <input
                required
                type="number"
                min="1"
                max="1000000000000"
                step="0.01"
                value={data.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </Field>
            <Field label="แหล่งงบ / ทรัพยากร">
              <input
                value={data.budgetSource}
                onChange={(e) => set("budgetSource", e.target.value)}
              />
            </Field>
          </div>
        )}
        <Field
          label={
            kind === "legal"
              ? "ฐานกฎหมายและข้อเสนอคำสั่ง"
              : "รายการทรัพยากร / ขอบเขตงาน"
          }
          required
        >
          <textarea
            rows={3}
            required
            value={data.scope}
            onChange={(e) => set("scope", e.target.value)}
          />
        </Field>
        <Field label="เหตุผลและความจำเป็น" required>
          <textarea
            rows={3}
            required
            value={data.reason}
            onChange={(e) => set("reason", e.target.value)}
          />
        </Field>
        <Field label="ระยะเวลา / กำหนดดำเนินงาน" required>
          <input
            required
            value={data.timeframe}
            onChange={(e) => set("timeframe", e.target.value)}
            placeholder="เช่น 3 วันหลังทรัพยากรพร้อม"
          />
        </Field>
        <Field label="หลักฐานหรือเลขเอกสารอ้างอิง" required>
          <input
            required
            value={data.reference}
            onChange={(e) => set("reference", e.target.value)}
          />
        </Field>
        <Uploader
          files={evidence}
          onChange={setEvidence}
          label="แนบหลักฐานประกอบข้อเสนอ"
        />
        <Field label="ผู้มีอำนาจรับพิจารณา" required>
          <select
            value={data.authorityId}
            onChange={(e) => set("authorityId", e.target.value)}
          >
            {PEOPLE.authority.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <p className="notice notice-amber">
          ข้อเสนอที่อนุมัติแล้วยังต้องเตรียมงบ พัสดุ
          และทรัพยากรตามกรณีก่อนเริ่มงาน
        </p>
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={saveDraft}
            disabled={busy}
          >
            เก็บแบบร่าง
          </Button>
          <Button type="submit" disabled={busy}>
            <Send size={16} />
            {busy ? "กำลังส่ง…" : "ส่งพิจารณา"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function ResourceRequestForm({ issue, onClose }) {
  const { act, busy } = useStore();
  const [data, setData] = useState({ items: "", quantity: "", reason: "", amount: "", timeframe: "" });
  const change = (key, value) => setData((old) => ({ ...old, [key]: value }));
  return (
    <Modal title="ขอใช้ทรัพยากรเพิ่ม" onClose={onClose}>
      <p className="muted mb-4">{issue.id} · ส่งให้หัวหน้าทีมตรวจ ก่อนเจ้าหน้าที่ส่งผู้อนุมัติ</p>
      <form className="form-stack" onSubmit={async (e) => {
        e.preventDefault();
        if (await act("REQUEST_RESOURCE", issue, data, "ส่งคำขอให้หัวหน้าทีมแล้ว")) onClose();
      }}>
        <Field label="รายการทรัพยากรที่ต้องการ" required>
          <textarea required rows={2} value={data.items} onChange={(e) => change("items", e.target.value)} placeholder="เช่น ฝาท่อคอนกรีตและอุปกรณ์ติดตั้ง" />
        </Field>
        <div className="form-grid">
          <Field label="จำนวน / ปริมาณ" required><input required value={data.quantity} onChange={(e) => change("quantity", e.target.value)} placeholder="เช่น 2 ชุด" /></Field>
          <Field label="วงเงินประมาณการ (บาท)" required><input required type="number" min="1" step="0.01" value={data.amount} onChange={(e) => change("amount", e.target.value)} /></Field>
        </div>
        <Field label="เหตุผลและความจำเป็น" required><textarea required rows={3} value={data.reason} onChange={(e) => change("reason", e.target.value)} /></Field>
        <Field label="ระยะเวลา / วันที่ต้องใช้" required><input required value={data.timeframe} onChange={(e) => change("timeframe", e.target.value)} placeholder="เช่น ภายใน 3 วัน" /></Field>
        <div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy ? "กำลังส่ง…" : "ส่งให้หัวหน้าตรวจ"}</Button></div>
      </form>
    </Modal>
  );
}
function ResourceRequestView({ issue }) {
  const request = issue.resourceRequest;
  if (!request) return null;
  if (typeof request === "string") return <div className="resource-request-view"><strong>คำขอทรัพยากรเดิม</strong><p>{request}</p></div>;
  return <div className="resource-request-view">
    <div className="resource-request-head"><span>คำขอจากงานภาคสนาม</span><strong>{money(request.amount)}</strong></div>
    <dl className="data-list">
      <div><dt>รายการ</dt><dd>{request.items}</dd></div>
      <div><dt>จำนวน / ปริมาณ</dt><dd>{request.quantity}</dd></div>
      <div><dt>เหตุผล</dt><dd>{request.reason}</dd></div>
      <div><dt>เวลาที่ต้องใช้</dt><dd>{request.timeframe}</dd></div>
      {request.supervisorReview && <div><dt>ผลตรวจหัวหน้า</dt><dd>{request.supervisorReview.note}</dd></div>}
    </dl>
  </div>;
}
function ResourceReviewModal({ issue, stage, onClose }) {
  const { act, busy } = useStore();
  const [reason, setReason] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [authorityId, setAuthorityId] = useState(issue.proposal?.authorityId || "authority-a");
  const [reference, setReference] = useState("");
  const supervisor = stage === "supervisor";
  return <Modal title={supervisor ? "ตรวจคำขอทรัพยากร" : "ส่งคำขอทรัพยากรให้ผู้อนุมัติ"} onClose={onClose}>
    <p className="muted mb-4">{issue.id} · {issue.title}</p>
    <ResourceRequestView issue={issue} />
    <form className="form-stack" onSubmit={async (e) => {
      e.preventDefault();
      const ok = await act(supervisor ? "SUPERVISOR_APPROVE_RESOURCE" : "STAFF_FORWARD_RESOURCE", issue,
        supervisor ? { reason } : { authorityId, reference, staffNote },
        supervisor ? "ส่งคำขอให้เจ้าหน้าที่รับเรื่องแล้ว" : "ส่งคำขอให้ผู้อนุมัติแล้ว");
      if (ok) onClose();
    }}>
      {supervisor ? <Field label="ผลตรวจและเหตุผลอนุมัติ" required><textarea required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field> : <>
        <Field label="หมายเหตุประกอบการส่ง"><textarea rows={2} value={staffNote} onChange={(e) => setStaffNote(e.target.value)} placeholder="ระบุคำชี้แจงเพิ่มเติม หากผู้อนุมัติขอข้อมูล" /></Field>
        <Field label="ผู้อนุมัติรับพิจารณา" required><select value={authorityId} onChange={(e) => setAuthorityId(e.target.value)}>{PEOPLE.authority.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></Field>
        <Field label="เลขเอกสารส่งพิจารณา" required><input required value={reference} onChange={(e) => setReference(e.target.value)} placeholder="เช่น ทรัพยากร TT-001/2569" /></Field>
      </>}
      <div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>ยกเลิก</Button><Button type="submit" disabled={busy}>{busy ? "กำลังส่ง…" : supervisor ? "อนุมัติและส่งเจ้าหน้าที่" : "ส่งผู้อนุมัติพิจารณา"}</Button></div>
    </form>
  </Modal>;
}
function CompletionForm({ issue, onClose }) {
  const { act, busy } = useStore();
  const [before, setBefore] = useState([]),
    [after, setAfter] = useState([]),
    [summary, setSummary] = useState("");
  return (
    <Modal title="รายงานผลการปฏิบัติงาน" onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await act(
            "REPORT",
            issue,
            { summary, before, after },
            "ส่งรายงานให้หัวหน้าตรวจแล้ว",
          );
          if (result) onClose();
        }}
      >
        <p className="muted">
          {issue.id} · แนบหลักฐานก่อนและหลังอย่างละ 1 ไฟล์ขึ้นไป
        </p>
        <Field label="ผลที่พบ / การดำเนินงาน / ความปลอดภัย" required>
          <textarea
            rows={4}
            required
            maxLength={3000}
            placeholder="ดำเนินงานอะไร ผลเป็นอย่างไร และตรวจความปลอดภัยแล้วหรือไม่"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Field>
        <Uploader
          files={before}
          onChange={setBefore}
          label="หลักฐานก่อนดำเนินการ"
          required
        />
        <Uploader
          files={after}
          onChange={setAfter}
          label="หลักฐานหลังดำเนินการ"
          required
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={busy}>
            <Send size={16} />
            {busy ? "กำลังส่ง…" : "ส่งรายงาน"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function ProposalView({ issue }) {
  const p = issue.proposal;
  if (!p) return null;
  return (
    <section className="proposal-view">
      <div className="section-title">
        <Wallet size={18} />
        <h3>
          {p.kind === "legal"
            ? "ข้อเสนอคำสั่งตามกฎหมาย"
            : "ข้อเสนอขอใช้งบประมาณ"}
        </h3>
        <span className="category-tag">ฉบับ {p.versions}</span>
      </div>
      {p.kind === "budget" && (
        <div className="proposal-amount">
          {money(p.amount)}
          <span>วงเงินประมาณการ</span>
        </div>
      )}
      <dl className="data-list">
        <div>
          <dt>รายการ / ขอบเขต</dt>
          <dd>{p.scope}</dd>
        </div>
        <div>
          <dt>เหตุผล</dt>
          <dd>{p.reason}</dd>
        </div>
        <div>
          <dt>ระยะเวลา</dt>
          <dd>{p.timeframe}</dd>
        </div>
        {p.budgetSource && (
          <div>
            <dt>แหล่งงบ</dt>
            <dd>{p.budgetSource}</dd>
          </div>
        )}
        <div>
          <dt>หลักฐาน</dt>
          <dd>{p.reference}</dd>
        </div>
        <div>
          <dt>ส่งโดย</dt>
          <dd>{p.submittedBy}</dd>
        </div>
      </dl>
      <Gallery items={p.evidence} />
      {issue.decisions.length > 0 && (
        <details className="decision-history">
          <summary>ผลพิจารณาก่อนหน้า ({issue.decisions.length})</summary>
          {issue.decisions.map((d, n) => (
            <p key={n}>
              <strong>
                {d.decision === "approved"
                  ? "อนุมัติ"
                  : d.decision === "declined"
                    ? "ไม่อนุมัติ"
                    : "ขอข้อมูลเพิ่ม"}{" "}
                · ฉบับ {d.version}
              </strong>
              <br />
              {d.note}
              {d.reference && " · " + d.reference}
              <small>{date(d.at)}</small>
            </p>
          ))}
        </details>
      )}
    </section>
  );
}
function WorkflowActions({ issue }) {
  const { role, actor, act, busy } = useStore();
  const [modal, setModal] = useState(null),
    [proposal, setProposal] = useState(null),
    [resourceForm, setResourceForm] = useState(false),
    [resourceReview, setResourceReview] = useState(null),
    [report, setReport] = useState(false);
  const config = (action, title, extra = {}) =>
    setModal({ action, title, ...extra });
  const allowed = {
    staff: role === "staff",
    supervisor: role === "supervisor" && issue.supervisorId === actor.id,
    worker: role === "worker" && issue.workerId === actor.id,
    authority: role === "authority" && issue.proposal?.authorityId === actor.id,
  };
  const direct = (type, msg) => act(type, issue, {}, msg);
  const s = issue.status;
  return (
    <>
      <section className="workflow-actions">
        <div className="section-title">
          <ShieldCheck size={17} />
          <h3>ดำเนินการขั้นถัดไป</h3>
        </div>
        {s === "CLOSED" ? (
          <div className="notice">
            <CheckCircle2 size={18} />
            ปิดเรื่องแล้ว · ดูย้อนหลังได้ แก้ไขไม่ได้
          </div>
        ) : (
          <div className="action-stack">
            {allowed.staff && ["NEW", "RECEIVED"].includes(s) && (
              <>
                <p>เลือกขั้นดำเนินการสำหรับคำร้องนี้</p>
                <Button
                  onClick={() => config("STAFF_ASSESS_ASSIGN", "ประเมินและมอบหมายหัวหน้าทีม", {
                    priorityFirst: true, person: "supervisor", schedule: true,
                    instruction: true, confirm: "บันทึกและส่งหัวหน้าทีม",
                    success: "ประเมินและมอบหมายหัวหน้าทีมแล้ว",
                  })}
                >
                  <Users size={17} />
                  ประเมินความเร่งด่วนและมอบหมายหัวหน้าทีม
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setProposal("budget")}
                >
                  <Wallet size={17} />
                  จัดทำข้อเสนองบ
                </Button>
              </>
            )}
            {allowed.staff && s === "RESOURCE_STAFF" && <>
              <p className="notice notice-amber">หัวหน้าทีมตรวจคำขอแล้ว · โปรดตรวจรายละเอียดก่อนส่งผู้อนุมัติ</p>
              {issue.decisions?.at(-1)?.decision === "more" && <p className="notice notice-amber">ผู้อนุมัติขอข้อมูลเพิ่ม: {issue.decisions.at(-1).note}</p>}
              <Button onClick={() => setResourceReview("staff")}><Wallet size={17} /> ตรวจคำขอทรัพยากรและส่งผู้อนุมัติ</Button>
            </>}
            {allowed.staff && s === "NEEDS_INFO" && (
              <div className="notice notice-amber">
                <Clock3 size={17} />
                <span>
                  รอประชาชนส่งข้อมูลเพิ่มเติม: {issue.requestedInfo}
                  <small>
                    กำหนด {issue.citizenEditDeadline ? date(issue.citizenEditDeadline) : "7 วัน"} ·
                    หากพ้นกำหนด ระบบปิดเรื่องอัตโนมัติ
                  </small>
                </span>
              </div>
            )}
            {allowed.staff && s === "APPROVED" && (
              <>
                <div className="notice notice-amber">
                  อนุมัติแล้ว ต้องบันทึกหลักฐานพร้อมก่อนส่งทีมเริ่มงาน
                </div>
                <Button
                  onClick={() =>
                    config("RESOURCE_READY", "ยืนยันทรัพยากรและขั้นตอนพร้อม", {
                      reference: true,
                      reason: false,
                    })
                  }
                >
                  บันทึกหลักฐานพร้อมใช้
                </Button>
                {issue.proposal.origin === "staff" && issue.readyReference && (
                  <Button
                    onClick={() =>
                      config("STAFF_ASSESS_ASSIGN", "ประเมินและมอบหมายหัวหน้าทีม", {
                        priorityFirst: true, person: "supervisor", schedule: true,
                        instruction: true, confirm: "บันทึกและส่งหัวหน้าทีม",
                      })
                    }
                  >
                    ประเมินและมอบหมายหัวหน้าทีม
                  </Button>
                )}
              </>
            )}
            {allowed.staff && s === "LEGAL_ORDERED" && (
              <Button
                onClick={() =>
                  config("ASSIGN_SUPERVISOR", "ติดตามการปฏิบัติตามคำสั่ง", {
                    person: "supervisor",
                    schedule: true,
                    instruction: true,
                    reason: false,
                  })
                }
              >
                มอบหมายติดตามผลคำสั่ง
              </Button>
            )}
            {s === "BUDGET_MORE" &&
              ((allowed.staff && issue.proposal?.origin === "staff") ||
                (allowed.supervisor &&
                  issue.proposal?.origin === "supervisor")) && (
                <>
                  <div className="notice notice-amber">
                    ผู้พิจารณาขอข้อมูลเพิ่ม: {issue.decisions.at(-1)?.note}
                  </div>
                  <Button onClick={() => setProposal("budget")}>
                    เพิ่มเติมและส่งข้อเสนอฉบับใหม่
                  </Button>
                </>
              )}
            {allowed.staff && s === "LEGAL_MORE" && (
              <>
                <p className="notice notice-amber">
                  {issue.decisions.at(-1)?.note}
                </p>
                <Button onClick={() => setProposal("legal")}>
                  เพิ่มเติมข้อเสนอคำสั่ง
                </Button>
              </>
            )}
            {allowed.supervisor && s === "SUPERVISOR" && (
              <>
                {issue.refusals?.at(-1) && (
                  <p className="notice notice-rose">
                    ทีมปฏิเสธงาน: {issue.refusals.at(-1).reason} ·
                    โปรดจัดทีมใหม่
                  </p>
                )}
                  <Button
                    onClick={() =>
                      config("ASSIGN_WORKER", "จัดทีมและมอบหมายงาน", {
                        person: "worker",
                        schedule: true,
                        reason: false,
                        success: "มอบหมายทีมลงพื้นที่แล้ว",
                      })
                    }
                  >
                    <HardHat size={17} />
                    มอบหมายทีมผู้ลงพื้นที่
                  </Button>
                <Button
                  variant="secondary"
                  onClick={() => setProposal("budget")}
                >
                  <Wallet size={16} />
                  ต้องใช้ทรัพยากรเพิ่ม · เสนอขออนุมัติ
                </Button>
              </>
            )}
            {allowed.supervisor && s === "RESOURCE_SUPERVISOR" && <>
              <p className="notice notice-amber">งานภาคสนามส่งคำขอทรัพยากร · กรุณาตรวจรายละเอียด</p>
              <Button onClick={() => setResourceReview("supervisor")}><ClipboardList size={17} /> ตรวจคำขอทรัพยากรและอนุมัติ</Button>
              {issue.decisions?.at(-1)?.decision === "declined" && <Button variant="secondary" onClick={() => config("RESOURCE_NOT_NEEDED", "ให้ทีมดำเนินงานด้วยทรัพยากรเดิม", { reasonLabel: "เหตุผลและแนวทางที่ใช้ทรัพยากรเดิม", confirm: "ส่งกลับให้ทีมทำงานต่อ" })}>ใช้ทรัพยากรเดิม · ให้ทีมทำงานต่อ</Button>}
            </>}
            {allowed.worker && s === "ASSIGNED" && (
              <>
                <Button
                  disabled={busy}
                  onClick={() => direct("WORKER_ACCEPT", "รับงานแล้ว")}
                >
                  <Check size={17} />
                  กดรับงาน
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    config("WORKER_REJECT", "ปฏิเสธงาน", {
                      danger: true,
                      reasonLabel: "เหตุผลปฏิเสธเพื่อให้หัวหน้าจัดทีมใหม่",
                    })
                  }
                >
                  <X size={17} />
                  กดปฏิเสธงาน
                </Button>
              </>
            )}
            {allowed.worker && ["ACCEPTED", "REWORK"].includes(s) && (
              <>
                {issue.reworkComment && (
                  <p className="notice notice-amber">
                    สิ่งที่ต้องแก้ไข: {issue.reworkComment}
                  </p>
                )}
                <Button
                  disabled={busy}
                  onClick={() => direct("START", "เริ่มปฏิบัติงานแล้ว")}
                >
                  <Wrench size={17} />
                  เริ่มปฏิบัติงาน
                </Button>
                {s === "ACCEPTED" && (
                  <Button
                    variant="secondary"
                    onClick={() => setResourceForm(true)}
                  >
                    ขอใช้ทรัพยากรเพิ่ม
                  </Button>
                )}
              </>
            )}
            {allowed.worker && ["RESOURCE_SUPERVISOR", "RESOURCE_STAFF", "BUDGET_PENDING"].includes(s) && issue.proposal?.origin !== "supervisor" && (
              <p className="notice notice-amber">ส่งคำขอทรัพยากรแล้ว · รอการตรวจและอนุมัติก่อนเริ่มงาน</p>
            )}
            {allowed.worker && ["IN_PROGRESS", "ON_SITE"].includes(s) && (
              <Button onClick={() => setReport(true)}>
                <FileText size={17} />
                ส่งรายงานพร้อมภาพก่อน / หลัง
              </Button>
            )}
            {allowed.supervisor && s === "SUPERVISOR_REVIEW" && (
              <>
                <Button
                  onClick={() =>
                    config("SUPERVISOR_PASS", "ยืนยันผลตรวจคุณภาพ", {
                      confirm: "ผ่าน · ส่งให้เทศบาลตรวจปิด",
                    })
                  }
                >
                  <Check size={17} />
                  ผ่าน · ส่งเทศบาลตรวจปิด
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    config("SUPERVISOR_REWORK", "ส่งกลับให้ทีมแก้ไข", {
                      danger: true,
                      reasonLabel: "สิ่งที่ต้องแก้ไข / เพิ่มเติม",
                    })
                  }
                >
                  <RotateCcw size={16} />
                  ไม่ผ่าน · ให้แก้ไข
                </Button>
              </>
            )}
            {allowed.staff && s === "STAFF_REVIEW" && (
              <>
                <Button
                  onClick={() =>
                    config("STAFF_CLOSE", "ตรวจผลสุดท้ายและปิดเรื่อง", {
                      confirm: "ยืนยันปิดเรื่อง",
                      reasonLabel: "ผลตรวจและคำอธิบายการแก้ไข",
                    })
                  }
                >
                  <CheckCircle2 size={17} />
                  ผ่าน · ปิดเรื่อง
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    config("STAFF_REWORK", "ขอให้ทีมแก้ไขเพิ่มเติม", {
                      danger: true,
                    })
                  }
                >
                  ยังไม่ผ่าน · ส่งกลับแก้ไข
                </Button>
              </>
            )}
            {allowed.authority &&
              ["BUDGET_PENDING", "LEGAL_PENDING"].includes(s) && (
                <>
                  <Button
                    onClick={() =>
                      config(
                        "APPROVE",
                        s === "LEGAL_PENDING"
                          ? "ออกคำสั่งและแจ้งคู่กรณี"
                          : "อนุมัติข้อเสนองบประมาณ",
                        {
                          reference: true,
                          confirm:
                            s === "LEGAL_PENDING"
                              ? "ยืนยันออกคำสั่ง"
                              : "อนุมัติ",
                          note:
                            s === "LEGAL_PENDING"
                              ? "อ้างอิงเอกสารคำสั่งและการแจ้งคู่กรณีจริง ปุ่มนี้เป็นการจำลองผลพิจารณา"
                              : "อนุมัติข้อเสนอแล้ว เจ้าหน้าที่จะเตรียมทรัพยากรก่อนเริ่มงาน",
                        },
                      )
                    }
                  >
                    <Check size={16} />
                    {s === "LEGAL_PENDING" ? "ออกคำสั่งแจ้งคู่กรณี" : "อนุมัติ"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      config(
                        "DECLINE",
                        s === "LEGAL_PENDING"
                          ? "ไม่ออกคำสั่งและยุติเรื่อง"
                          : "ไม่อนุมัติข้อเสนอ",
                        {
                          reference: true,
                          danger: true,
                          confirm: issue.proposal?.origin === "worker" ? "ยืนยันและส่งกลับหัวหน้าทีม" : "ยืนยันผลและปิดเรื่อง",
                        },
                      )
                    }
                  >
                    <X size={16} />
                    {s === "LEGAL_PENDING"
                      ? "ไม่ออกคำสั่ง · ยุติเรื่อง"
                      : "ไม่อนุมัติ"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      config("AUTHORITY_MORE", "ขอข้อมูลเพิ่มเติม", {
                        reasonLabel: "ข้อมูลหรือเอกสารที่ต้องเพิ่มเติม",
                      })
                    }
                  >
                    ขอข้อมูลเพิ่มเติม
                  </Button>
                </>
              )}
            {!(
              (allowed.staff &&
                [
                  "NEW",
                  "RECEIVED",
                  "RESOURCE_STAFF",
                  "NEEDS_INFO",
                  "APPROVED",
                  "LEGAL_ORDERED",
                  "STAFF_REVIEW",
                  "BUDGET_MORE",
                  "LEGAL_MORE",
                ].includes(s)) ||
              (allowed.supervisor &&
                ["SUPERVISOR", "RESOURCE_SUPERVISOR", "SUPERVISOR_REVIEW", "BUDGET_MORE"].includes(
                  s,
                )) ||
              (allowed.worker &&
                [
                  "ASSIGNED",
                  "ACCEPTED",
                  "IN_PROGRESS",
                  "ON_SITE",
                  "REWORK",
                  "RESOURCE_SUPERVISOR",
                  "RESOURCE_STAFF",
                  "BUDGET_PENDING",
                ].includes(s)) ||
              (allowed.authority &&
                ["BUDGET_PENDING", "LEGAL_PENDING"].includes(s))
            ) && (
              <p className="notice">รอผู้รับผิดชอบขั้นถัดไป · {STATUS[s]}</p>
            )}
          </div>
        )}
      </section>
      {modal && (
        <ActionModal
          key={issue.id + "-" + modal.action}
          config={modal}
          issue={issue}
          onClose={() => setModal(null)}
        />
      )}
      {proposal && (
        <ProposalForm
          issue={issue}
          kind={proposal}
          onClose={() => setProposal(null)}
        />
      )}
      {resourceForm && <ResourceRequestForm issue={issue} onClose={() => setResourceForm(false)} />}
      {resourceReview && <ResourceReviewModal issue={issue} stage={resourceReview} onClose={() => setResourceReview(null)} />}
      {report && (
        <CompletionForm issue={issue} onClose={() => setReport(false)} />
      )}
    </>
  );
}
const DESK_FLOWS = {
  staff: ["รับเรื่อง", "ประเมินและมอบหมาย", "ส่งข้อเสนอ / ทรัพยากร"],
  supervisor: ["รับแผน", "จัดทีม / ตรวจทรัพยากร", "ตรวจคุณภาพ"],
  worker: ["รับงาน", "ลงพื้นที่ / ขอทรัพยากร", "ส่งหลักฐาน"],
  authority: ["ตรวจข้อเสนอ", "พิจารณา", "บันทึกผล"],
};

function DeskMetric({ value, label, tone = "blue" }) {
  return (
    <div className={`desk-metric desk-metric-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function DeskQueue({
  role,
  items,
  all,
  selected,
  setSelected,
  query,
  setQuery,
  filter,
  setFilter,
  sortBy,
  setSortBy,
  day,
  setDay,
  view,
  setView,
  priorityView,
  setPriorityView,
  priorityCounts,
  active,
}) {
  const [visibleCount, setVisibleCount] = useState(10);
  useEffect(() => setVisibleCount(10), [query, filter, day, view, priorityView, sortBy, role]);
  const queueTitle = {
    staff: view === "history" ? "ประวัติคำร้อง" : view === "latest" ? "เรื่องล่าสุดที่ต้องตรวจ" : "งานที่ต้องดูแล",
    supervisor: view === "history" ? "ประวัติงานทีม" : view === "latest" ? "งานทีมล่าสุด" : "งานที่ต้องจัดทีม",
    worker: view === "history" ? "งานที่เสร็จแล้ว" : view === "latest" ? "งานภาคสนามล่าสุด" : "เส้นทางและงานวันนี้",
    authority: view === "history" ? "ผลการพิจารณา" : view === "latest" ? "ข้อเสนอล่าสุด" : "ข้อเสนอที่รอพิจารณา",
  }[role];

  return (
    <section className="desk-queue" aria-label={queueTitle}>
      <div className="desk-queue-head">
        <div>
          <span className="desk-kicker">{view === "history" ? "ย้อนหลัง" : "รายการงาน"}</span>
          <h2>{queueTitle}</h2>
        </div>
        <strong className="desk-count">{items.length}</strong>
      </div>
      <div className="desk-queue-tabs" role="group" aria-label="มุมมองงาน">
        <button
          type="button"
          aria-pressed={view === "latest"}
          className={view === "latest" ? "is-current" : ""}
          onClick={() => { setView("latest"); setSelected(null); }}
        >
          ล่าสุด <span>{Math.min(active.length, 10)}</span>
        </button>
        <button
          aria-pressed={view === "active"}
          className={view === "active" ? "is-current" : ""}
          onClick={() => {
            setView("active");
            setSelected(null);
          }}
        >
          ต้องดูแล <span>{active.length}</span>
        </button>
        <button
          aria-pressed={view === "history"}
          className={view === "history" ? "is-current" : ""}
          onClick={() => {
            setView("history");
            setSelected(null);
          }}
        >
          ประวัติ
        </button>
      </div>
      {view === "latest" && <p className="desk-queue-note">งานที่อัปเดตล่าสุดสูงสุด 10 เรื่อง · แตะรายการเพื่อดูรายละเอียด</p>}
      <div className="desk-priority-group">
          <span className="desk-priority-heading">แยกตามความเร่งด่วน</span>
          <div className="desk-priority-views" role="group" aria-label="กรองตามความเร่งด่วน">
            {[
              ["all", "รวมเรื่อง", "all"],
              ["urgent", "เร่งด่วน", "urgent"],
              ["normal", "ทั่วไป", "normal"],
            ].map(([value, label, tone]) => (
              <button
                key={value}
                type="button"
                aria-pressed={priorityView === value}
                aria-label={`${label} ${priorityCounts[value]} เรื่อง`}
                className={cx(`priority-${tone}`, priorityView === value && "is-current")}
                onClick={() => {
                  setPriorityView(value);
                  setSelected(null);
                }}
              >
                <span>{label}</span>
                <strong>{priorityCounts[value]}</strong>
              </button>
            ))}
          </div>
      </div>
      <label className="desk-search">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          aria-label="ค้นหาคำร้อง"
          placeholder="ค้นหาเลขเรื่อง ชื่อ หรือสถานที่"
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="desk-filters">
        <label>
          <span>สถานะ</span>
          <select
            value={filter}
            aria-label="กรองสถานะ"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            {[...new Set(all.map((item) => item.status))].map((status) => (
              <option key={status} value={status}>
                {STATUS[status]}
              </option>
            ))}
          </select>
        </label>
        {["worker", "supervisor"].includes(role) && (
          <label>
            <span>วันนัดหมาย</span>
            <input
              type="date"
              aria-label="วันที่นัดลงพื้นที่"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </label>
        )}
      </div>
      {view === "latest" ? <p className="desk-latest-order">เรียงตามวันที่อัปเดตใหม่สุด</p> : <label className="desk-sort-control">
        <span>เรียงรายการตาม</span>
        <select
          value={sortBy}
          aria-label="เรียงรายการคำร้อง"
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="votes-desc">โหวตมากที่สุด</option>
          <option value="votes-asc">โหวตน้อยที่สุด</option>
          <option value="latest">ล่าสุด</option>
          <option value="oldest">เก่าสุด</option>
        </select>
      </label>}
      <div className="desk-results-bar">
        <span role="status" aria-live="polite">พบ {items.length} เรื่อง</span>
        {(query || filter || day || priorityView !== "all") && <button type="button" onClick={() => {
          setQuery(""); setFilter(""); setDay(""); setPriorityView("all"); setSelected(null);
        }}>ล้างตัวกรอง</button>}
      </div>
      <div className="desk-case-list">
        {items.length ? (
          items.slice(0, visibleCount).map((item) => (
            <button
              key={item.id}
              data-issue-id={item.id}
              className={cx("desk-case", selected === item.id && "is-selected")}
              aria-pressed={selected === item.id}
              onClick={() => setSelected(item.id)}
            >
              <div className="desk-case-meta">
                <span className="desk-case-id">{item.id}</span>
                <Priority value={item.priority} />
              </div>
              <h3>{item.title}</h3>
              <p className="desk-case-place">
                <MapPin size={15} /> <span>{item.place}</span>
              </p>
              <div className="desk-case-foot">
                <Badge issue={item} />
                <span className="desk-case-votes" aria-label={`${item.votes} โหวต`}>
                  <ThumbsUp size={14} aria-hidden="true" />
                  <span>{item.votes}</span>
                </span>
                <time>
                  {view === "latest" ? `อัปเดต ${new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "th-TH", { day: "numeric", month: "short" }).format(new Date(item.updatedAt || item.createdAt))}` : role === "worker" && item.scheduleDate
                    ? item.scheduleDate
                    : new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "th-TH", {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(item.createdAt))}
                </time>
                <ArrowUpRight size={16} aria-hidden="true" />
              </div>
            </button>
          ))
        ) : (
          <Empty
            title="ไม่พบงานในรายการนี้"
            text={
              role === "authority"
                ? "เมื่อมีข้อเสนอส่งถึงคุณ รายการจะแสดงที่นี่"
                : "ลองเปลี่ยนตัวกรอง หรือเปิดดูประวัติ"
            }
          />
        )}
      </div>
      {view !== "latest" && items.length > 10 && <div className="desk-list-pagination">
        <span>แสดง {Math.min(visibleCount, items.length)} จาก {items.length} เรื่อง</span>
        {visibleCount < items.length && <button type="button" onClick={() => setVisibleCount((count) => count + 10)}>ดูเพิ่ม 10 เรื่อง</button>}
        {visibleCount > 10 && <button type="button" onClick={() => setVisibleCount(10)}>ย่อรายการ</button>}
      </div>}
    </section>
  );
}

function DeskDetail({ role, issue, onBack }) {
  if (!issue) {
    const idle = {
      staff: ["เปิดคำร้องเพื่อตรวจข้อมูล", "ดูรายละเอียดผู้แจ้ง สถานที่ และหลักฐานก่อนรับเรื่อง"],
      supervisor: ["เลือกงานเพื่อจัดทีม", "ตรวจความเร่งด่วนและคำขอทรัพยากรก่อนมอบหมายงาน"],
      worker: ["เลือกงานเพื่อดูเส้นทาง", "ตรวจจุดเกิดเหตุ คำแนะนำ และวันนัดก่อนออกปฏิบัติงาน"],
      authority: ["เลือกข้อเสนอเพื่อพิจารณา", "ตรวจวงเงิน เหตุผล และเอกสารอ้างอิงก่อนบันทึกผล"],
    }[role];
    return (
      <section className="desk-detail desk-detail-idle">
        <div className="desk-idle-icon"><ClipboardList size={25} /></div>
        <span className="desk-kicker">พร้อมทำงาน</span>
        <h2>{idle[0]}</h2>
        <p>{idle[1]}</p>
        <div className="desk-idle-hint">
          <span>01</span>
          <span>เลือกรายการจากคิวงาน</span>
          <ArrowLeft size={16} />
        </div>
      </section>
    );
  }

  return (
    <section className="desk-detail desk-detail-open">
      <button className="desk-back" onClick={onBack}>
        <ArrowLeft size={17} /> กลับไปที่รายการ
      </button>
      <div className="desk-detail-cap">
        <span className="desk-kicker">ตรวจข้อมูลและดำเนินการ</span>
        {issue.status !== "CLOSED" && <a className="desk-action-link" href="#desk-next-action" onClick={(event) => {
          event.preventDefault();
          const target = document.getElementById("desk-next-action");
          target?.focus({ preventScroll: true });
          target?.scrollIntoView({ block: "start", behavior: "auto" });
        }}>ไปที่ปุ่มดำเนินการ ↓</a>}
      </div>
      <IssueSummary issue={issue} internal />
      {["supervisor", "worker"].includes(role) && (
        <section className="desk-instruction">
          <div className="desk-section-heading">
            <Navigation size={18} />
            <h3>{role === "worker" ? "แผนลงพื้นที่" : "แผนและขอบเขตงาน"}</h3>
          </div>
          <p>{issue.instruction || "ยังไม่มีรายละเอียดแผนงาน"}</p>
          <div className="desk-instruction-meta">
            <span><CalendarDays size={15} /> {issue.scheduleDate || "ยังไม่กำหนดวันลงพื้นที่"}</span>
            {issue.warnings && <span className="desk-warning"><AlertTriangle size={15} /> {issue.warnings}</span>}
          </div>
        </section>
      )}
      {issue.resourceRequest && <ResourceRequestView issue={issue} />}
      {issue.proposal && <ProposalView issue={issue} />}
      {issue.reports.length > 0 && <ReportView issue={issue} />}
      <div id="desk-next-action" tabIndex={-1} className="desk-action-target">
        <WorkflowActions key={issue.id} issue={issue} />
      </div>
      <details className="desk-history">
        <summary>ประวัติรายการ <span>{issue.history.length} ขั้นตอน</span></summary>
        <Timeline issue={issue} />
      </details>
    </section>
  );
}

function AlertIssuePicker({ title, items, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const shown = items.filter((item) => [item.id, item.title, item.place].join(" ").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  return <Modal title={title} onClose={onClose} closeOnBackdrop className="alert-picker-modal">
    <div className="alert-picker">
      <p className="alert-picker-intro">เลือกเรื่องที่ต้องการดูรายละเอียดและดำเนินการ</p>
      <label className="desk-search">
        <Search size={18} aria-hidden="true" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="ค้นหาเรื่องในรายการ" placeholder="ค้นหาเลขเรื่อง ชื่อ หรือสถานที่" />
      </label>
      <p className="alert-picker-count" role="status">พบ {shown.length} เรื่อง</p>
      <div className="alert-picker-list">
        {shown.map((item) => <article className="alert-picker-card" key={item.id}>
          <div className="alert-picker-meta"><span className="case-id">{item.id}</span><Priority value={item.priority} /><Badge issue={item} /></div>
          <h3>{item.title}</h3>
          <p className="alert-picker-place"><MapPin size={16} aria-hidden="true" /><span>{item.place}</span></p>
          {item.description && <p className="alert-picker-description">{item.description}</p>}
          <div className="alert-picker-foot"><span><ThumbsUp size={15} aria-hidden="true" /> {item.votes || 0}</span><time dateTime={item.updatedAt || item.createdAt}>{date(item.updatedAt || item.createdAt)}</time></div>
          <Button onClick={() => onSelect(item.id)}>ดูรายละเอียดและดำเนินการ <ArrowUpRight size={17} aria-hidden="true" /></Button>
        </article>)}
        {!shown.length && <Empty title="ไม่พบเรื่องตามเงื่อนไขที่เลือก" text="ลองเปลี่ยนคำค้นหา" />}
      </div>
    </div>
  </Modal>;
}

export default function Office() {
  const { db, role, actor } = useStore();
  const workspaceRef = useRef(null);
  const previousSelection = useRef(null);
  const [alertKind, setAlertKind] = useState(null);
  const [selected, setSelected] = useState(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [sortBy, setSortBy] = useState("latest"),
    [priorityView, setPriorityView] = useState("all"),
    [view, setView] = useState("latest"),
    [day, setDay] = useState("");
  useEffect(() => {
    const previous = previousSelection.current;
    previousSelection.current = selected;
    if (!window.matchMedia("(max-width: 760px)").matches || (!selected && !previous)) return;
    const frame = requestAnimationFrame(() => {
      const target = selected
        ? workspaceRef.current?.querySelector(".desk-back")
        : [...(workspaceRef.current?.querySelectorAll(".desk-case") || [])].find((node) => node.dataset.issueId === previous)
          || workspaceRef.current?.querySelector(".desk-search input");
      target?.focus({ preventScroll: true });
      (selected ? workspaceRef.current : target)?.scrollIntoView({ block: "start", behavior: "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);
  const all = roleIssues(db, actor);
  const isArchive = (item) =>
    role === "authority"
      ? !["BUDGET_PENDING", "LEGAL_PENDING"].includes(item.status)
      : item.status === "CLOSED" || (role === "worker" && item.workerId !== actor.id);
  const active = all.filter((item) => !isArchive(item));
  const currentQueue = all.filter((item) =>
    view === "history" ? isArchive(item) : !isArchive(item),
  );
  const priorityCounts = {
    all: currentQueue.length,
    urgent: currentQueue.filter((item) => item.priority === "urgent").length,
    normal: currentQueue.filter((item) => item.priority !== "urgent").length,
  };
  const items = all
    .filter(
      (item) =>
        (view === "history" ? isArchive(item) : !isArchive(item)) &&
        (priorityView === "all" || item.priority === priorityView ||
          (priorityView === "normal" && item.priority !== "urgent")) &&
        (!query ||
          [item.title, item.id, item.place]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!filter || item.status === filter) &&
        (!day || item.scheduleDate === day),
    )
    .sort((a, b) => {
      if (view === "latest") return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "votes-desc") return b.votes - a.votes || timeDiff;
      if (sortBy === "votes-asc") return a.votes - b.votes || timeDiff;
      return sortBy === "oldest" ? -timeDiff : timeDiff;
    })
    .slice(0, view === "latest" ? 10 : undefined);
  const issue = all.find((item) => item.id === selected);
  const urgent = role === "staff"
    ? active.filter((item) => item.priority === "urgent" && item.status === "NEW")
    : [];
  const pendingAuthority = active.filter((item) => ["BUDGET_PENDING", "LEGAL_PENDING"].includes(item.status));
  const resourcePending = active.filter((item) => item.status === (role === "supervisor" ? "RESOURCE_SUPERVISOR" : "RESOURCE_STAFF"));
  const assigned = active.filter((item) => item.status === "ASSIGNED");
  const alertGroups = {
    urgent: { title: "เรื่องเร่งด่วนรอประเมิน", items: urgent },
    resources: { title: "คำขอทรัพยากรรอดำเนินการ", items: resourcePending },
    assigned: { title: "งานที่รอรับ", items: assigned },
    proposals: { title: "ข้อเสนอที่รอพิจารณา", items: pendingAuthority },
  };
  const openedAlert = alertGroups[alertKind];
  const today = TODAY();
  useEffect(() => {
    if (selected && !all.some((item) => item.id === selected)) setSelected(null);
  }, [db, actor.id]);

  const metrics = {
    staff: [
      [all.filter((item) => ["NEW", "RECEIVED"].includes(item.status)).length, "รอประเมินและมอบหมาย"],
      [all.filter((item) => item.status === "RESOURCE_STAFF").length, "คำขอทรัพยากรรอส่ง", "warm"],
      [urgent.length, "เรื่องเร่งด่วน", "alert"],
    ],
    supervisor: [
      [all.filter((item) => item.status === "SUPERVISOR").length, "รอจัดทีม"],
      [all.filter((item) => item.status === "SUPERVISOR_REVIEW").length, "รอตรวจงาน"],
      [all.filter((item) => item.status === "RESOURCE_SUPERVISOR").length, "คำขอทรัพยากรรอตรวจ", "warm"],
    ],
    worker: [
      [all.filter((item) => item.scheduleDate === today).length, "นัดวันนี้"],
      [all.filter((item) => item.status === "ASSIGNED").length, "รอรับงาน"],
      [all.filter((item) => ["IN_PROGRESS", "ON_SITE", "REWORK"].includes(item.status)).length, "กำลังทำ", "warm"],
    ],
    authority: [
      [pendingAuthority.length, "รอพิจารณา"],
      [pendingAuthority.filter((item) => item.status === "BUDGET_PENDING").length, "งบประมาณ"],
      [pendingAuthority.filter((item) => item.status === "LEGAL_PENDING").length, "ข้อกฎหมาย", "warm"],
    ],
  }[role];
  const flow = DESK_FLOWS[role];
  const title = TITLES[role];
  const queueLabel = {
    staff: "โต๊ะรับเรื่อง",
    supervisor: "วางแผนและจัดทีม",
    worker: "งานภาคสนาม",
    authority: "โต๊ะพิจารณา",
  }[role];

  return (
    <main className={`desk desk-${role}`}>
      <header className="desk-welcome">
        <div className="desk-welcome-copy">
          <span className="desk-kicker">{title[0]} · TownTrack</span>
          <h1>{title[1]}</h1>
          <p>{title[2]}</p>
        </div>
        <div className="desk-today">
          <CalendarDays size={17} />
          <span>{new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "th-TH", { dateStyle: "full" }).format(new Date())}</span>
        </div>
      </header>

      <section className="desk-flow" aria-label="ลำดับงานตามบทบาท">
        <div className="desk-flow-label">
          <span className="desk-kicker">ลำดับงาน</span>
          <strong>{queueLabel}</strong>
        </div>
        <ol>
          {flow.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
              {index < flow.length - 1 && <i aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </section>

      <section className="desk-overview" aria-label="สรุปงาน">
        <div className="desk-overview-title">
          <span className="desk-kicker">วันนี้</span>
          <h2>{role === "authority" ? "เรื่องที่ต้องตัดสินใจ" : role === "worker" ? "ภารกิจของฉัน" : "ภาพรวมงาน"}</h2>
        </div>
        <div className="desk-metrics">
          {metrics.map(([value, label, tone]) => (
            <DeskMetric key={label} value={value} label={label} tone={tone} />
          ))}
        </div>
        {role === "authority" && <Analytics />}
      </section>

      {urgent.length > 0 && !selected && (
        <section className="desk-alert" aria-label="เรื่องเร่งด่วน">
          <span className="desk-alert-icon"><Siren size={20} /></span>
          <div><strong>มีเรื่องเร่งด่วนรอประเมิน</strong><p>{urgent.length} เรื่อง · ประเมินและมอบหมายหัวหน้าทีม</p></div>
          <button onClick={() => setAlertKind("urgent")}>เปิดเรื่อง <ArrowUpRight size={16} /></button>
        </section>
      )}

      {["staff", "supervisor"].includes(role) && resourcePending.length > 0 && !selected && (
        <section className="desk-alert desk-resource-alert" aria-label="แจ้งเตือนคำขอทรัพยากร">
          <span className="desk-alert-icon"><Wallet size={20} /></span>
          <div><strong>{role === "supervisor" ? "ทีมภาคสนามส่งคำขอทรัพยากร" : "หัวหน้าทีมส่งคำขอทรัพยากรให้ตรวจ"}</strong><p>{resourcePending.length} เรื่อง · เปิดดูรายการและดำเนินการต่อ</p></div>
          <button onClick={() => setAlertKind("resources")}>เปิดเรื่อง <ArrowUpRight size={16} /></button>
        </section>
      )}

      {!selected && ((role === "worker" && assigned.length > 0) || (role === "authority" && pendingAuthority.length > 0)) && (
        <section className="desk-alert desk-resource-alert" aria-label={role === "worker" ? "งานที่รอรับ" : "ข้อเสนอที่รอพิจารณา"}>
          <span className="desk-alert-icon"><ClipboardList size={20} /></span>
          <div><strong>{role === "worker" ? "มีงานรอรับมอบหมาย" : "มีข้อเสนอรอพิจารณา"}</strong><p>{role === "worker" ? assigned.length : pendingAuthority.length} เรื่อง · เลือกเรื่องเพื่อดำเนินการ</p></div>
          <button onClick={() => setAlertKind(role === "worker" ? "assigned" : "proposals")}>เปิดเรื่อง <ArrowUpRight size={16} /></button>
        </section>
      )}
      {openedAlert && <AlertIssuePicker title={openedAlert.title} items={openedAlert.items} onClose={() => setAlertKind(null)} onSelect={(id) => {
        setAlertKind(null);
        setView("active"); setQuery(""); setFilter(""); setDay(""); setPriorityView("all");
        setSelected(id);
        requestAnimationFrame(() => workspaceRef.current?.querySelector(".desk-detail")?.scrollIntoView({ block: "start", behavior: "auto" }));
      }} />}

      <div ref={workspaceRef} className={cx("desk-workspace", selected && "has-selection")}>
        <DeskQueue
          role={role}
          items={items}
          all={all}
          selected={selected}
          setSelected={setSelected}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          day={day}
          setDay={setDay}
          view={view}
          setView={setView}
          priorityView={priorityView}
          setPriorityView={setPriorityView}
          priorityCounts={priorityCounts}
          active={active}
        />
        <DeskDetail role={role} issue={issue} onBack={() => setSelected(null)} />
      </div>
    </main>
  );
}
