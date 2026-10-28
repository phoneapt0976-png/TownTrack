import { USER_LOCATION } from "./model";

export const SERVICE_AREA = {
  name: "พื้นที่ลาดหลุมแก้ว จ.ปทุมธานี",
  center: USER_LOCATION,
  radiusMeters: 25000,
};

export const NATIONAL_HOTLINES = [
  {
    id: "police-191",
    kind: "police",
    name: "เหตุด่วนเหตุร้าย",
    detail: "ตำรวจ · ทั่วประเทศ",
    phone: "191",
  },
  {
    id: "ems-1669",
    kind: "medical",
    name: "แพทย์ฉุกเฉิน",
    detail: "อุบัติเหตุหรือเจ็บป่วยฉุกเฉิน · ทั่วประเทศ",
    phone: "1669",
  },
  {
    id: "fire-199",
    kind: "fire",
    name: "แจ้งเหตุเพลิงไหม้",
    detail: "ดับเพลิงและกู้ภัย",
    phone: "199",
  },
  {
    id: "tourist-1155",
    kind: "police",
    name: "ตำรวจท่องเที่ยว",
    detail: "ช่วยเหลือนักท่องเที่ยว",
    phone: "1155",
  },
];

export const LOCAL_EMERGENCY_SERVICES = [
  {
    id: "ladlumkaeo-hospital",
    kind: "medical",
    name: "โรงพยาบาลลาดหลุมแก้ว",
    detail: "ห้องฉุกเฉิน โรงพยาบาลชุมชน",
    phone: "02-599-1651",
    location: { lat: 14.026178, lng: 100.365051 },
    mapQuery: "โรงพยาบาลลาดหลุมแก้ว ปทุมธานี",
    source: "https://www.lkh.go.th/index.php/ContactUS",
  },
  {
    id: "ladlumkaeo-police",
    kind: "police",
    name: "สถานีตำรวจภูธรลาดหลุมแก้ว",
    detail: "6/4 หมู่ 1 ต.ระแหง อ.ลาดหลุมแก้ว",
    phone: "02-599-1288",
    mapQuery: "สถานีตำรวจภูธรลาดหลุมแก้ว ปทุมธานี",
    source: "https://latlumkaeo.pathumthani.police.go.th/contact/",
  },
  {
    id: "rahaeng-disaster",
    kind: "fire",
    name: "งานป้องกันและบรรเทาสาธารณภัย ทต.ระแหง",
    detail: "ดับเพลิง กู้ภัย และสาธารณภัยในพื้นที่",
    phone: "02-599-1543",
    mapQuery: "เทศบาลตำบลระแหง ลาดหลุมแก้ว ปทุมธานี",
    source:
      "https://www.tessabanrahang.go.th/dnm_file/project/17583721_center.pdf",
  },
];

export const hotlineSource =
  "https://thailand.go.th/public/index.php/useful-information-detail/003_003";

export function phoneHref(phone) {
  const firstNumber = String(phone).split(/[;,/]/)[0];
  return "tel:" + firstNumber.replace(/[^+\d]/g, "");
}

export function mapHref(service) {
  if (service.location)
    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(`${service.location.lat},${service.location.lng}`)
    );
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(service.mapQuery || service.name)
  );
}

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const serviceKind = (tags = {}) => {
  const value = tags.amenity || tags.healthcare || "";
  if (["hospital", "clinic"].includes(value)) return "medical";
  if (value === "police") return "police";
  if (["fire_station", "rescue_station"].includes(value)) return "fire";
  return "other";
};

export async function fetchNearbyEmergencyServices(location, signal) {
  const query = `[out:json][timeout:22];(
    nwr(around:20000,${location.lat},${location.lng})["amenity"~"hospital|clinic|police|fire_station|rescue_station"];
    nwr(around:20000,${location.lat},${location.lng})["healthcare"~"hospital|clinic"];
  );out center tags;`;
  let lastError;
  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({ data: query }),
        signal,
      });
      if (!response.ok) throw Error(`Overpass ${response.status}`);
      const data = await response.json();
      const seen = new Set();
      return data.elements
        .map((element) => {
          const tags = element.tags || {};
          const lat = element.lat ?? element.center?.lat;
          const lng = element.lon ?? element.center?.lon;
          const name = tags["name:th"] || tags.name;
          if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const phone =
            tags["contact:phone"] ||
            tags.phone ||
            tags["emergency:phone"] ||
            "";
          const key = `${name}|${phone}`;
          if (seen.has(key)) return null;
          seen.add(key);
          return {
            id: `osm-${element.type}-${element.id}`,
            kind: serviceKind(tags),
            name,
            detail:
              tags["addr:full"] ||
              [tags["addr:housenumber"], tags["addr:street"], tags["addr:district"]]
                .filter(Boolean)
                .join(" ") ||
              "หน่วยบริการใกล้ตำแหน่ง GPS",
            phone,
            location: { lat, lng },
            source: `https://www.openstreetmap.org/${element.type}/${element.id}`,
          };
        })
        .filter(Boolean);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      lastError = error;
    }
  }
  throw lastError || Error("ค้นหาหน่วยฉุกเฉินไม่สำเร็จ");
}
