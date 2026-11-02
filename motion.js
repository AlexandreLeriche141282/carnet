(function () {
  document.documentElement.classList.add("js-motion");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SELECTOR = [
    ".block > .wrap > .eyebrow-pro",
    ".block > .wrap > h2",
    ".block > .wrap > .intro",
    ".ledger li",
    ".faults li",
    ".steps li",
    ".path li",
    ".split-card",
    ".shot",
    ".product-grid",
    ".plan",
    ".faq details",
    ".qr-stage",
    ".center-link",
    ".plan-promise",
    ".band > .wrap > *",
    "body.demo .phone",
    ".poster",
    ".test-page .card",
  ].join(",");

  function reveal() {
    if (document.documentElement.classList.contains("in-frame")) return;
    const nodes = document.querySelectorAll(SELECTOR);
    if (reduce) {
      nodes.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((el) => io.observe(el));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal);
  } else {
    reveal();
  }
})();
