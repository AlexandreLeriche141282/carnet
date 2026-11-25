(function (root) {
  const BG = "#fcf6ec";
  const INK = "#2d1d14";
  const PAPER = "#fffdf7";
  const ACCENT = "#ae5528";
  const SECONDARY = "#f3e6d2";
  const CRUST = "#352118";
  const CRUST_FG = "#f6ede0";
  const MUTED = "#715f53";
  const LINE = "#e1d6c6";
  const SANS = "Arial, Helvetica, sans-serif";
  const SERIF = "Georgia, 'Times New Roman', Times, serif";

  function shop() {
    const cfg = root.CARNET_SHOP || {};
    return {
      name: cfg.name || "Léonard",
      logoUrl: cfg.logoUrl || "https://alexandreleriche141282.github.io/carnet/assets/logo-leonardd.png?v=2",
      laboUrl: cfg.laboUrl || "https://alexandreleriche141282.github.io/carnet/labo.html",
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function itemQty(item) {
    return item.qty || 1;
  }

  function orderItems(order) {
    if (Array.isArray(order.items) && order.items.length) return order.items;
    return [{ product: order.product, size: order.size, flavor: order.flavor, price: order.price, qty: 1 }];
  }

  function itemLabel(item) {
    const qty = itemQty(item) > 1 ? ` × ${itemQty(item)}` : "";
    return [item.product, item.size ? `${item.size} personnes` : "", item.flavor].filter(Boolean).join(" · ") + qty;
  }

  function orderLabel(order) {
    return orderItems(order).map(itemLabel).join(" + ");
  }

  function orderTotal(order) {
    if (typeof order.price === "number") return order.price;
    return orderItems(order).reduce((sum, item) => sum + (Number(item.price) || 0) * itemQty(item), 0);
  }

  function euro(n) {
    return `${n}\u00a0€`;
  }

  function sizeLabel(size) {
    if (!size) return "—";
    return /personne/i.test(String(size)) ? String(size) : `${size} personnes`;
  }

  function productionLines(orders) {
    const map = {};
    for (const order of orders) {
      for (const item of orderItems(order)) {
        const product = item.product || "—";
        const size = sizeLabel(item.size);
        const flavor = item.flavor || "—";
        const key = `${product}|${size}|${flavor}`;
        map[key] = map[key] || { product, size, flavor, qty: 0 };
        map[key].qty += itemQty(item);
      }
    }
    return Object.values(map);
  }

  function counterRows(orders) {
    return orders.map((order) => ({
      name: order.name || "—",
      detail: orderLabel(order),
      time: order.time || "—",
      amount: euro(orderTotal(order)),
    }));
  }

  function view(orders, meta) {
    const info = shop();
    return {
      shopName: info.name,
      logoUrl: info.logoUrl,
      laboUrl: info.laboUrl,
      hour: meta.hour || "18h",
      whenLabel: meta.whenLabel || "",
      lines: productionLines(orders),
      rows: counterRows(orders),
      count: orders.length,
    };
  }

  function buildText(data) {
    const lines = data.lines.length
      ? data.lines.map((line) => `${line.product} · ${line.size} · ${line.flavor} × ${line.qty}`)
      : ["(aucune commande)"];
    const rows = data.rows.length
      ? data.rows.map((row) => `${row.name} · ${row.detail} · ${row.time} · ${row.amount}`)
      : ["(aucun retrait)"];
    return [
      data.shopName,
      `Feuille du labo · ${data.whenLabel}`,
      `Envoi ${data.hour}`,
      ``,
      `À produire`,
      ...lines,
      `Total : ${data.count} commande${data.count === 1 ? "" : "s"}`,
      ``,
      `Retraits`,
      ...rows,
      ``,
      `Ouvrez la feuille du labo pour imprimer ou cocher les retraits.`,
    ].join("\n");
  }

  function th(label, align) {
    return `<th align="${align}" style="padding:10px 12px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;color:${CRUST_FG};border-bottom:1px solid ${CRUST};white-space:nowrap;">${escapeHtml(label)}</th>`;
  }

  function td(content, align, extra) {
    return `<td align="${align}" style="padding:11px 12px;font-family:${SANS};font-size:14px;color:${INK};border-bottom:1px solid ${LINE};${extra || ""}">${content}</td>`;
  }

  function emptyRow(cols, text) {
    return `<tr><td colspan="${cols}" align="left" style="padding:16px 12px;font-family:${SANS};font-size:14px;color:${MUTED};">${escapeHtml(text)}</td></tr>`;
  }

  function buildHtml(data) {
    const lineRows = data.lines.length
      ? data.lines
          .map(
            (line) => `<tr>
              ${td(escapeHtml(line.product), "left", "font-weight:600;")}
              ${td(escapeHtml(line.size), "left", `color:${MUTED};`)}
              ${td(escapeHtml(line.flavor), "left")}
              ${td(String(line.qty), "right", `font-family:${SERIF};font-size:20px;font-weight:700;color:${ACCENT};`)}
            </tr>`,
          )
          .join("")
      : emptyRow(4, "Aucune commande à préparer.");

    const counter = data.rows.length
      ? data.rows
          .map(
            (row) => `<tr>
              ${td(escapeHtml(row.name), "left", "font-weight:600;white-space:nowrap;")}
              ${td(escapeHtml(row.detail), "left")}
              ${td(escapeHtml(row.time), "left", `white-space:nowrap;`)}
              ${td(escapeHtml(row.amount), "right", `white-space:nowrap;font-family:${SERIF};`)}
            </tr>`,
          )
          .join("")
      : emptyRow(4, "Aucun retrait.");

    const countLabel = `${data.count} commande${data.count === 1 ? "" : "s"}`;

    return `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${PAPER};border:1px solid ${LINE};">
          <tr>
            <td align="center" style="padding:28px 28px 8px;background:${PAPER};">
              <img src="${escapeHtml(data.logoUrl)}" width="148" alt="${escapeHtml(data.shopName)}" style="display:block;width:148px;max-width:148px;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 28px 4px;font-family:${SERIF};font-size:28px;line-height:1.2;color:${INK};letter-spacing:-0.02em;">
              Feuille du labo
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 28px 22px;font-family:${SANS};font-size:15px;line-height:1.45;color:${MUTED};">
              ${escapeHtml(data.whenLabel)}<br>
              Envoi automatique · ${escapeHtml(data.hour)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SECONDARY};">
                <tr>
                  <td style="padding:12px 16px;font-family:${SERIF};font-size:18px;color:${INK};">À produire</td>
                  <td align="right" style="padding:12px 16px;font-family:${SANS};font-size:13px;color:${ACCENT};font-weight:600;">${escapeHtml(countLabel)}</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr style="background:${CRUST};">
                  ${th("Produit", "left")}
                  ${th("Taille", "left")}
                  ${th("Parfum", "left")}
                  ${th("Qté", "right")}
                </tr>
                ${lineRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 20px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SECONDARY};">
                <tr>
                  <td style="padding:12px 16px;font-family:${SERIF};font-size:18px;color:${INK};">Retraits au comptoir</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr style="background:${CRUST};">
                  ${th("Client", "left")}
                  ${th("Commande", "left")}
                  ${th("Heure", "left")}
                  ${th("Montant", "right")}
                </tr>
                ${counter}
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 28px 28px;font-family:${SANS};font-size:13px;line-height:1.5;color:${MUTED};">
              Ouvrez la feuille du labo pour imprimer ou cocher les retraits.<br>
              <a href="${escapeHtml(data.laboUrl)}" style="color:${ACCENT};text-decoration:none;font-weight:600;">Ouvrir le carnet</a>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-family:${SERIF};font-size:14px;color:${MUTED};letter-spacing:-0.02em;">Carnet.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  function wrapTextHtml(text) {
    return `<pre style="margin:0;padding:20px;font-family:${SANS};font-size:15px;line-height:1.5;color:${INK};white-space:pre-wrap;">${escapeHtml(text)}</pre>`;
  }

  function build(orders, meta) {
    const data = view(orders, meta);
    return {
      subject: `${data.whenLabel} — ${data.count} commande${data.count > 1 ? "s" : ""} à produire`,
      text: buildText(data),
      html: buildHtml(data),
    };
  }

  root.CARNET_RECAP_MAIL = { build, wrapTextHtml, escapeHtml };
})(typeof window !== "undefined" ? window : globalThis);
