const days = ["Samedi", "Dimanche", "Lundi"];
const state = { productId: "buche", size: "6", flavor: "marron-poire", day: days[1] };

function currentProduct() {
  return catalog.find((p) => p.id === state.productId) || catalog[0];
}

function currentFlavor() {
  return findFlavor(currentProduct(), state.flavor);
}

function currentPrice() {
  const size = currentProduct().sizes.find((s) => s.id === state.size);
  return (size || currentProduct().sizes[0]).price;
}

function syncVariants() {
  const p = currentProduct();
  if (!p.sizes.some((s) => s.id === state.size)) state.size = p.sizes[0].id;
  if (!findFlavor(p, state.flavor) || !p.flavors.some((f) => flavorId(f) === state.flavor || flavorName(f) === state.flavor)) {
    state.flavor = flavorId(p.flavors[0]);
  } else {
    state.flavor = flavorId(findFlavor(p, state.flavor));
  }
}

function renderChoices() {
  syncVariants();
  const p = currentProduct();

  document.getElementById("products").innerHTML = catalog
    .map(
      (item) => `
      <button class="choice choice-photo ${state.productId === item.id ? "is-on" : ""}" data-product="${item.id}" type="button">
        <img src="${item.photo}" alt="">
        <span><strong>${item.name}</strong><span>${item.detail}</span></span>
      </button>`
    )
    .join("");

  document.getElementById("sizes").innerHTML = p.sizes
    .map(
      (s) => `
      <button class="choice ${state.size === s.id ? "is-on" : ""}" data-size="${s.id}" type="button">
        <span><strong>${s.label}</strong><span>${s.detail}</span></span>
        <span class="price">${euro(s.price)}</span>
      </button>`
    )
    .join("");

  document.getElementById("flavors").innerHTML = p.flavors
    .map((f) => {
      const on = flavorId(f) === state.flavor;
      const layers = flavorLayers(f)
        .map((layer) => `<li>${layer}</li>`)
        .join("");
      const photo = flavorPhoto(f, p);
      return `
      <button class="flavor-card ${on ? "is-on" : ""}" data-flavor="${flavorId(f)}" type="button">
        <img src="${photo}" alt="${flavorName(f)}">
        <span>
          <strong>${flavorName(f)}</strong>
          <ul>${layers}</ul>
        </span>
      </button>`;
    })
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
    <p>${orderLabel(order)}</p>
    <p>Retrait ${order.day}</p>
    <p>Acompte payé ${euro(order.price / 2)} · solde ${euro(order.price / 2)} en boutique</p>
  `;
}

document.getElementById("products").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-product]");
  if (!btn) return;
  state.productId = btn.dataset.product;
  renderChoices();
});

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
  const p = currentProduct();
  const flavor = currentFlavor();
  const order = {
    id: String(Date.now()),
    name,
    phone,
    product: p.name,
    size: state.size,
    flavor: flavorName(flavor),
    composition: flavorLayers(flavor).join(" · "),
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
