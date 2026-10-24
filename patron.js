let patronDate = tomorrowIso();
let pendingDelete = null;
let mailReady = false;

function weekdayShort(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
}

function dayNum(iso) {
  return new Date(`${iso}T12:00:00`).getDate();
}

function showLock() {
  document.getElementById("patron-lock").classList.remove("hidden");
  document.getElementById("patron-app").classList.add("hidden");
  const pin = document.getElementById("patron-pin");
  pin.value = "";
  pin.focus();
}

function showApp() {
  document.getElementById("patron-lock").classList.add("hidden");
  document.getElementById("patron-app").classList.remove("hidden");
  initMailForm();
  render();
}

function renderWeek() {
  const chips = [];
  for (let i = 0; i <= 7; i += 1) {
    const date = addDaysIso(todayIso(), i);
    const n = ordersForDay(date).length;
    chips.push(`
      <button class="week-day ${date === patronDate ? "is-on" : ""}" type="button" data-day="${date}">
        <span>${weekdayShort(date)}</span>
        <strong>${dayNum(date)}</strong>
        <em>${n}</em>
      </button>`);
  }
  document.getElementById("week").innerHTML = chips.join("");
  document.querySelectorAll("[data-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      patronDate = btn.dataset.day;
      render();
    });
  });
}

function initMailForm() {
  if (mailReady) return;
  const settings = loadMailSettings();
  const hourEl = document.getElementById("lab-hour");
  hourEl.innerHTML = times.map((t) => `<option value="${t}">${t}</option>`).join("");
  hourEl.value = settings.hour;
  document.getElementById("lab-mail").value = settings.to;
  mailReady = true;
}

function render() {
  const dateEl = document.getElementById("patron-date");
  dateEl.min = todayIso();
  dateEl.max = lastPickupIso();
  dateEl.value = patronDate;
  document.getElementById("when").textContent = `${formatDateFr(patronDate)} · Léonard`;

  renderWeek();

  const orders = ordersForDay(patronDate);
  const counts = productionCounts(orders);
  const pieces = Object.values(counts).reduce((n, qty) => n + qty, 0);
  const ca = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  const done = orders.filter((o) => o.done).length;

  const rows = Object.entries(counts)
    .map(([k, n]) => `<div><span>${k}</span><strong>× ${n}</strong></div>`)
    .join("");

  document.getElementById("totals").innerHTML = `
    <div><span>Commandes</span><strong>${orders.length}</strong></div>
    <div><span>Pièces</span><strong>${pieces}</strong></div>
    <div><span>Récupérées</span><strong>${done}</strong></div>
    <div><span>À encaisser</span><strong>${euro(ca)}</strong></div>
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
    : `<p class="note">Aucune commande pour ${formatDateFr(patronDate)}.</p>`;

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

document.getElementById("patron-lock-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const pin = document.getElementById("patron-pin");
  const err = document.getElementById("pin-error");
  if ((pin.value || "").trim() !== PATRON_PIN) {
    err.textContent = "Code incorrect.";
    pin.classList.add("is-bad");
    pin.select();
    return;
  }
  err.textContent = "";
  pin.classList.remove("is-bad");
  unlockPatron();
  showApp();
});

document.getElementById("patron-date").addEventListener("change", (e) => {
  patronDate = clampPickupDate(e.target.value);
  render();
});

document.getElementById("lab-hour").addEventListener("change", () => {
  const to = document.getElementById("lab-mail").value.trim();
  saveMailSettings({
    to: isEmailOk(to) ? to : loadMailSettings().to,
    hour: document.getElementById("lab-hour").value,
  });
});

document.getElementById("mail-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const to = document.getElementById("lab-mail").value.trim();
  const hour = document.getElementById("lab-hour").value;
  const err = document.getElementById("lab-mail-error");
  const mailEl = document.getElementById("lab-mail");
  const status = document.getElementById("mail-status");

  if (!isEmailOk(to)) {
    err.textContent = "Indiquez un mail valide.";
    mailEl.classList.add("is-bad");
    status.classList.add("hidden");
    return;
  }

  err.textContent = "";
  mailEl.classList.remove("is-bad");
  saveMailSettings({ to, hour });
  const mail = pushRecapMail(patronDate, to);
  status.textContent = `Récap prêt pour ${mail.to}. Une copie est dans la boîte démo.`;
  status.classList.remove("hidden");
  openMailto(mail.to, mail.subject, mail.body);
});

document.getElementById("lock-out").addEventListener("click", () => {
  lockPatron();
  showLock();
});

if (patronUnlocked()) showApp();
else showLock();
