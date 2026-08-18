const HISTORY_KEY = "scamshield.assessments.v1";
const SETTINGS_KEY = "scamshield.settings.v1";
const USAGE_KEY = "scamshield.usage.v1";

export function loadHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
}

export function saveAssessment(record) {
  const history = loadHistory();
  const next = [record, ...history.filter((item) => item.assessmentId !== record.assessmentId)].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadSettings() {
  return {
    billing_enabled: false,
    paywall_enabled: false,
    beta_free_mode: true,
    entitlement_engine_enabled: true,
    future_full_report_active: false,
    future_plus_active: false,
    provider_configured: false,
    anonymous_daily_limit: 1,
    authenticated_monthly_limit: 20,
    pdf_monthly_limit: 5,
    ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")
  };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadUsage() {
  return JSON.parse(localStorage.getItem(USAGE_KEY) || "{\"assessments\":0,\"pdfs\":0}");
}

export function incrementUsage(key) {
  const usage = loadUsage();
  const next = { ...usage, [key]: Number(usage[key] || 0) + 1 };
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  return next;
}
