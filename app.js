const sizes = [
  { id: "6", label: "6 parts", detail: "pour 4 à 6 personnes", price: 22 },
  { id: "8", label: "8 parts", detail: "pour 6 à 8 personnes", price: 28 },
  { id: "10", label: "10 parts", detail: "pour 8 à 10 personnes", price: 34 },
];

const flavors = ["Frangipane", "Pomme", "Chocolat"];
const days = ["Samedi 10 janv.", "Dimanche 11 janv.", "Lundi 12 janv."];

const state = { size: "8", flavor: "Frangipane", day: days[1] };

function currentPrice() {
  return sizes.find((s) => s.id === state.size).price;
}

function renderChoices() {
  document.getElementById("sizes").innerHTML = sizes
    .map(
      (s) => `
      <button class="choice ${state.size === s.id ? "is-on" : ""}" data-size="${s.id}" type="button">
        <span><strong>${s.label}</strong><span>${s.detail}</span></span>
        <span class="price">${euro(s.price)}</span>
      </button>`
    )
    .join("");

  document.getElementById("flavors").innerHTML = flavors
    .map(
      (f) => `<button class="chip ${state.flavor === f ? "is-on" : ""}" data-flavor="${f}" type="button">${f}</button>`
    )
    .join("");

  document.getElementById("days").innerHTML = days
    .map(
      (d) => `<button class="chip ${state.day === d ? "is-on" : ""}" data-day="${d}" type="button">${d}</button>`
    )
    .join("");

  const price = currentPrice();
  document.getElementById("deposit").textContent = euro(price / 2);
  document.getElementById("balance").textContent = euro(price / 2);
}

function showOk(order) {
  document.getElementById("form-view").classList.add("hidden");
  document.getElementById("ok-view").classList.remove("hidden");
  document.getElementById("ticket").innerHTML = `
    <p><strong>${order.name}</strong></p>
    <p>Galette ${order.size} parts · ${order.flavor}</p>
    <p>Retrait ${order.day}</p>
    <p>Acompte payé ${euro(order.price / 2)} · solde ${euro(order.price / 2)} en boutique</p>
  `;
}

document.getElementById("sizes").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-size]");
  if (!btn) return;
  state.size = btn.dataset.size;
  renderChoices();
});

document.getElementById("flavors").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-flavor]");
  if (!btn) return;
  state.flavor = btn.dataset.flavor;
  renderChoices();
});

document.getElementById("days").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-day]");
  if (!btn) return;
  state.day = btn.dataset.day;
  renderChoices();
});

document.getElementById("pay").addEventListener("click", () => {
  const name = document.getElementById("name").value.trim() || "Client démo";
  const phone = document.getElementById("phone").value.trim() || "06 00 00 00 00";
  const order = {
    id: String(Date.now()),
    name,
    phone,
    size: state.size,
    flavor: state.flavor,
    day: state.day,
    price: currentPrice(),
    done: false,
  };
  const orders = loadOrders();
  orders.push(order);
  saveOrders(orders);
  pushOrderMail(order);
  showOk(order);
});

document.getElementById("again").addEventListener("click", () => {
  document.getElementById("ok-view").classList.add("hidden");
  document.getElementById("form-view").classList.remove("hidden");
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
});

if (window.self !== window.top) {
  document.body.classList.add("in-frame");
  const back = document.querySelector(".demo-back");
  if (back) back.remove();
}

renderChoices();
loadOrders();
