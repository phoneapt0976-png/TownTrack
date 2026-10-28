import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  MapPin,
  ThumbsUp,
  Star,
  Bell,
  BellRing,
  Phone,
  Navigation,
  Home,
  ClipboardList,
  X,
  Send,
  Check,
  ChevronRight,
  CheckCircle2,
  LocateFixed,
  AlertTriangle,
  Construction,
  Trash2,
  Waves,
  Zap,
  Trees,
} from "lucide-react";
import { useStore } from "./store";
import { getLanguage } from "./i18n";
import PublicDashboard from "./PublicDashboard";
import { PrivacyNotice } from "./PublicInformation";
import EmergencyPage from "./EmergencyPage";
import GeoMap, { useGeolocation } from "./GeoMap";
import {
  USER_LOCATION,
  MUNICIPALITY,
  nearby,
  distance,
  publicIssue,
  normalizePhone,
  stageOf,
} from "./model";
import {
  Button,
  Badge,
  Priority,
  Empty,
  Field,
  Uploader,
  Modal,
  MapPreview,
  Timeline,
  IssueSummary,
  cx,
  date,
} from "./components";

const CATEGORY_OPTIONS = [
  { value: "ถนนชำรุด", label: "ถนนพัง / ฝาท่อ", Icon: Construction },
  { value: "ท่อระบายน้ำ", label: "น้ำขัง / น้ำท่วม", Icon: Waves },
  { value: "ขยะมูลฝอย", label: "ขยะ / สิ่งสกปรก", Icon: Trash2 },
  { value: "ไฟฟ้าส่องสว่าง", label: "ไฟดับ / ไฟส่องทาง", Icon: Zap },
  { value: "กิ่งไม้/ความปลอดภัย", label: "ต้นไม้ล้ม / กิ่งไม้", Icon: Trees },
];

function VoteFollow({ issue, compact = false }) {
  const { act, busy, actor } = useStore(),
    voted = issue?.voters?.includes(actor.id) || false,
    followed = issue?.followers?.includes(actor.id) || false;
  return (
    <div className={cx("vote-follow", compact && "compact")}>
      <Button
        variant="secondary"
        disabled={busy || voted || issue?.status === "CLOSED"}
        onClick={() =>
          act("VOTE", issue, {}, "โหวตสำเร็จ ขอบคุณที่ช่วยยืนยันปัญหา")
        }
        aria-label={"โหวต " + (issue?.id || "")}
      >
        <ThumbsUp size={15} />
        {voted ? "โหวตแล้ว" : compact ? issue?.votes || 0 : "กดโหวต (+1)"}
        {!compact && <span className="vote-number">{issue?.votes || 0}</span>}
      </Button>
      <Button
        variant={followed ? "ghost" : "secondary"}
        disabled={busy}
        onClick={() =>
          act(
            "FOLLOW",
            issue,
            {},
            followed ? "ยกเลิกติดตามแล้ว" : "ติดตามปัญหานี้แล้ว",
          )
        }
        aria-label={"ติดตาม " + (issue?.id || "")}
      >
        {followed ? <BellRing size={15} /> : <Bell size={15} />}
        <span>{followed ? "ติดตามแล้ว" : "ติดตามปัญหานี้"}</span>
      </Button>
    </div>
  );
}

