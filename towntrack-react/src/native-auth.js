import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { InAppBrowser } from "@capacitor/inappbrowser";

const env = import.meta.env || {};
const callbackUri = String(
  env.VITE_OIDC_NATIVE_REDIRECT_URI || "com.towntrack.app://auth/callback",
);

function isOidcCallback(rawUrl) {
  try {
    const actual = new URL(rawUrl);
    const expected = new URL(callbackUri);
    return (
      actual.protocol === expected.protocol &&
      actual.host === expected.host &&
      actual.pathname === expected.pathname &&
      (actual.searchParams.has("code") || actual.searchParams.has("error"))
    );
  } catch {
    return false;
  }
}

if (Capacitor.isNativePlatform()) {
  let pendingCallback = "";
  let lastDeliveredUrl = "";
  const deliverCallback = (rawUrl) => {
    if (rawUrl === lastDeliveredUrl || !isOidcCallback(rawUrl)) return;
    lastDeliveredUrl = rawUrl;
    pendingCallback = rawUrl;
    window.dispatchEvent(
      new CustomEvent("towntrack:oidc-callback", { detail: { url: rawUrl } }),
    );
  };

  window.TownTrackNativeAuth = {
    takeCallbackUrl() {
      const value = pendingCallback;
      pendingCallback = "";
      return value;
    },
    async openAuthorizationUrl(url) {
      await InAppBrowser.openInExternalBrowser({ url });
    },
  };

  void App.addListener("appUrlOpen", ({ url }) => deliverCallback(url));
  void App.getLaunchUrl().then((launch) => {
    if (launch?.url) deliverCallback(launch.url);
  });
}
