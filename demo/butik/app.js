/* Rona Kasturi demo shop. Plain script, no build step. */
(function () {
  "use strict";

  // Demo safety: orders never go to a real number. The link below opens WhatsApp with the message
  // prefilled and NO recipient, so the tester picks a chat themselves. For a real shop, set
  // SHOP_WA to the owner's number (digits only, e.g. "60123456789").
  var SHOP_WA = "";
  var FREE_POS_FROM = 250;

  // ---------- Colours (rona) ----------
  var R = {
    krimGading: ["Krim Gading", "#ece2c9"],
    emasPudar: ["Emas Pudar", "#c3a25b"],
    biruMalam: ["Biru Malam", "#26304f"],
    biruLaut: ["Biru Laut Dalam", "#22395f"],
    hijauSerai: ["Hijau Serai", "#8fa66a"],
    merahBata: ["Merah Bata", "#9c4430"],
    merahHati: ["Merah Hati", "#a3182a"],
    hijauZamrud: ["Hijau Zamrud", "#1f5a4a"],
    fuchsia: ["Merah Jambu Bunga Raya", "#d8287a"],
    kuningKunyit: ["Kuning Kunyit", "#d9a426"],
    hijauKasturi: ["Hijau Kasturi", "#6d8b3c"],
    lilac: ["Ungu Keladi", "#c7b3cf"],
    merahJambuDebu: ["Merah Jambu Debu", "#d3a09c"],
    pucukPisang: ["Hijau Pucuk Pisang", "#b6c73a"],
    hitamArang: ["Hitam Arang", "#2a2826"],
    pudina: ["Hijau Pudina", "#9fbfae"],
    kelabuAsap: ["Kelabu Asap", "#8a8c90"],
    krimSantan: ["Krim Santan", "#eadfc8"],
    kunyitTua: ["Kunyit Tua", "#c98d2e"],
    coklatKopi: ["Coklat Kopi Susu", "#8a6a52"],
    pasir: ["Pasir Pantai", "#c9ab8e"],
    hijauLumut: ["Hijau Lumut", "#55603d"]
  };
  function rona(keys) { return keys.map(function (k) { return { key: k, name: R[k][0], hex: R[k][1] }; }); }

  var SZ = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  var SZ6 = ["XS", "S", "M", "L", "XL", "2XL"];

  // ---------- Catalogue (first colour is the one in the photo) ----------
  var PRODUCTS = [
    { id: "kurung-krim", cat: "kurung", name: "Kurung Moden Tenun Krim", price: 229, img: "kurung-krim",
      colours: rona(["krimGading", "emasPudar", "biruMalam"]), sizes: SZ,
      desc: "Tenunan jacquard bercorak bunga halus yang berkilau lembut di bawah lampu majlis. Baju labuh dengan kain lurus berbelah sisi.",
      spec: [["Kain", "Jacquard tenun, berlapik"], ["Labuh baju", "40 inci (saiz M)"], ["Jagaan", "Cucian kering disyorkan"]] },
    { id: "kurung-bunga", cat: "kurung", name: "Kurung Riau Bunga Kecil", price: 169, img: "kurung-bunga",
      colours: rona(["biruMalam", "hijauSerai", "merahBata"]), sizes: SZ,
      desc: "Cetakan bunga kecil di atas kapas yang sejuk dipakai sepanjang hari. Pilihan untuk pejabat dan kenduri.",
      spec: [["Kain", "Kapas Jepun bercetak"], ["Labuh baju", "39 inci (saiz M)"], ["Jagaan", "Basuh mesin, kitaran lembut"]] },
    { id: "kurung-merah", cat: "kurung", name: "Kurung Pahang Satin Merah", price: 189, img: "kurung-merah",
      colours: rona(["merahHati", "biruLaut", "hijauZamrud"]), sizes: SZ,
      desc: "Satin berkilat dengan jalur sulam di bahu dan leher. Merah hati yang kekal cantik dalam gambar raya.",
      spec: [["Kain", "Satin duchess"], ["Labuh baju", "40 inci (saiz M)"], ["Jagaan", "Seterika suhu rendah dari belakang"]] },
    { id: "kurung-fuchsia", cat: "kurung", name: "Kurung Kedah Bunga Raya", price: 159, img: "kurung-fuchsia",
      colours: rona(["fuchsia", "kuningKunyit", "hijauKasturi"]), sizes: SZ6,
      desc: "Baju pendek paras pinggul dengan kain kembang. Warna terang untuk majlis siang.",
      spec: [["Kain", "Krep Korea, tidak mudah berkedut"], ["Labuh baju", "30 inci (saiz M)"], ["Jagaan", "Basuh tangan"]] },
    { id: "kebaya-biru", cat: "kebaya", name: "Kebaya Renda Biru Malam", price: 279, img: "kebaya-biru",
      colours: rona(["biruMalam", "hitamArang", "merahHati"]), sizes: SZ6,
      desc: "Renda Perancis berlapik dengan tali pinggang emas dan kain songket. Sesuai untuk majlis malam.",
      spec: [["Kain", "Renda Perancis, lapik kapas"], ["Labuh baju", "28 inci (saiz M)"], ["Termasuk", "Tali pinggang dan kain sarung"]] },
    { id: "kebaya-lilac", cat: "kebaya", name: "Kebaya Renda Ungu Keladi", price: 249, img: "kebaya-lilac",
      colours: rona(["lilac", "krimGading", "merahJambuDebu"]), sizes: SZ,
      desc: "Renda lembut berbutang hadapan, lengan panjang dengan birai renda. Untuk nikah, tunang dan hari raya.",
      spec: [["Kain", "Renda bersulam dan lapik satin"], ["Labuh baju", "30 inci (saiz M)"], ["Jagaan", "Basuh tangan"]] },
    { id: "kebaya-nyonya", cat: "kebaya", name: "Kebaya Nyonya Sulam Kunyit", price: 299, img: "kebaya-nyonya",
      colours: rona(["kuningKunyit", "krimSantan", "pudina"]), sizes: SZ6,
      desc: "Kebaya pendek berhujung runcing dengan sulaman bunga di birai, disulam tangan di Melaka.",
      spec: [["Kain", "Voile kapas"], ["Labuh baju", "26 inci (saiz M)"], ["Nota", "Sulaman berbeza sedikit setiap helai"]] },
    { id: "kebaya-pucuk", cat: "kebaya", name: "Kebaya Labuh Pucuk Pisang", price: 199, img: "kebaya-pucuk",
      colours: rona(["pucukPisang", "hijauLumut", "kunyitTua"]), sizes: SZ,
      desc: "Kebaya labuh bersama kain batik sarung siap jahit. Hijau pucuk pisang yang ceria untuk pejabat.",
      spec: [["Kain", "Krep sutera"], ["Labuh baju", "38 inci (saiz M)"], ["Termasuk", "Kain batik sarung"]] },
    { id: "bawal-voile", cat: "tudung", name: "Tudung Bawal Cotton Voile", price: 35, img: "bawal-stack",
      colours: rona(["hijauLumut", "hitamArang", "krimSantan", "merahJambuDebu"]), sizes: ["45 inci", "50 inci"],
      desc: "Bawal bidang 45 atau 50 inci, jahitan tepi halus dan mudah dibentuk tanpa banyak pin.",
      spec: [["Kain", "Cotton voile"], ["Ukuran", "45 x 45 atau 50 x 50 inci"], ["Jagaan", "Basuh mesin dalam beg jaring"]] },
    { id: "shawl-pudina", cat: "tudung", name: "Shawl Chiffon Hijau Pudina", price: 39, img: "shawl-pudina",
      colours: rona(["pudina", "kelabuAsap", "krimSantan"]), sizes: ["Satu saiz"],
      desc: "Shawl panjang yang jatuh lembut dan tidak licin. Sesuai untuk gaya lilit ringkas.",
      spec: [["Kain", "Chiffon tebal"], ["Ukuran", "70 x 180 cm"], ["Jagaan", "Basuh tangan"]] },
    { id: "shawl-emas", cat: "tudung", name: "Shawl Satin Kunyit Tua", price: 55, img: "shawl-emas",
      colours: rona(["kunyitTua", "biruMalam", "krimGading"]), sizes: ["Satu saiz"],
      desc: "Satin silk berkilat lembut untuk majlis. Padankan dengan Kurung Moden Tenun Krim.",
      spec: [["Kain", "Satin silk"], ["Ukuran", "75 x 185 cm"], ["Jagaan", "Seterika suhu rendah dari belakang"]] },
    { id: "shawl-pasir", cat: "tudung", name: "Shawl Krep Pasir Pantai", price: 45, img: "shawl-pasir",
      colours: rona(["pasir", "coklatKopi", "hitamArang"]), sizes: ["Satu saiz"],
      desc: "Krep bertekstur yang mudah dibentuk dan tidak jarang. Rona neutral untuk dipakai setiap hari.",
      spec: [["Kain", "Krep moss"], ["Ukuran", "70 x 180 cm"], ["Jagaan", "Basuh mesin, kitaran lembut"]] }
  ];
  var TAGS = {
    raya: ["kurung-krim", "kurung-merah", "kebaya-biru", "kebaya-nyonya", "kebaya-lilac", "shawl-emas"],
    baru: ["kurung-fuchsia", "kebaya-pucuk", "shawl-pudina", "shawl-pasir", "kurung-bunga"]
  };
  var CAT_TITLE = { semua: "Semua", raya: "Koleksi Raya", baru: "Baru tiba", kurung: "Baju kurung", kebaya: "Kebaya", tudung: "Tudung" };
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  function inCat(p, cat) { return cat === "semua" || p.cat === cat || (TAGS[cat] && TAGS[cat].indexOf(p.id) > -1); }
  function imgSrc(p) { return "img/" + p.img + ".jpg"; }

  // Seed stock per product and size. A few low and sold out sizes so the owner view has something to flag.
  var STOCK_SEED = {
    "kurung-krim": { XS: 3, S: 5, M: 6, L: 4, XL: 3, "2XL": 2, "3XL": 1 },
    "kurung-bunga": { XS: 4, S: 7, M: 9, L: 7, XL: 5, "2XL": 4, "3XL": 3 },
    "kurung-merah": { XS: 3, S: 5, M: 6, L: 6, XL: 4, "2XL": 3, "3XL": 0 },
    "kurung-fuchsia": { XS: 3, S: 4, M: 5, L: 4, XL: 3, "2XL": 3 },
    "kebaya-biru": { XS: 2, S: 3, M: 1, L: 0, XL: 3, "2XL": 3 },
    "kebaya-lilac": { XS: 3, S: 4, M: 5, L: 4, XL: 3, "2XL": 3, "3XL": 2 },
    "kebaya-nyonya": { XS: 1, S: 2, M: 2, L: 1, XL: 0, "2XL": 0 },
    "kebaya-pucuk": { XS: 3, S: 5, M: 6, L: 5, XL: 4, "2XL": 3, "3XL": 3 },
    "bawal-voile": { "45 inci": 24, "50 inci": 14 },
    "shawl-pudina": { "Satu saiz": 31 },
    "shawl-emas": { "Satu saiz": 3 },
    "shawl-pasir": { "Satu saiz": 18 }
  };

  // Seed orders: sample data for the owner view, dated relative to today.
  function daysAgo(d, h, m) { var t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, m, 0, 0); return t.toISOString(); }
  var SEED_ORDERS = [
    { at: daysAgo(0, 9, 42), name: "Nur Aisyah", phone: "012 xxx 4471", area: "Shah Alam", pos: "semenanjung",
      items: [{ id: "kurung-krim", c: "Krim Gading", s: "M", q: 1 }, { id: "shawl-emas", c: "Kunyit Tua", s: "Satu saiz", q: 1 }], status: "Baru" },
    { at: daysAgo(0, 8, 15), name: "Siti Hajar", phone: "019 xxx 2208", area: "Kuantan", pos: "semenanjung",
      items: [{ id: "kebaya-lilac", c: "Ungu Keladi", s: "S", q: 1 }], status: "Baru" },
    { at: daysAgo(1, 21, 3), name: "Farah Nadia", phone: "013 xxx 9150", area: "Kuching", pos: "sabahsarawak",
      items: [{ id: "kurung-bunga", c: "Biru Malam", s: "L", q: 1 }, { id: "shawl-pudina", c: "Hijau Pudina", s: "Satu saiz", q: 1 }], status: "Dibayar" },
    { at: daysAgo(1, 14, 27), name: "Amira Zulaikha", phone: "011 xxx 6632", area: "Ipoh", pos: "semenanjung",
      items: [{ id: "kebaya-biru", c: "Biru Malam", s: "M", q: 1 }], status: "Dipos" },
    { at: daysAgo(2, 11, 50), name: "Hidayah Rahman", phone: "017 xxx 0384", area: "Shah Alam", pos: "ambil",
      items: [{ id: "bawal-voile", c: "Hitam Arang", s: "45 inci", q: 3 }], status: "Dipos" },
    { at: daysAgo(3, 16, 8), name: "Liyana Ismail", phone: "016 xxx 7719", area: "Johor Bahru", pos: "semenanjung",
      items: [{ id: "kebaya-nyonya", c: "Kuning Kunyit", s: "S", q: 1 }, { id: "kurung-merah", c: "Merah Hati", s: "XL", q: 2 }], status: "Dipos" }
  ];
  // Sample orders use the same number format as new ones (RK + month + day + sequence).
  SEED_ORDERS.forEach(function (o, i) {
    var d = new Date(o.at);
    o.id = "RK" + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + String(i + 1).padStart(2, "0"); // taste-skill-ignore
  });

  var POS = {
    semenanjung: { label: "Pos Semenanjung", fee: 8 },
    sabahsarawak: { label: "Pos Sabah dan Sarawak", fee: 15 },
    ambil: { label: "Ambil sendiri di Shah Alam", fee: 0 }
  };
  function posFee(kind, subtotal) {
    if (kind === "semenanjung" && subtotal >= FREE_POS_FROM) return 0;
    return POS[kind].fee;
  }

  // ---------- Storage (safe) ----------
  function load(k, fallback) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage off: keep in memory */ } }

  var stock = load("rk2_stock", null) || JSON.parse(JSON.stringify(STOCK_SEED));
  var cart = load("rk2_cart", []).filter(function (l) { return byId[l.id]; });
  var myOrders = load("rk2_orders", []);
  var statusOverride = load("rk2_status", {});

  function stockOf(id, size) { return (stock[id] && stock[id][size]) || 0; }
  function totalStock(id) { var s = stock[id] || {}; return Object.keys(s).reduce(function (a, k) { return a + s[k]; }, 0); }
  function inCart(id, size) { return cart.filter(function (l) { return l.id === id && l.size === size; }).reduce(function (a, l) { return a + l.qty; }, 0); }

  // ---------- Helpers ----------
  function rm(n) { return "RM" + (n % 1 ? n.toFixed(2) : n); }
  function rm2(n) { return "RM" + n.toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"'); }
  function openDlg(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); document.body.classList.add("locked"); }
  function closeDlg(d) { if (d.open) { if (d.close) d.close(); else d.removeAttribute("open"); } }

  // ---------- Toast ----------
  var toastEl = $("[data-toast]"), toastTimer = null;
  function toast(msg, withCart) {
    toastEl.innerHTML = "<span>" + esc(msg) + "</span>" + (withCart ? '<button type="button" data-open-cart>Lihat troli</button>' : "");
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }

  // ---------- Catalogue grid ----------
  var grid = $("[data-grid]");
  var currentCat = "semua";

  function stockFlag(p) {
    var t = totalStock(p.id);
    if (t === 0) return "Habis dijual";
    if (t <= 8) return "Tinggal sedikit";
    return "";
  }

  function renderGrid() {
    var list = PRODUCTS.filter(function (p) { return inCat(p, currentCat); });
    grid.innerHTML = list.map(function (p, i) {
      var flag = stockFlag(p);
      return '<li class="card enter" style="animation-delay:' + i * 50 + 'ms" data-id="' + p.id + '">' +
        '<button class="card-pic" type="button" data-open="' + p.id + '" aria-label="Pilih rona dan saiz untuk ' + esc(p.name) + '">' +
        '<img src="' + imgSrc(p) + '" width="800" height="1000" loading="lazy" alt="' + esc(p.name) + ", rona " + esc(p.colours[0].name) + '">' +
        (flag ? '<span class="card-flag">' + flag + "</span>" : "") +
        '<span class="card-add" aria-hidden="true">+</span></button>' +
        '<div class="card-txt"><h3 class="card-name"><button type="button" data-open="' + p.id + '">' + esc(p.name) + "</button></h3>" +
        '<div class="card-meta"><span class="card-price">' + rm(p.price) + "</span>" +
        '<span class="dots" aria-label="' + p.colours.length + ' rona">' + p.colours.map(function (c) {
          return '<span class="dot" title="' + esc(c.name) + '"><span style="background:' + c.hex + '"></span></span>';
        }).join("") + "</span></div></div></li>";
    }).join("");
  }

  function setCat(cat) {
    currentCat = cat;
    $all(".tabs [data-cat]").forEach(function (o) { o.setAttribute("aria-selected", String(o.dataset.cat === cat)); });
    var t = $("[data-koleksi-title]"); if (t) t.textContent = CAT_TITLE[cat] || "Semua";
    renderGrid();
  }

  grid.addEventListener("click", function (e) {
    var open = e.target.closest("[data-open]");
    if (open) openProduct(open.dataset.open, open);
  });
  $all(".tabs [data-cat]").forEach(function (b) { b.addEventListener("click", function () { setCat(b.dataset.cat); }); });
  var bar = $("[data-bar]");
  var menuDlg = $("[data-menu]");
  $all("[data-filter]").forEach(function (a) { a.addEventListener("click", function () { setCat(a.dataset.filter); closeDlg(menuDlg); }); });

  // ---------- Header, menu ----------
  function onScroll() { bar.classList.toggle("solid", window.scrollY > window.innerHeight * 0.6); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  $("[data-open-menu]").addEventListener("click", function () { openDlg(menuDlg); });
  $("[data-close-menu]").addEventListener("click", function () { closeDlg(menuDlg); });
  menuDlg.addEventListener("click", function (e) { if (e.target === menuDlg || e.target.closest(".menu-nav a")) closeDlg(menuDlg); });
  menuDlg.addEventListener("close", function () { document.body.classList.remove("locked"); });

  // ---------- Product sheet ----------
  var sheet = $("[data-pv]");
  var sel = null, lastOpener = null;

  function openProduct(id, opener) {
    var p = byId[id];
    lastOpener = opener || null;
    var firstSize = p.sizes.filter(function (s) { return stockOf(id, s) - inCart(id, s) > 0; })[0] || null;
    sel = { id: id, ci: 0, size: p.sizes.length === 1 ? firstSize : null, qty: 1 };
    renderSheet("");
    openDlg(sheet);
    var t = $(".sheet-title", sheet); if (t) t.focus({ preventScroll: true });
  }
  function closeProduct() { closeDlg(sheet); }
  sheet.addEventListener("close", function () {
    if (!cartDlg.open) document.body.classList.remove("locked");
    if (lastOpener && document.body.contains(lastOpener)) lastOpener.focus({ preventScroll: true });
  });
  sheet.addEventListener("click", function (e) { if (e.target === sheet) closeProduct(); });

  function sizeTableHTML() {
    var t = $("[data-size-table]").cloneNode(true);
    t.removeAttribute("data-size-table"); t.removeAttribute("style");
    t.classList.remove("reveal", "in");
    return t.outerHTML;
  }

  function renderSheet(msg, kind) {
    var p = byId[sel.id], c = p.colours[sel.ci];
    var left = sel.size ? stockOf(p.id, sel.size) - inCart(p.id, sel.size) : null;
    var canBuy = !!sel.size && left > 0;
    var keepScroll = $(".sheet-scroll", sheet) ? $(".sheet-scroll", sheet).scrollTop : 0;
    var keepBody = $(".sheet-body", sheet) ? $(".sheet-body", sheet).scrollTop : 0;
    var guideOpen = $(".size-guide", sheet) ? $(".size-guide", sheet).open : false;
    sheet.innerHTML =
      '<div class="sheet-scroll"><span class="sheet-grab" aria-hidden="true"></span>' +
      '<div class="sheet-pic"><img src="' + imgSrc(p) + '" width="800" height="1000" alt="' + esc(p.name) + ", rona " + esc(p.colours[0].name) + '">' +
      '<button type="button" class="sheet-close" data-close-sheet aria-label="Tutup">&times;</button>' +
      '<span class="sheet-note">Dalam gambar: ' + esc(p.colours[0].name) + "</span></div>" +
      '<div class="sheet-body">' +
      '<div><h2 class="sheet-title" id="pv-title" tabindex="-1">' + esc(p.name) + '</h2><p class="sheet-price">' + rm(p.price) + "</p></div>" +
      '<div><p class="opt-label"><span>Rona: <b>' + esc(c.name) + "</b></span></p>" +
      '<div class="chips" role="group" aria-label="Pilih rona">' + p.colours.map(function (o, j) {
        return '<button type="button" class="chip chip-colour" data-ci="' + j + '" aria-pressed="' + (j === sel.ci) + '" aria-label="' + esc(o.name) + '" title="' + esc(o.name) + '"><i style="background:' + o.hex + '"></i></button>';
      }).join("") + "</div></div>" +
      '<div><p class="opt-label"><span>Saiz' + (sel.size ? ": <b>" + esc(sel.size) + "</b>" : "") + "</span></p>" +
      '<div class="chips" role="group" aria-label="Pilih saiz">' + p.sizes.map(function (s) {
        var n = stockOf(p.id, s) - inCart(p.id, s);
        return '<button type="button" class="chip" data-size="' + esc(s) + '" aria-pressed="' + (s === sel.size) + '"' + (n <= 0 ? " disabled" : "") + ">" + esc(s) +
          (n > 0 && n <= 2 ? " <small>tinggal " + n + "</small>" : "") + "</button>";
      }).join("") + "</div>" +
      (p.cat !== "tudung" ? '<details class="size-guide"' + (guideOpen ? " open" : "") + '><summary>Panduan saiz</summary>' + sizeTableHTML() + "</details>" : "") +
      "</div>" +
      '<p class="sheet-desc">' + esc(p.desc) + "</p>" +
      '<dl class="spec">' + p.spec.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
      '<p class="sheet-msg ' + (kind || "") + '" role="status">' + (msg || "") + "</p>" +
      "</div></div>" +
      '<div class="sheet-buy"><div class="stepper" role="group" aria-label="Kuantiti">' +
      '<button type="button" data-q="-1" aria-label="Kurang satu">&minus;</button><output aria-live="polite">' + sel.qty + "</output>" +
      '<button type="button" data-q="1" aria-label="Tambah satu">+</button></div>' +
      '<button type="button" class="btn btn-solid" data-add' + (canBuy ? "" : " disabled") + ">" +
      (sel.size ? (left > 0 ? "Tambah &middot; " + rm(p.price * sel.qty) : "Saiz ini habis") : "Pilih saiz dahulu") + "</button></div>";
    if ($(".sheet-scroll", sheet)) $(".sheet-scroll", sheet).scrollTop = keepScroll;
    if ($(".sheet-body", sheet)) $(".sheet-body", sheet).scrollTop = keepBody;
  }

  sheet.addEventListener("click", function (e) {
    if (!sel) return;
    var p = byId[sel.id];
    if (e.target.closest("[data-close-sheet]")) { closeProduct(); return; }
    var ci = e.target.closest("[data-ci]");
    if (ci) { sel.ci = +ci.dataset.ci; renderSheet(); $('[data-ci="' + sel.ci + '"]', sheet).focus(); return; }
    var sz = e.target.closest("[data-size]");
    if (sz) { sel.size = sz.dataset.size; sel.qty = 1; renderSheet(); $('[data-size="' + cssEsc(sel.size) + '"]', sheet).focus(); return; }
    var q = e.target.closest("[data-q]");
    if (q) {
      var max = sel.size ? stockOf(p.id, sel.size) - inCart(p.id, sel.size) : 9;
      var nq = Math.max(1, Math.min(Math.max(1, max), sel.qty + +q.dataset.q));
      var capped = nq === sel.qty && +q.dataset.q > 0;
      sel.qty = nq; renderSheet(capped ? "Stok saiz ini tinggal " + max + " helai." : "", capped ? "err" : "");
      $('[data-q="' + q.dataset.q + '"]', sheet).focus(); return;
    }
    if (e.target.closest("[data-add]")) {
      addToCart(p, p.colours[sel.ci].name, sel.size, sel.qty);
      closeProduct();
      toast("Dimasukkan ke troli", true);
    }
  });

  // ---------- Cart ----------
  var cartDlg = $("[data-cart]");
  var cartBody = $("[data-cart-body]");
  var form = { name: "", phone: "", address: "", note: "", pos: "semenanjung" };
  var lastWaUrl = "";
  var justPlaced = null;

  function addToCart(p, colour, size, qty) {
    var line = cart.filter(function (l) { return l.id === p.id && l.colour === colour && l.size === size; })[0];
    if (line) line.qty += qty; else cart.push({ id: p.id, colour: colour, size: size, qty: qty });
    save("rk2_cart", cart);
    updateCount(true);
  }
  function updateCount(bump) {
    var n = cart.reduce(function (a, l) { return a + l.qty; }, 0);
    $all("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.classList.toggle("has", n > 0);
      if (n > 0) el.removeAttribute("data-zero"); else el.setAttribute("data-zero", "");
      if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    });
  }
  function subtotal() { return cart.reduce(function (a, l) { return a + byId[l.id].price * l.qty; }, 0); }

  function openCart() {
    justPlaced = null;
    toastEl.classList.remove("show");
    closeProduct();
    renderCart();
    openDlg(cartDlg);
  }
  function closeCart() { closeDlg(cartDlg); }
  cartDlg.addEventListener("close", function () { justPlaced = null; document.body.classList.remove("locked"); });
  cartDlg.addEventListener("click", function (e) { if (e.target === cartDlg) closeCart(); });

  function freeBar(sub) {
    if (form.pos !== "semenanjung") return "";
    var left = FREE_POS_FROM - sub;
    var pct = Math.min(100, Math.round(sub / FREE_POS_FROM * 100));
    return '<div class="freebar">' + (left > 0 ? "Tambah " + rm(left) + " lagi untuk pos percuma Semenanjung." : "Anda layak pos percuma Semenanjung.") +
      '<div class="freebar-track"><i style="width:' + pct + '%"></i></div></div>';
  }

  function renderCart(errors) {
    errors = errors || {};
    if (justPlaced) { renderDone(); return; }
    if (!cart.length) {
      cartBody.innerHTML = '<div class="empty"><p>Troli anda masih kosong.</p><button type="button" class="btn btn-solid" data-close-cart data-goto="#koleksi">Lihat koleksi</button></div>';
      setFoot("");
      return;
    }
    var sub = subtotal(), fee = posFee(form.pos, sub);
    cartBody.innerHTML =
      '<div class="steps" aria-hidden="true"><span class="on">Troli</span><span class="on">Butiran</span><span>WhatsApp</span></div>' +
      freeBar(sub) +
      '<ul class="lines">' + cart.map(function (l, i) {
        var p = byId[l.id];
        return '<li class="line"><img src="' + imgSrc(p) + '" width="84" height="105" alt="" loading="lazy"><div>' +
          '<p class="line-name">' + esc(p.name) + "</p>" +
          '<p class="line-opts">' + esc(l.colour) + ", saiz " + esc(l.size) + "</p>" +
          '<div class="line-row"><div class="stepper" role="group" aria-label="Kuantiti ' + esc(p.name) + '">' +
          '<button type="button" data-lq="-1" data-l="' + i + '" aria-label="Kurang satu">&minus;</button><output>' + l.qty + "</output>" +
          '<button type="button" data-lq="1" data-l="' + i + '" aria-label="Tambah satu">+</button></div>' +
          "<b>" + rm(p.price * l.qty) + "</b></div>" +
          '<button type="button" class="rm" data-rm="' + i + '">Buang</button></div></li>';
      }).join("") + "</ul>" +
      '<form class="form" novalidate data-form id="order-form">' +
      '<fieldset><legend>Penghantaran</legend>' + Object.keys(POS).map(function (k) {
        var f = posFee(k, sub);
        return '<label class="radio"><input type="radio" name="pos" value="' + k + '"' + (form.pos === k ? " checked" : "") + "><span>" + POS[k].label + "</span><span>" + (f ? rm(f) : "Percuma") + "</span></label>";
      }).join("") + "</fieldset>" +
      '<div><label for="f-name">Nama penuh</label><input id="f-name" name="name" type="text" autocomplete="name" value="' + esc(form.name) + '" aria-describedby="e-name"><p class="field-err" id="e-name">' + (errors.name || "") + "</p></div>" +
      '<div><label for="f-phone">No. telefon</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(form.phone) + '" aria-describedby="e-phone"><p class="field-err" id="e-phone">' + (errors.phone || "") + "</p></div>" +
      (form.pos !== "ambil" ? '<div><label for="f-address">Alamat penghantaran, termasuk poskod</label><textarea id="f-address" name="address" autocomplete="street-address" aria-describedby="e-address">' + esc(form.address) + '</textarea><p class="field-err" id="e-address">' + (errors.address || "") + "</p></div>" : "") +
      '<div><label for="f-note">Catatan (tidak wajib)</label><input id="f-note" name="note" type="text" value="' + esc(form.note) + '" placeholder="Contoh: hadiah, tolong balut"></div>' +
      '<dl class="sum"><dt>Jumlah barang</dt><dd>' + rm2(sub) + "</dd><dt>" + POS[form.pos].label + "</dt><dd>" + (fee ? rm2(fee) : "Percuma") + '</dd><dt class="total">Jumlah perlu dibayar</dt><dd class="total">' + rm2(sub + fee) + "</dd></dl>" +
      '<p class="fine">Laman demo: tiada mesej dihantar kepada sesiapa. Anda akan nampak mesej WhatsApp yang akan diterima kedai, dan pesanan disimpan dalam pelayar ini untuk paparan pemilik.</p>' +
      "</form>";
    setFoot('<button type="submit" form="order-form" class="btn btn-accent btn-block">Sediakan pesanan &middot; ' + rm2(sub + fee) + "</button>");
  }
  function setFoot(html) {
    var f = $(".cart-foot", cartDlg);
    if (!f) { f = document.createElement("div"); f.className = "cart-foot"; cartDlg.appendChild(f); }
    f.innerHTML = html;
    f.hidden = !html;
  }

  function readForm() {
    var f = $("[data-form]", cartBody);
    if (!f) return;
    ["name", "phone", "address", "note"].forEach(function (k) { if (f.elements[k]) form[k] = f.elements[k].value; });
    var r = f.querySelector('input[name="pos"]:checked');
    if (r) form.pos = r.value;
    save("rk2_form", { name: form.name, phone: form.phone, address: form.address, pos: form.pos });
  }

  cartBody.addEventListener("input", function () { readForm(); });
  cartBody.addEventListener("change", function (e) {
    if (e.target.name === "pos") { readForm(); renderCart(); var r = $('input[name="pos"]:checked', cartBody); if (r) r.focus(); }
  });
  cartBody.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lq]");
    if (b) {
      readForm();
      var l = cart[+b.dataset.l], d = +b.dataset.lq;
      var max = stockOf(l.id, l.size) - inCart(l.id, l.size) + l.qty;
      l.qty = Math.max(1, Math.min(max, l.qty + d));
      save("rk2_cart", cart); updateCount(); renderCart();
      var again = $('[data-lq="' + d + '"][data-l="' + b.dataset.l + '"]', cartBody); if (again) again.focus();
      return;
    }
    var r = e.target.closest("[data-rm]");
    if (r) { readForm(); cart.splice(+r.dataset.rm, 1); save("rk2_cart", cart); updateCount(); renderCart(); return; }
    var g = e.target.closest("[data-goto]");
    if (g) { closeCart(); setCat("semua"); location.hash = g.dataset.goto; }
  });
  cartDlg.addEventListener("submit", function (e) {
    e.preventDefault();
    readForm();
    var errs = {};
    if (form.name.trim().length < 2) errs.name = "Sila isi nama penuh.";
    if (form.phone.replace(/\D/g, "").length < 9) errs.phone = "Sila isi nombor telefon, contohnya 012 345 6789.";
    if (form.pos !== "ambil" && form.address.trim().length < 10) errs.address = "Sila isi alamat lengkap dengan poskod.";
    if (Object.keys(errs).length) {
      renderCart(errs);
      var first = $("#f-" + Object.keys(errs)[0], cartBody); if (first) first.focus();
      return;
    }
    placeOrder();
  });

  function nextOrderId() {
    var d = new Date();
    var n = myOrders.length + 7;
    return "RK" + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + String(n).padStart(2, "0"); // taste-skill-ignore
  }

  function waMessage(o) {
    var sub = o.items.reduce(function (a, it) { return a + byId[it.id].price * it.q; }, 0);
    var fee = posFee(o.pos, sub);
    var lines = [];
    lines.push("Assalamualaikum Rona Kasturi, saya nak buat pesanan.");
    lines.push("");
    lines.push("*Pesanan " + o.id + "*");
    o.items.forEach(function (it, i) {
      var p = byId[it.id];
      lines.push((i + 1) + ". " + p.name);
      lines.push("   Rona: " + it.c + " | Saiz: " + it.s + " | Kuantiti: " + it.q);
      lines.push("   " + rm2(p.price * it.q));
    });
    lines.push("");
    lines.push("Jumlah barang: " + rm2(sub));
    lines.push(POS[o.pos].label + ": " + (fee ? rm2(fee) : "Percuma"));
    lines.push("*Jumlah perlu dibayar: " + rm2(sub + fee) + "*");
    lines.push("");
    lines.push("Nama: " + o.name);
    lines.push("Telefon: " + o.phone);
    if (o.pos !== "ambil") lines.push("Alamat: " + o.address.replace(/\s*,?\s*\n\s*/g, ", "));
    if (o.note) lines.push("Catatan: " + o.note);
    lines.push("");
    lines.push("Terima kasih!");
    return lines.join("\n");
  }

  function placeOrder() {
    var o = {
      id: nextOrderId(), at: new Date().toISOString(),
      name: form.name.trim(), phone: form.phone.trim(), address: form.pos === "ambil" ? "" : form.address.trim(),
      note: form.note.trim(), pos: form.pos, area: form.pos === "ambil" ? "Ambil sendiri" : guessArea(form.address),
      items: cart.map(function (l) { return { id: l.id, c: l.colour, s: l.size, q: l.qty }; }),
      status: "Baru", mine: true
    };
    var msg = waMessage(o);
    lastWaUrl = "https://wa.me/" + SHOP_WA + "?text=" + encodeURIComponent(msg);
    o.items.forEach(function (it) { if (stock[it.id] && it.s in stock[it.id]) stock[it.id][it.s] = Math.max(0, stock[it.id][it.s] - it.q); });
    myOrders.push(o);
    save("rk2_orders", myOrders); save("rk2_stock", stock);
    cart = []; save("rk2_cart", cart); updateCount();
    form.note = "";
    justPlaced = { order: o, msg: msg };
    renderCart();
    renderGrid();
    cartBody.scrollTop = 0;
  }

  function guessArea(addr) {
    var parts = String(addr).split(/[,\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  }

  function renderDone() {
    var o = justPlaced.order;
    var t = new Date(o.at).toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit" });
    cartBody.innerHTML = '<div class="steps" aria-hidden="true"><span class="on">Troli</span><span class="on">Butiran</span><span class="on">WhatsApp</span></div>' +
      '<div class="done" data-done>' +
      "<h3>Pesanan " + esc(o.id) + " sudah siap</h3>" +
      "<p>Di kedai sebenar, mesej ini terus dibuka di WhatsApp kedai. Dalam demo, ini mesej yang kedai akan terima. Tiada apa dihantar.</p>" +
      '<div class="chat"><p class="chat-head">Rona Kasturi (demo)</p><p class="bubble" data-wa-text>' + esc(justPlaced.msg).replace(/\*([^*\n]+)\*/g, "<b>$1</b>") + "<time>" + esc(t) + "</time></p></div>" +
      '<p class="fine">Butang di bawah membuka WhatsApp dengan mesej siap ditulis tetapi tanpa penerima, jadi anda pilih sendiri (contohnya chat dengan diri sendiri). Pesanan ini kini muncul dalam <a href="#owner" data-close-cart>paparan pemilik</a> dan stok sudah ditolak.</p>' +
      "</div>";
    setFoot('<a class="btn btn-accent btn-block" data-wa-link href="' + esc(lastWaUrl) + '" target="_blank" rel="noopener">Cuba di WhatsApp anda</a>' +
      '<button type="button" class="btn btn-block link" style="min-height:44px" data-close-cart>Teruskan membeli</button>');
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-open-cart]")) { e.preventDefault(); openCart(); return; }
    var c = e.target.closest("[data-close-cart]");
    if (c) { if (c.getAttribute("href") !== "#owner") e.preventDefault(); closeCart(); }
  });

  var savedForm = load("rk2_form", null);
  if (savedForm) { form.name = savedForm.name || ""; form.phone = savedForm.phone || ""; form.address = savedForm.address || ""; form.pos = savedForm.pos || "semenanjung"; }

  // ---------- Owner view ----------
  var ownerEl = $("[data-owner]");
  var ownerTab = "pesanan";

  function allOrders() {
    var list = SEED_ORDERS.concat(myOrders).map(function (o) {
      var x = Object.assign({}, o);
      if (statusOverride[o.id]) x.status = statusOverride[o.id];
      return x;
    });
    return list.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }
  function orderTotal(o) {
    var sub = o.items.reduce(function (a, it) { return a + (byId[it.id] ? byId[it.id].price : 0) * it.q; }, 0);
    return sub + posFee(o.pos, sub);
  }
  function fmtDate(iso) {
    var d = new Date(iso), now = new Date();
    var hm = d.toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit" });
    var dd = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
    if (dd === 0) return "Hari ini, " + hm;
    if (dd === 1) return "Semalam, " + hm;
    return d.toLocaleDateString("ms-MY", { day: "numeric", month: "short" }) + ", " + hm;
  }
  function lowList() {
    var out = [];
    PRODUCTS.forEach(function (p) { p.sizes.forEach(function (s) { var n = stockOf(p.id, s); if (n <= 2) out.push({ p: p, s: s, n: n }); }); });
    return out;
  }
  function waNum(phone) { var d = String(phone).replace(/\D/g, ""); if (d.charAt(0) === "0") d = "6" + d; return d; }

  function renderOwner() {
    var orders = allOrders().filter(function (o) { return o.items.every(function (it) { return byId[it.id]; }); });
    var baru = orders.filter(function (o) { return o.status === "Baru"; }).length;
    var belumPos = orders.filter(function (o) { return o.status !== "Dipos"; }).length;
    var week = orders.filter(function (o) { return Date.now() - new Date(o.at) < 7 * 864e5; }).reduce(function (a, o) { return a + orderTotal(o); }, 0);
    var lows = lowList();
    var outCount = lows.filter(function (l) { return l.n === 0; }).length;

    var html = '<div class="o-head"><a class="wordmark" href="#top">Rona Kasturi</a><h1>Paparan pemilik</h1>' +
      '<a class="btn btn-solid" href="#top">Kembali ke kedai</a></div>' +
      '<p class="o-note">Contoh skrin untuk pemilik kedai. Enam pesanan pertama ialah data contoh. Pesanan yang anda sediakan dari troli di pelayar ini turut muncul di sini, berlatar jingga, dan stok ditolak secara automatik.</p>' +
      '<div class="o-stats">' +
      '<div class="o-stat' + (baru ? " alert" : "") + '"><b>' + baru + "</b><span>Pesanan baru perlu disahkan</span></div>" +
      '<div class="o-stat"><b>' + belumPos + "</b><span>Belum dipos</span></div>" +
      '<div class="o-stat"><b>' + rm(week) + "</b><span>Jualan 7 hari (data contoh)</span></div>" +
      '<div class="o-stat' + (lows.length ? " alert" : "") + '"><b>' + lows.length + "</b><span>Saiz stok rendah, " + outCount + " habis</span></div></div>" +
      '<div class="tabs o-tabs" role="tablist" aria-label="Bahagian">' +
      '<button role="tab" data-otab="pesanan" aria-selected="' + (ownerTab === "pesanan") + '">Pesanan (' + orders.length + ")</button>" +
      '<button role="tab" data-otab="stok" aria-selected="' + (ownerTab === "stok") + '">Stok</button></div>';

    if (ownerTab === "pesanan") {
      html += '<table class="o-table"><caption class="sr">Senarai pesanan</caption><thead><tr><th scope="col">Pesanan</th><th scope="col">Pelanggan</th><th scope="col">Barang</th><th scope="col" class="num">Jumlah</th><th scope="col">Status</th></tr></thead><tbody>' +
        orders.map(function (o) {
          return '<tr class="' + (o.mine ? "mine" : "") + '">' +
            '<td data-l="Pesanan"><b>' + esc(o.id) + '</b><span class="o-sub">' + fmtDate(o.at) + "</span></td>" +
            '<td data-l="Pelanggan">' + esc(o.name) + '<span class="o-sub">' + esc(o.phone) + (o.area ? ", " + esc(o.area) : "") + "</span>" +
            (o.mine ? '<a class="o-wa" href="https://wa.me/' + waNum(o.phone) + "?text=" + encodeURIComponent("Salam " + o.name + ", terima kasih. Pesanan " + o.id + " sudah kami terima. Jumlah " + rm2(orderTotal(o)) + ". Butiran bayaran: DuitNow ke nombor kedai.") + '" target="_blank" rel="noopener">Balas di WhatsApp</a>' : "") + "</td>" +
            '<td data-l="Barang"><div class="o-items">' + o.items.map(function (it) {
              var p = byId[it.id];
              return '<span class="o-item"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><span>' + it.q + " x " + esc(p.name) + "<small>" + esc(it.c) + ", " + esc(it.s) + "</small></span></span>";
            }).join("") + "<small>" + esc(POS[o.pos].label) + "</small></div></td>" +
            '<td data-l="Jumlah" class="num">' + rm2(orderTotal(o)) + "</td>" +
            '<td data-l="Status"><select class="o-status" data-oid="' + esc(o.id) + '" data-s="' + o.status + '" aria-label="Status ' + esc(o.id) + '">' +
            ["Baru", "Dibayar", "Dipos"].map(function (s) { return "<option" + (s === o.status ? " selected" : "") + ">" + s + "</option>"; }).join("") +
            "</select></td></tr>";
        }).join("") + "</tbody></table>";
    } else {
      html += '<table class="o-table"><caption class="sr">Stok mengikut produk dan saiz</caption><thead><tr><th scope="col">Produk</th><th scope="col">Stok mengikut saiz</th><th scope="col" class="num">Jumlah</th></tr></thead><tbody>' +
        PRODUCTS.map(function (p) {
          var t = totalStock(p.id);
          var lowN = p.sizes.filter(function (s) { var n = stockOf(p.id, s); return n > 0 && n <= 2; }).length;
          var outN = p.sizes.filter(function (s) { return stockOf(p.id, s) === 0; }).length;
          return "<tr>" +
            '<td data-l="Produk"><div class="o-prod"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><div>' + esc(p.name) + '<span class="o-sub">' + rm(p.price) + ", " + ({ kurung: "Baju kurung", kebaya: "Kebaya", tudung: "Tudung" })[p.cat] + "</span>" +
            (outN ? '<span class="flag out">' + outN + " saiz habis</span>" : "") + (lowN ? '<span class="flag low">' + lowN + " saiz stok rendah</span>" : "") + "</div></div></td>" +
            '<td data-l="Stok mengikut saiz"><div class="o-sizes">' + p.sizes.map(function (s) {
              var n = stockOf(p.id, s);
              return '<span class="o-size' + (n === 0 ? " out" : n <= 2 ? " low" : "") + '"><button type="button" data-st="' + p.id + '" data-sz="' + esc(s) + '" data-d="-1" aria-label="Kurangkan stok ' + esc(p.name) + " saiz " + esc(s) + '">&minus;</button>' +
                "<span>" + esc(s) + " <b>" + n + "</b></span>" +
                '<button type="button" data-st="' + p.id + '" data-sz="' + esc(s) + '" data-d="1" aria-label="Tambah stok ' + esc(p.name) + " saiz " + esc(s) + '">+</button></span>';
            }).join("") + "</div></td>" +
            '<td data-l="Jumlah" class="num">' + t + "</td></tr>";
        }).join("") + "</tbody></table>";
    }
    html += '<div class="o-foot"><p>Stok rendah bermaksud 2 helai atau kurang bagi satu saiz.</p><button type="button" data-reset>Set semula data demo</button>' +
      '<p>Demo oleh <a href="https://irfanhakimi.com/kerja/">Irfan Hakimi</a></p></div>';
    ownerEl.innerHTML = html;
  }

  ownerEl.addEventListener("click", function (e) {
    var t = e.target.closest("[data-otab]");
    if (t) { ownerTab = t.dataset.otab; renderOwner(); $('[data-otab="' + ownerTab + '"]', ownerEl).focus(); return; }
    var st = e.target.closest("[data-st]");
    if (st) {
      var id = st.dataset.st, sz = st.dataset.sz, d = +st.dataset.d;
      stock[id][sz] = Math.max(0, (stock[id][sz] || 0) + d);
      save("rk2_stock", stock); renderOwner(); renderGrid();
      var again = $('[data-st="' + id + '"][data-sz="' + cssEsc(sz) + '"][data-d="' + d + '"]', ownerEl); if (again) again.focus();
      return;
    }
    if (e.target.closest("[data-reset]")) {
      if (!window.confirm("Set semula pesanan, stok dan troli demo dalam pelayar ini?")) return;
      ["rk2_stock", "rk2_orders", "rk2_status", "rk2_cart", "rk2_form"].forEach(function (k) { try { localStorage.removeItem(k); } catch (er) { /* ignore */ } });
      stock = JSON.parse(JSON.stringify(STOCK_SEED)); myOrders = []; statusOverride = {}; cart = [];
      updateCount(); renderOwner(); renderGrid();
    }
  });
  ownerEl.addEventListener("change", function (e) {
    var s = e.target.closest("[data-oid]");
    if (s) { statusOverride[s.dataset.oid] = s.value; save("rk2_status", statusOverride); renderOwner(); var a = $('[data-oid="' + s.dataset.oid + '"]', ownerEl); if (a) a.focus(); }
  });

  function route() {
    var owner = location.hash === "#owner";
    document.body.classList.toggle("is-owner", owner);
    ownerEl.hidden = !owner;
    if (owner) {
      closeProduct(); closeCart(); closeDlg(menuDlg);
      renderOwner();
      window.scrollTo(0, 0);
      document.title = "Paparan pemilik, Rona Kasturi";
    } else {
      document.title = "Rona Kasturi, butik baju kurung, kebaya dan tudung";
    }
  }
  window.addEventListener("hashchange", route);

  // ---------- Entrances ----------
  var revealTargets = $all(".sec-title, .slip, .perks li, .acc");
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });
  if ("IntersectionObserver" in window) {
    var groups = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, parent = el.parentElement;
        var n = groups.get(parent) || 0;
        el.style.setProperty("--d", Math.min(n, 6) * 70 + "ms");
        groups.set(parent, n + 1);
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); bio.unobserve(en.target); } });
    }, { threshold: 0.2 });
    $all(".banner").forEach(function (b) { bio.observe(b); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("in"); });
  }

  // ---------- Floating chat: preview of the order message ----------
  var chatDlg = $("[data-chat]");
  function renderChat() {
    var now = new Date().toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit" });
    var last = myOrders.length ? myOrders[myOrders.length - 1] : null;
    var msg, note;
    if (cart.length) {
      msg = waMessage({ id: "(nombor diberi selepas hantar)", pos: form.pos, name: form.name || "Nama anda", phone: form.phone || "Nombor anda",
        address: form.address || "Alamat anda", note: "", items: cart.map(function (l) { return { id: l.id, c: l.colour, s: l.size, q: l.qty }; }) });
      note = "Ini mesej yang akan dihasilkan daripada troli anda sekarang.";
    } else if (last) {
      msg = waMessage(last);
      note = "Pesanan terakhir anda di pelayar ini.";
    } else {
      msg = "Assalamualaikum Rona Kasturi, saya nak tanya tentang saiz dan stok.";
      note = "Troli anda kosong. Tambah barang untuk lihat mesej pesanan penuh.";
    }
    chatDlg.innerHTML = '<div class="chat-top"><div><h2 id="chat-title">Rona Kasturi</h2><p>Demo. Tiada mesej dihantar.</p></div>' +
      '<button type="button" class="icon-btn" data-close-chat aria-label="Tutup"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6"/></svg></button></div>' +
      '<div class="chat-scroll"><p class="chat-note">' + esc(note) + "</p>" +
      '<p class="bubble in">Salam, terima kasih kerana singgah. Hantar senarai pesanan dan kami sahkan stok dalam masa sejam.<time>' + esc(now) + "</time></p>" +
      '<p class="bubble">' + esc(msg).replace(/\*([^*\n]+)\*/g, "<b>$1</b>") + "<time>" + esc(now) + "</time></p></div>" +
      '<div class="chat-actions">' + (cart.length ? '<button type="button" class="btn btn-accent btn-block" data-chat-cart>Lengkapkan di troli</button>' :
        '<a class="btn btn-solid btn-block" href="#koleksi" data-chat-shop>Lihat koleksi</a>') + "</div>";
  }
  $("[data-open-chat]").addEventListener("click", function () { renderChat(); openDlg(chatDlg); });
  chatDlg.addEventListener("click", function (e) {
    if (e.target === chatDlg || e.target.closest("[data-close-chat]") || e.target.closest("[data-chat-shop]")) { closeDlg(chatDlg); return; }
    if (e.target.closest("[data-chat-cart]")) { closeDlg(chatDlg); openCart(); }
  });
  chatDlg.addEventListener("close", function () { document.body.classList.remove("locked"); });

  // ---------- Init ----------
  renderGrid();
  updateCount();
  route();

  window.RK = { waMessage: waMessage, lastWaUrl: function () { return lastWaUrl; } };
})();
