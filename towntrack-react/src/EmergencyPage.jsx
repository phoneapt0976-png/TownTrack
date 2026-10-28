import React, { useEffect, useMemo, useState } from "react";
import {
  Ambulance,
  ArrowUpRight,
  Building2,
  Flame,
  LocateFixed,
  MapPin,
  Phone,
  Shield,
} from "lucide-react";
import { distance } from "./model";
import {
  hotlineSource,
  fetchNearbyEmergencyServices,
  mapHref,
  NATIONAL_HOTLINES,
  phoneHref,
} from "./emergency-data";

const icons = {
  medical: Ambulance,
  police: Shield,
  fire: Flame,
};

const hotlineByKind = { medical: "1669", police: "191", fire: "199" };

function ServiceCard({ service, local = false, userLocation }) {
  const Icon = icons[service.kind] || Building2;
  const meters =
    local && service.location && userLocation
      ? distance(userLocation, service.location)
      : null;
  return (
    <article className="emergency-service-card">
      <span className={"service-icon service-" + service.kind}>
        <Icon size={20} />
      </span>
      <div className="service-copy">
        <strong>{service.name}</strong>
        <small>
          {service.detail}
          {meters != null
            ? ` · ห่างประมาณ ${(meters / 1000).toFixed(1)} กม.`
            : ""}
        </small>
        <div className="service-links">
          {service.phone ? (
            <a href={phoneHref(service.phone)}>
              <Phone size={14} /> {service.phone}
            </a>
          ) : (
            <a href={`tel:${hotlineByKind[service.kind] || "191"}`}>
              <Phone size={14} /> สายด่วน {hotlineByKind[service.kind] || "191"}
            </a>
          )}
          {local && (
            <a href={mapHref(service)} target="_blank" rel="noreferrer">
              <MapPin size={14} /> เปิดแผนที่
            </a>
          )}
          {local && service.source && (
            <a href={service.source} target="_blank" rel="noreferrer">
              <ArrowUpRight size={14} /> ข้อมูลสถานที่
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function EmergencyPage({ geo }) {
  const [result, setResult] = useState({ key: "", services: [], loading: false, error: "" });
  const allowed = geo.canUseLocation === true;
  const key = allowed ? `${geo.location.lat},${geo.location.lng}` : "";
  useEffect(() => {
    if (!allowed) { setResult({ key: "", services: [], loading: false, error: "" }); return; }
    const controller = new AbortController();
    let active = true;
    setResult({ key, services: [], loading: true, error: "" });
    fetchNearbyEmergencyServices(geo.location, controller.signal).then(services => {
      if (active) setResult({ key, services, loading: false, error: "" });
    }).catch(error => {
      if (active && error.name !== "AbortError") setResult({ key, services: [], loading: false, error: "ค้นหาหน่วยงานใกล้พิกัดไม่สำเร็จ กรุณาใช้เบอร์ส่วนกลาง" });
    });
    return () => { active = false; controller.abort(); };
  }, [allowed, key]);
  const lookup = result.key === key ? result : { loading: false, error: "" };
  const sortedLocal = useMemo(() => {
    if (!allowed || result.key !== key) return [];
    return result.services.map(service => ({ ...service, meters: distance(geo.location, service.location) }))
      .sort((a, b) => a.meters - b.meters).slice(0, 12);
  }, [allowed, result, key]);
  return (
    <section className="emergency-page" aria-labelledby="emergency-heading">
      <span className="eyebrow emergency-eyebrow">ติดต่อขอความช่วยเหลือ</span>
      <h1 id="emergency-heading">เบอร์ช่วยเหลือ</h1>
      <p className="muted">
        กดโทรเพื่อขอความช่วยเหลือ หรือดูหน่วยงานใกล้ตำแหน่งของคุณ
      </p>

      <div className="emergency-location-row" aria-live="polite">
        <LocateFixed size={20} />
        <div>
          <strong>
            {geo.pending
              ? "กำลังตรวจสอบตำแหน่งของอุปกรณ์…"
              : allowed
              ? "ได้รับตำแหน่ง GPS แล้ว"
              : geo.permission === "denied" ? "ไม่ได้อนุญาตให้ใช้ตำแหน่ง" : "ยังไม่สามารถระบุตำแหน่งได้"}
          </strong>
          <small>
            {allowed
              ? `${geo.location.lat.toFixed(6)}, ${geo.location.lng.toFixed(6)}${
                  geo.accuracy ? ` · แม่นยำประมาณ ${Math.round(geo.accuracy)} ม.` : ""
                }`
              : "ใช้เบอร์ส่วนกลางได้ตามปกติ การค้นหาหน่วยงานใกล้ตัวต้องได้รับอนุญาตและพิกัดจากอุปกรณ์"}
          </small>
        </div>
      </div>
      {geo.error && <p className="gps-error" role="alert">{geo.error}</p>}

      <div className="emergency-urgent-grid">
        {NATIONAL_HOTLINES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {allowed ? <>
      <div className="emergency-section-head">
        <div>
          <h2>โรงพยาบาล ตำรวจ และกู้ภัยใกล้พิกัด</h2>
          <p>
            {lookup.loading
              ? "กำลังค้นหาหน่วยงานในรัศมี 20 กิโลเมตร"
              : geo.pending
                ? "กำลังตรวจตำแหน่งเพื่อค้นหาหน่วยงานในเขตบริการ"
                : "เรียงจากหน่วยงานที่อยู่ใกล้ตำแหน่ง GPS มากที่สุด"}
          </p>
        </div>
        <MapPin size={18} />
      </div>
      {lookup.error ? (
        <div className="emergency-empty" role="alert"><MapPin size={28} /><strong>ยังโหลดเบอร์ใกล้ตัวไม่ได้</strong><span>{lookup.error}</span></div>
      ) : lookup.loading ? (
        <div className="emergency-empty emergency-loading" role="status">
          <LocateFixed size={28} />
          <strong>กำลังค้นหาเบอร์ฉุกเฉินใกล้คุณ…</strong>
          <span>ค้นหาจากข้อมูล OpenStreetMap ในรัศมี 20 กิโลเมตร</span>
        </div>
      ) : sortedLocal.length ? (
        <div className="local-service-list">
          {sortedLocal.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              local
              userLocation={geo.location}
            />
          ))}
        </div>
      ) : (
        <div className="emergency-empty">
          <LocateFixed size={28} />
          <strong>ไม่พบหน่วยงานที่มีข้อมูลในรัศมี 20 กิโลเมตร</strong>
          <span>ยังสามารถใช้สายด่วนระดับประเทศด้านบนได้</span>
        </div>
      )}
      <p className="emergency-sources">
        ระบบส่งพิกัดไปยัง OpenStreetMap Overpass เพื่อค้นหาหน่วยงานใกล้เคียง ·{" "}
        <a href={hotlineSource} target="_blank" rel="noreferrer">
          ตรวจสอบแหล่งข้อมูลสายด่วน <ArrowUpRight size={12} />
        </a>
      </p>
      </> : <div className="emergency-empty" role="status"><LocateFixed size={28} /><strong>ยังไม่เปิดใช้บริการใกล้ตำแหน่งของคุณ</strong><span>หากไม่อนุญาตตำแหน่ง ระบบจะไม่ค้นหาหรือแสดงโรงพยาบาล ตำรวจ และกู้ภัยใกล้ตัว คุณยังแจ้งเรื่อง ติดตาม และใช้เบอร์ส่วนกลางได้</span></div>}
    </section>
  );
}
