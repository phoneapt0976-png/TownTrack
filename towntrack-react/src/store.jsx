import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
// 🟢 นำเข้าแพ็กเกจ LINE LIFF
import liff from "@line/liff"; 
import {
  transition,
  PEOPLE,
  CURRENT_CITIZEN,
  expireIncompleteCases,
  USER_LOCATION,
} from "./model";

const KEY = "towntrack-react-v4";
const CITIZEN_KEY = "towntrack-line-citizen-v1";
const Store = createContext(null);

const valid = (d) =>
  d?.schema === 1 &&
  Array.isArray(d.issues) &&
  d.issues.every(
    (i) => i.id && Array.isArray(i.history) && Number.isInteger(i.revision),
  );

function mapReport(report) {
  const at = report.created_at || new Date().toISOString();
  return {
    id: `REQ-${report.id}`,
    title: report.title || "แจ้งปัญหาทั่วไป",
    description: report.description || "",
    place: report.location || "ไม่ระบุสถานที่",
    category: "ทั่วไป",
    status: "NEW",
    priority: "normal",
    reportedBy: report.citizen_id || CURRENT_CITIZEN,
    reporterName: "ประชาชน",
    phone: "",
    followers: [],
    voters: [],
    votes: 1,
    updatedAt: at,
    createdAt: at,
    media: [],
    satisfaction: [],
    revision: 1,
    location: USER_LOCATION,
    history: [
      {
        id: `report-${report.id}`,
        at,
        status: "NEW",
        text: "รับคำร้องจากฐานข้อมูล Neon",
        actorName: "ระบบ",
      },
    ],
    reports: [],
    decisions: [],
  };
}

function restore() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { schema: 1, issues: [] };
  try {
    const d = JSON.parse(raw);
    if (!valid(d)) {
      return { schema: 1, issues: [] };
    }
    const expired = expireIncompleteCases(d);
    if (expired.changed) localStorage.setItem(KEY, JSON.stringify(expired.db));
    return expired.db;
  } catch {
    return { schema: 1, issues: [] };
  }
}

function readCitizenIdentity() {
  try {
    const identity = JSON.parse(localStorage.getItem(CITIZEN_KEY));
    return identity?.userId ? identity : null;
  } catch {
    return null;
  }
}

let dbPromise;
function mediaDB() {
  return (dbPromise ||= new Promise((resolve, reject) => {
    const req = indexedDB.open("towntrack-media", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(Error("เปิดพื้นที่จัดเก็บไฟล์ไม่ได้"));
    };
  }));
}

async function files(mode, operation) {
  const db = await mediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", mode);
    let req;
    try {
      req = operation(tx.objectStore("files"));
    } catch (e) {
      reject(e);
      return;
    }
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = tx.onabort = () => reject(Error("บันทึกไฟล์ไม่สำเร็จ"));
  });
}

export const getMedia = (id) => files("readonly", (s) => s.get(id));

const allowed = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export function validateFiles(list) {
  if (list.length > 5) throw Error("แนบได้สูงสุด 5 ไฟล์ต่อช่อง");
  for (const f of list) {
    if (!allowed.includes(f.type))
      throw Error("รองรับ JPG, PNG, WebP, MP4, WebM และ MOV");
    if (!f.size || f.size >= 10 * 1024 * 1024)
      throw Error("แต่ละไฟล์ต้องมีขนาดน้อยกว่า 10 MB");
  }
}

async function encodeUploads(payload) {
  const out = { ...payload },
    uploads = [];
  for (const k of ["media", "before", "after", "evidence"]) {
    if (!payload[k]) continue;
    validateFiles(payload[k].filter((f) => f instanceof File));
    out[k] = payload[k].map((f) => {
      if (!(f instanceof File)) return f;
      const m = {
        id: "media-" + crypto.randomUUID(),
        name: f.name.slice(0, 180),
        type: f.type,
        size: f.size,
      };
      uploads.push({ meta: m, file: f });
      return m;
    });
  }
  return { payload: out, uploads };
}

