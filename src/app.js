import { modelConfig } from "./data/model-config.js";
import { billingState, plans } from "./data/monetization-config.js";
import { redactPII, scoreAssessment } from "./engine/risk-engine.js";
import { evaluateAccess } from "./services/entitlements.js";
import { createPaymentProvider } from "./services/payment-provider.js";
import { clearHistory, incrementUsage, loadHistory, loadSettings, loadUsage, saveAssessment, saveSettings } from "./services/storage.js";
import { getAuthSession, saveRemoteAssessment, signInWithEmail, signOut, signUpWithEmail } from "./services/auth.js";
import { loadPublicConfig } from "./services/app-config.js";

const app = document.querySelector("#app");
const state = {
  view: "assessment",
  step: 0,
  input: {
    relationshipType: "online_recent",
    metInPerson: "no",
    paymentMethod: "bank_transfer",
    storyType: "romance",
    amount: 250,
    urgency: true,
    secrecy: false,
    requestedCodes: false,
    remoteAccess: false,
    independentVerification: "no",
    expectedPayment: "no",
    fundsConfirmed: "no",
    messageOptIn: false,
    message: ""
  },
  result: null,
  redaction: null,
  settings: loadSettings(),
  config: null,
  auth: {
    configured: false,
    user: null,
    session: null,
    mode: "signin",
    message: ""
  },
  pending: false
};

const steps = [
  {
    title: "Situación",
    eyebrow: "1 de 5",
    render: () => `
      ${radio("relationshipType", "¿Quién pide el dinero?", [
        ["online_recent", "Contacto online reciente"],
        ["new_contact", "Persona nueva o poco conocida"],
        ["known_offline", "Alguien que conozco fuera de internet"],
        ["unknown", "No estoy seguro"]
      ])}
      ${radio("metInPerson", "¿Se han visto en persona?", [["yes", "Sí"], ["no", "No"]])}
    `
  },
  {
    title: "Pago",
    eyebrow: "2 de 5",
    render: () => `
      <label class="field">
        <span>Monto aproximado</span>
        <input data-bind="amount" type="number" min="0" value="${escapeHtml(state.input.amount)}" />
      </label>
      ${radio("paymentMethod", "Método solicitado", [
        ["bank_transfer", "Transferencia bancaria"],
        ["wire", "Giro / wire"],
        ["yape_plin", "Yape / Plin u otro wallet"],
        ["crypto", "Cripto"],
        ["gift_card", "Gift card"],
        ["credit_card", "Tarjeta de crédito"]
      ])}
    `
  },
  {
    title: "Historia",
    eyebrow: "3 de 5",
    render: () => `
      ${radio("storyType", "¿Cuál es el motivo principal?", [
        ["romance", "Relación / romance"],
        ["investment", "Inversión"],
        ["authority", "Gobierno / autoridad"],
        ["bank", "Banco o empresa"],
        ["marketplace", "Compra / marketplace"],
        ["job", "Trabajo"],
        ["protect_money", "Mover dinero para protegerlo"],
        ["overpayment", "Cheque / sobrepago"],
        ["other", "Otro"]
      ])}
    `
  },
  {
    title: "Presión",
    eyebrow: "4 de 5",
    render: () => `
      <div class="toggle-grid">
        ${toggle("urgency", "Hay urgencia o plazo corto")}
        ${toggle("secrecy", "Piden mantenerlo en secreto")}
        ${toggle("requestedCodes", "Pidieron código, OTP, PIN o clave")}
        ${toggle("remoteAccess", "Pidieron acceso remoto")}
      </div>
      ${radio("independentVerification", "¿Ya verificaste por un canal independiente?", [["yes", "Sí"], ["no", "No"]])}
      ${radio("expectedPayment", "¿Era un pago esperado?", [["yes", "Sí"], ["no", "No"]])}
      ${radio("fundsConfirmed", "¿Confirmaste fondos o cuenta por otro canal?", [["yes", "Sí"], ["no", "No"]])}
    `
  },
  {
    title: "Mensaje opcional",
    eyebrow: "5 de 5",
    render: () => `
      <div class="notice">
        El texto es opcional. Si lo pegas, esta demo lo analiza localmente y redacta datos sensibles antes de extraer señales.
      </div>
      ${toggle("messageOptIn", "Analizar texto del mensaje")}
      <label class="field">
        <span>Mensaje recibido</span>
        <textarea data-bind="message" rows="7" maxlength="1600" ${state.input.messageOptIn ? "" : "disabled"}>${escapeHtml(state.input.message)}</textarea>
      </label>
    `
  }
];

