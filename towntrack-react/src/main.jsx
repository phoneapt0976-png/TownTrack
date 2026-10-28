import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./native-auth.js";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  Landmark,
  MapPinned,
  ShieldCheck,
  UserRound,
  AlertCircle,
  LogOut,
  Menu,
  X,
  MessageCircle,
  LoaderCircle,
} from "lucide-react";
import { Provider, useStore } from "./store";
import Citizen from "./Citizen";
import Office from "./Office";
import { cx } from "./components";
import {
  getOidcSession,
  hasOidcConfig,
  hasRole,
  startOidcLogin,
  finishOidcLogin,
  clearOidcSession,
} from "./oidc";
import {
  getLineProfile,
  lineEntryUrl,
  lineLiffEnabled,
  lineOfficialAccountUrl,
} from "./line-liff";
import "./style.css";
import "./redesign.css";
import PublicInformation, { SiteTools, GovernmentFooter } from "./PublicInformation";
import "./government.css";
import "./usability.css";
import { installInterfaceTranslation, useLanguage } from "./i18n";

const ROLES = [
  {
    id: "citizen",
    title: "ประชาชน",
    description: lineLiffEnabled || hasOidcConfig()
      ? "เริ่มแจ้งปัญหาและติดตามสถานะผ่าน LINE OA"
      : "แจ้งปัญหาใกล้บ้านและติดตามความคืบหน้า",
    Icon: UserRound,
    color: "sky",
  },
  {
    id: "staff",
    title: "เจ้าหน้าที่รับเรื่อง",
    description: "รับเรื่อง ตรวจข้อมูล และส่งต่อทีมที่เกี่ยวข้อง",
    Icon: Building2,
    color: "blue",
  },
  {
    id: "supervisor",
    title: "หัวหน้าทีมภาคสนาม",
    description: "วางแผนทีม จัดทรัพยากร และติดตามงาน",
    Icon: ClipboardCheck,
    color: "indigo",
  },
  {
    id: "worker",
    title: "เจ้าหน้าที่ภาคสนาม",
    description: "รับงาน ลงพื้นที่ และส่งผลพร้อมหลักฐาน",
    Icon: HardHat,
    color: "cyan",
  },
  {
    id: "authority",
    title: "ผู้บริหาร / ผู้อนุมัติ",
    description: "พิจารณางบประมาณ คำสั่ง และการใช้ทรัพยากร",
    Icon: Landmark,
    color: "navy",
  },
];
const ROLE_BY_PATH = Object.fromEntries(ROLES.map((r) => [r.id, r]));

function currentRole() {
  const segment = decodeURIComponent(location.pathname)
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/\.html$/, "");
  if (!segment || segment === "index") return "citizen";
  return ROLE_BY_PATH[segment] ? segment : null;
}

function Brand({ compact = false, href = "/", label = "TownTrack · กลับหน้าหลัก" }) {
  return (
    <a className="brand-lockup" href={href} aria-label={label}>
      <span className="brand-mark">
        <MapPinned size={21} />
      </span>
      <span>
        <strong>TownTrack</strong>
        {!compact && <small>ระบบดูแลปัญหาชุมชน</small>}
      </span>
    </a>
  );
}

function LoginPanel({ role, message = "เข้าสู่ระบบด้วยบัญชีหน่วยงานของคุณ" }) {
  const [error, setError] = useState("");
  return (
    <section className="auth-panel">
      <span className="auth-icon">
        <ShieldCheck size={26} />
      </span>
      <span className="eyebrow">ยืนยันตัวตนอย่างปลอดภัย</span>
      <h2>เข้าสู่ระบบ{role.title}</h2>
      <p>{message}</p>
      <button
        className="btn btn-primary auth-button"
        onClick={async () => {
          setError("");
          try {
            await startOidcLogin(role.id);
          } catch (e) {
            setError(e.message || "เริ่มต้นการเข้าสู่ระบบไม่สำเร็จ");
          }
        }}
      >
        <ShieldCheck size={17} /> เข้าสู่ระบบด้วยบัญชีองค์กร
      </button>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <a className="auth-back" href="/">
        <ArrowLeft size={15} /> กลับหน้าประชาชน
      </a>
      <small className="auth-security">
        เข้าสู่ระบบเสร็จแล้วจะกลับมาที่หน้านี้
      </small>
    </section>
  );
}

function AuthGate({ role, children }) {
  if (role.id === "citizen")
    return <LineCitizenGate>{children}</LineCitizenGate>;
  const session = getOidcSession();
  if (!hasOidcConfig()) return <>{children}</>;
  if (!session) return <LoginPanel role={role} />;
  if (!hasRole(session, role.id)) {
    return (
      <LoginPanel
        role={role}
        message="บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าถึงบทบาทดังกล่าว กรุณาเลือกบัญชีที่ได้รับมอบหมาย"
      />
    );
  }
  return <>{children}</>;
}