export function Provider({ children }) {
  const actionLock = useRef(false);
  const [loadError, setLoadError] = useState("");
  const [db, setDB] = useState(() => {
    try {
      return restore();
    } catch {
      return { schema: 1, issues: [] };
    }
  });

  const [citizenIdentity, setCitizenIdentityState] = useState(readCitizenIdentity);
  const [role] = useState(() => {
    const segment = location.pathname
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/\.html$/, "");
    return ["citizen", "staff", "supervisor", "worker", "authority"].includes(
      segment,
    )
      ? segment
      : "citizen";
  });

  const [account, setAccount] = useState({
    staff: "staff-demo",
    supervisor: "supervisor-a",
    worker: "worker-a",
    authority: "authority-a",
  });

  const [toast, setToast] = useState(null),
    [busy, setBusy] = useState(false);


  const setCitizenIdentity = useCallback((profile) => {
    if (!profile?.userId) {
      localStorage.removeItem(CITIZEN_KEY);
      setCitizenIdentityState(null);
      return;
    }
    const identity = {
      userId: String(profile.userId),
      displayName: String(profile.displayName || ""),
    };
    localStorage.setItem(CITIZEN_KEY, JSON.stringify(identity));
    setCitizenIdentityState(identity);
  }, []);

  // 🟢 เริ่มต้นระบบ LINE LIFF 
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: "2012227993-tgksP03U" });
        
        // ถ้ายังไม่ได้ล็อกอิน ให้บังคับเด้งหน้าล็อกอิน LINE ก่อน
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          // ถ้าล็อกอินแล้ว ดึงข้อมูลได้เลย
          const profile = await liff.getProfile();
          setCitizenIdentity(profile);
        }
      } catch (err) {
        console.error("LIFF Initialization failed", err);
      }
    };
    
    if (role === "citizen") {
      initLiff();
    }
  }, [role, setCitizenIdentity]);

  const actor = {
    role,
    id:
      role === "citizen"
        ? citizenIdentity?.userId
          ? `line:${citizenIdentity.userId}`
          : CURRENT_CITIZEN
        : account[role],
  };

  const notify = useCallback(
    (message, error = false) =>
      setToast({ message, error, id: crypto.randomUUID() }),
    [],
  );

  const reloadReports = useCallback(async () => {
    const response = await fetch("/api/reports");
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "โหลดคำร้องจากฐานข้อมูลไม่สำเร็จ");
    }
    const issues = result.map(mapReport);
    const updated = { ...restore(), issues };
    localStorage.setItem(KEY, JSON.stringify(updated));
    setDB(updated);
    setLoadError("");
    return issues;
  }, []);

  useEffect(() => {
    let active = true;
    reloadReports().catch((error) => {
      if (!active) return;
      console.error("Failed to load reports from Neon:", error);
      setLoadError(error.message);
      notify(error.message, true);
    });
    return () => {
      active = false;
    };
  }, [notify, reloadReports]);

  useEffect(() => {
    try {
      const value = restore();
      if (!localStorage.getItem(KEY)) {
        localStorage.setItem(KEY, JSON.stringify(value));
      }
      setDB(value);
    } catch {
      setLoadError("อ่านข้อมูลที่บันทึกไม่ได้ ยังไม่เขียนทับข้อมูลเดิม");
    }

    const sync = (ev) => {
      if (ev.key === KEY)
        try {
          setDB(restore());
        } catch {
          notify("ข้อมูลจากอีกหน้าไม่ถูกต้อง", true);
        }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [notify]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function act(type, issue, payload = {}, message = "บันทึกสำเร็จ") {
    if (actionLock.current) return null;
    actionLock.current = true;
    setBusy(true);
    let saved = [];
    try {
      if (loadError) throw Error(loadError);
      const beforeRestore = localStorage.getItem(KEY);
      const initial = restore();
      if (localStorage.getItem(KEY) !== beforeRestore) setDB(initial);
      const { payload: encoded, uploads } = await encodeUploads(payload);
      const cmd = {
        type,
        id: issue?.id,
        expectedRevision: issue?.revision,
        payload: encoded,
      };
      transition(initial, cmd, actor);
      if (uploads.length) {
        await files("readwrite", (s) => {
          for (const u of uploads) s.put(u.file, u.meta.id);
        });
        saved = uploads.map((u) => u.meta.id);
      }
      const latest = restore();
      const result = transition(latest, cmd, actor);
      localStorage.setItem(KEY, JSON.stringify(result.db));
      setDB(result.db);
      notify(message);
      return result.issue;
    } catch (e) {
      if (saved.length)
        try {
          await files("readwrite", (s) => saved.forEach((id) => s.delete(id)));
        } catch {}
      notify(e.message || "บันทึกไม่สำเร็จ", true);
      return null;
    } finally {
      actionLock.current = false;
      setBusy(false);
    }
  }

  return (
    <Store.Provider
      value={{
        db,
        role,
        actor,
        citizenIdentity,
        setCitizenIdentity,
        account,
        setAccount,
        act,
        notify,
        busy,
        toast,
        loadError,
        reloadReports,
        people: PEOPLE,
      }}
    >
      {children}
    </Store.Provider>
  );
}

export const useStore = () => useContext(Store);

export function useMedia(item) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true,
      u;
    const run = async () => {
      try {
        if (!item) return;
        if (item?.url) {
          if (alive) setUrl(item.url);
          return;
        }
        const blob = item instanceof File ? item : await getMedia(item?.id);
        if (!blob || !alive) return;
        u = URL.createObjectURL(blob);
        setUrl(u);
      } catch {}
    };
    setUrl(null);
    run();
    return () => {
      alive = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [item]);
  return url;
}