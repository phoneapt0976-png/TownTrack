import { Capacitor } from "@capacitor/core";

const AUTH_KEY = "towntrack-oidc-session-v1";
const TXN_KEY = "towntrack-oidc-transaction-v1";
const APP_ROLES = ["citizen", "staff", "supervisor", "worker", "authority"];
let callbackPromise;
const env = import.meta.env || {};
const nativeRuntime = Capacitor.isNativePlatform();
const issuer = String(env.VITE_OIDC_ISSUER || "");
const clientId = String(
  (nativeRuntime && env.VITE_OIDC_NATIVE_CLIENT_ID) ||
    env.VITE_OIDC_CLIENT_ID ||
    "",
);
const roleClaim = String(env.VITE_OIDC_ROLE_CLAIM || "roles");
const storage = nativeRuntime ? localStorage : sessionStorage;
const config = {
  issuer,
  clientId,
  scope: String(env.VITE_OIDC_SCOPE || "openid profile email"),
  redirectUri: String(
    nativeRuntime
      ? env.VITE_OIDC_NATIVE_REDIRECT_URI || "com.towntrack.app://auth/callback"
      : env.VITE_OIDC_REDIRECT_URI || `${location.origin}/auth/callback`,
  ),
  roleClaim,
};

export const hasOidcConfig = () => Boolean(config.issuer && config.clientId);

function randomString(bytes = 48) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64Url(data);
}

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(fromBase64Url(value)));
}

