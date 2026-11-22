const KEY = "leroy-commandes-v5";
const MAIL_KEY = "leroy-mails-v2";
const CART_KEY = "leroy-panier-v2";
const MAIL_SET_KEY = "leroy-mail-set-v1";
const RECAP_SENT_KEY = "carnet-recap-sent-v1";
const PATRON_AUTH_KEY = "leroy-patron-auth";
const PATRON_PIN = "2010";
const DEFAULT_LAB_MAIL = "alexandre@pikcel.fr";
const times = ["8h", "9h", "10h", "11h", "12h", "14h", "15h", "16h", "17h", "18h"];
const PICKUP_DAYS = 21;

function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayIso() {
  return isoFromDate(new Date());
}

function addDaysIso(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoFromDate(d);
}

function tomorrowIso() {
  return addDaysIso(todayIso(), 1);
}

function lastPickupIso() {
  return addDaysIso(todayIso(), PICKUP_DAYS);
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && isoFromDate(d) === value;
}

function clampPickupDate(value) {
  const min = todayIso();
  const max = lastPickupIso();
  if (!isIsoDate(value)) return tomorrowIso();
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function formatDateFr(iso) {
  if (!isIsoDate(iso)) return iso || "";
  const text = new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function orderDate(o) {
  return o.date || o.day || "";
}

const catalog = [
  {
    id: "tarte",
    name: "Tarte",
    detail: "Tous les jours",
    photo: "assets/tarte_citron_meringue.webp?v=2",
    sizes: [
      { id: "6", label: "6 personnes", detail: "", price: 18 },
      { id: "8", label: "8 personnes", detail: "", price: 24 },
    ],
    flavors: [
      { id: "citron", name: "Citron meringuée", photo: "assets/tarte_citron_meringue.webp?v=2", layers: ["Pâte sablée", "Crème citron", "Meringue italienne"] },
      { id: "fraise", name: "Fraises", photo: "assets/tarte-aux-fraises.png", layers: ["Pâte sablée", "Crème pâtissière", "Fraises fraîches"] },
      { id: "pomme", name: "Pommes", photo: "assets/tarte-aux-pommes.webp?v=1", layers: ["Pâte sablée", "Compotée de pommes", "Pommes rôties"] },
    ],
  },
  {
    id: "gateau",
    name: "Gâteau",
    detail: "Tous les jours",
    photo: "assets/gateau-vanille.jpg?v=1",
    sizes: [
      { id: "8", label: "8 personnes", detail: "", price: 32 },
      { id: "12", label: "12 personnes", detail: "grand format", price: 48 },
    ],
    flavors: [
      { id: "vanille", name: "Vanille", photo: "assets/gateau-vanille.jpg?v=1", layers: ["Génoise", "Crème vanille"] },
      { id: "chocolat", name: "Chocolat", photo: "assets/gateau-chocolat.jpg?v=1", layers: ["Génoise cacao", "Ganache montée"] },
      { id: "fraise", name: "Fraise", photo: "assets/gateau-fraise.jpg?v=1", layers: ["Génoise", "Crème légère", "Fraises fraîches"] },
    ],
  },
  {
    id: "quiche",
    name: "Quiche",
    detail: "Tous les jours",
    photo: "assets/quiche-lorraine.jpg?v=1",
    sizes: [
      { id: "6", label: "6 personnes", detail: "", price: 16 },
      { id: "8", label: "8 personnes", detail: "", price: 22 },
    ],
    flavors: [
      { id: "lorraine", name: "Lorraine", photo: "assets/quiche-lorraine.jpg?v=1", layers: ["Pâte brisée", "Lardons", "Emmental"] },
      { id: "saumon", name: "Saumon", photo: "assets/quiche-saumon.jpg?v=1", layers: ["Pâte brisée", "Saumon", "Oseille"] },
      { id: "legumes", name: "Légumes", photo: "assets/quiche-legumes.jpg?v=1", layers: ["Pâte brisée", "Légumes de saison"] },
    ],
  },
  {
    id: "buche",
    name: "Bûche",
    detail: "Fêtes",
    photo: "assets/buche-marron.webp",
    sizes: [
      { id: "6", label: "6 personnes", detail: "", price: 28 },
      { id: "8", label: "8 personnes", detail: "", price: 36 },
    ],
    flavors: [
      {
        id: "marron-poire",
        name: "Marron · poire",
        photo: "assets/buche-marron.webp",
        layers: ["Vermicelles de crème de marrons", "Mousse marron d’Ardèche", "Insert poire Williams", "Biscuit imbibé au rhum"],
      },
      {
        id: "noisette-piemont",
        name: "Noisette du Piémont",
        photo: "assets/buche-noisette.jpg",
        layers: ["Mousse vanille & praliné", "Croustillant noisettes IGP", "Crémeux noisette", "Biscuit dacquoise"],
      },
      {
        id: "citron-yuzu",
        name: "Citron · yuzu",
        photo: "assets/buche-citron.webp",
        layers: ["Mousse citron yuzu", "Insert lemon curd", "Sablé breton", "Biscuit financier"],
      },
      {
        id: "mangue-passion",
        name: "Mangue · passion",
        photo: "assets/buche-mangue.webp",
        layers: ["Mousse mangue", "Cœur fruit de la passion", "Biscuit coco", "Croustillant sablé"],
      },
    ],
  },
  {
    id: "galette",
    name: "Galette des rois",
    detail: "À la date",
    photo: "assets/galette-frangipane.jpg?v=1",
    sizes: [
      { id: "6", label: "6 personnes", detail: "4 à 6 personnes", price: 22 },
      { id: "8", label: "8 personnes", detail: "6 à 8 personnes", price: 28 },
      { id: "10", label: "10 personnes", detail: "8 à 10 personnes", price: 34 },
    ],
    flavors: [
      { id: "frangipane", name: "Frangipane", photo: "assets/galette-frangipane.jpg?v=1", layers: ["Pâte feuilletée", "Crème d’amandes"] },
      { id: "pomme", name: "Pomme", photo: "assets/galette-pomme.jpg?v=1", layers: ["Pâte feuilletée", "Compotée de pommes", "Crème d’amandes"] },
      { id: "chocolat", name: "Chocolat", photo: "assets/galette-chocolat.jpg?v=1", layers: ["Pâte feuilletée", "Ganache chocolat"] },
    ],
  },
];

function flavorId(flavor) {
  return typeof flavor === "string" ? flavor : flavor.id;
}

function flavorName(flavor) {
  return typeof flavor === "string" ? flavor : flavor.name;
}

function flavorPhoto(flavor, product) {
  if (flavor && typeof flavor === "object" && flavor.photo) return flavor.photo;
  return product.photo || "";
}

function flavorLayers(flavor) {
  return flavor && typeof flavor === "object" ? flavor.layers || [] : [];
}

function findFlavor(product, idOrName) {
  return product.flavors.find((f) => flavorId(f) === idOrName || flavorName(f) === idOrName) || product.flavors[0];
}

const seed = [
  {
    id: "1",
    name: "Martin",
    phone: "06 11 22 33 44",
    date: tomorrowIso(),
    time: "10h",
    items: [{ product: "Tarte", size: "6", flavor: "Citron meringuée", composition: "Pâte sablée · Crème citron · Meringue italienne", price: 18, qty: 1 }],
    price: 18,
    done: false,
  },
  {
    id: "2",
    name: "Durand",
    phone: "07 98 76 54 32",
    date: tomorrowIso(),
    time: "11h",
    items: [
      { product: "Tarte", size: "6", flavor: "Fraises", composition: "Pâte sablée · Crème pâtissière · Fraises fraîches", price: 18, qty: 1 },
      { product: "Gâteau", size: "8", flavor: "Vanille", composition: "Génoise · Crème vanille", price: 32, qty: 1 },
    ],
    price: 50,
    done: false,
  },
  {
    id: "3",
    name: "Bernard",
    phone: "06 55 44 33 22",
    date: tomorrowIso(),
    time: "12h",
    items: [{ product: "Quiche", size: "6", flavor: "Lorraine", composition: "Pâte brisée · Lardons · Emmental", price: 16, qty: 1 }],
    price: 16,
    done: false,
  },
  {
    id: "4",
    name: "Leroy",
    phone: "06 20 20 20 20",
    date: tomorrowIso(),
    time: "16h",
    items: [{ product: "Bûche", size: "6", flavor: "Marron · poire", composition: "Vermicelles de crème de marrons · Mousse marron d’Ardèche · Insert poire Williams · Biscuit imbibé au rhum", price: 28, qty: 1 }],
    price: 28,
    done: false,
  },
];

function euro(n) {
  return `${n}\u00a0€`;
}

function itemQty(item) {
  return item.qty || 1;
}

function itemLabel(item) {
  const qty = itemQty(item) > 1 ? ` × ${itemQty(item)}` : "";
  return [item.product, item.size ? `${item.size} personnes` : "", item.flavor].filter(Boolean).join(" · ") + qty;
}

function orderItems(o) {
  if (Array.isArray(o.items) && o.items.length) return o.items;
  return [{ product: o.product, size: o.size, flavor: o.flavor, composition: o.composition, price: o.price, qty: 1 }];
}

function orderLabel(o) {
  return orderItems(o).map(itemLabel).join(" + ");
}

function orderTotal(o) {
  if (typeof o.price === "number") return o.price;
  return orderItems(o).reduce((sum, item) => sum + item.price * itemQty(item), 0);
}

function pickupLabel(o) {
  return [formatDateFr(orderDate(o)) || orderDate(o), o.time].filter(Boolean).join(" · ");
}

function emptyCart() {
  return { items: [], date: tomorrowIso(), time: "10h" };
}

function loadCart() {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return emptyCart();
  try {
    const cart = JSON.parse(raw);
    return {
      items: Array.isArray(cart.items) ? cart.items : [],
      date: clampPickupDate(cart.date),
      time: times.includes(cart.time) ? cart.time : "10h",
    };
  } catch (err) {
    return emptyCart();
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
}

function cartCount(cart) {
  return cart.items.reduce((n, item) => n + itemQty(item), 0);
}

function cartTotal(cart) {
  return cart.items.reduce((sum, item) => sum + item.price * itemQty(item), 0);
}

function isNameOk(value) {
  return value.trim().length >= 2;
}

function isPhoneOk(value) {
  return /^0[1-9]\d{8}$/.test(value.replace(/\D/g, ""));
}

function isPickupDateOk(value) {
  return isIsoDate(value) && value >= todayIso() && value <= lastPickupIso();
}

function isPickupTimeOk(value) {
  return times.includes(value);
}

function storeConfig() {
  const cfg = window.CARNET_STORE || {};
  return {
    url: (cfg.url || "").trim(),
    key: (cfg.key || "").trim(),
  };
}

function storeReady() {
  return Boolean(storeConfig().url);
}

function snapshotStore(orders) {
  return {
    orders: Array.isArray(orders) ? orders : loadOrders(),
    mail: loadMailSettings(),
    recapSentOn: recapSentDay(),
  };
}

let remoteReady = null;
let remotePushChain = Promise.resolve();

async function pullRemoteState() {
  const { url } = storeConfig();
  if (!url) return null;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data && typeof data === "object" ? data : null;
}

async function pushRemoteState(state) {
  const { url, key } = storeConfig();
  if (!url) return;
  const headers = { "Content-Type": "application/json" };
  if (key) headers["X-Bin-Key"] = key;
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error("store");
}

function scheduleRemotePush(orders) {
  if (!storeReady()) return Promise.resolve();
  const snapshot = snapshotStore(orders);
  remotePushChain = remotePushChain.then(() => pushRemoteState(snapshot)).catch(() => {});
  return remotePushChain;
}

function applyRemoteState(data) {
  if (Array.isArray(data.orders)) {
    localStorage.setItem(KEY, JSON.stringify(data.orders));
  }
  if (data.mail && typeof data.mail === "object") {
    const current = loadMailSettings();
    localStorage.setItem(
      MAIL_SET_KEY,
      JSON.stringify({
        to: isEmailOk(data.mail.to) && !isPlaceholderMail(data.mail.to) ? data.mail.to.trim() : current.to,
        hour: times.includes(data.mail.hour) ? data.mail.hour : current.hour,
      })
    );
  }
  if (typeof data.recapSentOn === "string") {
    localStorage.setItem(RECAP_SENT_KEY, data.recapSentOn);
  }
}

async function hydrateFromRemote() {
  if (!storeReady()) return false;
  try {
    const data = await pullRemoteState();
    if (!data) return false;
    applyRemoteState(data);
    return true;
  } catch (err) {
    return false;
  }
}

function ensureRemoteStore() {
  if (!storeReady()) return Promise.resolve(false);
  if (!remoteReady) remoteReady = hydrateFromRemote();
  return remoteReady;
}

function loadOrders() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const starter = storeReady() ? [] : seed.slice();
    localStorage.setItem(KEY, JSON.stringify(starter));
    return starter.slice();
  }
  return JSON.parse(raw);
}

function saveOrders(orders) {
  localStorage.setItem(KEY, JSON.stringify(orders));
  return scheduleRemotePush(orders);
}

function loadMails() {
  const raw = localStorage.getItem(MAIL_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveMails(mails) {
  localStorage.setItem(MAIL_KEY, JSON.stringify(mails));
}

function addMail(mail) {
  const mails = loadMails();
  mails.unshift({
    id: String(Date.now()) + Math.random().toString(16).slice(2),
    at: new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
    unread: true,
    ...mail,
  });
  saveMails(mails);
}

function ordersForDay(day) {
  return loadOrders().filter((o) => orderDate(o) === day);
}

function productionCounts(orders) {
  const counts = {};
  for (const o of orders) {
    for (const item of orderItems(o)) {
      const key = itemLabel({ ...item, qty: 1 });
      counts[key] = (counts[key] || 0) + itemQty(item);
    }
  }
  return counts;
}

function totalsText(orders) {
  return Object.entries(productionCounts(orders))
    .map(([k, n]) => `${k} × ${n}`)
    .join("\n");
}

function pushOrderMail(order) {
  const items = orderItems(order);
  addMail({
    type: "order",
    to: loadMailSettings().to,
    from: "Carnet de commandes <commandes@carnet.fr>",
    subject: `Commande : ${order.name} — ${items.length} produit${items.length > 1 ? "s" : ""}`,
    preview: `Retrait ${pickupLabel(order)} · ${euro(orderTotal(order))} au comptoir`,
    body: [
      `Bonjour,`,
      ``,
      `Nouvelle commande pour Léonard Boulangerie.`,
      ``,
      `${order.name} · ${order.phone}`,
      ``,
      ...items.flatMap((item) => [itemLabel(item), item.composition ? `Composition : ${item.composition}` : ""].filter(Boolean)),
      ``,
      `Retrait ${pickupLabel(order)}`,
      `${euro(orderTotal(order))} à régler au retrait`,
      ``,
      `En pleine saison, ce mail-là resterait coupé.`,
      `Le vrai filet, c’est le récap du labo.`,
    ].join("\n"),
  });
}

function isEmailOk(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
}

function loadMailSettings() {
  const fallback = { to: DEFAULT_LAB_MAIL, hour: "18h" };
  const raw = localStorage.getItem(MAIL_SET_KEY);
  if (!raw) return fallback;
  try {
    const saved = JSON.parse(raw);
    return {
      to: isEmailOk(saved.to) && !isPlaceholderMail(saved.to) ? saved.to.trim() : fallback.to,
      hour: times.includes(saved.hour) ? saved.hour : fallback.hour,
    };
  } catch (err) {
    return fallback;
  }
}

function saveMailSettings(settings) {
  localStorage.setItem(MAIL_SET_KEY, JSON.stringify(settings));
  scheduleRemotePush();
}

function recapPayload(date, to) {
  const when = isIsoDate(date) ? date : tomorrowIso();
  const dest = isEmailOk(to) ? to.trim() : loadMailSettings().to;
  const hour = loadMailSettings().hour;
  const orders = ordersForDay(when);
  const subject = `${formatDateFr(when)} — ${orders.length} commande${orders.length > 1 ? "s" : ""} à produire`;
  const body = [
    `Bonjour,`,
    ``,
    `Récap labo · envoi ${hour}`,
    `Production : ${formatDateFr(when)}`,
    ``,
    `À FAIRE`,
    totalsText(orders) || "(aucune commande)",
    `Total : ${orders.length} commande${orders.length === 1 ? "" : "s"}`,
    ``,
    `COMPTOIR`,
    ...orders.map((o) => `${o.name} · ${orderLabel(o)} · retrait ${pickupLabel(o)} · ${euro(orderTotal(o))} au retrait`),
    ``,
    `Ouvrez la feuille du labo pour imprimer ou cocher les retraits.`,
  ].join("\n");
  return {
    to: dest,
    subject,
    preview: `Retrait ${formatDateFr(when)} · ${orders.length} commande${orders.length > 1 ? "s" : ""}`,
    body,
    orders,
    date: when,
  };
}

function pushRecapMail(date, to) {
  const mail = recapPayload(date, to);
  addMail({
    type: "recap",
    to: mail.to,
    from: "Carnet de commandes <commandes@carnet.fr>",
    subject: mail.subject,
    preview: mail.preview,
    body: mail.body,
  });
  return mail;
}

function openMailto(to, subject, body) {
  const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const link = document.createElement("a");
  link.href = href;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function isPlaceholderMail(value) {
  const to = (value || "").trim().toLowerCase();
  return to.endsWith("@leonardd.fr") || to.endsWith("@example.com") || to.endsWith("@carnet.fr");
}

function emailjsConfig() {
  const cfg = window.CARNET_EMAILJS || {};
  return {
    publicKey: (cfg.publicKey || "").trim(),
    serviceId: (cfg.serviceId || "").trim(),
    templateId: (cfg.templateId || "").trim(),
  };
}

function emailjsReady() {
  const cfg = emailjsConfig();
  return Boolean(window.emailjs && cfg.publicKey && cfg.serviceId && cfg.templateId);
}

function hourLabelToMinutes(hour) {
  const n = parseInt(String(hour || "").replace("h", ""), 10);
  return Number.isFinite(n) ? n * 60 : 18 * 60;
}

function recapSentDay() {
  try {
    return localStorage.getItem(RECAP_SENT_KEY) || "";
  } catch (err) {
    return "";
  }
}

function markRecapSentToday() {
  try {
    localStorage.setItem(RECAP_SENT_KEY, todayIso());
    scheduleRemotePush();
  } catch (err) {
    /* ignore */
  }
}

function recapAlreadySentToday() {
  return recapSentDay() === todayIso();
}

function shouldAutoSendRecap() {
  if (!emailjsReady() || recapAlreadySentToday()) return false;
  const settings = loadMailSettings();
  if (!isEmailOk(settings.to) || isPlaceholderMail(settings.to)) return false;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= hourLabelToMinutes(settings.hour);
}

async function sendLabEmail(mail) {
  const cfg = emailjsConfig();
  if (!emailjsReady()) throw new Error("emailjs");
  if (!window.__carnetEmailjsInit) {
    window.emailjs.init({ publicKey: cfg.publicKey });
    window.__carnetEmailjsInit = true;
  }
  await window.emailjs.send(cfg.serviceId, cfg.templateId, {
    to_email: mail.to,
    subject: mail.subject,
    message: mail.body,
  });
}

function patronUnlocked() {
  try {
    return sessionStorage.getItem(PATRON_AUTH_KEY) === "ok";
  } catch (err) {
    return false;
  }
}

function unlockPatron() {
  try {
    sessionStorage.setItem(PATRON_AUTH_KEY, "ok");
  } catch (err) {
    /* ignore */
  }
}

function lockPatron() {
  try {
    sessionStorage.removeItem(PATRON_AUTH_KEY);
  } catch (err) {
    /* ignore */
  }
}

function resetDemo() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(MAIL_KEY);
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem(MAIL_SET_KEY);
  localStorage.removeItem(RECAP_SENT_KEY);
  lockPatron();
  if (storeReady()) {
    pushRemoteState({
      orders: [],
      mail: { to: DEFAULT_LAB_MAIL, hour: "18h" },
      recapSentOn: "",
    }).catch(() => {});
  }
}
