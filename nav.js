(function () {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!btn || !nav) return;
  let scrollY = 0;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("nav-open", open);
    document.body.classList.toggle("nav-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (open) {
      scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
    } else {
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    }
  }

  btn.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();