function SatisfactionModal({ issue, onClose }) {
  const { act, busy } = useStore();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const submitModal = async (event) => {
    event.preventDefault();
    if (!score) return;
    const saved = await act(
      "RATE", issue, { score, comment },
      "ขอบคุณที่ประเมินความพึงพอใจ",
    );
    if (saved) onClose();
  };
  const labels = ["ควรปรับปรุงมาก", "ควรปรับปรุง", "ปานกลาง", "พึงพอใจ", "พึงพอใจมาก"];
  return (
    <Modal title="ประเมินความพึงพอใจ" onClose={onClose}>
      <form className="satisfaction-form" onSubmit={submitModal}>
        <span className="satisfaction-kicker">เรื่องปิดแล้ว · {issue?.id}</span>
        <h3>{issue?.title}</h3>
        <p>การแก้ไขปัญหาเรื่องนี้ตรงกับความคาดหวังของคุณแค่ไหน</p>
        <fieldset>
          <legend>ให้คะแนนความพึงพอใจ <span aria-hidden="true">*</span></legend>
          <div className="satisfaction-stars">
            {labels.map((label, index) => {
              const value = index + 1;
              return (
                <label key={value} className={score === value ? "selected" : ""}>
                  <input type="radio" name="satisfaction-score" value={value}
                    checked={score === value} required
                    onChange={() => setScore(value)}
                    aria-label={`${value} คะแนน: ${label}`} />
                  <Star size={24} fill={score >= value ? "currentColor" : "none"} aria-hidden="true" />
                  <span>{value}</span>
                </label>
              );
            })}
          </div>
          <p className="satisfaction-rating-label" aria-live="polite">
            {score ? `${score} จาก 5 คะแนน · ${labels[score - 1]}` : "เลือกดาว 1–5 ดวง"}
          </p>
        </fieldset>
        <Field label="ข้อเสนอแนะเพิ่มเติม" hint="ไม่บังคับ · ไม่เกิน 300 ตัวอักษร">
          <textarea rows={3} maxLength={300} value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="เช่น การแจ้งความคืบหน้า หรือคุณภาพงาน" />
        </Field>
        <small className="satisfaction-count">{comment.length}/300</small>
        <p className="satisfaction-privacy">ความคิดเห็นส่งให้เจ้าหน้าที่ประกอบการปรับปรุงบริการ ไม่แสดงในรายการปัญหาสาธารณะ</p>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>ไว้ทีหลัง</Button>
          <Button type="submit" disabled={!score || busy}>{busy ? "กำลังส่ง…" : "ส่งแบบประเมิน"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CitizenCorrectionForm({ issue, onClose }) {
  const { act, busy, notify } = useStore();
  const [data, setData] = useState({
    title: issue?.title || "",
    description: issue?.description || "",
    place: issue?.place || "",
    phone: issue?.phone || "",
    reporterName: issue?.reporterName || "",
  });
  const [media, setMedia] = useState([]);
  const deadline = issue?.citizenEditDeadline
    ? new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "th-TH", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(issue.citizenEditDeadline))
    : "หมดเขตแล้ว";
  const set = (key, value) => setData((current) => ({ ...current, [key]: value }));
  return (
    <Modal title="แก้ไขและส่งข้อมูลเพิ่มเติม" onClose={onClose}>
      <p className="muted mb-3">
        {issue?.id} · {issue?.title}
      </p>
      <div className="citizen-correction-request">
        <strong>ข้อมูลที่เจ้าหน้าที่ขอ</strong>
        <p>{issue?.requestedInfo || "โปรดตรวจสอบและเติมข้อมูลให้ครบถ้วน"}</p>
        <small>ส่งแก้ไขได้ถึง {deadline} · ภายใน 7 วัน</small>
      </div>
      <form
        className="form-stack citizen-correction-form"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            if (data.phone.trim()) normalizePhone(data.phone);
          } catch (error) {
            notify(error.message, true);
            return;
          }
          const result = await act(
            "CITIZEN_UPDATE",
            issue,
            { ...data, media },
            "ส่งข้อมูลเพิ่มเติมแล้ว เจ้าหน้าที่จะตรวจคำร้องอีกครั้ง",
          );
          if (result) onClose();
        }}
      >
        <Field label="ชื่อเรื่อง" hint="ไม่บังคับ · เว้นว่างได้">
          <input
            value={data.title}
            maxLength={100}
            onChange={(event) => set("title", event.target.value)}
          />
        </Field>
        <Field label="รายละเอียดปัญหา" required>
          <textarea
            required
            rows={5}
            maxLength={4000}
            value={data.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </Field>
        <Field label="จุดสังเกตหรือสถานที่" required>
          <input
            required
            value={data.place}
            maxLength={180}
            onChange={(event) => set("place", event.target.value)}
          />
        </Field>
        <Field label="ชื่อผู้แจ้ง" hint="ไม่บังคับ">
          <input
            value={data.reporterName}
            maxLength={100}
            onChange={(event) => set("reporterName", event.target.value)}
          />
        </Field>
        <Field label="เบอร์โทรศัพท์" hint="ไม่บังคับ · สำหรับติดต่อกลับ">
          <input
            type="tel"
            value={data.phone}
            placeholder="เช่น 0812345678"
            autoComplete="tel"
            onChange={(event) => set("phone", event.target.value)}
          />
        </Field>
        {issue?.media?.length < 5 ? (
          <Uploader
            files={media}
            onChange={setMedia}
            label="เพิ่มรูปหรือวิดีโอประกอบ"
            maxFiles={5 - (issue?.media?.length || 0)}
          />
        ) : (
          <p className="muted text-sm">
            แนบหลักฐานครบ 5 ไฟล์แล้ว · รายละเอียดเดิมจะยังคงอยู่
          </p>
        )}
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={onClose}
          >
            กลับก่อน
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "กำลังส่ง…" : "ส่งข้อมูลให้เจ้าหน้าที่"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CitizenNav({ page, go, open, setOpen }) {
  const navRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const trigger = document.querySelector(".citizen-menu-trigger");
    const frame = requestAnimationFrame(() => navRef.current?.querySelector("button")?.focus());
    const content = navRef.current?.closest(".citizen-nav-host")?.querySelector(".citizen-wrap, .citizen-portal-shell");
    if (content) content.inert = true;
    const onKey = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const controls = [trigger, ...navRef.current.querySelectorAll("button, a[href]")].filter(Boolean);
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && (index === -1 || index === controls.length - 1)) { event.preventDefault(); controls[0]?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      if (content) content.inert = false;
      trigger?.focus({ preventScroll: true });
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const active = ["nearby", "form"].includes(page)
    ? "report"
    : ["tracking", "detail"].includes(page)
      ? "tracking"
      : page === "emergency"
        ? "emergency"
        : "home";
  const navigate = (target) => {
    setOpen(false);
    go(target);
  };
  return (
    <div className="citizen-nav-container">
      {open && (
        <button
          type="button"
          className="citizen-nav-backdrop"
          aria-label="ปิดเมนูประชาชน"
          onClick={() => setOpen(false)}
        />
      )}
      <nav
        ref={navRef}
        id="citizen-sidebar"
        className={cx("citizen-sidebar", open && "is-open")}
        aria-label="เมนูประชาชน"
        data-active={active}
      >
        <div className="citizen-sidebar-heading">
          <span>เมนูหลัก</span>
          <button
            type="button"
            className="citizen-sidebar-close"
            aria-label="ปิดเมนูประชาชน"
            onClick={() => setOpen(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <button className={active === "home" ? "active" : ""} aria-current={active === "home" ? "page" : undefined} onClick={() => navigate("portal")}>
          <Home size={19} aria-hidden="true" />
          <span>หน้าหลัก</span>
        </button>
        <button
          className={active === "report" ? "active" : ""}
          aria-current={active === "report" ? "page" : undefined}
          onClick={() => navigate("nearby")}
        >
          <Plus size={21} aria-hidden="true" />
          <span>แจ้งปัญหา</span>
        </button>
        <button
          className={active === "tracking" ? "active" : ""}
          aria-current={active === "tracking" ? "page" : undefined}
          onClick={() => navigate("tracking")}
        >
          <ClipboardList size={19} aria-hidden="true" />
          <span>ติดตาม</span>
        </button>
        <button className={active === "emergency" ? "active emergency-tab" : "emergency-tab"} aria-current={active === "emergency" ? "page" : undefined} onClick={() => navigate("emergency")}>
          <Phone size={19} aria-hidden="true" />
          <span>เบอร์ช่วยเหลือ</span>
        </button>
      </nav>
    </div>
  );
}

export default function Citizen({ navOpen, setNavOpen }) {
  const { act, busy, notify, actor, citizenIdentity } = useStore();
  const geo = useGeolocation();
  const locate = async () => {
    const position = await geo.request();
    if (position) {
      update("location", position);
      notify("ใช้พิกัด GPS ของอุปกรณ์แล้ว");
    }
  };
  const [page, setPage] = useState("portal"),
    [trackTab, setTrackTab] = useState("mine"),
    [trackStatus, setTrackStatus] = useState("all"),
    [selected, setSelected] = useState(null),
    [detailFrom, setDetailFrom] = useState("portal"),
    [search, setSearch] = useState(""),
    [trackPage, setTrackPage] = useState(1);

  // ดึงข้อมูลจริงจาก Neon โดยตรง
  const [neonIssues, setNeonIssues] = useState([]);

  const [form, setForm] = useState({
      category: "ไฟฟ้าส่องสว่าง",
      phone: "",
      reporterName: citizenIdentity?.displayName || "",
      title: "",
      description: "",
      place: "บริเวณตลาดระแหง",
      location: USER_LOCATION,
    }),
    [media, setMedia] = useState([]),
    [receipt, setReceipt] = useState(null);
  const [correcting, setCorrecting] = useState(false);
  const [ratingIssueId, setRatingIssueId] = useState(null);

  useEffect(() => {
    if (geo.source === "gps")
      setForm((f) => ({ ...f, location: geo.location }));
  }, [geo.location, geo.source]);

  useEffect(() => {
    if (citizenIdentity?.displayName)
      setForm((f) => ({
        ...f,
        reporterName: f.reporterName || citizenIdentity.displayName,
      }));
  }, [citizenIdentity?.displayName]);

  // โหลดข้อมูลจริงจากตาราง reports ใน Neon
  useEffect(() => {
    const fetchNeonReports = async () => {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon("postgresql://neondb_owner:npg_HmAiMfy2qU5N@ep-noisy-truth-b5sf63d2-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
        
        const rows = await sql`SELECT * FROM reports ORDER BY created_at DESC`;
        
        const formatted = rows.map((r) => ({
          id: "REQ-" + r.id,
          title: r.title || "แจ้งปัญหาทั่วไป",
          description: r.description || "",
          place: r.location || "ไม่ระบุสถานที่",
          category: r.title || "ทั่วไป",
          status: r.status || "NEW",
          reportedBy: r.citizen_id || actor.id,
          reporterName: "ประชาชน",
          phone: "",
          followers: [],
          voters: [],
          votes: 1,
          updatedAt: r.created_at || new Date().toISOString(),
          createdAt: r.created_at || new Date().toISOString(),
          media: [],
          satisfaction: [],
          location: USER_LOCATION,
          timeline: [
            { status: "NEW", title: "รับแจ้งเรื่องเข้าสู่ระบบ", time: r.created_at || new Date().toISOString() }
          ]
        }));

        setNeonIssues(formatted);
      } catch (err) {
        console.error("Failed to fetch reports from Neon:", err);
      }
    };

    fetchNeonReports();
  }, [page, actor.id]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  
  const open = (i) => {
    setDetailFrom(page);
    setSelected(i.id);
    setPage("detail");
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  // ดึงข้อมูลตัวที่เลือกจาก Neon ตรงๆ
  const issue = neonIssues.find((i) => i.id === selected) || {
    id: selected || "REQ-0000",
    title: "กำลังโหลด...",
    description: "",
    place: "",
    category: "ทั่วไป",
    status: "NEW",
    reportedBy: actor.id,
    followers: [],
    voters: [],
    votes: 0,
    updatedAt: new Date().toISOString(),
    media: [],
    satisfaction: [],
    timeline: []
  };

  const near = nearby(neonIssues, form.location);
  
  const go = (p) => {
    setPage(p);
    setSelected(null);
  };

  const trackingScope = useMemo(() => neonIssues, [neonIssues]);

  const trackedIssues = trackingScope.filter((i) => {
    return [i.title, i.id, i.place].join(" ").toLowerCase().includes(search.toLowerCase());
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const trackPages = Math.max(1, Math.ceil(trackedIssues.length / 5));
  
  useEffect(() => setTrackPage(1), [trackTab, trackStatus, search]);
  useEffect(() => {
    if (trackPage > trackPages) setTrackPage(trackPages);
  }, [trackPage, trackPages]);

  // ฟังก์ชันส่งข้อมูลเข้า Neon ฐานข้อมูลจริง
  const submit = async (event) => {
    event.preventDefault();
    if (!form.description.trim()) {
      notify("กรุณากรอกรายละเอียดปัญหา", true);
      return;
    }
    try {
      if (form.phone.trim()) normalizePhone(form.phone);
    } catch (e) {
      notify(e.message, true);
      return;
    }
    if (!media.length) {
      notify("กรุณาแนบรูปหลักฐานหรือวิดีโออย่างน้อย 1 ไฟล์", true);
      return;
    }

    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon("postgresql://neondb_owner:npg_HmAiMfy2qU5N@ep-noisy-truth-b5sf63d2-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

      const result = await sql`
        INSERT INTO reports (title, description, location, citizen_id)
        VALUES (
          ${form.title || form.category}, 
          ${form.description}, 
          ${form.place}, 
          ${actor.id}
        )
        RETURNING id
      `;

      notify("ส่งคำร้องสำเร็จ ข้อมูลบันทึกลง Neon เรียบร้อย!");
      const newId = "REQ-" + (result[0]?.id || Math.floor(1000 + Math.random() * 9000));
      setReceipt(newId);
      setPage("receipt");
      setMedia([]);
      setForm({ ...form, title: "", description: "" });

    } catch (error) {
      console.error(error);
      notify("ไม่สามารถเชื่อมต่อฐานข้อมูล Neon ได้", true);
    }
  };

  const locationNotice = (geo.pending || geo.error) && (
    <aside className="citizen-location-notice" role={geo.error ? "alert" : "status"}>
      <LocateFixed size={22} aria-hidden="true" />
      <div>
        <strong>{geo.pending ? "กำลังขอใช้ตำแหน่งของคุณ" : geo.permission === "denied" ? "ใช้งานต่อได้โดยไม่เปิดตำแหน่ง" : "ยังไม่พบตำแหน่งของคุณ"}</strong>
        <p>{geo.pending ? "กรุณาเลือกอนุญาตในข้อความของอุปกรณ์ เพื่อใช้ตำแหน่งปัจจุบันและค้นหาเบอร์ช่วยเหลือใกล้ตัว" : geo.error}</p>
        {geo.permission === "denied" && <small>หากต้องการเปิดใช้ภายหลัง ให้เปลี่ยนสิทธิ์ตำแหน่งในการตั้งค่าของเบราว์เซอร์หรือ LINE แล้วเปิดหน้านี้ใหม่</small>}
        {!geo.pending && geo.permission !== "denied" && <button type="button" onClick={geo.request}>ลองค้นหาตำแหน่งอีกครั้ง</button>}
      </div>
    </aside>
  );

  if (page === "portal")
    return (
      <div className="citizen-nav-host">
        <CitizenNav page={page} go={go} open={navOpen} setOpen={setNavOpen} />
        {locationNotice}
        <div className="citizen-portal-shell">
          <PublicDashboard
            onReport={() => go("nearby")}
            onTrack={() => go("tracking")}
            onOpen={open}
            geo={geo}
          />
        </div>
      </div>
    );

  return (
    <div className="citizen-nav-host">
      <CitizenNav page={page} go={go} open={navOpen} setOpen={setNavOpen} />
      {locationNotice}
      <div className="citizen-wrap">
        <div className="phone-frame">
          <div className="citizen-header">
            <a className="municipal-mark" href="/citizen" aria-label="TownTrack · กลับหน้าหลักประชาชน">ท</a>
            <div>
              <a href="/citizen" aria-label="TownTrack · กลับหน้าหลักประชาชน" style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}><strong>TownTrack</strong></a>
              <small>
                {citizenIdentity
                  ? `LINE OA · ${citizenIdentity.displayName || "ยืนยันตัวตนแล้ว"}`
                  : MUNICIPALITY}
              </small>
            </div>
            <button
              className="icon-btn citizen-bell"
              aria-label="ดูเรื่องที่ติดตาม"
              onClick={() => {
                setTrackTab("follow");
                go("tracking");
              }}
            >
              <Bell size={20} />
              <i />
            </button>
          </div>
          {!['portal', 'emergency'].includes(page) && (
            <nav className="citizen-flow" aria-label="ขั้นตอนแจ้งและติดตามปัญหา">
              {[
                ["nearby", "เช็กเรื่องซ้ำ"],
                ["form", "แจ้งปัญหา"],
                ["receipt", "ติดตาม/แก้ไข"],
              ].map(([step, label], index) => {
                const activeStep = ["nearby"].includes(page)
                  ? 0
                  : ["form"].includes(page)
                    ? 1
                    : 2;
                const complete = index < activeStep;
                return (
                  <div
                    key={step}
                    className={cx(
                      "citizen-flow-step",
                      index === activeStep && "is-active",
                      complete && "is-complete",
                    )}
                    aria-current={index === activeStep ? "step" : undefined}
                  >
                    <span>{complete ? <Check size={14} /> : index + 1}</span>
                    <strong>{label}</strong>
                  </div>
                );
              })}
            </nav>
          )}
          <div className={cx("citizen-body", "citizen-page-" + page)}>
            {page === "nearby" && (
              <>
                <button className="back-link" onClick={() => go("portal")}>
                  <ArrowLeft size={16} />
                  กลับหน้าหลัก
                </button>
                <span className="eyebrow">ก่อนแจ้งปัญหา</span>
                <h1>ตรวจปัญหาใกล้จุดเกิดเหตุ</h1>
                <p className="muted">
                  ดูเรื่องในระยะ 100 เมตร
                  <br />
                  เพื่อช่วยลดการแจ้งซ้ำ
                </p>
                <div className="gps-box">
                  <LocateFixed size={18} />
                  <div>
                    <strong>
                      {geo.source === "gps" &&
                      distance(form.location, geo.location) < 1
                        ? "พิกัดจาก GPS ของคุณ"
                        : distance(form.location, USER_LOCATION) > 1
                          ? "จุดเกิดเหตุที่เลือกบนแผนที่"
                          : "จุดอ้างอิงเทศบาล · ยังไม่ได้ใช้ GPS"}
                    </strong>
                    <small>
                      {form.location.lat.toFixed(6)},{" "}
                      {form.location.lng.toFixed(6)}
                      {geo.accuracy
                        ? " · ความแม่นยำประมาณ " +
                          Math.round(geo.accuracy) +
                          " ม."
                        : ""}
                    </small>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full mb-3"
                  disabled={geo.pending}
                  onClick={locate}
                >
                  <LocateFixed size={15} />
                  {geo.pending ? "กำลังหาตำแหน่ง…" : "ใช้ GPS ของฉัน"}
                </Button>
                {geo.error && (
                  <p className="gps-error" role="alert">
                    {geo.error}
                  </p>
                )}
                <GeoMap
                  issues={near}
                  center={form.location}
                  radar
                  onSelect={open}
                  onPick={(p) => update("location", p)}
                />
                <div className="section-title mt-5">
                  <strong>พบ {near.length} ปัญหาใกล้คุณ</strong>
                  <span className="muted text-xs">ภายใน 100 เมตร</span>
                </div>
                {near.length ? (
                  near.map((i) => (
                    <article className="nearby-card" key={i.id}>
                      <div className="flex justify-between items-center">
                        <span className="case-id">{i.id}</span>
                        <span className="distance-label">
                          <Navigation size={11} />
                          {Math.round(distance(i.location, form.location))} เมตร
                        </span>
                      </div>
                      <h3>{i.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="category-tag">{i.category}</span>
                        <Badge issue={i} />
                      </div>
                      <VoteFollow issue={i} />
                    </article>
                  ))
                ) : (
                  <Empty
                    title="ยังไม่พบปัญหาใกล้จุดนี้"
                    text="คุณสามารถแจ้งคำร้องใหม่ได้"
                  />
                )}
                <Button className="w-full mt-4" onClick={() => go("form")}>
                  ไม่พบเรื่องนี้? แจ้งปัญหาใหม่
                  <ArrowRight size={16} />
                </Button>
              </>
            )}
            {page === "form" && (
              <>
                <button className="back-link" onClick={() => go("nearby")}>
                  <ArrowLeft size={16} />
                  กลับไปดูปัญหาใกล้ตัว
                </button>
                <span className="eyebrow">คำร้องใหม่</span>
                <h1>แจ้งปัญหา</h1>
                <p className="muted mb-5">
                  บอกข้อมูลให้ครบ เพื่อให้เจ้าหน้าที่ช่วยได้เร็วขึ้น
                </p>
                <form className="form-stack" onSubmit={submit}>
                  <fieldset className="category-picker">
                    <legend>
                      ประเภทปัญหา <b aria-hidden="true">*</b>
                    </legend>
                    <div className="category-option-grid">
                      {CATEGORY_OPTIONS.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          type="button"
                          className={cx(
                            "category-option",
                            form.category === value && "selected",
                          )}
                          aria-pressed={form.category === value}
                          aria-label={`เลือกประเภท ${label}`}
                          onClick={() => update("category", value)}
                        >
                          <Icon size={20} aria-hidden="true" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <Field
                    label="ชื่อเรื่อง"
                    hint="ไม่บังคับ · เว้นว่างได้"
                  >
                    <input
                      value={form.title}
                      maxLength={100}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="เช่น ไฟส่องสว่างดับท้ายซอย"
                    />
                  </Field>
                  <Field label="สถานที่เกิดเหตุ" required>
                    <input
                      value={form.place}
                      required
                      maxLength={200}
                      onChange={(e) => update("place", e.target.value)}
                      placeholder="เช่น ซอย 3 หน้าโรงเรียน"
                    />
                  </Field>
                  <GeoMap
                    center={form.location}
                    onPick={(p) => update("location", p)}
                    radar
                  />
                  <div className="form-grid">
                    <Field label="ละติจูด">
                      <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        value={form.location.lat}
                        onChange={(e) =>
                          update("location", {
                            ...form.location,
                            lat: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="ลองจิจูด">
                      <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        value={form.location.lng}
                        onChange={(e) =>
                          update("location", {
                            ...form.location,
                            lng: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={geo.pending}
                    onClick={locate}
                  >
                    <LocateFixed size={15} />
                    {geo.pending ? "กำลังหาตำแหน่ง…" : "ใช้ GPS ของฉัน"}
                  </Button>
                  {geo.error && (
                    <p className="gps-error" role="alert">
                      {geo.error}
                    </p>
                  )}
                  <Field label="ชื่อ–นามสกุล" hint="ไม่บังคับ">
                    <input
                      value={form.reporterName}
                      maxLength={100}
                      onChange={(e) => update("reporterName", e.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                  <Field
                    label="เบอร์โทรศัพท์"
                    hint="ไม่บังคับ · สำหรับติดต่อกลับ"
                  >
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="เช่น 0812345678"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="รายละเอียดปัญหา" required>
                    <textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      required
                      maxLength={1500}
                      rows={4}
                      placeholder="เกิดอะไรขึ้น และกระทบคนในพื้นที่อย่างไร"
                    />
                  </Field>
                  <Uploader
                    files={media}
                    onChange={setMedia}
                    required
                    label="แนบรูปหรือวิดีโออย่างน้อย 1 ไฟล์"
                  />
                  <PrivacyNotice />
                  <div className="form-grid">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => go("portal")}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      type="submit"
                      disabled={busy}
                    >
                      <Send size={16} />
                      {busy ? "กำลังส่ง…" : "ยืนยันส่งข้อมูล"}
                    </Button>
                  </div>
                </form>
              </>
            )}
            {page === "receipt" && (
              <div className="receipt">
                <div className="receipt-check">
                  <CheckCircle2 size={44} />
                </div>
                <span className="eyebrow">บันทึกคำร้องแล้ว</span>
                <h1>ขอบคุณที่ช่วยดูแลชุมชน</h1>
                <p>หมายเลขคำร้องของคุณ</p>
                <strong className="receipt-id">{receipt}</strong>
                <p className="muted">
                  คุณสามารถดูสถานะและประวัติ
                  <br />
                  ได้จากหน้าติดตามความคืบหน้า
                </p>
                <Button
                  onClick={() => {
                    setSelected(receipt);
                    setPage("detail");
                  }}
                  className="w-full"
                >
                  <ClipboardList size={17} />
                  ติดตามคำร้องนี้
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => go("portal")}
                  className="w-full"
                >
                  กลับหน้าหลัก
                </Button>
              </div>
            )}
            {page === "tracking" && (
              <>
                <span className="eyebrow">ทุกเรื่องมีความคืบหน้า</span>
                <h1>ติดตามสถานะปัญหา</h1>
                <div className="search-input">
                  <Search size={16} />
                  <input
                    aria-label="ค้นหาชื่อเรื่องหรือเลขคำร้อง"
                    placeholder="ค้นหาชื่อเรื่องหรือเลขคำร้อง"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="tracking-grid">
                  {trackedIssues
                    .slice((trackPage - 1) * 5, trackPage * 5)
                    .map((i) => (
                    <button
                      className={cx("tracking-card", i.status === "CLOSED" && "tracking-card-closed")}
                      key={i.id}
                      onClick={() => open(i)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="case-id">{i.id}</span>
                        <Badge issue={i} />
                      </div>
                      <h3>{i.title}</h3>
                      <small>{i.place}</small>
                      {i.reportedBy === actor.id && i.status === "NEEDS_INFO" && (
                        <small className="tracking-needs-info">
                          รอข้อมูลจากคุณ · แตะเพื่อแก้ไข
                        </small>
                      )}
                      {i.status === "CLOSED" && (
                        <small className="tracking-rating-hint">
                          {i.satisfaction?.some((entry) => entry.actorId === actor.id)
                            ? `ประเมินแล้ว · ${i.satisfaction.find((entry) => entry.actorId === actor.id).score}/5 คะแนน`
                            : "ปิดเรื่องแล้ว · แตะเพื่อประเมินความพึงพอใจ"}
                        </small>
                      )}
                      <div className="mini-progress">
                        {[
                          "NEW",
                          "RECEIVED",
                          "IN_PROGRESS",
                          "STAFF_REVIEW",
                          "CLOSED",
                        ].map((s, n) => (
                          <span
                            key={s}
                            className={n <= stageOf(i.status) ? "filled" : ""}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="muted text-xs">{date(i.updatedAt)}</span>
                        <ChevronRight size={15} />
                      </div>
                    </button>
                  ))}
                </div>
                {!trackedIssues.length && (
                  <Empty
                    title={
                      trackStatus !== "all" || search ? "ไม่พบเรื่องตามเงื่อนไขที่เลือก" : trackTab === "mine"
                        ? "ยังไม่มีเรื่องที่คุณแจ้ง"
                        : "ยังไม่ได้ติดตามปัญหา"
                    }
                    text={trackStatus !== "all" || search ? "ลองเลือกสถานะทั้งหมด หรือเปลี่ยนคำค้นหา" : "เริ่มจากหน้าหลัก หรือเลือกติดตามปัญหาที่พบ"}
                  />
                )}
                {trackedIssues.length > 5 && (
                  <nav className="pagination" aria-label="หน้ารายการติดตาม">
                    <button
                      aria-label="หน้าก่อนหน้า"
                      disabled={trackPage === 1}
                      onClick={() => setTrackPage((n) => Math.max(1, n - 1))}
                    >
                      <ArrowLeft size={15} />
                    </button>
                    {Array.from({ length: trackPages }, (_, n) => n + 1)
                      .filter(
                        (n) =>
                          n === 1 ||
                          n === trackPages ||
                          Math.abs(n - trackPage) <= 1,
                      )
                      .map((n, index, visible) => (
                        <React.Fragment key={n}>
                          {index > 0 && n - visible[index - 1] > 1 && (
                            <span aria-hidden="true">…</span>
                          )}
                          <button
                            aria-label={`หน้า ${n}`}
                            aria-current={trackPage === n ? "page" : undefined}
                            onClick={() => setTrackPage(n)}
                          >
                            {n}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      aria-label="หน้าถัดไป"
                      disabled={trackPage === trackPages}
                      onClick={() =>
                        setTrackPage((n) => Math.min(trackPages, n + 1))
                      }
                    >
                      <ArrowRight size={15} />
                    </button>
                    <small>
                      {trackedIssues.length} เรื่อง · หน้า {trackPage}/{trackPages}
                    </small>
                  </nav>
                )}
              </>
            )}
            {page === "emergency" && (
              <EmergencyPage geo={geo} />
            )}
            {page === "detail" && issue && (
              <>
                <button className="back-link" onClick={() => go(detailFrom)}>
                  <ArrowLeft size={16} />
                  กลับรายการ
                </button>
                <IssueSummary issue={publicIssue(issue)} />
                {issue.status === "CLOSED" &&
                  (issue.reportedBy === actor.id || issue.followers.includes(actor.id)) && (
                  <section className="satisfaction-detail" aria-label="ความพึงพอใจต่อเรื่องนี้">
                    <Star size={22} aria-hidden="true" />
                    <div>
                      <strong>การประเมินความพึงพอใจ</strong>
                      <p>{issue.satisfaction?.some((entry) => entry.actorId === actor.id)
                        ? `คุณให้ ${issue.satisfaction.find((entry) => entry.actorId === actor.id).score} จาก 5 คะแนนแล้ว ขอบคุณสำหรับความคิดเห็น`
                        : "เรื่องปิดแล้ว ช่วยบอกความเห็นเพื่อปรับปรุงบริการ"}</p>
                    </div>
                    {!issue.satisfaction?.some((entry) => entry.actorId === actor.id) && (
                      <Button variant="secondary" onClick={() => setRatingIssueId(issue.id)}>
                        ให้คะแนน
                      </Button>
                    )}
                  </section>
                )}
                {issue.reportedBy === actor.id && issue.status === "NEEDS_INFO" && (
                  <section className="citizen-correction-card" aria-label="แก้ไขคำร้อง">
                    <div>
                      <span className="eyebrow">รอข้อมูลจากคุณ</span>
                      <h2>เจ้าหน้าที่ขอข้อมูลเพิ่มเติม</h2>
                      <p>{issue.requestedInfo}</p>
                      <small>
                        กรุณาส่งภายใน 7 วัน · ปิดเรื่องอัตโนมัติเมื่อพ้นกำหนด
                      </small>
                    </div>
                    <Button onClick={() => setCorrecting(true)}>
                      แก้ข้อมูลและส่งอีกครั้ง
                    </Button>
                  </section>
                )}
                <VoteFollow issue={issue} />
                <h2 className="mt-6 mb-3">ความคืบหน้า</h2>
                <Timeline issue={issue} />
              </>
            )}
          </div>
          <div className="citizen-bottom">
            <button className={page === 'portal' ? 'active' : ''} onClick={() => go('portal')}>
              <Home size={20} />
              <span>หน้าหลัก</span>
            </button>
            <button className={page === 'nearby' || page === 'form' ? 'active' : ''} onClick={() => go('nearby')}>
              <Plus size={20} />
              <span>แจ้งเรื่อง</span>
            </button>
            <button className={page === 'tracking' || page === 'detail' ? 'active' : ''} onClick={() => go('tracking')}>
              <ClipboardList size={20} />
              <span>ติดตาม</span>
            </button>
            <button className={page === 'emergency' ? 'active emergency-tab' : 'emergency-tab'} onClick={() => go('emergency')}>
              <Phone size={20} />
              <span>ฉุกเฉิน</span>
            </button>
          </div>
        </div>
      </div>
      {correcting && issue && (
        <CitizenCorrectionForm
          issue={issue}
          onClose={() => setCorrecting(false)}
        />
      )}
      {ratingIssueId && (
        <SatisfactionModal key={ratingIssueId}
          issue={db.issues.find((entry) => entry.id === ratingIssueId)}
          onClose={() => setRatingIssueId(null)} />
      )}
    </div>
  );
}