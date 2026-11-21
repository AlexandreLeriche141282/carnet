let patronDate = tomorrowIso();
let pendingDelete = null;
let mailReady = false;
let autoSendBusy = false;
let autoSendTimer = null;

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
  startAutoRecap();
}

function setMailStatus(text) {
  const status = document.getElementById("mail-status");
  if (!status) return;
  status.textContent = text;
  status.classList.toggle("hidden", !text);
}

function updateAutoMailNote() {
  const el = document.getElementById("auto-mail-note");
  const hourEl = document.getElementById("lab-hour");
  if (!el || !hourEl) return;
  const hour = hourEl.value;
  if (!emailjsReady()) {
    el.innerHTML = "L’envoi EmailJS n’est pas encore réglé.<br>Le bouton ouvre la messagerie en attendant.";
    return;
  }
  if (recapAlreadySentToday()) {
    el.innerHTML = `Le récap automatique du jour est déjà parti, à ${hour}.<br>Prochain envoi : demain, à ${hour}.`;
    return;
  }
  el.innerHTML = `Un seul mail automatique par jour, à ${hour}.<br>Laissez cet onglet ouvert. L’ordinateur ne doit pas s’endormir.`;
}

async function tryAutoSendRecap() {
  if (autoSendBusy || !patronUnlocked() || !shouldAutoSendRecap()) return;
  autoSendBusy = true;
  const settings = loadMailSettings();
  try {
    const mail = pushRecapMail(tomorrowIso(), settings.to);
    await sendLabEmail(mail);
    markRecapSentToday();
    setMailStatus(`Récap automatique parti à ${settings.to}, pour ${formatDateFr(mail.date)}.`);
    updateAutoMailNote();
  } catch (err) {
    setMailStatus("L’envoi automatique n’est pas passé. Réessayez avec le bouton, ou plus tard.");
  } finally {
    autoSendBusy = false;
  }
}

function startAutoRecap() {
  tryAutoSendRecap();
  if (autoSendTimer) return;
  autoSendTimer = setInterval(tryAutoSendRecap, 30000);
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
  hourEl.value = settings.hour || "18h";
  document.getElementById("lab-mail").value = settings.to;
  saveMailSettings({
    to: isEmailOk(settings.to) ? settings.to : loadMailSettings().to,
    hour: hourEl.value,
  });
  mailReady = true;
  updateAutoMailNote();
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
  updateAutoMailNote();
});

document.getElementById("mail-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const to = document.getElementById("lab-mail").value.trim();
  const hour = document.getElementById("lab-hour").value;
  const err = document.getElementById("lab-mail-error");
  const mailEl = document.getElementById("lab-mail");
  const status = document.getElementById("mail-status");
  const btn = e.target.querySelector("button[type='submit']");

  if (!isEmailOk(to) || isPlaceholderMail(to)) {
    err.textContent = "Indiquez votre vrai mail, pour recevoir le récap.";
    mailEl.classList.add("is-bad");
    status.classList.add("hidden");
    return;
  }

  err.textContent = "";
  mailEl.classList.remove("is-bad");
  saveMailSettings({ to, hour });
  const mail = pushRecapMail(patronDate, to);
  setMailStatus("Envoi du récap…");
  if (btn) btn.disabled = true;

  try {
    await sendLabEmail(mail);
    setMailStatus(`Récap envoyé à ${mail.to} via EmailJS.`);
    updateAutoMailNote();
  } catch (errSend) {
    setMailStatus(`Votre messagerie s’ouvre pour envoyer le récap à ${mail.to}. Cliquez sur Envoyer.`);
    openMailto(mail.to, mail.subject, mail.body);
  } finally {
    if (btn) btn.disabled = false;
  }
});

document.getElementById("lock-out").addEventListener("click", () => {
  lockPatron();
  showLock();
});

if (patronUnlocked()) showApp();
else showLock();
