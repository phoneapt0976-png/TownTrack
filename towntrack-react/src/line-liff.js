const env = import.meta.env;
const LIFF_ID = String(env.VITE_LINE_LIFF_ID || "").trim();

export const lineLiffEnabled = Boolean(LIFF_ID);
export const lineOfficialAccountUrl = String(env.VITE_LINE_OA_URL || "").trim();
export const lineEntryUrl = lineLiffEnabled
  ? `https://liff.line.me/${encodeURIComponent(LIFF_ID)}`
  : "/citizen";

let sdkPromise;
let profilePromise;
function loadLiffSdk() {
  if (window.liff) return Promise.resolve(window.liff);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
      script.async = true;
      script.onload = () =>
        window.liff
          ? resolve(window.liff)
          : reject(Error("เปิดบริการยืนยันตัวตน LINE ไม่สำเร็จ"));
      script.onerror = () => reject(Error("เชื่อมต่อ LINE ไม่สำเร็จ"));
      document.head.appendChild(script);
    }).catch((error) => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise;
}

export function getLineProfile() {
  if (!LIFF_ID) throw Error("ยังไม่ได้ตั้งค่า LINE LIFF ID");
  if (!profilePromise) {
    profilePromise = (async () => {
      const liff = await loadLiffSdk();
      await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true });
      if (!liff.isLoggedIn()) {
        if (!liff.isInClient()) {
          liff.login({ redirectUri: window.location.href });
          return null;
        }
        throw Error("กรุณาเปิด TownTrack จาก LINE OA เพื่อยืนยันตัวตน");
      }
      const profile = await liff.getProfile();
      if (!profile?.userId) throw Error("LINE ยังไม่ส่งข้อมูลยืนยันตัวตนกลับมา");
      return {
        userId: profile.userId,
        displayName: profile.displayName || "",
      };
    })().catch((error) => {
      profilePromise = null;
      throw error;
    });
  }
  return profilePromise;
}
