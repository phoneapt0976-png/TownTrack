import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  transition,
  PEOPLE,
  CURRENT_CITIZEN,
  expireIncompleteCases,
  USER_LOCATION, // 👉 เพิ่มการเรียกใช้พิกัดแผนที่เริ่มต้น ป้องกันแอปพัง
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

  // 🔌 โหลดและแมปข้อมูลพิกัด (location) ให้ครบถ้วน แผนที่จะได้ไม่พัง
  useEffect(() => {
    const fetchNeonToStore = async () => {
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon("postgresql://neondb_owner:npg_HmAiMfy2qU5N@ep-noisy-truth-b5sf63d2-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
        
        const rows = await sql`SELECT * FROM reports ORDER BY created_at DESC`;
        
        const neonIssues = rows.map((r) => ({
          id: "REQ-" + r.id,
          title: r.title || "แจ้งปัญหาทั่วไป",
          description: r.description || "",
          place: r.location || "ไม่ระบุสถานที่",
          category: "ทั่วไป",
          status: r.status || "NEW",
          priority: "MEDIUM",
          reportedBy: r.citizen_id || CURRENT_CITIZEN,
          reporterName: "ประชาชน",
          phone: "",
          followers: [],
          voters: [],
          votes: 1,
          updatedAt: r.created_at || new Date().toISOString(),
          createdAt: r.created_at || new Date().toISOString(),
          media: [],
          satisfaction: [],
          revision: 1,
          location: USER_LOCATION || { lat: 14.0, lng: 100.0 }, // 👉 ตัวป้องกัน! ถ้าไม่มีพิกัดแผนที่จะไม่พัง
          history: [
            { action: "CREATE", by: r.citizen_id || CURRENT_CITIZEN, at: r.created_at || new Date().toISOString() }
          ]
        }));

        setDB((currentDb) => {
          const existingIds = new Set((currentDb.issues || []).map(i => i.id));
          const uniqueNeonIssues = neonIssues.filter(i => !existingIds.has(i.id));
          return {
            ...currentDb,
            issues: [...uniqueNeonIssues, ...(currentDb.issues || [])]
          };
        });
      } catch (err) {
        console.error("Failed to sync Neon reports to store:", err);
      }
    };

    fetchNeonToStore();
  }, []);

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