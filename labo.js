if (!patronUnlocked()) {
  window.location.replace("patron.html");
}

let labDate = tomorrowIso();
let pendingDelete = null;

function render() {
  const dateEl = document.getElementById("lab-date");
  dateEl.min = todayIso();
  dateEl.max = lastPickupIso();
  dateEl.value = labDate;

  document.getElementById("lab-title").textContent = formatDateFr(labDate);
  document.getElementById("when").textContent = "Léonard · feuille du jour";

  const orders = ordersForDay(labDate);
  const counts = productionCounts(orders);
  const pieces = Object.values(counts).reduce((n, qty) => n + qty, 0);

  const rows = Object.entries(counts)
    .map(([k, n]) => `<div><span>${k}</span><strong>× ${n}</strong></div>`)
    .join("");

  document.getElementById("totals").innerHTML = `
    <div><span>Total à produire</span><strong>${pieces}</strong></div>
    ${rows}
  `;

  document.getElementById("list").innerHTML = orders.length
    ? orders
        .map((o) => {
          const lines = orderItems(o)
            .map((item) => `${itemLabel(item)}${item.composition ? `<br>${item.composition}` : ""}`)
            .join("<br>");
          return `
        <article class="order ${o.done ? "is-done" : ""}">
          <header>
            <h3>${o.name}</h3>
            <span>${o.time || ""} · ${euro(orderTotal(o))}</span>
          </header>
          <p>${lines}<br>Retrait ${pickupLabel(o)}<br>${o.phone}</p>
          <div class="order-actions">
            <button class="done" type="button" data-done="${o.id}">${o.done ? "Récupéré" : "Marquer récupéré"}</button>
            <button class="order-delete ${pendingDelete === o.id ? "is-ask" : ""}" type="button" data-delete="${o.id}">${pendingDelete === o.id ? "Confirmer" : "Supprimer"}</button>
          </div>
        </article>`;
        })
        .join("")
    : `<p class="note">Aucune commande pour ${formatDateFr(labDate)}.</p>`;

  document.querySelectorAll("[data-done]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingDelete = null;
      const next = loadOrders().map((o) => (o.id === btn.dataset.done ? { ...o, done: !o.done } : o));
      saveOrders(next);
      render();
    });
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.delete;
      if (pendingDelete === id) {
        saveOrders(loadOrders().filter((o) => o.id !== id));
        pendingDelete = null;
        render();
        return;
      }
      pendingDelete = id;
      render();
    });
  });
}

document.getElementById("lab-date").addEventListener("change", (e) => {
  labDate = clampPickupDate(e.target.value);
  render();
});

render();