function LineCitizenGate({ children }) {
  const { setCitizenIdentity } = useStore();
  const [state, setState] = useState(() =>
    !lineLiffEnabled && !hasOidcConfig()
      ? "demo"
      : lineLiffEnabled
        ? "checking"
        : "missing",
  );
  const [error, setError] = useState("");
  useEffect(() => {
    if (!lineLiffEnabled) return;
    let active = true;
    getLineProfile()
      .then((profile) => {
        if (!active) return;
        if (profile) {
          setCitizenIdentity(profile);
          setState("ready");
        } else {
          setState("redirecting");
        }
      })
      .catch((cause) => {
        if (active) {
          setError(cause.message || "ยืนยันตัวตน LINE ไม่สำเร็จ");
          setState("error");
        }
      });
    return () => {
      active = false;
    };
  }, [setCitizenIdentity]);
  if (state === "demo" || state === "ready") return children;
  return (
    <section className="line-entry-panel" aria-live="polite">
      <span className="line-entry-icon">
        {state === "checking" || state === "redirecting" ? (
          <LoaderCircle size={25} className="line-entry-spin" />
        ) : (
          <MessageCircle size={25} />
        )}
      </span>
      <span className="eyebrow">ช่องทางประชาชน · LINE OA</span>
      <h1>
        {state === "missing"
          ? "ยังไม่ได้ตั้งค่า LINE LIFF"
          : state === "error"
            ? "เชื่อมต่อ LINE ไม่สำเร็จ"
            : "กำลังยืนยันบัญชี LINE"}
      </h1>
      <p>
        {state === "missing"
          ? "ช่องทางประชาชนยังไม่พร้อมใช้งาน โปรดติดต่อผู้ดูแลระบบ"
          : state === "error"
          ? error
          : state === "redirecting"
            ? "กำลังเปิดขั้นตอนเข้าสู่ระบบ LINE…"
            : "ใช้บัญชี LINE เพื่อแจ้งปัญหา แก้ข้อมูลที่ขาด และติดตามสถานะของคุณ"}
      </p>
      {lineLiffEnabled && (
        <a className="btn btn-primary" href={lineEntryUrl}>
          <MessageCircle size={17} />
          เปิด TownTrack ผ่าน LINE
        </a>
      )}
      {lineOfficialAccountUrl && (
        <a
          className="line-entry-secondary"
          href={lineOfficialAccountUrl}
          target="_blank"
          rel="noreferrer"
        >
          เปิดบัญชี LINE OA ของเทศบาล
        </a>
      )}
    </section>
  );
}