function render() {
  app.innerHTML = `
    <header class="shell topbar">
      <div class="brand" role="button" tabindex="0" data-action="view" data-view="assessment">
        <span class="brand-mark">E</span>
        <span><strong>Escudo Transferencia</strong><small>Riesgo antes de pagar</small></span>
      </div>
      <nav aria-label="Principal">
        ${navButton("assessment", "Evaluar")}
        ${navButton("pricing", "Planes")}
        ${navButton("history", "Historial")}
        ${navButton("admin", "Admin")}
        ${navButton("auth", state.auth.user ? "Cuenta" : "Ingresar")}
      </nav>
    </header>
    <main class="shell">
      ${state.view === "assessment" ? renderAssessment() : ""}
      ${state.view === "result" ? renderResult() : ""}
      ${state.view === "pricing" ? renderPricing() : ""}
      ${state.view === "history" ? renderHistory() : ""}
      ${state.view === "admin" ? renderAdmin() : ""}
      ${state.view === "auth" ? renderAuth() : ""}
    </main>
  `;
  bindEvents();
}

function renderAssessment() {
  const step = steps[state.step];
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">Free beta · scoring determinístico</p>
        <h1>Antes de enviar dinero, revisa el riesgo.</h1>
        <p class="lead">Una evaluación breve para detectar señales canónicas, explicar el resultado y proponer verificación independiente.</p>
      </div>
      <aside class="model-card">
        <span>Modelo activo</span>
        <strong>${modelConfig.modelVersion}</strong>
        <small>IA opcional: nunca modifica el score.</small>
      </aside>
    </section>
    <section class="workspace">
      <aside class="progress-panel">
        ${steps.map((item, index) => `<div class="progress-item ${index === state.step ? "active" : ""} ${index < state.step ? "done" : ""}"><span>${index + 1}</span>${item.title}</div>`).join("")}
      </aside>
      <form class="panel assessment-card">
        <p class="eyebrow">${step.eyebrow}</p>
        <h2>${step.title}</h2>
        ${step.render()}
        <div class="actions">
          <button class="secondary" type="button" data-action="back" ${state.step === 0 ? "disabled" : ""}>Atrás</button>
          <button class="primary" type="button" data-action="${state.step === steps.length - 1 ? "analyze" : "next"}">${state.step === steps.length - 1 ? "Analizar riesgo" : "Continuar"}</button>
        </div>
      </form>
    </section>
  `;
}

function renderResult() {
  const result = state.result;
  if (!result) return renderAssessment();
  return `
    <section class="result-layout">
      <div class="score-panel ${result.riskLevel.toLowerCase()}">
        <p class="eyebrow">Resultado</p>
        <div class="score-ring" aria-label="Risk Score ${result.riskScore} de 100">${result.riskScore}</div>
        <h1>${riskLabel(result.riskLevel)}</h1>
        <p>${riskDisclaimer(result.riskLevel)}</p>
        <div class="meta-row">
          <span>Confianza ${result.confidence}%</span>
          <span>${result.modelVersion}</span>
        </div>
      </div>
      <div class="panel">
        <h2>Señales principales</h2>
        ${signalList(result.topFactors, "No se activaron señales fuertes con la información actual.")}
        <h2>Factores protectores</h2>
        ${signalList(result.protectiveFactors, "No se declaró una verificación protectora.")}
      </div>
      <div class="panel">
        <h2>Patrones relacionados</h2>
        ${result.matchedPatterns.length ? result.matchedPatterns.map((pattern) => `<article class="pattern"><strong>${pattern.name}</strong><span>${pattern.id} · similitud ${pattern.score}%</span></article>`).join("") : `<p class="muted">No hay un patrón contextual dominante.</p>`}
        <h2>Acciones recomendadas</h2>
        <ol class="recommendations">${result.recommendations.map((item) => `<li>${item}</li>`).join("")}</ol>
        ${state.redaction?.findings?.length ? `<div class="notice">Se redactó antes de analizar: ${state.redaction.findings.join(", ")}.</div>` : ""}
        <div class="actions wrap">
          <button class="primary" type="button" data-action="save">Guardar evaluación</button>
          <button class="secondary" type="button" data-action="print">Generar PDF</button>
          <button class="secondary" type="button" data-action="view" data-view="pricing">Ver planes</button>
          <button class="ghost" type="button" data-action="restart">Nueva evaluación</button>
        </div>
      </div>
    </section>
  `;
}

function renderPricing() {
  const access = evaluateAccess({ settings: state.settings, usage: loadUsage() });
  return `
    <section class="section-head">
      <div>
        <p class="eyebrow">Monetización preparada</p>
        <h1>Planes y límites</h1>
        <p class="lead">La beta sigue gratis. La arquitectura de pago ya está separada por flags, planes y entitlements para activar cobros sin cambiar el motor de riesgo.</p>
      </div>
    </section>
    <section class="billing-status">
      <div class="panel">
        <h2>Estado comercial</h2>
        <dl class="kv">
          <dt>Billing</dt><dd>${state.settings.billing_enabled ? "Activo" : "Apagado"}</dd>
          <dt>Paywall</dt><dd>${state.settings.paywall_enabled ? "Activo" : "Apagado"}</dd>
          <dt>Provider</dt><dd>${state.settings.provider_configured ? "Configurado" : "Pendiente"}</dd>
          <dt>Usuario</dt><dd>${state.auth.user?.email || "No autenticado"}</dd>
          <dt>Cuota actual</dt><dd>${access.assessmentsRemaining} evaluaciones y ${access.pdfsRemaining} PDFs disponibles</dd>
        </dl>
        <div class="notice">${access.reason}</div>
      </div>
    </section>
    <section class="pricing-grid">
      ${plans.map((plan) => `
        <article class="price-card ${plan.id === access.plan.id ? "current" : ""}">
          <p class="eyebrow">${plan.id === access.plan.id ? "Plan actual" : "Futuro"}</p>
          <h2>${plan.name}</h2>
          <div class="price">${plan.priceLabel}<span>${plan.interval}</span></div>
          <p>${plan.description}</p>
          <ul>${plan.features.map((feature) => `<li>${feature}</li>`).join("")}</ul>
          <button class="${plan.id === access.plan.id ? "secondary" : "primary"}" data-action="checkout" data-plan="${plan.id}" ${state.settings.billing_enabled && state.settings.provider_configured ? "" : "disabled"}>${plan.cta}</button>
        </article>
      `).join("")}
    </section>
  `;
}

function renderAuth() {
  const isSignin = state.auth.mode === "signin";
  return `
    <section class="section-head">
      <div>
        <p class="eyebrow">Cuenta segura</p>
        <h1>${state.auth.user ? "Tu cuenta" : isSignin ? "Ingresar" : "Crear cuenta"}</h1>
        <p class="lead">La cuenta permite guardar evaluaciones, asociar pagos y activar planes sin depender del navegador.</p>
      </div>
    </section>
    <section class="auth-layout">
      <div class="panel">
        ${state.auth.configured ? "" : `<div class="notice">Supabase aun no esta configurado en Netlify. Agrega SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY para activar autenticacion.</div>`}
        ${state.auth.message ? `<div class="notice">${escapeHtml(state.auth.message)}</div>` : ""}
        ${state.auth.user ? `
          <dl class="kv">
            <dt>Email</dt><dd>${escapeHtml(state.auth.user.email || "")}</dd>
            <dt>User ID</dt><dd>${escapeHtml(state.auth.user.id || "")}</dd>
          </dl>
          <div class="actions"><button class="secondary" data-action="signout">Cerrar sesión</button></div>
        ` : `
          <label class="field">
            <span>Email</span>
            <input data-auth="email" type="email" autocomplete="email" />
          </label>
          <label class="field">
            <span>Contraseña</span>
            <input data-auth="password" type="password" autocomplete="${isSignin ? "current-password" : "new-password"}" />
          </label>
          <div class="actions wrap">
            <button class="primary" data-action="${isSignin ? "signin" : "signup"}" ${state.pending || !state.auth.configured ? "disabled" : ""}>${isSignin ? "Ingresar" : "Crear cuenta"}</button>
            <button class="secondary" data-action="toggle-auth-mode">${isSignin ? "Crear cuenta" : "Ya tengo cuenta"}</button>
          </div>
        `}
      </div>
      <div class="panel">
        <h2>Estado de integraciones</h2>
        <dl class="kv">
          <dt>Supabase Auth</dt><dd>${state.auth.configured ? "Configurado" : "Pendiente"}</dd>
          <dt>Mercado Pago</dt><dd>${state.config?.mercadoPagoPublicKey ? "Public key lista" : "Pendiente"}</dd>
          <dt>Billing server</dt><dd>${state.config?.billingEnabled ? "Activado" : "Apagado"}</dd>
        </dl>
      </div>
    </section>
  `;
}

function renderHistory() {
  const history = loadHistory();
  return `
    <section class="section-head">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1>Historial local</h1>
      </div>
      <button class="secondary" data-action="clear-history" ${history.length ? "" : "disabled"}>Eliminar historial</button>
    </section>
    <div class="history-grid">
      ${history.length ? history.map((item) => `
        <article class="history-card">
          <span class="badge ${item.riskLevel.toLowerCase()}">${riskLabel(item.riskLevel)}</span>
          <strong>${item.riskScore}/100</strong>
          <small>${new Date(item.createdAt).toLocaleString()}</small>
          <p>${item.topFactors?.[0]?.label || "Evaluación guardada"}</p>
        </article>
      `).join("") : `<div class="empty">Aún no hay evaluaciones guardadas.</div>`}
    </div>
  `;
}

function renderAdmin() {
  const settings = state.settings;
  return `
    <section class="section-head">
      <div>
        <p class="eyebrow">Operación beta</p>
        <h1>Estado del modelo y flags</h1>
      </div>
    </section>
    <div class="admin-grid">
      <div class="panel">
        <h2>Modelo</h2>
        <dl class="kv">
          <dt>Versión activa</dt><dd>${modelConfig.modelVersion}</dd>
          <dt>Fuente</dt><dd>Seed local validado desde PRD</dd>
          <dt>Calibración</dt><dd>${modelConfig.probabilityClaimAllowed ? "Probabilidad permitida" : "Score sin claim de probabilidad"}</dd>
          <dt>Fallback</dt><dd>LAST_KNOWN_GOOD local</dd>
        </dl>
      </div>
      <div class="panel">
        <h2>Feature flags</h2>
        ${Object.entries(settings).map(([key, value]) => `
          <label class="setting-row">
            <span>${key}</span>
            <input data-setting="${key}" type="${typeof value === "boolean" ? "checkbox" : "number"}" ${value === true ? "checked" : ""} value="${value}" />
          </label>
        `).join("")}
        <div class="actions"><button class="primary" data-action="save-settings">Guardar flags</button></div>
      </div>
      <div class="panel wide">
        <h2>Próximas integraciones</h2>
        <div class="integration-list">
          <span>Supabase Auth + RLS</span>
          <span>DriveModelLoader manifest/cache/rollback</span>
          <span>PostHog events</span>
          <span>PaymentProviderAdapter con webhook verificado</span>
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  app.querySelectorAll("[data-bind]").forEach((element) => {
    element.addEventListener("input", () => {
      const key = element.dataset.bind;
      state.input[key] = element.type === "number" ? Number(element.value) : element.value;
      if (key === "message") state.redaction = redactPII(element.value);
    });
  });
  app.querySelectorAll("[data-radio]").forEach((button) => {
    button.addEventListener("click", () => {
      state.input[button.dataset.radio] = button.dataset.value;
      render();
    });
  });
  app.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.input[button.dataset.toggle] = !state.input[button.dataset.toggle];
      render();
    });
  });
  app.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button));
  });
}