async function discover() {
  if (!hasOidcConfig())
    throw Error("ยังไม่ได้ตั้งค่า OIDC issuer และ client ID");
  const issuerUrl = new URL(config.issuer);
  const localHttp =
    issuerUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(issuerUrl.hostname);
  if (issuerUrl.protocol !== "https:" && !localHttp)
    throw Error("OIDC issuer ต้องใช้ HTTPS");
  const response = await fetch(
    `${config.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
    {
      headers: { Accept: "application/json" },
    },
  );
  if (!response.ok) throw Error("ไม่สามารถอ่านการตั้งค่า OIDC ของหน่วยงานได้");
  const metadata = await response.json();
  if (metadata.issuer !== config.issuer)
    throw Error("OIDC issuer ใน discovery ไม่ตรงกับการตั้งค่า");
  for (const endpoint of [
    metadata.authorization_endpoint,
    metadata.token_endpoint,
    metadata.jwks_uri,
  ]) {
    const endpointUrl = endpoint ? new URL(endpoint) : null;
    const endpointLocalHttp =
      endpointUrl?.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(endpointUrl.hostname);
    if (
      !endpointUrl ||
      (endpointUrl.protocol !== "https:" && !endpointLocalHttp)
    )
      throw Error("OIDC ต้องใช้ endpoint ผ่าน HTTPS");
  }
  return metadata;
}

export async function startOidcLogin(role) {
  if (!APP_ROLES.includes(role)) throw Error("บทบาทไม่ถูกต้อง");
  const metadata = await discover();
  const state = randomString();
  const nonce = randomString();
  const verifier = randomString(64);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = toBase64Url(new Uint8Array(digest));
  storage.setItem(
    TXN_KEY,
    JSON.stringify({
      state,
      nonce,
      verifier,
      role,
      returnTo: `/${role}`,
      createdAt: Date.now(),
    }),
  );
  const url = new URL(metadata.authorization_endpoint);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  const authorizationUrl = url.toString();
  // A Capacitor or other native shell can provide this bridge to open the
  // system browser. Its app-link handler returns the callback URL through
  // `towntrack:oidc-callback`; regular web and installed PWA use navigation.
  const nativeAuth = window.TownTrackNativeAuth;
  if (typeof nativeAuth?.openAuthorizationUrl === "function") {
    await nativeAuth.openAuthorizationUrl(authorizationUrl);
    return;
  }
  window.location.assign(authorizationUrl);
}

async function verifyIdToken(token, metadata, expectedNonce) {
  const parts = token.split(".");
  if (parts.length !== 3) throw Error("รูปแบบ ID token ไม่ถูกต้อง");
  const [encodedHeader, encodedClaims, encodedSignature] = parts;
  const header = decodeJsonPart(encodedHeader);
  const claims = decodeJsonPart(encodedClaims);
  if (header.alg !== "RS256" || !header.kid)
    throw Error("ผู้ให้บริการต้องลงนาม ID token ด้วย RS256");
  const keysResponse = await fetch(metadata.jwks_uri, {
    headers: { Accept: "application/json" },
  });
  if (!keysResponse.ok) throw Error("อ่านกุญแจตรวจสอบ ID token ไม่สำเร็จ");
  const { keys = [] } = await keysResponse.json();
  const jwk = keys.find(
    (key) =>
      key.kid === header.kid &&
      key.kty === "RSA" &&
      (!key.use || key.use === "sig"),
  );
  if (!jwk) throw Error("ไม่พบกุญแจตรวจสอบ ID token ของผู้ให้บริการ");
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signedData = new TextEncoder().encode(
    `${encodedHeader}.${encodedClaims}`,
  );
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    fromBase64Url(encodedSignature),
    signedData,
  );
  if (!verified) throw Error("ลายเซ็น ID token ไม่ถูกต้อง");
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== config.issuer)
    throw Error("issuer ใน ID token ไม่ถูกต้อง");
  if (!audiences.includes(config.clientId))
    throw Error("ID token ไม่ได้ออกให้แอปนี้");
  if (audiences.length > 1 && claims.azp !== config.clientId)
    throw Error("authorized party ใน ID token ไม่ถูกต้อง");
  if (!Number.isFinite(claims.exp) || claims.exp <= now)
    throw Error("ID token หมดอายุแล้ว");
  if (Number.isFinite(claims.iat) && claims.iat > now + 60)
    throw Error("เวลาออก ID token ไม่ถูกต้อง");
  if (claims.nbf && claims.nbf > now + 60)
    throw Error("ID token ยังไม่เริ่มใช้งาน");
  if (claims.nonce !== expectedNonce)
    throw Error("nonce ใน ID token ไม่ตรงกับคำขอ");
  if (!claims.sub) throw Error("ID token ไม่มี subject");
  return claims;
}

async function finishOidcLoginOnce(url) {
  const txnText = storage.getItem(TXN_KEY);
  if (!txnText) throw Error("ไม่พบรายการเข้าสู่ระบบที่รออยู่ กรุณาเริ่มใหม่");
  const txn = JSON.parse(txnText);
  storage.removeItem(TXN_KEY);
  if (Date.now() - txn.createdAt > 10 * 60 * 1000)
    throw Error("คำขอเข้าสู่ระบบหมดเวลา กรุณาเริ่มใหม่");
  const providerError = url.searchParams.get("error");
  if (providerError)
    throw Error(
      url.searchParams.get("error_description") ||
        "ผู้ให้บริการปฏิเสธการเข้าสู่ระบบ",
    );
  if (
    !url.searchParams.get("code") ||
    url.searchParams.get("state") !== txn.state
  )
    throw Error("state ไม่ตรงกันหรือไม่มี authorization code");
  const metadata = await discover();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code: url.searchParams.get("code"),
    redirect_uri: config.redirectUri,
    code_verifier: txn.verifier,
  });
  const nativeAuth = window.TownTrackNativeAuth;
  let tokens;
  if (typeof nativeAuth?.exchangeAuthorizationCode === "function") {
    tokens = await nativeAuth.exchangeAuthorizationCode({
      tokenEndpoint: metadata.token_endpoint,
      clientId: config.clientId,
      code: url.searchParams.get("code"),
      redirectUri: config.redirectUri,
      codeVerifier: txn.verifier,
    });
  } else {
    const response = await fetch(metadata.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    if (!response.ok) throw Error("แลกเปลี่ยน authorization code ไม่สำเร็จ");
    tokens = await response.json();
  }
  if (!tokens.id_token) throw Error("ผู้ให้บริการไม่ได้ส่ง ID token กลับมา");
  const claims = await verifyIdToken(tokens.id_token, metadata, txn.nonce);
  const rawRoles = claims[config.roleClaim];
  const roles = Array.isArray(rawRoles)
    ? rawRoles
    : typeof rawRoles === "string"
      ? [rawRoles]
      : [];
  if (!roles.includes(txn.role)) {
    storage.removeItem(AUTH_KEY);
    throw Error("บัญชีนี้ไม่มีสิทธิ์เข้าใช้พื้นที่ทำงานที่เลือก");
  }
  storage.setItem(
    AUTH_KEY,
    JSON.stringify({
      sub: claims.sub,
      name:
        claims.name || claims.preferred_username || claims.email || claims.sub,
      email: claims.email || "",
      roles,
      exp: claims.exp,
      authenticatedAt: Date.now(),
    }),
  );
  return txn.returnTo;
}

export function finishOidcLogin(url) {
  if (!callbackPromise) {
    callbackPromise = finishOidcLoginOnce(url).finally(() => {
      callbackPromise = undefined;
    });
  }
  return callbackPromise;
}

export function getOidcSession() {
  if (!hasOidcConfig()) return null;
  try {
    const value = JSON.parse(storage.getItem(AUTH_KEY) || "null");
    if (
      !value?.sub ||
      !value?.exp ||
      value.exp <= Math.floor(Date.now() / 1000)
    ) {
      storage.removeItem(AUTH_KEY);
      return null;
    }
    return value;
  } catch {
    storage.removeItem(AUTH_KEY);
    return null;
  }
}

export function hasRole(session, role) {
  return Boolean(session?.roles?.includes(role));
}

export function clearOidcSession() {
  storage.removeItem(AUTH_KEY);
  storage.removeItem(TXN_KEY);
}
