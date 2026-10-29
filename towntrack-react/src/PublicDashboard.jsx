import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  MapPin,
  LocateFixed,
  Layers,
  ThumbsUp,
  Bell,
  BellRing,
  Download,
  ArrowUpRight,
  ChevronUp,
  X,
  Lightbulb,
  Construction,
  Trash2,
  Waves,
  Trees,
  Flame,
  ListFilter,
} from "lucide-react";
import { useStore, useMedia } from "./store";
import {
  MUNICIPALITY,
  CATEGORIES,
  USER_LOCATION,
  distance,
} from "./model";
import { Badge, Priority, date, Empty } from "./components";
import GeoMap from "./GeoMap";
import { Capacitor } from "@capacitor/core";
const getPublicIssuePageSize = () => {
  const platform = Capacitor.getPlatform();
  return Capacitor.isNativePlatform() && ["ios", "android"].includes(platform)
    ? 12
    : 24;
};
const groups = [
  {
    id: "waiting",
    label: "รอรับเรื่อง / ข้อมูล",
    color: "rose",
    test: (i) => ["NEW", "NEEDS_INFO"].includes(i.status),
  },
  {
    id: "doing",
    label: "กำลังดำเนินการ",
    color: "amber",
    test: (i) =>
      ![
        "NEW",
        "NEEDS_INFO",
        "CLOSED",
        "BUDGET_PENDING",
        "BUDGET_MORE",
        "LEGAL_PENDING",
        "LEGAL_MORE",
      ].includes(i.status),
  },
  {
    id: "approval",
    label: "รอพิจารณา",
    color: "blue",
    test: (i) =>
      ["BUDGET_PENDING", "BUDGET_MORE", "LEGAL_PENDING", "LEGAL_MORE"].includes(
        i.status,
      ),
  },
  {
    id: "closed",
    label: "ปิดเรื่องแล้ว",
    color: "green",
    test: (i) => i.status === "CLOSED",
  },
];
const icons = [Lightbulb, Construction, Trash2, Waves, Trees, Flame];
function Artwork({ category, issue }) {
  const url = useMedia(issue?.media?.[0]);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (url && !failed)
    return (
      <div className="case-photo">
        {issue.media[0].type.startsWith("video/") ? (
          <video src={url} muted preload="metadata" />
        ) : (
          <img
            src={url}
            alt={
              issue.isMock
                ? "รูปตัวอย่างประกอบ " + category
                : "หลักฐาน " + issue.title
            }
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
        <span>{issue.isMock ? "ภาพตัวอย่าง" : "หลักฐานผู้แจ้ง"}</span>
      </div>
    );
  const Icon = icons[CATEGORIES.indexOf(category)] || MapPin;
  return (
    <div
      className={"case-art art-" + Math.max(0, CATEGORIES.indexOf(category))}
      aria-label={"ภาพสัญลักษณ์ " + category}
    >
      <span className="art-orbit" />
      <Icon size={36} strokeWidth={1.5} />
      <small>{category}</small>
    </div>
  );
}
function PublicMap({ issues, onOpen, mode, setMode, geo }) {
  const [local, setLocal] = useState(false);
  useEffect(() => { if (!geo.canUseLocation) setLocal(false); }, [geo.canUseLocation]);
  const shown = local && geo.canUseLocation
    ? issues.filter((i) => distance(i.location, geo.location) <= 100)
    : issues;
  return (
    <div className="public-map area-map-card">
      <div className="map-tools area-map-tools">
        <button
          disabled={geo.pending}
          aria-pressed={local}
          onClick={async () => {
            if (local) {
              setLocal(false);
              return;
            }
            const position = await geo.request();
            if (position) setLocal(true);
          }}
        >
          <LocateFixed size={15} />
          {geo.pending
            ? "กำลังหาตำแหน่ง…"
            : local
              ? "แสดงรอบตัว 100 ม."
              : "ปัญหาใกล้ฉัน"}
        </button>
        <div className="area-map-modes" role="group" aria-label="รูปแบบหมุดแผนที่">
          {[["Clustering", "กลุ่ม"], ["Marker", "หมุด"], ["Heatmap", "ความหนาแน่น"]].map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {geo.error && (
        <p className="gps-error" role="alert">
          {geo.error}
        </p>
      )}
      <GeoMap
        issues={shown}
        center={geo.location}
        onSelect={onOpen}
        mode={mode}
        radar={local}
        accuracy={geo.accuracy}
      />
      <div className="map-legend">
        {groups.map((g) => (
          <span key={g.id}>
            <i className={"dot-" + g.color} />
            {g.label}
          </span>
        ))}
        <small>{shown.length} จุด</small>
      </div>
    </div>
  );
}
export default function PublicDashboard({ onReport, onTrack, onOpen, geo }) {
  const { db, act, busy, notify, actor } = useStore();
  const [pageSize, setPageSize] = useState(getPublicIssuePageSize);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("latest"),
    [visibleCount, setVisibleCount] = useState(getPublicIssuePageSize),
    [mode, setMode] = useState("Clustering");
  useEffect(() => {
    // Recheck after the native WebView bridge is ready; web OIDC remains at 24.
    const detectPlatform = () => setPageSize(getPublicIssuePageSize());
    detectPlatform();
    const timer = window.setTimeout(detectPlatform, 250);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(
    () => setVisibleCount(pageSize),
    [query, category, status, sort, pageSize],
  );
  const ranking = [...db.issues].sort((a, b) => b.votes - a.votes).slice(0, 5);
  const filtered = db.issues
    .filter(
      (i) =>
        (sort !== "mine" || i.reportedBy === actor.id) &&
        (!category || i.category === category) &&
        (!status || groups.find((g) => g.id === status).test(i)) &&
        (!query ||
          [i.id, i.title, i.category, i.place]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .sort((a, b) => {
      if (sort === "votes-desc") {
        return b.votes - a.votes || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sort === "votes-asc") {
        return a.votes - b.votes || new Date(b.createdAt) - new Date(a.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  const totalVotes = db.issues.reduce((n, i) => n + i.votes, 0),
    closed = db.issues.filter((i) => i.status === "CLOSED").length;
  function exportCsv() {
    const cell = (v) => {
      const value = String(v ?? "");
      return (
        '"' +
        (/^[\s]*[=+@-]/.test(value) ? "'" + value : value).replaceAll(
          '"',
          '""',
        ) +
        '"'
      );
    };
    const rows = [
      ["เลขเรื่อง", "ปัญหา", "ประเภท", "สถานที่", "สถานะ", "โหวต"],
      ...filtered.map((i) => [
        i.id,
        i.title,
        i.category,
        i.place,
        groups.find((g) => g.test(i)).label,
        i.votes,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "TownTrack-public-issues.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("ดาวน์โหลดข้อมูลสาธารณะแล้ว");
  }
  return (
    <main className="public-dashboard">
      <div className="public-heading">
        <div>
          <span className="public-eyebrow">
            ภาพรวมชุมชน
          </span>
          <h1>ทุกปัญหา มีความคืบหน้า</h1>
          <p>
            {MUNICIPALITY} <span>· ข้อมูลตัวอย่าง</span>
          </p>
        </div>
        <div className="public-actions">
          <button className="btn btn-secondary" onClick={onTrack}>
            <Search size={17} />
            ติดตามสถานะปัญหา
          </button>
          <button className="btn btn-primary" onClick={onReport}>
            <Plus size={18} />
            แจ้งปัญหาใหม่
          </button>
        </div>
      </div>
      <div className="public-metrics">
        <div>
          <span>เรื่องที่แจ้งทั้งหมด</span>
          <strong>
            {db.issues.length.toLocaleString()} <small>เรื่อง</small>
          </strong>
        </div>
        <div>
          <span>เสียงสนับสนุนจากชุมชน</span>
          <strong>
            {totalVotes.toLocaleString()} <small>โหวต</small>
          </strong>
        </div>
        <div>
          <span>แก้ไขและปิดเรื่องแล้ว</span>
          <strong>
            {closed} <small>เรื่อง</small>
          </strong>
        </div>
        <div>
          <span>สัดส่วนปิดเรื่อง</span>
          <strong>
            {db.issues.length
              ? Math.round((closed / db.issues.length) * 100)
              : 0}
            <small>%</small>
          </strong>
        </div>
      </div>
      <div className="public-section-heading">
        <h2>5 ปัญหาที่ชุมชนสนใจมากที่สุด</h2>
        <span>
          <ThumbsUp size={14} />
          ทุกเสียงช่วยยืนยันปัญหา
        </span>
      </div>
      <div className="featured-cases">
        {ranking.map((i, n) => (
          <button
            className="featured-case"
            key={i.id}
            onClick={() => onOpen(i)}
          >
            <Artwork category={i.category} issue={i} />
            <div className="featured-copy">
              <span className="featured-rank">
                อันดับ {n + 1}{" "}
                <span className="rank-votes">
                  <ThumbsUp size={12} />
                  {i.votes}
                </span>
              </span>
              <strong>{i.title}</strong>
              <Badge issue={i} />
            </div>
          </button>
        ))}
      </div>
      <section className="area-explorer" aria-labelledby="area-explorer-title">
        <header className="area-explorer-head">
          <div className="area-explorer-title">
            <span className="area-eyebrow"><MapPin size={14} /> แผนที่ชุมชน</span>
            <h2 id="area-explorer-title">สำรวจปัญหาในพื้นที่</h2>
            <p>ค้นหาเรื่องใกล้ตัว แล้วดูตำแหน่งและความคืบหน้าได้ในที่เดียว</p>
          </div>
          <div className="area-explorer-actions">
            <div className="area-result-total" aria-live="polite">
              <strong>{filtered.length.toLocaleString()}</strong>
              <span>จาก {db.issues.length.toLocaleString()} เรื่อง</span>
            </div>
            <button className="area-export-button" onClick={exportCsv}>
              <Download size={16} /> <span>ดาวน์โหลดรายการ</span>
            </button>
          </div>
        </header>

        <div className="area-filterbar">
          <label className="area-search-field">
            <Search size={19} aria-hidden="true" />
            <input
              aria-label="ค้นหาเลขเรื่อง ปัญหา หรือสถานที่"
              placeholder="ค้นหาเลขเรื่อง ปัญหา หรือสถานที่"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" aria-label="ล้างคำค้น" onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            )}
          </label>
          <label className="area-filter-select">
            <span>ประเภทปัญหา</span>
            <select aria-label="กรองประเภทปัญหา" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">ทุกประเภท</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="area-filter-select">
            <span>เรียงตาม</span>
            <select aria-label="เรียงรายการปัญหา" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">แจ้งล่าสุด</option>
              <option value="votes-desc">คนโหวตเยอะสุด</option>
              <option value="votes-asc">คนโหวตน้อยสุด</option>
              <option value="mine">เรื่องที่เราเป็นคนแจ้ง</option>
            </select>
          </label>
          {(category || status || query || sort !== "latest") && (
            <button
              className="area-clear-filters"
              onClick={() => {
                setCategory("");
                setStatus("");
                setQuery("");
                setSort("latest");
              }}
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>

        <div className="area-explorer-grid">
          <section className="area-map-column" aria-label="แผนที่ปัญหา">
            <div className="area-map-heading">
              <div><strong>ตำแหน่งปัญหา</strong><span>แตะหมุดเพื่อดูรายละเอียด</span></div>
              <span className="area-map-count"><i /> {filtered.length.toLocaleString()} เรื่อง</span>
            </div>
            <PublicMap
              issues={filtered}
              onOpen={onOpen}
              mode={mode}
              setMode={setMode}
              geo={geo}
            />
          </section>

          <aside className="area-status-panel" aria-labelledby="area-status-title">
            <div className="area-panel-heading">
              <div><span className="area-eyebrow">สรุปภาพรวม</span><h3 id="area-status-title">ความคืบหน้าเรื่อง</h3></div>
              <span className="area-status-total">{db.issues.length.toLocaleString()}</span>
            </div>
            <div className="area-status-list">
              {groups.map((g) => {
                const count = db.issues.filter(g.test).length;
                const share = db.issues.length ? (count / db.issues.length) * 100 : 0;
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={`area-status-item area-tone-${g.color}${status === g.id ? " selected" : ""}`}
                    aria-pressed={status === g.id}
                    onClick={() => setStatus(status === g.id ? "" : g.id)}
                  >
                    <span className="area-status-dot" aria-hidden="true" />
                    <span className="area-status-copy"><strong>{g.label}</strong><small>{g.id === "waiting" ? "เรื่องใหม่หรือรอข้อมูลจากผู้แจ้ง" : g.id === "doing" ? "กำลังแก้ไขในพื้นที่" : g.id === "approval" ? "อยู่ระหว่างพิจารณา" : "ดำเนินการเสร็จแล้ว"}</small></span>
                    <strong className="area-status-number">{count.toLocaleString()}</strong>
                    <span className="area-status-track"><i style={{ width: `${share}%` }} /></span>
                  </button>
                );
              })}
            </div>
            <div className="area-map-tip">
              <Layers size={18} aria-hidden="true" />
              <span>เลือกสถานะเพื่อกรองทั้งแผนที่และรายการด้านล่าง</span>
            </div>
          </aside>
        </div>
      </section>
      <section className="area-results" aria-labelledby="area-results-title">
        <div className="area-results-heading">
          <div>
            <span className="area-eyebrow">ผลการค้นหา</span>
            <h2 id="area-results-title">
              รายการปัญหา{" "}
              <span>
                {visibleCount < filtered.length
                  ? `แสดง ${Math.min(visibleCount, filtered.length).toLocaleString()} จาก `
                  : ""}
                {filtered.length.toLocaleString()} เรื่อง
              </span>
            </h2>
          </div>
          <span className="area-sort-note"><ListFilter size={15} />{{
            latest: "เรียงตามวันที่แจ้ง",
            "votes-desc": "คนโหวตเยอะสุด",
            "votes-asc": "คนโหวตน้อยสุด",
            mine: "เรื่องที่เราเป็นคนแจ้ง",
          }[sort]}</span>
        </div>
        {!filtered.length && (
          <Empty
            title="ไม่พบปัญหาที่ค้นหา"
            text="ลองเปลี่ยนคำค้นหรือประเภทปัญหา"
          />
        )}
        <div className="area-case-grid" id="area-case-list">
          {filtered.slice(0, visibleCount).map((i) => {
            const voted = i.voters.includes(actor.id),
              followed = i.followers.includes(actor.id);
            return (
              <article className="area-case-card" key={i.id}>
                <button
                  type="button"
                  className="area-case-visual"
                  aria-label={"ดูรายละเอียดและภาพประกอบ " + i.id}
                  onClick={() => onOpen(i)}
                >
                  <Artwork category={i.category} issue={i} />
                  {i.media?.length > 1 && (
                    <span className="area-case-photo-count">{i.media.length} ไฟล์</span>
                  )}
                </button>
                <div className="area-case-content">
                  <div className="area-case-topline">
                    <span className="area-case-category">{i.category}</span>
                    <span className="area-case-id">{i.id}</span>
                  </div>
                  <div className="area-case-badges"><Priority value={i.priority} /><Badge issue={i} /></div>
                  <button className="area-case-title" onClick={() => onOpen(i)}>{i.title}</button>
                  <p className="area-case-place"><MapPin size={14} />{i.place}</p>
                  <div className="area-case-meta"><time>แจ้งเมื่อ {date(i.createdAt)}</time><span><ThumbsUp size={14} />{i.votes} เสียง</span></div>
                  <div className="area-case-actions">
                    <button
                      aria-label={"โหวต " + i.id}
                      disabled={busy || voted || i.status === "CLOSED"}
                      onClick={() => act("VOTE", i, {}, "โหวตสำเร็จ")}
                      className={voted ? "voted" : ""}
                    >
                      <ThumbsUp size={16} />
                      <span>{voted ? "โหวตแล้ว" : "ยืนยันปัญหา"}</span>
                    </button>
                    <button
                      aria-label={"ติดตาม " + i.id}
                      disabled={busy}
                      className={followed ? "following" : ""}
                      onClick={() =>
                        act(
                          "FOLLOW",
                          i,
                          {},
                          followed ? "ยกเลิกติดตามแล้ว" : "ติดตามปัญหานี้แล้ว",
                        )
                      }
                    >
                      {followed ? <BellRing size={16} /> : <Bell size={16} />}
                      <span>{followed ? "ติดตามแล้ว" : "ติดตาม"}</span>
                    </button>
                    <button className="area-open-case" onClick={() => onOpen(i)}>
                      ดูเรื่อง <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {(visibleCount > pageSize ||
        visibleCount < filtered.length) && (
        <div className="area-results-pagination" role="group" aria-label="การแสดงรายการปัญหา">
          {visibleCount > pageSize && (
            <button
              className="btn btn-secondary area-collapse"
              aria-controls="area-case-list"
              onClick={() => setVisibleCount(pageSize)}
            >
              <ChevronUp size={17} />
              ย่อรายการ ({pageSize} เรื่อง)
            </button>
          )}
          {visibleCount < filtered.length && (
            <button
              className="btn btn-secondary load-more"
              aria-controls="area-case-list"
              onClick={() => setVisibleCount((n) => n + pageSize)}
            >
              ดูเรื่องเพิ่ม ({Math.min(visibleCount, filtered.length)} / {filtered.length}{" "}
              เรื่อง)
            </button>
          )}
        </div>
      )}
      <div className="public-bottom">
        <span>
          TownTrack · เมืองที่ดี เริ่มจากการรับฟัง ·{" "}
          <a href="sample-images/credits.html" target="_blank" rel="noreferrer">
            เครดิตภาพตัวอย่าง
          </a>
        </span>
      </div>
    </main>
  );
}