function AppHeader({ role, citizenNavOpen, setCitizenNavOpen }) {
  const headerRef = useRef(null);
  useEffect(() => {
    if (role.id !== "citizen" || !headerRef.current) return;
    const header = headerRef.current;
    const updateOffset = () => header.closest(".role-page").style.setProperty("--citizen-header-offset", `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    window.addEventListener("scroll", updateOffset, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", updateOffset); };
  }, [role.id]);
  const { actor, account, setAccount, people } = useStore();
  const session = getOidcSession();
  const isDemo = !hasOidcConfig();
  const choices = people[role.id];
  const logout = () => {
    clearOidcSession();
    window.location.assign("/");
  };
  return (
    <header className="app-header" ref={headerRef}>
      {role.id === "citizen" && (
        <button
          type="button"
          className="citizen-menu-trigger"
          aria-label={citizenNavOpen ? "ซ่อนเมนูประชาชน" : "แสดงเมนูประชาชน"}
          aria-controls="citizen-sidebar"
          aria-expanded={citizenNavOpen}
          onClick={() => setCitizenNavOpen((value) => !value)}
        >
          {citizenNavOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      )}
      <Brand compact href={`/${role.id}`} label={`TownTrack · กลับหน้าหลัก${role.title}`} />
      <div className="app-header-meta">
        <div className="header-utilities">
          <SiteTools inline role={role.id} />
          <label className="header-role-picker">
            <span className="sr-only">เลือกบทบาท</span>
            <select
              aria-label="เลือกบทบาท"
              title={role.title}
              value={role.id}
              onChange={(event) => window.location.assign(`/${event.target.value}`)}
            >
              {ROLES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
        </div>
        {isDemo && choices?.length > 1 && (
          <label className="demo-account-label">
            <span>บัญชีทดลอง</span>
            <select
              aria-label="เลือกบัญชีทดลอง"
              value={actor.id}
              onChange={(e) =>
                setAccount({ ...account, [role.id]: e.target.value })
              }
            >
              {choices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {session && role.id !== "citizen" && (
          <button className="signout-button" onClick={logout}>
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        )}
      </div>
    </header>
  );
}

function RolePage({ role }) {
  useLanguage();
  const { loadError, toast } = useStore();
  const [citizenNavOpen, setCitizenNavOpen] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${role.title} · TownTrack`;
  }, [role.id, role.title]);
  return (
    <div className={`role-page role-page-${role.id}`}>
      <AppHeader
        role={role}
        citizenNavOpen={citizenNavOpen}
        setCitizenNavOpen={setCitizenNavOpen}
      />
      {loadError && (
        <p className="load-error" role="alert">
          {loadError}
        </p>
      )}
      <main id="main-content" tabIndex={-1} className="app-content">
        <AuthGate role={role}>
          {role.id === "citizen" ? (
            <Citizen
              navOpen={citizenNavOpen}
              setNavOpen={setCitizenNavOpen}
            />
          ) : (
            <Office />
          )}
        </AuthGate>
      </main>
      {toast && (
        <div
          className={cx("toast", toast.error && "toast-error")}
          role={toast.error ? "alert" : "status"}
          key={toast.id}
        >
          {toast.error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
      <GovernmentFooter homeHref={`/${role.id}`} />
    </div>
  );
}

function OidcCallback() {
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    document.title = "กำลังเข้าสู่ระบบ · TownTrack";
    const nativeCallback = sessionStorage.getItem(
      "towntrack-native-oidc-callback-v1",
    );
    sessionStorage.removeItem("towntrack-native-oidc-callback-v1");
    finishOidcLogin(new URL(nativeCallback || window.location.href))
      .then((returnTo) => {
        if (active) window.location.replace(returnTo);
      })
      .catch((e) => {
        if (active) setError(e.message || "เข้าสู่ระบบไม่สำเร็จ");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <main id="main-content" tabIndex={-1} className="callback-page">
      <section className="auth-panel">
        <span className="auth-icon">
          <ShieldCheck size={26} />
        </span>
        <h2>{error ? "ยืนยันตัวตนไม่สำเร็จ" : "กำลังตรวจสอบบัญชี"}</h2>
        <p>{error || "กำลังเชื่อมต่อกลับมายัง TownTrack อย่างปลอดภัย…"}</p>
        {error && (
          <a className="btn btn-primary auth-button" href="/">
            กลับไปหน้าเริ่มต้น
          </a>
        )}
      </section>
    </main>
  );
}

// Native shells can open the authorization URL in the system browser and
// forward their Universal Link / App Link callback through this event.
function NativeOidcBridge() {
  useEffect(() => {
    const onCallback = (event) => {
      const value = event.detail?.url || event.detail;
      if (typeof value !== "string") return;
      if (window.location.pathname.replace(/\/+$/, "") === "/auth/callback")
        return;
      try {
        const callbackUrl = new URL(value);
        if (
          !callbackUrl.searchParams.has("code") &&
          !callbackUrl.searchParams.has("error")
        )
          return;
        sessionStorage.setItem(
          "towntrack-native-oidc-callback-v1",
          callbackUrl.href,
        );
        window.location.assign("/auth/callback");
      } catch {
        // Ignore malformed callback events; OIDC state is still checked by the callback handler.
      }
    };
    window.addEventListener("towntrack:oidc-callback", onCallback);
    const pendingUrl = window.TownTrackNativeAuth?.takeCallbackUrl?.();
    if (pendingUrl) onCallback({ detail: { url: pendingUrl } });
    return () => window.removeEventListener("towntrack:oidc-callback", onCallback);
  }, []);
  return null;
}

class ErrorBoundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="fatal-error">
          <AlertCircle size={30} />
          <h1>เปิดหน้าจอไม่สำเร็จ</h1>
          <p>ข้อมูลเดิมยังอยู่ในเบราว์เซอร์ ลองโหลดหน้าอีกครั้ง</p>
          <button className="btn btn-primary" onClick={() => location.reload()}>
            โหลดใหม่
          </button>
        </div>
      );
    return this.props.children;
  }
}

function App() {
  if (location.pathname.replace(/\/+$/, "").replace(/\.html$/, "") === "/information") return <PublicInformation />;
  const roleId = currentRole() || "citizen";
  const bridge = <NativeOidcBridge />;
  if (location.pathname.replace(/\/+$/, "") === "/auth/callback") {
    return (
      <>
        {bridge}
        <OidcCallback />
        <GovernmentFooter />
      </>
    );
  }
  const role = ROLE_BY_PATH[roleId];
  return (
    <Provider key={roleId}>
      {bridge}
      <RolePage role={role} />
    </Provider>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      {["/auth/callback"].includes(location.pathname.replace(/\/+$/, "")) && <SiteTools />}
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

installInterfaceTranslation();
