const state = { productId: "tarte", size: "6", flavor: "citron" };
let cart = loadCart();
let addedTimer = 0;

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

function showView(id) {
  ["form-view", "cart-view", "ok-view"].forEach((view) => {
    document.getElementById(view).classList.toggle("hidden", view !== id);
  });
  if (id === "cart-view") renderCart();
  renderBadge();
}

function renderBadge() {
  const count = cartCount(cart);
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
  document.querySelectorAll("[data-open-cart]").forEach((el) => {
    el.setAttribute("aria-label", count ? `Ouvrir le panier, ${count} article${count > 1 ? "s" : ""}` : "Ouvrir le panier");
  });
  const peek = document.getElementById("cart-peek");
  if (!peek) return;
  peek.hidden = count === 0;
  peek.textContent = count ? `Voir le panier · ${count} article${count > 1 ? "s" : ""} · ${euro(cartTotal(cart))}` : "";
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
        <span><strong>${s.label}</strong>${s.detail ? `<span>${s.detail}</span>` : ""}</span>
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

  const add = document.getElementById("add");
  add.classList.remove("is-added");
  add.innerHTML = `Ajouter au panier · <span id="total">${euro(currentPrice())}</span><small>Vous pourrez en prendre d’autres</small>`;
  renderBadge();
}

function currentLine() {
  const p = currentProduct();
  const flavor = currentFlavor();
  return {
    id: `${p.id}-${state.size}-${flavorId(flavor)}`,
    productId: p.id,
    product: p.name,
    size: state.size,
    flavor: flavorName(flavor),
    composition: flavorLayers(flavor).join(" · "),
    photo: flavorPhoto(flavor, p),
    price: currentPrice(),
    qty: 1,
  };
}

function addToCart() {
  const line = currentLine();
  const found = cart.items.find((item) => item.id === line.id);
  if (found) found.qty = itemQty(found) + 1;
  else cart.items.push(line);
  saveCart(cart);
  renderBadge();
  const add = document.getElementById("add");
  add.classList.add("is-added");
  add.innerHTML = `Ajouté au panier · ${euro(line.price)}<small>Ajoutez un autre produit, ou ouvrez le panier</small>`;
  window.clearTimeout(addedTimer);
  addedTimer = window.setTimeout(() => {
    if (document.getElementById("form-view").classList.contains("hidden")) return;
    renderChoices();
  }, 1400);
}

function renderCart() {
  const list = document.getElementById("cart-lines");
  const empty = document.getElementById("cart-empty");
  const fields = document.getElementById("cart-fields");
  const pay = document.getElementById("pay");
  const count = cartCount(cart);
  empty.hidden = count > 0;
  fields.hidden = count === 0;
  pay.hidden = count === 0;
  pay.disabled = count === 0;

  list.innerHTML = cart.items
    .map(
      (item) => `
      <article class="cart-line">
        <img src="${item.photo}" alt="">
        <div>
          <strong>${itemLabel(item)}</strong>
          <span>${euro(item.price * itemQty(item))}</span>
        </div>
        <button class="cart-remove" type="button" data-remove="${item.id}">Retirer</button>
      </article>`
    )
    .join("");

  syncPickupFields();
  pay.innerHTML = `Valider la commande · ${euro(cartTotal(cart))}<small>Paiement au retrait</small>`;
}

function fillTimeSelect() {
  const select = document.getElementById("pickup-time");
  select.innerHTML = times.map((t) => `<option value="${t}">${t.replace("h", " h")}</option>`).join("");
}

function syncPickupFields() {
  const dateEl = document.getElementById("pickup-date");
  const timeEl = document.getElementById("pickup-time");
  dateEl.min = todayIso();
  dateEl.max = lastPickupIso();
  dateEl.value = clampPickupDate(cart.date);
  timeEl.value = times.includes(cart.time) ? cart.time : "10h";
  cart.date = dateEl.value;
  cart.time = timeEl.value;
}

