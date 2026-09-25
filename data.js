const KEY = "leroy-commandes-v2";
const MAIL_KEY = "leroy-mails-v2";
const LAB_DAY = "Dimanche";

const catalog = [
  {
    id: "galette",
    name: "Galette des rois",
    detail: "À la date",
    photo: "assets/viennoiserie.jpg",
    sizes: [
      { id: "6", label: "6 parts", detail: "4 à 6 personnes", price: 22 },
      { id: "8", label: "8 parts", detail: "6 à 8 personnes", price: 28 },
      { id: "10", label: "10 parts", detail: "8 à 10 personnes", price: 34 },
    ],
    flavors: [
      { id: "frangipane", name: "Frangipane", photo: "assets/viennoiserie.jpg", layers: ["Pâte feuilletée", "Crème d’amandes"] },
      { id: "pomme", name: "Pomme", photo: "assets/viennoiserie.jpg", layers: ["Pâte feuilletée", "Compotée de pommes", "Crème d’amandes"] },
      { id: "chocolat", name: "Chocolat", photo: "assets/gateau.jpg", layers: ["Pâte feuilletée", "Ganache chocolat"] },
    ],
  },
  {
    id: "buche",
    name: "Bûche",
    detail: "Fêtes",
    photo: "assets/buche-marron.webp",
    sizes: [
      { id: "6", label: "6 parts", detail: "à partager", price: 28 },
      { id: "8", label: "8 parts", detail: "à partager", price: 36 },
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
    id: "gateau",
    name: "Gâteau d’anniversaire",
    detail: "Toute l’année",
    photo: "assets/gateau.jpg",
    sizes: [
      { id: "8", label: "8 parts", detail: "famille", price: 32 },
      { id: "12", label: "12 parts", detail: "fête", price: 48 },
    ],
    flavors: [
      { id: "vanille", name: "Vanille", photo: "assets/gateau.jpg", layers: ["Génoise", "Crème vanille"] },
      { id: "chocolat", name: "Chocolat", photo: "assets/gateau.jpg", layers: ["Génoise cacao", "Ganache montée"] },
      { id: "fraise", name: "Fraise", photo: "assets/gateau.jpg", layers: ["Génoise", "Crème légère", "Fraises fraîches"] },
    ],
  },
  {
    id: "piece",
    name: "Pièce montée",
    detail: "Événement",
    photo: "assets/viennoiserie.jpg",
    sizes: [
      { id: "20", label: "20 parts", detail: "cocktail", price: 90 },
      { id: "30", label: "30 parts", detail: "réception", price: 130 },
    ],
    flavors: [
      { id: "nature", name: "Nature", photo: "assets/viennoiserie.jpg", layers: ["Choux", "Crème pâtissière"] },
      { id: "chocolat", name: "Chocolat", photo: "assets/gateau.jpg", layers: ["Choux", "Crème pâtissière chocolat"] },
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
  { id: "1", name: "Durand", phone: "06 11 22 33 44", product: "Galette des rois", size: "8", flavor: "Frangipane", day: LAB_DAY, price: 28, done: false },
  { id: "2", name: "Leroy", phone: "07 98 76 54 32", product: "Bûche", size: "6", flavor: "Chocolat", day: LAB_DAY, price: 28, done: false },
  { id: "3", name: "Bernard", phone: "06 55 44 33 22", product: "Gâteau d’anniversaire", size: "12", flavor: "Fraise", day: LAB_DAY, price: 48, done: false },
  { id: "4", name: "Messaoudi", phone: "06 20 20 20 20", product: "Pièce montée", size: "20", flavor: "Nature", day: LAB_DAY, price: 90, done: false },
];

function euro(n) {
  return `${n}\u00a0€`;
}

function orderLabel(o) {
  return [o.product, o.size ? `${o.size} parts` : "", o.flavor].filter(Boolean).join(" · ");
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
    const key = orderLabel(o);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([k, n]) => `${k} × ${n}`)
    .join("\n");
}

function pushOrderMail(order) {
  addMail({
    type: "order",
    to: "contact@leonardd.fr",
    from: "Carnet de commandes <commandes@carnet.fr>",
    subject: `Commande : ${order.name} — ${orderLabel(order)}`,
    preview: `Retrait ${order.day} · acompte ${euro(order.price / 2)}`,
    body: [
      `Bonjour,`,
      ``,
      `Nouvelle commande pour Léonard Boulangerie.`,
      ``,
      `${order.name} · ${order.phone}`,
      orderLabel(order),
      order.composition ? `Composition : ${order.composition}` : "",
      `Retrait ${order.day}`,
      `Acompte ${euro(order.price / 2)} · solde ${euro(order.price / 2)} en boutique`,
      ``,
      `En pleine saison, ce mail-là resterait coupé.`,
      `Le vrai filet, c’est le récap de 18h.`,
    ].join("\n"),
  });
}

function pushRecapMail() {
  const orders = ordersForDay(LAB_DAY);
  addMail({
    type: "recap",
    to: "contact@leonardd.fr",
    from: "Carnet de commandes <commandes@carnet.fr>",
    subject: `Demain ${LAB_DAY} — ${orders.length} commandes à produire`,
    preview: "Liste labo + totaux. Un seul mail, le soir.",
    body: [
      `Bonjour,`,
      ``,
      `Récap automatique · la veille 18h`,
      `Production de demain : ${LAB_DAY}`,
      ``,
      `À FAIRE`,
      totalsText(orders) || "(aucune commande)",
      `Total : ${orders.length} commandes`,
      ``,
      `COMPTOIR`,
      ...orders.map((o) => `${o.name} · ${orderLabel(o)} · solde ${euro(o.price / 2)}`),
      ``,
      `Ouvrez la page labo pour imprimer ou cocher les retraits.`,
    ].join("\n"),
  });
}

function resetDemo() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(MAIL_KEY);
}
