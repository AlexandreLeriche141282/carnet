(function () {
  const form = document.getElementById("lead-form");
  const thanks = document.getElementById("lead-thanks");
  const status = document.getElementById("lead-status");
  if (!form || !thanks) return;

  const started = Date.now();
  const TO = "alexandre@pikcel.fr";
  const WAIT_MS = 800;
  const COOL_KEY = "carnet-lead-sent-v1";
  const COOL_MS = 10 * 60 * 1000;

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

  function isEmailOk(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
  }

  function isPhoneOk(value) {
    return /^0[1-9]\d{8}$/.test(String(value || "").replace(/\D/g, ""));
  }

  function setError(id, text) {
    const input = document.getElementById(id);
    const err = document.getElementById(`${id}-error`);
    if (err) err.textContent = text || "";
    if (input) input.classList.toggle("is-bad", Boolean(text));
  }

  function setStatus(text) {
    if (!status) return;
    status.textContent = text || "";
    status.classList.toggle("hidden", !text);
  }

  function alreadySent() {
    try {
      const at = Number(localStorage.getItem(COOL_KEY) || 0);
      return at && Date.now() - at < COOL_MS;
    } catch (err) {
      return false;
    }
  }

  function markSent() {
    try {
      localStorage.setItem(COOL_KEY, String(Date.now()));
    } catch (err) {
      /* ignore */
    }
  }

  function showThanks() {
    form.classList.add("hidden");
    thanks.classList.remove("hidden");
    thanks.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    const honey = (document.getElementById("lead-website").value || "").trim();
    const name = (document.getElementById("lead-name").value || "").trim();
    const shop = (document.getElementById("lead-shop").value || "").trim();
    const phone = (document.getElementById("lead-phone").value || "").trim();
    const email = (document.getElementById("lead-mail").value || "").trim();
    const city = (document.getElementById("lead-city").value || "").trim();
    const message = (document.getElementById("lead-message").value || "").trim().slice(0, 1000);

    setError("lead-name", name.length >= 2 ? "" : "Indiquez votre nom.");
    setError("lead-shop", shop.length >= 2 ? "" : "Indiquez le nom de la boutique.");
    setError("lead-phone", isPhoneOk(phone) ? "" : "Indiquez un téléphone à 10 chiffres.");
    setError("lead-mail", isEmailOk(email) ? "" : "Indiquez un mail valide.");

    if (name.length < 2 || shop.length < 2 || !isPhoneOk(phone) || !isEmailOk(email)) {
      setStatus("");
      return;
    }

    if (honey || Date.now() - started < WAIT_MS) {
      showThanks();
      return;
    }

    if (alreadySent()) {
      showThanks();
      return;
    }

    if (!emailjsReady()) {
      setStatus("L’envoi n’est pas passé. Appelez le 06 10 60 14 42.");
      return;
    }

    const cfg = emailjsConfig();
    const body = [
      `Nouvelle demande d’essai Carnet`,
      ``,
      `Nom : ${name}`,
      `Boulangerie : ${shop}`,
      `Téléphone : ${phone}`,
      `Mail : ${email}`,
      `Ville : ${city || "—"}`,
      ``,
      `Message :`,
      message || "—",
    ].join("\n");

    if (btn) btn.disabled = true;
    setStatus("Envoi…");

    try {
      if (!window.__carnetEmailjsInit) {
        window.emailjs.init({ publicKey: cfg.publicKey });
        window.__carnetEmailjsInit = true;
      }
      const html = `<pre style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;white-space:pre-wrap;">${body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>`;
      await window.emailjs.send(cfg.serviceId, cfg.templateId, {
        to_email: TO,
        subject: `Essai Carnet — ${shop} — ${name}`,
        message: body,
        html_message: html,
      });
      markSent();
      showThanks();
    } catch (err) {
      setStatus("L’envoi n’est pas passé. Appelez le 06 10 60 14 42.");
      if (btn) btn.disabled = false;
    }
  });
})();