async function handleAction(action, element) {
  if (action === "view") {
    state.view = element.dataset.view;
  }
  if (action === "next") state.step = Math.min(steps.length - 1, state.step + 1);
  if (action === "back") state.step = Math.max(0, state.step - 1);
  if (action === "analyze") {
    state.redaction = redactPII(state.input.message);
    const safeInput = { ...state.input, message: state.redaction.redacted };
    state.result = scoreAssessment(safeInput);
    incrementUsage("assessments");
    state.view = "result";
  }
  if (action === "save" && state.result) {
    saveAssessment(state.result);
    const remote = await saveRemoteAssessment({ input: state.input, result: state.result });
    if (!remote.ok && remote.reason !== "auth_required") window.alert(`Guardado local listo. Supabase: ${remote.reason}`);
  }
  if (action === "print") {
    incrementUsage("pdfs");
    window.print();
  }
  if (action === "checkout") {
    if (!state.auth.user || !state.auth.session?.access_token) {
      state.view = "auth";
      state.auth.message = "Inicia sesión antes de pagar para asociar el plan a tu cuenta.";
      return render();
    }
    const provider = createPaymentProvider({
      billingEnabled: Boolean(state.settings.billing_enabled),
      providerConfigured: Boolean(state.settings.provider_configured)
    });
    const checkout = provider.createCheckoutSession({
      planId: element.dataset.plan,
      userId: state.auth.user.id,
      assessmentId: state.result?.assessmentId
    });
    if (!checkout.ok) {
      window.alert(checkout.message);
    } else {
      await startCheckout(element.dataset.plan);
      return;
    }
  }
  if (action === "toggle-auth-mode") {
    state.auth.mode = state.auth.mode === "signin" ? "signup" : "signin";
    state.auth.message = "";
  }
  if (action === "signin" || action === "signup") await submitAuth(action);
  if (action === "signout") {
    await signOut();
    await refreshAuth();
    state.auth.message = "Sesión cerrada.";
  }
  if (action === "restart") {
    state.step = 0;
    state.result = null;
    state.view = "assessment";
  }
  if (action === "clear-history") clearHistory();
  if (action === "save-settings") {
    const next = {};
    app.querySelectorAll("[data-setting]").forEach((input) => {
      next[input.dataset.setting] = input.type === "checkbox" ? input.checked : Number(input.value);
    });
    state.settings = next;
    saveSettings(next);
  }
  render();
}

