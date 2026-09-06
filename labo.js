function render() {
  const orders = loadOrders().filter((o) => o.day === LAB_DAY);
  const counts = {};
  for (const o of orders) {
    const key = `${o.flavor} · ${o.size} parts`;
    counts[key] = (counts[key] || 0) + 1;
  }

  const rows = Object.entries(counts)
    .map(([k, n]) => `<div><span>${k}</span><strong>× ${n}</strong></div>`)
    .join("");

  document.getElementById("totals").innerHTML = `
    <div><span>Total galettes</span><strong>${orders.length}</strong></div>
    ${rows}
  `;

  document.getElementById("list").innerHTML = orders
    .map(
      (o) => `
        <article class="order ${o.done ? "is-done" : ""}">
          <header>
            <h3>${o.name}</h3>
            <span>${euro(o.price / 2)} solde</span>
          </header>
          <p>${o.size} parts · ${o.flavor}<br>${o.phone}</p>
          <button class="done" type="button" data-id="${o.id}">${o.done ? "Récupéré" : "Marquer récupéré"}</button>
        </article>`
    )
    .join("");

  document.querySelectorAll("[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = loadOrders().map((o) => (o.id === btn.dataset.id ? { ...o, done: !o.done } : o));
      saveOrders(next);
      render();
    });
  });
}

render();
