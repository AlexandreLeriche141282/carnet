function renderList() {
  const mails = loadMails();
  document.getElementById("empty").classList.toggle("hidden", mails.length > 0);
  document.getElementById("list").innerHTML = mails
    .map(
      (m) => `
      <button class="mail-item ${m.unread ? "is-unread" : ""}" type="button" data-id="${m.id}">
        <strong>${m.subject}</strong>
        <span>${m.preview}</span>
        <em>${m.at}</em>
      </button>`
    )
    .join("");

  document.querySelectorAll("[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => openMail(btn.dataset.id));
  });
}

function openMail(id) {
  const mails = loadMails();
  const mail = mails.find((m) => m.id === id);
  if (!mail) return;
  mail.unread = false;
  saveMails(mails);
  document.getElementById("reader").classList.remove("hidden");
  document.getElementById("meta").textContent = `À ${mail.to} · ${mail.at}`;
  document.getElementById("subject").textContent = mail.subject;
  document.getElementById("from").textContent = mail.from;
  document.getElementById("body").textContent = mail.body;
}

document.getElementById("close").addEventListener("click", () => {
  document.getElementById("reader").classList.add("hidden");
  renderList();
});

document.getElementById("recap").addEventListener("click", () => {
  pushRecapMail();
  renderList();
});

renderList();