async function submitAuth(action) {
  const email = app.querySelector("[data-auth='email']")?.value?.trim();
  const password = app.querySelector("[data-auth='password']")?.value || "";
  if (!email || password.length < 6) {
    state.auth.message = "Ingresa un email valido y una contraseña de al menos 6 caracteres.";
    return;
  }

  state.pending = true;
  state.auth.message = "";
  render();

  const { error } = action === "signin"
    ? await signInWithEmail(email, password)
    : await signUpWithEmail(email, password);

  state.pending = false;
  if (error) {
    state.auth.message = error.message;
    return;
  }

  await refreshAuth();
  state.auth.message = action === "signin"
    ? "Sesión iniciada."
    : "Cuenta creada. Si Supabase requiere confirmación, revisa tu correo.";
}

async function startCheckout(planId) {
  const response = await fetch("/api/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.auth.session.access_token}`
    },
    body: JSON.stringify({
      planId,
      assessmentId: state.result?.assessmentId || null
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.initPoint) {
    window.alert(payload.error || "No se pudo iniciar Mercado Pago.");
    return;
  }
  window.location.href = payload.initPoint;
}

async function refreshAuth() {
  const auth = await getAuthSession();
  state.auth = {
    ...state.auth,
    configured: auth.configured,
    user: auth.user,
    session: auth.session
  };
}

function radio(name, label, options) {
  return `<fieldset class="radio-group"><legend>${label}</legend>${options.map(([value, text]) => `<button type="button" data-radio="${name}" data-value="${value}" class="radio-card ${state.input[name] === value ? "selected" : ""}">${text}</button>`).join("")}</fieldset>`;
}

function toggle(name, label) {
  return `<button type="button" data-toggle="${name}" class="toggle ${state.input[name] ? "on" : ""}"><span></span>${label}</button>`;
}

function navButton(view, label) {
  return `<button class="${state.view === view ? "active" : ""}" data-action="view" data-view="${view}">${label}</button>`;
}

function signalList(items, empty) {
  return items.length ? `<div class="signal-list">${items.map((item) => `<article class="signal ${item.type}"><strong>${item.label}</strong><span>${item.weight > 0 ? "+" : ""}${item.weight.toFixed(2)}</span></article>`).join("")}</div>` : `<p class="muted">${empty}</p>`;
}

function riskLabel(level) {
  return { LOW: "Riesgo bajo", MEDIUM: "Riesgo medio", HIGH: "Riesgo alto" }[level];
}

function riskDisclaimer(level) {
  if (level === "LOW") return "Riesgo menor según la información proporcionada. Esto no garantiza que la solicitud sea legítima o segura.";
  if (level === "MEDIUM") return "Hay señales que conviene verificar antes de transferir. Pausar unos minutos puede evitar una decisión irreversible.";
  return "La situación combina señales fuertes. No envíes dinero hasta verificar por un canal independiente.";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

async function init() {
  state.config = await loadPublicConfig();
  if (state.config.billingEnabled) {
    state.settings = {
      ...state.settings,
      billing_enabled: true,
      provider_configured: Boolean(state.config.mercadoPagoPublicKey)
    };
  }
  await refreshAuth();
  render();
}

init();
