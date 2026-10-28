// Public, non-secret deployment settings. Empty fields are deliberately not invented.
const env = import.meta.env;
export function safePublicUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
}
export const agency = {
  name: String(env.VITE_AGENCY_NAME || '').trim(),
  address: String(env.VITE_AGENCY_ADDRESS || '').trim(),
  phone: String(env.VITE_AGENCY_PHONE || '').trim(),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.VITE_AGENCY_EMAIL || '') ? env.VITE_AGENCY_EMAIL : '',
  hours: String(env.VITE_AGENCY_SERVICE_HOURS || '').trim(),
  website: safePublicUrl(env.VITE_AGENCY_WEBSITE),
  feedback: safePublicUrl(env.VITE_AGENCY_FEEDBACK_URL),
};
export const officialPolicies = {
  privacy: safePublicUrl(env.VITE_AGENCY_PRIVACY_URL),
  terms: safePublicUrl(env.VITE_AGENCY_WEBSITE_POLICY_URL),
  security: safePublicUrl(env.VITE_AGENCY_SECURITY_POLICY_URL),
};
export const informationUrl = (section = 'guide', lang = 'th') =>
  `/information?section=${encodeURIComponent(section)}&lang=${lang === 'en' ? 'en' : 'th'}`;
export const policyUrl = (section, lang = 'th') => officialPolicies[section] || informationUrl(section, lang);
