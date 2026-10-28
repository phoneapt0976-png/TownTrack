import React, { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { USER_LOCATION } from "./model";
export function useGeolocation() {
  const [state, setState] = useState({
    location: USER_LOCATION, source: "default", accuracy: null,
    permission: "prompt", pending: false, error: "",
  });
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let status;
    let disposed = false;
    const updatePermission = () => {
      if (disposed) return;
      if (status.state === "denied") {
        generation.current++;
        setState({ location: USER_LOCATION, source: "default", accuracy: null,
          permission: "denied", pending: false,
          error: "ไม่สามารถใช้ตำแหน่งของฉันหรือค้นหาเบอร์ฉุกเฉินใกล้ฉันได้ คุณยังแจ้งและติดตามปัญหาได้ โดยระบุจุดเกิดเหตุเอง" });
      } else setState(s => ({ ...s, permission: status.state }));
    };
    navigator.permissions?.query({ name: "geolocation" }).then(result => {
      if (disposed) return;
      status = result;
      updatePermission();
      status.onchange = () => {
        updatePermission();
        if (status.state === "granted") request();
      };
    }).catch(() => { /* Safari/LIFF may only expose permission through the GPS callback. */ });
    return () => { disposed = true; mounted.current = false; generation.current++; if (status) status.onchange = null; };
  }, []);
  const request = useCallback(() => new Promise(resolve => {
    const attempt = ++generation.current;
    const current = () => mounted.current && attempt === generation.current;
    const fail = (permission, error) => {
      if (current()) setState({ location: USER_LOCATION, source: "default", accuracy: null, permission, pending: false, error });
      resolve(null);
    };
    if (!window.isSecureContext || !navigator.geolocation) {
      fail("unavailable", "GPS ต้องใช้ HTTPS หรือ localhost กรุณาระบุตำแหน่งเอง");
      return;
    }
    setState(s => ({ ...s, source: "default", accuracy: null, pending: true, error: "" }));
    navigator.geolocation.getCurrentPosition(position => {
      if (!current()) { resolve(null); return; }
      const location = { lat: position.coords.latitude, lng: position.coords.longitude };
      setState({ location, source: "gps", accuracy: position.coords.accuracy, permission: "granted", pending: false, error: "" });
      resolve(location);
    }, error => {
      const messages = {
        1: "ไม่สามารถใช้ตำแหน่งของฉันหรือค้นหาเบอร์ฉุกเฉินใกล้ฉันได้ คุณยังแจ้งและติดตามปัญหาได้ โดยระบุจุดเกิดเหตุเอง",
        2: "หาตำแหน่งไม่สำเร็จ กรุณาระบุตำแหน่งเองหรือกดลองใหม่",
        3: "ค้นหาตำแหน่งนานเกินไป กรุณาระบุตำแหน่งเองหรือกดลองใหม่",
      };
      fail(error.code === 1 ? "denied" : "prompt", messages[error.code] || "อ่านตำแหน่งไม่สำเร็จ");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  }), []);
  useEffect(() => {
    // Delay until the mounted effect is active; StrictMode cancels its first pass.
    const timer = window.setTimeout(() => request(), 0);
    return () => window.clearTimeout(timer);
  }, [request]);
  return { ...state, request, canUseLocation: state.source === "gps" && state.permission === "granted" && !state.pending };
}
const color = (i) =>
  i.status === "CLOSED"
    ? "#68a77f"
    : i.status === "NEW"
      ? "#dc6b84"
      : [
            "BUDGET_PENDING",
            "BUDGET_MORE",
            "LEGAL_PENDING",
            "LEGAL_MORE",
          ].includes(i.status)
        ? "#619aca"
        : "#c9a33e";
export default function GeoMap({
  issues = [],
  center = USER_LOCATION,
  onSelect,
  onPick,
  radar = false,
  mode = "Marker",
  accuracy,
}) {
  const element = useRef(),
    map = useRef(),
    callbacks = useRef({ onSelect, onPick }),
    [zoom, setZoom] = useState(radar ? 17 : 14),
    [tileError, setTileError] = useState(false);
  callbacks.current = { onSelect, onPick };
  useEffect(() => {
    const m = L.map(element.current, { scrollWheelZoom: false }).setView(
      [center.lat, center.lng],
      radar ? 17 : 14,
    );
    map.current = m;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    ).addTo(m);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("load", () => setTileError(false));
    m.on("click", (e) =>
      callbacks.current.onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
    );
    m.on("zoomend", () => setZoom(m.getZoom()));
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(element.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    map.current?.setView([center.lat, center.lng], radar ? 17 : 14, {
      animate: false,
    });
  }, [center.lat, center.lng, radar]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const layer = L.layerGroup().addTo(m);
    if (radar)
      L.circle([center.lat, center.lng], {
        radius: 100,
        color: "#2388bd",
        weight: 1,
        dashArray: "4 5",
        fillOpacity: 0.05,
      }).addTo(layer);
    if (accuracy)
      L.circle([center.lat, center.lng], {
        radius: Math.min(accuracy, 5000),
        color: "#736193",
        weight: 1,
        fillOpacity: 0.06,
      }).addTo(layer);
    L.circleMarker([center.lat, center.lng], {
      radius: 6,
      color: "white",
      weight: 2,
      fillColor: "#197bb4",
      fillOpacity: 1,
    })
      .bindTooltip(onPick ? "จุดเกิดเหตุที่เลือก" : "ตำแหน่งอ้างอิง")
      .addTo(layer);
    const groups = new Map();
    for (const i of issues) {
      const pt = m.project([i.location.lat, i.location.lng], zoom);
      const key =
        mode === "Clustering"
          ? Math.floor(pt.x / 55) + ":" + Math.floor(pt.y / 55)
          : i.id;
      const g = groups.get(key) || [];
      g.push(i);
      groups.set(key, g);
    }
    for (const members of groups.values()) {
      const i = members[0],
        lat = members.reduce((n, j) => n + j.location.lat, 0) / members.length,
        lng = members.reduce((n, j) => n + j.location.lng, 0) / members.length;
      let marker;
      if (mode === "Heatmap")
        marker = L.circle([lat, lng], {
          radius: 100 + Math.sqrt(i.votes) * 10,
          color: color(i),
          weight: 0,
          fillColor: color(i),
          fillOpacity: 0.22,
        });
      else {
        const html =
          members.length > 1
            ? "<span>" + members.length + "</span>"
            : '<span class="map-marker-dot"></span>';
        marker = L.marker([lat, lng], {
          icon: L.divIcon({
            html,
            className:
              "real-map-pin " + (members.length > 1 ? "map-cluster" : ""),
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        });
      }
      marker.addTo(layer);
      const markerElement = marker.getElement?.();
      if (markerElement && members.length === 1)
        markerElement.style.backgroundColor = color(i);
      const node = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent =
        members.length > 1 ? members.length + " ปัญหาในบริเวณนี้" : i.title;
      node.append(label);
      for (const issue of members) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = issue.id + " · ดูรายละเอียด";
        button.className = "map-popup-link";
        button.onclick = () => callbacks.current.onSelect?.(issue);
        node.append(button);
      }
      marker.bindPopup(node);
      if (mode === "Marker") marker.bindTooltip(i.id + " · " + i.title);
    }
    return () => layer.remove();
  }, [issues, center.lat, center.lng, mode, radar, zoom, accuracy]);
  return (
    <div className="geo-map-wrap">
      <div
        className="geo-map"
        ref={element}
        aria-label={onPick ? "แผนที่เลือกจุดเกิดเหตุ" : "แผนที่ปัญหาจริง"}
      />
      {tileError && (
        <span className="tile-warning">
          โหลดแผนที่ไม่สำเร็จ ตรวจการเชื่อมต่ออินเทอร์เน็ต ·
          หมุดและการเลือกตำแหน่งยังใช้งานได้
        </span>
      )}
      {onPick && (
        <span className="map-pick-hint">แตะบนแผนที่เพื่อเลือกจุดเกิดเหตุ</span>
      )}
    </div>
  );
}
