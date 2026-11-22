import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadFrontConfig() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, "email-config.js"), "utf8"), ctx);
  const emailjs = ctx.window.CARNET_EMAILJS || {};
  const store = ctx.window.CARNET_STORE || {};
  return {
    publicKey: (process.env.EMAILJS_PUBLIC_KEY || emailjs.publicKey || "").trim(),
    serviceId: (process.env.EMAILJS_SERVICE_ID || emailjs.serviceId || "").trim(),
    templateId: (process.env.EMAILJS_TEMPLATE_ID || emailjs.templateId || "").trim(),
    privateKey: (process.env.EMAILJS_PRIVATE_KEY || "").trim(),
    storeUrl: (process.env.CARNET_STORE_URL || store.url || "").trim(),
    storeKey: (process.env.CARNET_STORE_KEY || store.key || "").trim(),
  };
}

function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function addDaysIso(iso, n) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateFr(iso) {
  const text = new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function euro(n) {
  return `${n}\u00a0€`;
}

function orderDate(order) {
  return order.date || order.day || "";
}

function itemQty(item) {
  return item.qty || 1;
}

function itemLabel(item) {
  const qty = itemQty(item) > 1 ? ` × ${itemQty(item)}` : "";
  return [item.product, item.size ? `${item.size} personnes` : "", item.flavor].filter(Boolean).join(" · ") + qty;
}

function orderItems(order) {
  if (Array.isArray(order.items) && order.items.length) return order.items;
  return [{ product: order.product, size: order.size, flavor: order.flavor, composition: order.composition, price: order.price, qty: 1 }];
}

function orderLabel(order) {
  return orderItems(order).map(itemLabel).join(" + ");
}

function orderTotal(order) {
  if (typeof order.price === "number") return order.price;
  return orderItems(order).reduce((sum, item) => sum + item.price * itemQty(item), 0);
}

function pickupLabel(order) {
  return [formatDateFr(orderDate(order)) || orderDate(order), order.time].filter(Boolean).join(" · ");
}

function productionCounts(orders) {
  const counts = {};
  for (const order of orders) {
    for (const item of orderItems(order)) {
      const key = itemLabel({ ...item, qty: 1 });
      counts[key] = (counts[key] || 0) + itemQty(item);
    }
  }
  return counts;
}

function totalsText(orders) {
  return Object.entries(productionCounts(orders))
    .map(([key, n]) => `${key} × ${n}`)
    .join("\n");
}

function hourLabelToMinutes(hour) {
  const n = parseInt(String(hour || "").replace("h", ""), 10);
  return Number.isFinite(n) ? n * 60 : 18 * 60;
}

function padTime(n) {
  return String(n).padStart(2, "0");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STORE_UA = "carnet-recap/1.0 (+https://github.com/AlexandreLeriche141282/carnet)";
const MAX_WAIT_MS = (5 * 60 + 20) * 60 * 1000;

function isEmailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
}

function isPlaceholderMail(value) {
  const to = (value || "").trim().toLowerCase();
  return to.endsWith("@leonardd.fr") || to.endsWith("@example.com") || to.endsWith("@carnet.fr");
}

function recapPayload(orders, when, to, hour) {
  const dayOrders = orders.filter((order) => orderDate(order) === when);
  const subject = `${formatDateFr(when)} — ${dayOrders.length} commande${dayOrders.length > 1 ? "s" : ""} à produire`;
  const body = [
    `Bonjour,`,
    ``,
    `Récap labo · envoi ${hour}`,
    `Production : ${formatDateFr(when)}`,
    ``,
    `À FAIRE`,
    totalsText(dayOrders) || "(aucune commande)",
    `Total : ${dayOrders.length} commande${dayOrders.length === 1 ? "" : "s"}`,
    ``,
    `COMPTOIR`,
    ...dayOrders.map((order) => `${order.name} · ${orderLabel(order)} · retrait ${pickupLabel(order)} · ${euro(orderTotal(order))} au retrait`),
    ``,
    `Ouvrez la feuille du labo pour imprimer ou cocher les retraits.`,
  ].join("\n");
  return { to, subject, body, date: when, count: dayOrders.length };
}

async function pullState(cfg) {
  const res = await fetch(cfg.storeUrl, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": STORE_UA },
  });
  if (!res.ok) throw new Error(`store GET ${res.status}`);
  const data = await res.json();
  return data && typeof data === "object" ? data : {};
}

async function pushState(cfg, state) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": STORE_UA,
  };
  if (cfg.storeKey) headers["X-Bin-Key"] = cfg.storeKey;
  const res = await fetch(cfg.storeUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`store PUT ${res.status}`);
}

async function waitForLabHour(cfg) {
  for (;;) {
    const now = parisNow();
    const state = await pullState(cfg);
    const orders = Array.isArray(state.orders) ? state.orders : [];
    const mailSet = state.mail && typeof state.mail === "object" ? state.mail : {};
    const hour = mailSet.hour || "18h";
    const to = isEmailOk(mailSet.to) && !isPlaceholderMail(mailSet.to) ? mailSet.to.trim() : "alexandre@pikcel.fr";
    if (state.recapSentOn === now.date) {
      console.log(`Déjà envoyé aujourd’hui (${now.date}).`);
      process.exit(0);
    }
    const nowMin = now.hour * 60 + now.minute;
    const targetMin = hourLabelToMinutes(hour);
    if (nowMin >= targetMin) return { now, state, orders, hour, to };
    const remainMs = (targetMin - nowMin) * 60 * 1000;
    if (remainMs > MAX_WAIT_MS) {
      console.log(`Trop tôt à Paris (${padTime(now.hour)}:${padTime(now.minute)}, cible ${hour}).`);
      process.exit(0);
    }
    console.log(
      `Attente jusqu’à ${hour} (Paris ${padTime(now.hour)}:${padTime(now.minute)}, encore ${Math.ceil(remainMs / 60000)} min).`
    );
    await sleep(Math.min(60_000, remainMs));
  }
}

async function sendEmail(cfg, mail) {
  const payload = {
    service_id: cfg.serviceId,
    template_id: cfg.templateId,
    user_id: cfg.publicKey,
    template_params: {
      to_email: mail.to,
      subject: mail.subject,
      message: mail.body,
    },
  };
  if (cfg.privateKey) payload.accessToken = cfg.privateKey;
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://alexandreleriche141282.github.io",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`emailjs ${res.status} ${text.slice(0, 240)}`);
}

const cfg = loadFrontConfig();
if (!cfg.storeUrl) {
  console.log("Pas de coffre commandes : rien à envoyer.");
  process.exit(0);
}
if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
  console.log("EmailJS incomplet : rien à envoyer.");
  process.exit(0);
}

const { now, state, orders, hour, to } = await waitForLabHour(cfg);
const mail = recapPayload(orders, addDaysIso(now.date, 1), to, hour);
await sendEmail(cfg, mail);
await pushState(cfg, { ...state, orders, mail: { to, hour }, recapSentOn: now.date });
console.log(`Récap parti vers ${to} pour ${mail.date} (${mail.count} commande${mail.count > 1 ? "s" : ""}).`);
