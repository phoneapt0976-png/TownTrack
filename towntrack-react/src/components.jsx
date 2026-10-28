import { getLanguage } from './i18n';
import React, { useState, useEffect, useRef, useId } from "react";
import {
  X,
  Check,
  MapPin,
  Upload,
  FileText,
  Video,
  ChevronRight,
  AlertTriangle,
  Phone,
  Camera,
  ExternalLink,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { useStore, useMedia, validateFiles } from "./store";
import { STATUS, MUNICIPALITY, USER_LOCATION } from "./model";
export const cx = (...v) => v.filter(Boolean).join(" ");
export const date = (v) =>
  new Intl.DateTimeFormat(getLanguage() === "en" ? "en-GB" : "th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
export const money = (v) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(v || 0);
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={cx(
        "btn",
        variant === "primary"
          ? "btn-primary"
          : variant === "danger"
            ? "btn-danger"
            : variant === "ghost"
              ? "btn-ghost"
              : "btn-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({ issue, status }) {
  const s = status || issue?.status;
  return (
    <span
      className={cx(
        "badge",
        s === "CLOSED"
          ? "badge-gray"
          : [
                "BUDGET_PENDING",
                "BUDGET_MORE",
                "LEGAL_PENDING",
                "LEGAL_MORE",
                "NEEDS_INFO",
              ].includes(s)
            ? "badge-amber"
            : s === "NEW"
              ? "badge-blue"
              : s === "REWORK"
                ? "badge-rose"
                : "badge-green",
      )}
    >
      {STATUS[s] || s}
    </span>
  );
}
export function Priority({ value }) {
  return value === "urgent" ? (
    <span className="badge badge-amber">เร่งด่วน</span>
  ) : null;
}
export function Empty({
  title = "ยังไม่มีงานในรายการนี้",
  text = "เมื่อมีงานส่งถึงคุณ จะแสดงที่นี่",
  icon: Icon = CheckCircle2,
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function Field({ label, required, children, hint, error }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  const controls = React.Children.map(children, (child) => {
    if (!React.isValidElement(child) || !["input", "textarea", "select"].includes(child.type)) return child;
    return React.cloneElement(child, {
      "aria-required": required || child.props["aria-required"],
      "aria-invalid": error ? true : child.props["aria-invalid"],
      "aria-describedby": [child.props["aria-describedby"], describedBy].filter(Boolean).join(" ") || undefined,
    });
  });
  return (
    <label className="field">
      <span>{label}{required && <><b className="text-rose-500" aria-hidden="true"> *</b><span className="sr-only"> (จำเป็น)</span></>}</span>
      {controls}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && <small id={`${id}-error`} role="alert">{error}</small>}
    </label>
  );
}
export function Modal({ title, children, onClose, red = false, closeOnBackdrop = false, className }) {
  const backdropPress = useRef(false);
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const old = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const list = ref.current.querySelectorAll(
          "button,a[href],input,textarea,select",
        );
        const usable = [...list].filter((v) => !v.disabled && v.getClientRects().length && v.tabIndex >= 0);
        if (!usable.length) return;
        if (!usable.includes(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? usable.at(-1) : usable[0]).focus();
        } else if (e.shiftKey && document.activeElement === usable[0]) {
          e.preventDefault();
          usable.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === usable.at(-1)) {
          e.preventDefault();
          usable[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
      old?.focus?.();
    };
  }, []);
  return (
    <div className={cx("modal-backdrop", closeOnBackdrop && "modal-backdrop-dismissible")}>
      {closeOnBackdrop && <div className="modal-dismiss-layer" aria-hidden="true"
        onPointerDown={() => { backdropPress.current = true; }}
        onPointerCancel={() => { backdropPress.current = false; }}
        onClick={() => {
          if (backdropPress.current) closeRef.current();
          backdropPress.current = false;
        }}
      />}
      <section
        className={cx("modal", red && "modal-red", className)}
        onPointerDown={() => { backdropPress.current = false; }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-btn"
            aria-label="ปิดหน้าต่าง"
            type="button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function MediaItem({ item, small = false }) {
  const url = useMedia(item);
  return (
    <div className={cx("media-item", small && "media-small")}>
      {!url ? (
        <div className="media-missing">
          <FileText size={22} />
          <span>โหลดไฟล์ไม่ได้</span>
        </div>
      ) : item.type.startsWith("video/") ? (
        <video src={url} controls preload="metadata" aria-label={item.name} />
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={item.name} />
        </a>
      )}
      <span title={item.name}>
        {item.sample ? "ภาพประกอบ" : item.name}
      </span>
      {item.source && (
        <small className="image-credit">
          <a href={item.source} target="_blank" rel="noreferrer">
            {item.author} · {item.license}
          </a>
        </small>
      )}
    </div>
  );
}
export function Gallery({ items = [] }) {
  return items.length ? (
    <div className="media-grid">
      {items.map((item, i) => (
        <MediaItem key={item.id || i} item={item} />
      ))}
    </div>
  ) : (
    <p className="muted text-sm">ไม่มีไฟล์แนบ</p>
  );
}
export function Uploader({
  files,
  onChange,
  label = "แนบรูปภาพ / วิดีโอ",
  required = false,
  maxFiles = 5,
}) {
  const { notify } = useStore();
  const id = React.useId();
  return (
    <div className="upload-section">
      <label className="upload-zone" htmlFor={id}>
        <Upload size={24} />
        <strong>
          {label}
          {required ? " *" : ""}
        </strong>
        <span>JPG, PNG, WebP, MP4, WebM, MOV · น้อยกว่า 10 MB/ไฟล์</span>
        <input
          id={id}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={(e) => {
            try {
              const next = [...files, ...e.target.files];
              if (next.length > maxFiles)
                throw Error(`เพิ่มได้อีกไม่เกิน ${maxFiles} ไฟล์`);
              validateFiles(next);
              onChange(next);
            } catch (err) {
              notify(err.message, true);
            }
            e.target.value = "";
          }}
        />
      </label>
      {files.length > 0 && (
        <div className="upload-previews">
          {files.map((f, i) => (
            <div key={i} className="relative">
              <MediaItem item={f} small />
              <button
                type="button"
                className="remove-media"
                aria-label={"ลบ " + f.name}
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export function Timeline({ issue }) {
  const map = {
      NEW: 0,
      NEEDS_INFO: 1,
      RECEIVED: 1,
      SUPERVISOR: 1,
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
    },
    cur = map[issue.status] ?? 0;
  return (
    <div>
      <ol className="timeline-steps">
        {["แจ้งเรื่อง", "รับคำร้อง", "กำลังแก้ไข", "ตรวจสอบ", "ปิดเรื่อง"].map(
          (s, i) => (
            <li key={s} className={i <= cur ? "done" : ""}>
              <span>{i < cur ? <Check size={12} /> : i + 1}</span>
              <small>{s}</small>
            </li>
          ),
        )}
      </ol>
      <ol className="event-list">
        {[...issue.history].reverse().map((h) => (
          <li key={h.id}>
            <span className="event-dot" />
            <strong>{STATUS[h.status]}</strong>
            <p>{h.text}</p>
            <small>
              {date(h.at)} · {h.actorName}
            </small>
          </li>
        ))}
      </ol>
    </div>
  );
}
const pinPercent = (i) => ({
  x: Math.max(
    9,
    Math.min(91, 50 + (i.location.lng - USER_LOCATION.lng) * 14000),
  ),
  y: Math.max(
    12,
    Math.min(88, 50 - (i.location.lat - USER_LOCATION.lat) * 15000),
  ),
});
export function MapPreview({
  issues = [],
  radar = false,
  onSelect,
  selected,
  location = USER_LOCATION,
}) {
  return (
    <div
      className={cx("map-preview", radar && "radar-map")}
      aria-label={radar ? "แผนที่จำลองรัศมี 100 เมตร" : "แผนที่จำลองเขตเทศบาล"}
    >
      <svg
        viewBox="0 0 500 310"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="500" height="310" fill="#eef1e8" />
        <path
          d="M380 -30 Q310 90 390 170 T350 340"
          fill="none"
          stroke="#bfdce0"
          strokeWidth="38"
        />
        <path
          d="M35 0 L95 310 M140 0 L205 310 M0 78 L500 98 M0 222 L500 180 M280 0 L242 310"
          stroke="#fff"
          strokeWidth="14"
        />
        <path
          d="M35 0 L95 310 M140 0 L205 310 M0 78 L500 98 M0 222 L500 180 M280 0 L242 310"
          stroke="#d8d7cd"
          strokeWidth="1"
        />
        <rect x="64" y="115" width="65" height="62" rx="12" fill="#d5e8c8" />
        <rect x="294" y="115" width="43" height="40" rx="5" fill="#e1dacb" />
        <rect x="102" y="25" width="31" height="36" rx="5" fill="#e1dacb" />
        <path
          d="M30 25 L360 16 L460 85 L428 275 L92 290 L20 215 Z"
          fill="rgba(16,137,98,.035)"
          stroke="#5a9f83"
          strokeDasharray="7 6"
          strokeWidth="2"
        />
        {radar && (
          <>
            <circle
              cx="250"
              cy="155"
              r="96"
              fill="rgba(39,128,95,.07)"
              stroke="#29906a"
              strokeDasharray="5 4"
            />
            <circle
              cx="250"
              cy="155"
              r="62"
              fill="none"
              stroke="#29906a"
              opacity=".17"
            />
            <line
              x1="250"
              y1="155"
              x2="300"
              y2="73"
              stroke="#29906a"
              opacity=".25"
            />
          </>
        )}
      </svg>
      <span className="map-label">
        {radar ? "รัศมี 100 เมตร" : MUNICIPALITY + " · ขอบเขตจำลอง"}
      </span>
      <span className="map-user" style={{ left: "50%", top: "50%" }}>
        <span />
      </span>
      {issues.map((i) => {
        const p = pinPercent(i);
        return (
          <button
            key={i.id}
            type="button"
            className={cx(
              "map-pin",
              i.status === "CLOSED"
                ? "pin-gray"
                : i.priority === "emergency"
                  ? "pin-red"
                  : "",
              selected === i.id && "pin-selected",
            )}
            style={{ left: p.x + "%", top: p.y + "%" }}
            title={i.title}
            aria-label={"ดู " + i.title}
            onClick={() => onSelect?.(i)}
          >
            <MapPin size={21} fill="currentColor" stroke="white" />
            <small>{i.id.split("-")[1]}</small>
          </button>
        );
      })}
      <span className="map-foot">
        ภาพจำลองเพื่อทดสอบ · ไม่ใช่แผนที่หรือขอบเขตทางราชการ
      </span>
    </div>
  );
}
export function ReportView({ issue }) {
  const r = issue.reports?.at(-1);
  return r ? (
    <section className="report-view">
      <div className="section-title">
        <Camera size={17} />
        <h3>รายงานการปฏิบัติงาน</h3>
        <span className="muted text-xs">ฉบับ {issue.reports.length}</span>
      </div>
      <p className="preserve-lines">{r.summary}</p>
      <div className="before-after">
        <div>
          <h4>ก่อนดำเนินการ</h4>
          <Gallery items={r.before} />
        </div>
        <div>
          <h4>หลังดำเนินการ</h4>
          <Gallery items={r.after} />
        </div>
      </div>
      <p className="muted text-xs">ส่ง {date(r.at)}</p>
      {issue.reworkComment && (
        <div className="notice notice-amber">
          ข้อแก้ไข: {issue.reworkComment}
        </div>
      )}
    </section>
  ) : (
    <Empty
      title="ยังไม่มีรายงานลงพื้นที่"
      text="รายงานและภาพก่อน/หลังจะแสดงเมื่อทีมส่งผล"
      icon={Camera}
    />
  );
}
export function IssueSummary({ issue, internal = false }) {
  return (
    <section className="issue-summary">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="case-id">{issue.id}</span>
        <Priority value={issue.priority} />
        <Badge issue={issue} />
      </div>
      <h2>{issue.title}</h2>
      {issue.isMock && (
        <p className="muted text-xs">
          ข้อมูลตัวอย่าง
        </p>
      )}
      <div className="issue-summary-meta">
        <span className="category-tag">{issue.category}</span>
        <span>แจ้งเมื่อ {date(issue.createdAt)}</span>
        <span>👍 {issue.votes || 0} โหวต</span>
      </div>
      <div className="issue-summary-block">
        <h3>รายละเอียดปัญหา</h3>
        <p className="summary-description">
          {issue.description || "คุณกำลังติดตามความคืบหน้าของคำร้องนี้"}
        </p>
      </div>
      <div className="issue-summary-block">
        <h3>สถานที่เกิดเหตุ</h3>
        <div className="summary-location">
          <MapPin size={17} aria-hidden="true" />
          <span>{issue.place}</span>
        </div>
        <a
          className="map-link"
          href={`https://www.openstreetmap.org/?mlat=${issue.location.lat}&mlon=${issue.location.lng}#map=18/${issue.location.lat}/${issue.location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          เปิดพิกัดบนแผนที่ <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
      {internal && issue.satisfaction?.length > 0 && (
        <section className="satisfaction-staff-summary" aria-label="ผลประเมินความพึงพอใจ">
          <strong>ผลประเมินหลังปิดเรื่อง</strong>
          <p>
            เฉลี่ย {(issue.satisfaction.reduce((sum, rating) => sum + rating.score, 0) /
              issue.satisfaction.length).toFixed(1)} / 5 คะแนน · {issue.satisfaction.length} คน
          </p>
          {issue.satisfaction.filter((rating) => rating.comment).map((rating, index) => (
            <blockquote key={`${rating.at}-${index}`}>{rating.comment}</blockquote>
          ))}
        </section>
      )}
      {internal && (
        <div className="reporter-box">
          <strong>ข้อมูลติดต่อผู้แจ้ง</strong>
          <span>{issue.reporterName || "ไม่ระบุชื่อ"}</span>
          {issue.phone ? (
            <a href={"tel:" + issue.phone}>
              <Phone size={13} />
              {issue.phone}
            </a>
          ) : (
            <span>ไม่ได้ระบุเบอร์โทร</span>
          )}
        </div>
      )}
      <div className="issue-summary-block issue-evidence">
        <h3>ภาพและหลักฐาน</h3>
        <Gallery items={issue.media} />
      </div>
    </section>
  );
}
