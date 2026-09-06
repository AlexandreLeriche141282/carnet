const KEY = "leroy-commandes";
const MAIL_KEY = "leroy-mails";
const LAB_DAY = "Dimanche 11 janv.";

const seed = [
  { id: "1", name: "Durand", phone: "06 11 22 33 44", size: "8", flavor: "Frangipane", day: LAB_DAY, price: 28, done: false },
  { id: "2", name: "Leroy", phone: "07 98 76 54 32", size: "6", flavor: "Pomme", day: LAB_DAY, price: 22, done: false },
  { id: "3", name: "Bernard", phone: "06 55 44 33 22", size: "10", flavor: "Frangipane", day: LAB_DAY, price: 34, done: false },
  { id: "4", name: "Messaoudi", phone: "06 20 20 20 20", size: "8", flavor: "Chocolat", day: LAB_DAY, price: 28, done: false },
];

function euro(n) {
  return `${n}\u00a0€`;
}

function loadOrders() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed.slice();
  }
  return JSON.parse(raw);
}

function saveOrders(orders) {
  localStorage.setItem(KEY, JSON.stringify(orders));
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
  return loadOrders().filter((o) => o.day === day);
}

function totalsText(orders) {
  const counts = {};
  for (const o of orders) {
    const key = `${o.flavor} · ${o.size} parts`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([k, n]) => `${k} × ${n}`)
    .join("\n");
}

function pushOrderMail(order) {
  addMail({
    type: "order",
    to: "leroy@boulangerie.fr",
    from: "Carnet <commandes@carnet.fr>",
    subject: `Commande : ${order.name} — galette ${order.size}p ${order.flavor}`,
    preview: `Retrait ${order.day} · acompte ${euro(order.price / 2)}`,
    body: [
      `Bonjour,`,
      ``,
      `Nouvelle commande pour la Boulangerie Leroy.`,
      ``,
      `${order.name} · ${order.phone}`,
      `Galette ${order.size} parts · ${order.flavor}`,
      `Retrait ${order.day}`,
      `Acompte ${euro(order.price / 2)} · solde ${euro(order.price / 2)} en boutique`,
      ``,
      `En saison, ce mail-là resterait coupé.`,
      `Le vrai filet, c’est le récap de 18h.`,
    ].join("\n"),
  });
}

function pushRecapMail() {
  const orders = ordersForDay(LAB_DAY);
  addMail({
    type: "recap",
    to: "leroy@boulangerie.fr",
    from: "Carnet <commandes@carnet.fr>",
    subject: `Demain ${LAB_DAY} — ${orders.length} galettes à produire`,
    preview: "Liste labo + totaux. Un seul mail, le soir.",
    body: [
      `Bonjour,`,
      ``,
      `Récap automatique · samedi 18h`,
      `Production de demain : ${LAB_DAY}`,
      ``,
      `À FAIRE`,
      totalsText(orders) || "(aucune commande)",
      `Total : ${orders.length} galettes`,
      ``,
      `COMPTOIR`,
      ...orders.map((o) => `${o.name} · ${o.size}p ${o.flavor} · solde ${euro(o.price / 2)}`),
      ``,
      `Ouvrez la page labo pour imprimer ou cocher les retraits.`,
    ].join("\n"),
  });
}

function resetDemo() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(MAIL_KEY);
}