function setFieldError(id, message) {
  const input = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  input.classList.toggle("is-bad", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  err.textContent = message || "";
}

function clearFieldErrors() {
  setFieldError("pickup-date", "");
  setFieldError("pickup-time", "");
  setFieldError("name", "");
  setFieldError("phone", "");
}

function validateCart() {
  const date = document.getElementById("pickup-date").value;
  const time = document.getElementById("pickup-time").value;
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const dateOk = isPickupDateOk(date);
  const timeOk = isPickupTimeOk(time);
  const nameOk = isNameOk(name);
  const phoneOk = isPhoneOk(phone);
  setFieldError("pickup-date", dateOk ? "" : "Choisissez un jour de retrait.");
  setFieldError("pickup-time", timeOk ? "" : "Choisissez une heure.");
  setFieldError("name", nameOk ? "" : "Indiquez votre nom.");
  setFieldError("phone", phoneOk ? "" : "Indiquez un téléphone à 10 chiffres.");
  if (!dateOk) document.getElementById("pickup-date").focus();
  else if (!timeOk) document.getElementById("pickup-time").focus();
  else if (!nameOk) document.getElementById("name").focus();
  else if (!phoneOk) document.getElementById("phone").focus();
  return dateOk && timeOk && nameOk && phoneOk;
}

function showOk(order) {
  showView("ok-view");
  const lines = orderItems(order)
    .map((item) => `<p>${itemLabel(item)} · ${euro(item.price * itemQty(item))}</p>`)
    .join("");
  document.getElementById("ticket").innerHTML = `
    <p><strong>${order.name}</strong> · ${order.phone}</p>
    ${lines}
    <p>Retrait ${pickupLabel(order)}</p>
    <p>${euro(orderTotal(order))} à régler au retrait</p>
  `;
}

function placeOrder() {
  if (!cart.items.length) {
    showView("form-view");
    return;
  }
  if (!validateCart()) return;
  cart.date = document.getElementById("pickup-date").value;
  cart.time = document.getElementById("pickup-time").value;
  const order = {
    id: String(Date.now()),
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    date: cart.date,
    time: cart.time,
    items: cart.items.map((item) => ({
      product: item.product,
      size: item.size,
      flavor: item.flavor,
      composition: item.composition,
      price: item.price,
      qty: itemQty(item),
    })),
    price: cartTotal(cart),
    done: false,
  };
  const orders = loadOrders();
  orders.push(order);
  saveOrders(orders);
  pushOrderMail(order);
  clearCart();
  cart = emptyCart();
  showOk(order);
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

document.getElementById("add").addEventListener("click", addToCart);

document.querySelectorAll("[data-open-cart]").forEach((el) => {
  el.addEventListener("click", () => showView("cart-view"));
});

document.getElementById("back-catalog").addEventListener("click", () => {
  showView("form-view");
  renderChoices();
});

document.getElementById("cart-lines").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  cart.items = cart.items.filter((item) => item.id !== btn.dataset.remove);
  saveCart(cart);
  renderCart();
  renderBadge();
});

document.getElementById("pickup-date").addEventListener("change", (e) => {
  cart.date = clampPickupDate(e.target.value);
  e.target.value = cart.date;
  saveCart(cart);
  setFieldError("pickup-date", "");
});

document.getElementById("pickup-time").addEventListener("change", (e) => {
  cart.time = isPickupTimeOk(e.target.value) ? e.target.value : "10h";
  e.target.value = cart.time;
  saveCart(cart);
  setFieldError("pickup-time", "");
});

document.getElementById("cart-form").addEventListener("submit", (e) => {
  e.preventDefault();
  placeOrder();
});

["name", "phone"].forEach((id) => {
  document.getElementById(id).addEventListener("input", () => setFieldError(id, ""));
});

fillTimeSelect();

document.getElementById("again").addEventListener("click", () => {
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  showView("form-view");
  renderChoices();
});

if (window.self !== window.top) {
  document.body.classList.add("in-frame");
  const back = document.querySelector(".demo-back");
  if (back) back.remove();
}

renderChoices();
loadOrders();
