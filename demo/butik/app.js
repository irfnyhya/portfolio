/* Maison Ve’ra demo shop. Plain script, no build step. */
(function () {
  "use strict";

  // Demo safety: checkout is simulated. The payment step asks for no card or bank details,
  // charges nothing and contacts no one. A real shop would hand off to a gateway (Billplz, Stripe).
  var FREE_POS_FROM = 250;

  // ---------- Colours (rona) ----------
  var R = {
    hitamArang: ["Hitam Arang", "#1d1c1b"],
    kelabuAsap: ["Kelabu Asap", "#8a8c90"],
    biruPudar: ["Biru Pudar", "#9db3c9"],
    biruIndigo: ["Biru Indigo", "#2e3f5c"],
    pasir: ["Pasir", "#c8b49a"],
    krim: ["Krim", "#ece3d2"],
    putih: ["Putih Susu", "#f4f1ea"],
    zaitun: ["Zaitun", "#5d6148"],
    coklatKopi: ["Coklat Kopi", "#6b4a35"],
    merahJambu: ["Merah Jambu Neon", "#e8579a"],
    merahCeri: ["Merah Ceri", "#9a1f2c"],
    pudina: ["Pudina", "#b9d6cc"],
    zamrud: ["Zamrud", "#1f4f47"],
    unguKilau: ["Ungu Kilau", "#8a3fc0"],
    perak: ["Perak", "#bfc0c4"],
    nude: ["Nude", "#d9bfa8"]
  };
  function rona(keys) { return keys.map(function (k) { return { key: k, name: R[k][0], hex: R[k][1] }; }); }

  var SZ = ["XS", "S", "M", "L", "XL"];
  var SZ_SELUAR = ["24", "26", "28", "30", "32"];
  var SZ_KASUT = ["36", "37", "38", "39", "40", "41"];

  // ---------- Catalogue (first colour is the one in the photo) ----------
  var PRODUCTS = [
    { id: "jaket-kulit", cat: "pakaian", name: "Jaket Biker Kulit Hitam", price: 259, img: "jaket-kulit",
      colours: rona(["hitamArang", "coklatKopi", "merahCeri"]), sizes: SZ,
      desc: "Jaket biker potongan pendek dengan zip serong dan bahu jatuh. Dipakai dengan apa saja, dari crop top ke hoodie.",
      spec: [["Bahan", "Kulit sintetik lembut, lapik satin"], ["Potongan", "Pendek, longgar di bahu"], ["Jagaan", "Lap dengan kain lembap"]] },
    { id: "jeans-hitam", cat: "pakaian", name: "Jeans Baggy Hitam Pudar", price: 169, img: "jeans-hitam",
      colours: rona(["hitamArang", "kelabuAsap", "biruIndigo"]), sizes: SZ_SELUAR,
      desc: "Jeans baggy pinggang rendah dengan cucian pudar dan jahitan panel di lutut. Jatuh menutup kasut.",
      spec: [["Bahan", "Denim kapas 100%, 13 oz"], ["Labuh", "42 inci (saiz 26)"], ["Jagaan", "Basuh terbalik, air sejuk"]] },
    { id: "jeans-biru", cat: "pakaian", name: "Jeans Lurus Biru Koyak", price: 149, img: "jeans-biru",
      colours: rona(["biruPudar", "biruIndigo", "hitamArang"]), sizes: SZ_SELUAR,
      desc: "Jeans kaki lurus warna biru pudar dengan koyak di lutut. Padan dengan tee putih dan kasut kanvas.",
      spec: [["Bahan", "Denim kapas, sedikit regang"], ["Labuh", "41 inci (saiz 26)"], ["Jagaan", "Basuh terbalik, air sejuk"]] },
    { id: "blazer-pasir", cat: "pakaian", name: "Blazer Oversize Pasir", price: 219, img: "blazer-pasir",
      colours: rona(["pasir", "hitamArang", "krim"]), sizes: SZ,
      desc: "Blazer besar dengan bahu berpad dan lengan panjang yang boleh dilipat. Juga boleh dipakai sebagai gaun pendek.",
      spec: [["Bahan", "Campuran linen, tidak berlapik"], ["Potongan", "Oversize, dua saiz lebih"], ["Jagaan", "Cucian kering disyorkan"]] },
    { id: "blazer-jalur", cat: "pakaian", name: "Blazer Jalur Halus Hitam", price: 239, img: "blazer-jalur",
      colours: rona(["hitamArang", "kelabuAsap", "biruIndigo"]), sizes: SZ,
      desc: "Blazer hitam berjalur halus, labuh sedikit dan longgar. Pakai terbuka di atas bralet atau tee.",
      spec: [["Bahan", "Bulu sintetik bertenun"], ["Potongan", "Longgar, labuh paras pinggul"], ["Jagaan", "Cucian kering disyorkan"]] },
    { id: "cargo-zaitun", cat: "pakaian", name: "Seluar Cargo Zaitun", price: 159, img: "cargo-zaitun",
      colours: rona(["zaitun", "hitamArang", "pasir"]), sizes: SZ,
      desc: "Cargo longgar dengan enam poket dan tali ikat di buku lali. Boleh diketatkan atau dibiarkan jatuh.",
      spec: [["Bahan", "Kapas twill"], ["Pinggang", "Getah di belakang"], ["Jagaan", "Basuh mesin"]] },
    { id: "trench-pasir", cat: "pakaian", name: "Kot Trench Pasir Labuh", price: 289, img: "trench-pasir",
      colours: rona(["pasir", "hitamArang", "zaitun"]), sizes: SZ,
      desc: "Trench labuh paras betis dengan tali pinggang. Dipakai terbuka di atas blazer untuk gaya berlapis.",
      spec: [["Bahan", "Kapas gabardin kalis percikan"], ["Labuh", "Paras betis"], ["Termasuk", "Tali pinggang padan"]] },
    { id: "kot-merah-jambu", cat: "pakaian", name: "Kot Kulit Merah Jambu Neon", price: 279, img: "kot-merah-jambu",
      colours: rona(["merahJambu", "hitamArang", "krim"]), sizes: SZ,
      desc: "Kot kulit berkilat warna merah jambu terang. Satu helai yang menjadikan pakaian hitam terus menonjol.",
      spec: [["Bahan", "Kulit sintetik berkilat"], ["Labuh", "Paras lutut"], ["Jagaan", "Lap dengan kain lembap"]] },
    { id: "beg-hitam", cat: "beg", name: "Beg Silang Hitam Berzip", price: 189, img: "beg-hitam",
      colours: rona(["hitamArang", "coklatKopi", "krim"]), sizes: ["Satu saiz"],
      desc: "Beg silang kecil dengan zip hadapan dan tali panjang boleh laras. Muat telefon, dompet dan kunci.",
      spec: [["Bahan", "Kulit lembu licin"], ["Ukuran", "22 x 15 x 7 cm"], ["Tali", "Boleh laras, 120 cm"]] },
    { id: "beg-krim", cat: "beg", name: "Beg Silinder Krim", price: 229, img: "beg-krim",
      colours: rona(["krim", "hitamArang", "coklatKopi"]), sizes: ["Satu saiz"],
      desc: "Beg bentuk silinder dengan jahitan panel dan tali bahu nipis. Lembut dan ringan.",
      spec: [["Bahan", "Kulit sintetik lembut"], ["Ukuran", "26 x 14 cm"], ["Termasuk", "Beg habuk"]] },
    { id: "beg-pudina", cat: "beg", name: "Beg Flap Pudina Rantai", price: 249, img: "beg-pudina",
      colours: rona(["pudina", "hitamArang", "putih"]), sizes: ["Satu saiz"],
      desc: "Beg flap berjahit tangan dengan tali rantai berjalin kulit. Pakai di bahu atau silang.",
      spec: [["Bahan", "Kulit sintetik bertekstur"], ["Ukuran", "20 x 14 cm"], ["Tali", "Rantai dan kulit, dua panjang"]] },
    { id: "beg-kroko", cat: "beg", name: "Beg Tangan Kroko Zamrud", price: 289, img: "beg-kroko",
      colours: rona(["zamrud", "hitamArang", "coklatKopi"]), sizes: ["Satu saiz"],
      desc: "Beg tangan bercorak buaya berkilat dengan dua pemegang dan tali bahu yang boleh ditanggalkan.",
      spec: [["Bahan", "Kulit bercetak kroko"], ["Ukuran", "24 x 18 cm"], ["Termasuk", "Tali bahu dan beg habuk"]] },
    { id: "beg-putih", cat: "beg", name: "Beg Bahu Putih Minimal", price: 169, img: "beg-putih",
      colours: rona(["putih", "hitamArang", "pasir"]), sizes: ["Satu saiz"],
      desc: "Beg bahu nipis dengan tali panjang dan buckle perak. Ringkas, dipakai setiap hari.",
      spec: [["Bahan", "Kulit sintetik licin"], ["Ukuran", "24 x 18 cm"], ["Tali", "Boleh laras"]] },
    { id: "kasut-kuning", cat: "kasut", name: "Pump Klasik Hitam", price: 199, img: "kasut-kuning",
      colours: rona(["hitamArang", "nude", "merahCeri"]), sizes: SZ_KASUT,
      desc: "Pump hujung runcing dengan tumit 10 cm. Asas untuk setiap almari.",
      spec: [["Bahan", "Kulit sintetik matte"], ["Tumit", "10 cm"], ["Tapak", "Berlapik span lembut"]] },
    { id: "kasut-kerusi", cat: "kasut", name: "Pump Kilat Hitam Runcing", price: 229, img: "kasut-kerusi",
      colours: rona(["hitamArang", "nude", "perak"]), sizes: SZ_KASUT,
      desc: "Pump kulit berkilat dengan potongan sisi rendah. Cantik dengan seluar labuh atau jeans baggy.",
      spec: [["Bahan", "Kulit paten sintetik"], ["Tumit", "9 cm"], ["Tapak", "Getah anti gelincir"]] },
    { id: "kasut-putih", cat: "kasut", name: "Pump Kitten Putih", price: 189, img: "kasut-putih",
      colours: rona(["putih", "hitamArang", "nude"]), sizes: SZ_KASUT,
      desc: "Tumit rendah 6 cm dengan hujung runcing. Selesa untuk berjalan seharian di bandar.",
      spec: [["Bahan", "Kulit sintetik licin"], ["Tumit", "6 cm"], ["Tapak", "Berlapik span lembut"]] },
    { id: "kasut-kilau", cat: "kasut", name: "Stiletto Kilau Ungu", price: 259, img: "kasut-kilau",
      colours: rona(["unguKilau", "perak", "hitamArang"]), sizes: SZ_KASUT,
      desc: "Stiletto bersalut glitter yang berkilau di bawah lampu. Untuk malam keluar.",
      spec: [["Bahan", "Glitter atas fabrik"], ["Tumit", "11 cm"], ["Nota", "Edisi terhad"]] },
    { id: "kasut-tali", cat: "kasut", name: "Sandal Tali Buku Lali Hitam", price: 179, img: "kasut-tali",
      colours: rona(["hitamArang", "nude", "perak"]), sizes: SZ_KASUT,
      desc: "Sandal tumit nipis dengan tali buku lali dan buckle kecil. Ringan dan mudah dipadankan.",
      spec: [["Bahan", "Suede sintetik"], ["Tumit", "9 cm"], ["Tapak", "Getah anti gelincir"]] }
  ];
  var TAGS = {
    baru: ["kot-merah-jambu", "jeans-hitam", "blazer-jalur", "beg-pudina", "beg-krim", "kasut-kilau", "kasut-putih", "trench-pasir"]
  };
  var CAT_TITLE = { semua: "Semua koleksi", baru: "Baru tiba", pakaian: "Pakaian", beg: "Beg tangan", kasut: "Kasut tumit" };
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  function inCat(p, cat) { return cat === "semua" || p.cat === cat || (TAGS[cat] && TAGS[cat].indexOf(p.id) > -1); }
  function imgSrc(p) { return "img/" + p.img + ".jpg"; }

  // Seed stock per product and size. A few low and sold out sizes so the owner view has something to flag.
  var STOCK_SEED = {
    "jaket-kulit": { XS: 5, S: 9, M: 11, L: 7, XL: 4 },
    "jeans-hitam": { "24": 6, "26": 9, "28": 9, "30": 5, "32": 3 },
    "jeans-biru": { "24": 4, "26": 7, "28": 8, "30": 5, "32": 2 },
    "blazer-pasir": { XS: 4, S: 7, M: 8, L: 5, XL: 3 },
    "blazer-jalur": { XS: 1, S: 2, M: 1, L: 0, XL: 1 },
    "cargo-zaitun": { XS: 6, S: 9, M: 10, L: 7, XL: 4 },
    "trench-pasir": { XS: 3, S: 5, M: 6, L: 4, XL: 2 },
    "kot-merah-jambu": { XS: 2, S: 3, M: 2, L: 0, XL: 0 },
    "beg-hitam": { "Satu saiz": 21 },
    "beg-krim": { "Satu saiz": 14 },
    "beg-pudina": { "Satu saiz": 6 },
    "beg-kroko": { "Satu saiz": 0 },
    "beg-putih": { "Satu saiz": 17 },
    "kasut-kuning": { "36": 5, "37": 9, "38": 11, "39": 7, "40": 5, "41": 3 },
    "kasut-kerusi": { "36": 4, "37": 7, "38": 8, "39": 6, "40": 3, "41": 2 },
    "kasut-putih": { "36": 5, "37": 7, "38": 9, "39": 7, "40": 3, "41": 0 },
    "kasut-kilau": { "36": 1, "37": 2, "38": 1, "39": 0, "40": 1, "41": 0 },
    "kasut-tali": { "36": 4, "37": 6, "38": 7, "39": 5, "40": 3, "41": 2 }
  };

  // Seed orders: sample data for the owner view, dated relative to today.
  function daysAgo(d, h, m) { var t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, m, 0, 0); return t.toISOString(); }
  var SEED_ORDERS = [
    { at: daysAgo(0, 9, 42), name: "Nur Aisyah", phone: "012 xxx 4471", area: "Shah Alam", pos: "semenanjung", pay: "fpx", pick: "Maybank2u",
      items: [{ id: "jaket-kulit", c: "Hitam Arang", s: "M", q: 1 }, { id: "beg-hitam", c: "Hitam Arang", s: "Satu saiz", q: 1 }], status: "Dibayar" },
    { at: daysAgo(0, 8, 15), name: "Siti Hajar", phone: "019 xxx 2208", area: "Kuantan", pos: "semenanjung", pay: "dompet", pick: "Touch 'n Go eWallet",
      items: [{ id: "jeans-hitam", c: "Hitam Arang", s: "26", q: 1 }], status: "Dibayar" },
    { at: daysAgo(1, 21, 3), name: "Farah Nadia", phone: "013 xxx 9150", area: "Kuching", pos: "sabahsarawak", pay: "atome", pick: "",
      items: [{ id: "kasut-kilau", c: "Ungu Kilau", s: "37", q: 1 }, { id: "beg-krim", c: "Krim", s: "Satu saiz", q: 1 }], status: "Dibungkus" },
    { at: daysAgo(1, 14, 27), name: "Amira Zulaikha", phone: "011 xxx 6632", area: "Ipoh", pos: "semenanjung", pay: "kad", pick: "",
      items: [{ id: "blazer-pasir", c: "Pasir", s: "S", q: 1 }], status: "Dipos" },
    { at: daysAgo(2, 11, 50), name: "Hidayah Rahman", phone: "017 xxx 0384", area: "Shah Alam", pos: "ambil", pay: "duitnow", pick: "",
      items: [{ id: "kasut-kuning", c: "Hitam Arang", s: "38", q: 1 }], status: "Dipos" },
    { at: daysAgo(3, 16, 8), name: "Liyana Ismail", phone: "016 xxx 7719", area: "Johor Bahru", pos: "semenanjung", pay: "fpx", pick: "CIMB Clicks",
      items: [{ id: "cargo-zaitun", c: "Zaitun", s: "M", q: 1 }, { id: "trench-pasir", c: "Pasir", s: "M", q: 1 }], status: "Dipos" }
  ];
  // Sample orders use the same number format as new ones (MV + month + day + sequence).
  SEED_ORDERS.forEach(function (o, i) {
    var d = new Date(o.at);
    o.id = "MV" + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + String(i + 1).padStart(2, "0"); // taste-skill-ignore
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

  var stock = load("rk3_stock", null) || JSON.parse(JSON.stringify(STOCK_SEED));
  var cart = load("rk3_cart", []).filter(function (l) { return byId[l.id]; });
  var myOrders = load("rk3_orders", []);
  var statusOverride = load("rk3_status", {});

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
      (p.cat === "pakaian" ? '<details class="size-guide"' + (guideOpen ? " open" : "") + '><summary>Panduan saiz</summary>' + sizeTableHTML() + "</details>" : "") +
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

  // ---------- Cart and checkout ----------
  // Flow after the reference shops (Shopify style): Troli > Daftar keluar > gerbang bayaran > Selesai.
  // Demo only: the payment page asks for no card or bank details and nothing is charged.
  var cartDlg = $("[data-cart]");
  var cartBody = $("[data-cart-body]");
  var cartTitle = $("#cart-title");
  var form = { email: "", phone: "", name: "", address: "", postcode: "", city: "", state: "Selangor", note: "", pos: "semenanjung", pay: "fpx", pick: "" };
  var step = "troli";
  var justPlaced = null;

  var STATES = ["Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu"];
  var PAY = {
    fpx: { label: "FPX perbankan dalam talian", sub: "Pilih bank anda di langkah seterusnya", picks: ["Maybank2u", "CIMB Clicks", "Public Bank", "RHB", "Bank Islam", "Hong Leong", "AmBank", "BSN"] },
    kad: { label: "Kad kredit atau debit", sub: "Visa dan Mastercard" },
    duitnow: { label: "DuitNow QR", sub: "Imbas dengan aplikasi bank atau dompet digital" },
    dompet: { label: "Dompet digital", sub: "Touch 'n Go eWallet, GrabPay, ShopeePay", picks: ["Touch 'n Go eWallet", "GrabPay", "ShopeePay"] },
    atome: { label: "Atome", sub: "Bayar 3 kali tanpa faedah" }
  };
  var STEP_TITLE = { troli: "Troli", checkout: "Daftar keluar", gateway: "Bayaran", processing: "Bayaran", done: "Pesanan disahkan" };

  function addToCart(p, colour, size, qty) {
    var line = cart.filter(function (l) { return l.id === p.id && l.colour === colour && l.size === size; })[0];
    if (line) line.qty += qty; else cart.push({ id: p.id, colour: colour, size: size, qty: qty });
    save("rk3_cart", cart);
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
  function total() { var s = subtotal(); return s + posFee(form.pos, s); }

  function openCart() {
    if (step === "done" || step === "processing") { step = "troli"; justPlaced = null; }
    if (step === "gateway") step = "checkout";
    toastEl.classList.remove("show");
    closeProduct();
    renderCart();
    openDlg(cartDlg);
  }
  function closeCart() { closeDlg(cartDlg); }
  cartDlg.addEventListener("close", function () {
    if (step === "done") { step = "troli"; justPlaced = null; }
    document.body.classList.remove("locked");
  });
  cartDlg.addEventListener("click", function (e) { if (e.target === cartDlg && step !== "processing") closeCart(); });

  function stepsBar(n) {
    return '<div class="steps" aria-hidden="true">' + ["Troli", "Butiran", "Bayar", "Selesai"].map(function (s, i) {
      return '<span class="' + (i < n ? "on" : "") + '">' + s + "</span>";
    }).join("") + "</div>";
  }
  function freeBar(sub) {
    var left = FREE_POS_FROM - sub;
    var pct = Math.min(100, Math.round(sub / FREE_POS_FROM * 100));
    return '<div class="freebar">' + (left > 0 ? "Tambah " + rm(left) + " lagi untuk pos percuma Semenanjung." : "Anda layak pos percuma Semenanjung.") +
      '<div class="freebar-track"><i style="width:' + pct + '%"></i></div></div>';
  }
  function setFoot(html) {
    var f = $(".cart-foot", cartDlg);
    if (!f) { f = document.createElement("div"); f.className = "cart-foot"; cartDlg.appendChild(f); }
    f.innerHTML = html;
    f.hidden = !html;
  }
  function field(id, label, input, err) {
    return '<div class="fld"><label for="f-' + id + '">' + label + "</label>" + input + '<p class="field-err" id="e-' + id + '">' + (err || "") + "</p></div>";
  }
  function textIn(id, type, auto, extra, err) {
    return '<input id="f-' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + auto + '" value="' + esc(form[id]) + '"' + (extra || "") +
      (err ? ' aria-invalid="true"' : "") + ' aria-describedby="e-' + id + '">';
  }

  function renderCart(errors) {
    cartTitle.textContent = STEP_TITLE[step];
    cartBody.scrollTop = 0;
    if (step === "done") return renderDone();
    if (step === "processing") return renderProcessing();
    if (!cart.length) {
      step = "troli"; cartTitle.textContent = "Troli";
      cartBody.innerHTML = '<div class="empty"><p>Troli anda masih kosong.</p><button type="button" class="btn btn-solid" data-close-cart data-goto="#koleksi">Lihat koleksi</button></div>';
      setFoot("");
      return;
    }
    if (step === "checkout") return renderCheckout(errors || {});
    if (step === "gateway") return renderGateway(errors || {});
    var sub = subtotal();
    cartBody.innerHTML = stepsBar(1) + freeBar(sub) +
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
      '<dl class="sum"><dt class="total">Jumlah kecil</dt><dd class="total">' + rm2(sub) + "</dd></dl>" +
      '<p class="fine">Kos pos dikira semasa daftar keluar. Bayar dengan FPX, kad, DuitNow QR, dompet digital atau Atome.</p>';
    setFoot('<button type="button" class="btn btn-solid btn-block" data-go="checkout">Daftar keluar &middot; ' + rm2(sub) + "</button>");
  }

  function summaryBlock(open) {
    var sub = subtotal(), fee = posFee(form.pos, sub);
    return '<details class="co-sum"' + (open ? " open" : "") + '><summary><span>Ringkasan pesanan</span><b>' + rm2(sub + fee) + "</b></summary>" +
      '<ul class="co-lines">' + cart.map(function (l) {
        var p = byId[l.id];
        return '<li><span class="co-pic"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><i>' + l.qty + "</i></span><span>" + esc(p.name) + "<small>" + esc(l.colour) + ", " + esc(l.size) + "</small></span><b>" + rm2(p.price * l.qty) + "</b></li>";
      }).join("") + "</ul>" +
      '<dl class="sum"><dt>Jumlah kecil</dt><dd>' + rm2(sub) + "</dd><dt>" + esc(POS[form.pos].label) + "</dt><dd>" + (fee ? rm2(fee) : "Percuma") +
      '</dd><dt class="total">Jumlah</dt><dd class="total">MYR ' + rm2(sub + fee) + "</dd></dl></details>";
  }

  function renderCheckout(errors) {
    var sub = subtotal(), t = total();
    var ship = form.pos !== "ambil";
    cartBody.innerHTML = stepsBar(2) +
      '<button type="button" class="back" data-go="troli">&larr; Kembali ke troli</button>' +
      summaryBlock(false) +
      '<form class="form" novalidate data-form id="co-form">' +
      '<fieldset><legend>Hubungan</legend>' +
      field("email", "Emel untuk resit", textIn("email", "email", "email", ' inputmode="email" placeholder="nama@contoh.com"', errors.email), errors.email) +
      field("phone", "No. telefon untuk kurier", textIn("phone", "tel", "tel", ' inputmode="tel" placeholder="012 345 6789"', errors.phone), errors.phone) +
      "</fieldset>" +
      '<fieldset><legend>Penghantaran</legend>' + Object.keys(POS).map(function (k) {
        var f = posFee(k, sub);
        return '<label class="radio"><input type="radio" name="pos" value="' + k + '"' + (form.pos === k ? " checked" : "") + "><span>" + POS[k].label + "</span><span>" + (f ? rm(f) : "Percuma") + "</span></label>";
      }).join("") + "</fieldset>" +
      '<fieldset><legend>' + (ship ? "Alamat penghantaran" : "Nama pengambil") + "</legend>" +
      field("name", "Nama penuh", textIn("name", "text", "name", "", errors.name), errors.name) +
      (ship ?
        field("address", "Alamat", textIn("address", "text", "street-address", ' placeholder="No. rumah, jalan, taman"', errors.address), errors.address) +
        '<div class="fld-row">' +
        field("postcode", "Poskod", textIn("postcode", "text", "postal-code", ' inputmode="numeric" maxlength="5"', errors.postcode), errors.postcode) +
        field("city", "Bandar", textIn("city", "text", "address-level2", "", errors.city), errors.city) + "</div>" +
        field("state", "Negeri", '<select id="f-state" name="state" autocomplete="address-level1">' + STATES.map(function (s) {
          return "<option" + (s === form.state ? " selected" : "") + ">" + s + "</option>";
        }).join("") + "</select>", "") : '<p class="fine">Ambil di studio kami di Shah Alam, Isnin hingga Sabtu, 11 pagi hingga 7 petang. Kami SMS bila barang sedia.</p>') +
      "</fieldset>" +
      '<fieldset><legend>Bayaran</legend><p class="fine">Semua transaksi selamat dan disulitkan.</p>' + Object.keys(PAY).map(function (k) {
        var sub2 = k === "atome" ? "3 bayaran " + rm2(Math.ceil(t / 3 * 100) / 100) + ", tanpa faedah" : PAY[k].sub;
        return '<label class="radio pay"><input type="radio" name="pay" value="' + k + '"' + (form.pay === k ? " checked" : "") + "><span>" + PAY[k].label + "<small>" + esc(sub2) + "</small></span></label>";
      }).join("") + "</fieldset>" +
      field("note", "Catatan untuk kedai (tidak wajib)", textIn("note", "text", "off", ' placeholder="Contoh: hadiah, tolong balut"', ""), "") +
      '<p class="fine">Laman demo: langkah bayaran seterusnya tidak meminta nombor kad atau log masuk bank, dan tiada wang ditolak.</p>' +
      "</form>";
    setFoot('<button type="submit" form="co-form" class="btn btn-accent btn-block">Bayar sekarang &middot; ' + rm2(t) + "</button>");
  }

  function renderGateway(errors) {
    var t = total(), m = PAY[form.pay];
    var body = "";
    if (m.picks) {
      if (m.picks.indexOf(form.pick) < 0) form.pick = "";
      body = '<p class="gw-ask">' + (form.pay === "fpx" ? "Pilih bank anda" : "Pilih dompet digital") + '</p><div class="gw-picks" role="radiogroup" aria-label="' + (form.pay === "fpx" ? "Bank" : "Dompet digital") + '">' +
        m.picks.map(function (b) { return '<button type="button" role="radio" aria-checked="' + (b === form.pick) + '" data-pick="' + esc(b) + '">' + esc(b) + "</button>"; }).join("") + "</div>" +
        '<p class="field-err" role="alert">' + (errors.pick || "") + "</p>";
    } else if (form.pay === "kad") {
      body = '<div class="gw-card"><span>Visa / Mastercard</span><b>&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242</b><small>Kad contoh. Demo ini tidak meminta nombor kad sebenar.</small></div>';
    } else if (form.pay === "duitnow") {
      body = '<div class="gw-qr"><svg viewBox="0 0 21 21" aria-hidden="true" shape-rendering="crispEdges">' + fakeQr() + '</svg><small>Contoh sahaja, kod ini tidak boleh diimbas.</small></div>';
    } else if (form.pay === "atome") {
      var part = Math.ceil(t / 3 * 100) / 100;
      body = '<ol class="gw-plan">' + [0, 1, 2].map(function (i) {
        var d = new Date(); d.setMonth(d.getMonth() + i);
        return "<li><span>" + (i === 0 ? "Hari ini" : d.toLocaleDateString("ms-MY", { day: "numeric", month: "long" })) + "</span><b>" + rm2(i < 2 ? part : Math.round((t - part * 2) * 100) / 100) + "</b></li>";
      }).join("") + "</ol>";
    }
    cartBody.innerHTML = stepsBar(3) +
      '<div class="gw">' +
      '<div class="gw-top"><span class="gw-tag">Gerbang bayaran demo</span><span>Maison Ve’ra</span></div>' +
      '<p class="gw-amt"><small>Jumlah</small>MYR ' + rm2(t).replace("RM", "") + "</p>" +
      '<p class="gw-via">' + esc(m.label) + "</p>" + body + "</div>" +
      '<p class="fine">Di kedai sebenar, langkah ini dibuka oleh gerbang bayaran seperti Billplz atau Stripe. Dalam demo, tekan Luluskan untuk lihat apa yang berlaku selepas bayaran berjaya.</p>';
    setFoot('<button type="button" class="btn btn-accent btn-block" data-approve>Luluskan bayaran &middot; ' + rm2(t) + "</button>" +
      '<button type="button" class="btn btn-block link" style="min-height:44px" data-go="checkout">Batal dan kembali</button>');
  }

  function fakeQr() {
    // Decorative pattern with three corner squares; not a real QR code.
    var s = "", seed = 7;
    function corner(x, y) { s += '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; }
    for (var y = 0; y < 21; y++) for (var x = 0; x < 21; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      seed = (seed * 9301 + 49297) % 233280;
      if (seed / 233280 > 0.52) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    corner(0, 0); corner(14, 0); corner(0, 14);
    return s;
  }

  function renderProcessing() {
    cartBody.innerHTML = stepsBar(3) + '<div class="gw-wait" role="status"><span class="spin" aria-hidden="true"></span><p>Mengesahkan bayaran</p><small>Jangan tutup tetingkap ini.</small></div>';
    setFoot("");
  }

  function readForm() {
    var f = $("[data-form]", cartBody);
    if (!f) return;
    ["email", "phone", "name", "address", "postcode", "city", "state", "note"].forEach(function (k) { if (f.elements[k]) form[k] = f.elements[k].value; });
    var r = f.querySelector('input[name="pos"]:checked'); if (r) form.pos = r.value;
    var p = f.querySelector('input[name="pay"]:checked'); if (p) form.pay = p.value;
    save("rk3_form", { email: form.email, phone: form.phone, name: form.name, address: form.address, postcode: form.postcode, city: form.city, state: form.state, pos: form.pos, pay: form.pay });
  }

  function go(to) {
    readForm();
    step = to;
    renderCart();
    var first = to === "checkout" ? $("#f-email", cartBody) : $("[data-pick], [data-approve]", cartDlg);
    if (first && to !== "checkout") first.focus();
  }

  cartBody.addEventListener("input", function () { readForm(); });
  cartBody.addEventListener("change", function (e) {
    if (e.target.name === "pos" || e.target.name === "pay") {
      readForm(); renderCart();
      var r = $('input[name="' + e.target.name + '"]:checked', cartBody); if (r) r.focus();
    }
  });
  cartDlg.addEventListener("click", function (e) {
    var g0 = e.target.closest("[data-go]");
    if (g0) { go(g0.dataset.go); return; }
    var pk = e.target.closest("[data-pick]");
    if (pk) { form.pick = pk.dataset.pick; renderCart(); var again0 = $('[data-pick="' + cssEsc(form.pick) + '"]', cartBody); if (again0) again0.focus(); return; }
    if (e.target.closest("[data-approve]")) {
      if (PAY[form.pay].picks && !form.pick) { renderGateway({ pick: form.pay === "fpx" ? "Sila pilih bank dahulu." : "Sila pilih dompet digital dahulu." }); return; }
      step = "processing"; renderCart();
      setTimeout(placeOrder, matchMedia("(prefers-reduced-motion: reduce)").matches ? 300 : 1600);
      return;
    }
    var b = e.target.closest("[data-lq]");
    if (b) {
      var l = cart[+b.dataset.l], d = +b.dataset.lq;
      var max = stockOf(l.id, l.size) - inCart(l.id, l.size) + l.qty;
      l.qty = Math.max(1, Math.min(max, l.qty + d));
      save("rk3_cart", cart); updateCount(); renderCart();
      var again = $('[data-lq="' + d + '"][data-l="' + b.dataset.l + '"]', cartBody); if (again) again.focus();
      return;
    }
    var r = e.target.closest("[data-rm]");
    if (r) { cart.splice(+r.dataset.rm, 1); save("rk3_cart", cart); updateCount(); renderCart(); return; }
    var g = e.target.closest("[data-goto]");
    if (g) { closeCart(); setCat("semua"); location.hash = g.dataset.goto; }
  });
  cartDlg.addEventListener("submit", function (e) {
    e.preventDefault();
    readForm();
    var errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "Sila isi emel yang sah, contohnya nama@contoh.com.";
    if (form.phone.replace(/\D/g, "").length < 9) errs.phone = "Sila isi nombor telefon, contohnya 012 345 6789.";
    if (form.name.trim().length < 2) errs.name = "Sila isi nama penuh.";
    if (form.pos !== "ambil") {
      if (form.address.trim().length < 6) errs.address = "Sila isi alamat.";
      if (!/^\d{5}$/.test(form.postcode.trim())) errs.postcode = "Poskod 5 angka.";
      if (form.city.trim().length < 2) errs.city = "Sila isi bandar.";
    }
    if (Object.keys(errs).length) {
      renderCheckout(errs);
      var first = $("#f-" + Object.keys(errs)[0], cartBody); if (first) first.focus();
      return;
    }
    form.pick = "";
    go("gateway");
  });

  function nextOrderId() {
    var d = new Date();
    var n = myOrders.length + 7;
    return "MV" + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + String(n).padStart(2, "0"); // taste-skill-ignore
  }
  function payLabel(o) { return o.pay ? PAY[o.pay].label.replace(" perbankan dalam talian", "") + (o.pick ? ", " + o.pick : "") : ""; }

  function placeOrder() {
    var ship = form.pos !== "ambil";
    var o = {
      id: nextOrderId(), at: new Date().toISOString(),
      name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
      address: ship ? [form.address.trim(), form.postcode.trim() + " " + form.city.trim(), form.state].join(", ") : "",
      note: form.note.trim(), pos: form.pos, area: ship ? form.city.trim() + ", " + form.state : "Ambil sendiri",
      pay: form.pay, pick: PAY[form.pay].picks ? form.pick : "",
      items: cart.map(function (l) { return { id: l.id, c: l.colour, s: l.size, q: l.qty }; }),
      status: "Dibayar", mine: true
    };
    o.items.forEach(function (it) { if (stock[it.id] && it.s in stock[it.id]) stock[it.id][it.s] = Math.max(0, stock[it.id][it.s] - it.q); });
    myOrders.push(o);
    save("rk3_orders", myOrders); save("rk3_stock", stock);
    cart = []; save("rk3_cart", cart); updateCount();
    form.note = ""; form.pick = "";
    justPlaced = { order: o };
    step = "done";
    renderCart();
    renderGrid();
    var h = $("[data-done] h3", cartBody); if (h) h.focus();
  }

  function renderDone() {
    var o = justPlaced.order;
    var sub = o.items.reduce(function (a, it) { return a + byId[it.id].price * it.q; }, 0), fee = posFee(o.pos, sub);
    var day = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("ms-MY", { weekday: "short", day: "numeric", month: "short" }); };
    var ship = o.pos !== "ambil";
    var track = [
      ["Bayaran diterima", payLabel(o) + ", " + new Date(o.at).toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit" }), true],
      ["Dibungkus", "Hari ini", false],
      ship ? ["Dipos", "Nombor tracking dihantar ke emel dan SMS", false] : ["Sedia untuk diambil", "Kami SMS bila sedia", false],
      ship ? ["Sampai", day(o.pos === "semenanjung" ? 2 : 4) + " hingga " + day(o.pos === "semenanjung" ? 4 : 7), false] : ["Diambil", "Studio Shah Alam", false]
    ];
    cartBody.innerHTML = stepsBar(4) +
      '<div class="done" data-done>' +
      '<p class="done-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2"/></svg></p>' +
      '<h3 tabindex="-1">Terima kasih, ' + esc(o.name.split(" ")[0]) + "</h3>" +
      "<p>Pesanan <b>" + esc(o.id) + "</b> sudah dibayar. Resit dihantar ke <b>" + esc(o.email) + "</b>.</p>" +
      '<ol class="track">' + track.map(function (s) { return '<li class="' + (s[2] ? "on" : "") + '"><b>' + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>"; }).join("") + "</ol>" +
      '<ul class="co-lines">' + o.items.map(function (it) {
        var p = byId[it.id];
        return '<li><span class="co-pic"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><i>' + it.q + "</i></span><span>" + esc(p.name) + "<small>" + esc(it.c) + ", " + esc(it.s) + "</small></span><b>" + rm2(p.price * it.q) + "</b></li>";
      }).join("") + "</ul>" +
      '<dl class="sum"><dt>Jumlah kecil</dt><dd>' + rm2(sub) + "</dd><dt>" + esc(POS[o.pos].label) + "</dt><dd>" + (fee ? rm2(fee) : "Percuma") + '</dd><dt class="total">Dibayar</dt><dd class="total">' + rm2(sub + fee) + "</dd></dl>" +
      (ship ? '<p class="fine"><b>Dihantar ke</b><br>' + esc(o.name) + ", " + esc(o.address) + "</p>" : "") +
      '<p class="fine">Demo: tiada wang ditolak dan tiada emel dihantar. Pesanan ini kini ada dalam <a href="#owner" data-close-cart>paparan pemilik</a> dengan status Dibayar, dan stok sudah ditolak.</p>' +
      "</div>";
    setFoot('<button type="button" class="btn btn-solid btn-block" data-close-cart>Teruskan membeli</button>');
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-open-cart]")) { e.preventDefault(); openCart(); return; }
    var c = e.target.closest("[data-close-cart]");
    if (c) { if (c.getAttribute("href") !== "#owner") e.preventDefault(); closeCart(); }
  });

  var savedForm = load("rk3_form", null);
  if (savedForm) Object.keys(form).forEach(function (k) { if (typeof savedForm[k] === "string" && savedForm[k]) form[k] = savedForm[k]; });
  if (!PAY[form.pay]) form.pay = "fpx";
  if (!POS[form.pos]) form.pos = "semenanjung";

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
    var baru = orders.filter(function (o) { return o.status === "Dibayar"; }).length;
    var belumPos = orders.filter(function (o) { return o.status !== "Dipos"; }).length;
    var week = orders.filter(function (o) { return Date.now() - new Date(o.at) < 7 * 864e5; }).reduce(function (a, o) { return a + orderTotal(o); }, 0);
    var lows = lowList();
    var outCount = lows.filter(function (l) { return l.n === 0; }).length;

    var html = '<div class="o-head"><a class="wordmark" href="#top">Maison Ve’ra</a><h1>Paparan pemilik</h1>' +
      '<a class="btn btn-solid" href="#top">Kembali ke kedai</a></div>' +
      '<p class="o-note">Contoh skrin untuk pemilik kedai. Enam pesanan pertama ialah data contoh. Pesanan yang anda bayar di troli dalam pelayar ini masuk terus ke sini, berlatar jingga, dengan status Dibayar. Stok ditolak secara automatik.</p>' +
      '<div class="o-stats">' +
      '<div class="o-stat' + (baru ? " alert" : "") + '"><b>' + baru + "</b><span>Sudah dibayar, perlu dibungkus</span></div>" +
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
            (o.mine ? '<a class="o-wa" href="https://wa.me/' + waNum(o.phone) + "?text=" + encodeURIComponent("Salam " + o.name + ", terima kasih. Pesanan " + o.id + " sudah dibayar dan sedang dibungkus. Nombor tracking akan dihantar sebaik dipos.") + '" target="_blank" rel="noopener">Balas di WhatsApp</a>' : "") + "</td>" +
            '<td data-l="Barang"><div class="o-items">' + o.items.map(function (it) {
              var p = byId[it.id];
              return '<span class="o-item"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><span>' + it.q + " x " + esc(p.name) + "<small>" + esc(it.c) + ", " + esc(it.s) + "</small></span></span>";
            }).join("") + "<small>" + esc(POS[o.pos].label) + "</small></div></td>" +
            '<td data-l="Jumlah" class="num">' + rm2(orderTotal(o)) + (o.pay ? '<span class="o-sub">' + esc(payLabel(o)) + "</span>" : "") + "</td>" +
            '<td data-l="Status"><select class="o-status" data-oid="' + esc(o.id) + '" data-s="' + o.status + '" aria-label="Status ' + esc(o.id) + '">' +
            ["Dibayar", "Dibungkus", "Dipos"].map(function (s) { return "<option" + (s === o.status ? " selected" : "") + ">" + s + "</option>"; }).join("") +
            "</select></td></tr>";
        }).join("") + "</tbody></table>";
    } else {
      html += '<table class="o-table"><caption class="sr">Stok mengikut produk dan saiz</caption><thead><tr><th scope="col">Produk</th><th scope="col">Stok mengikut saiz</th><th scope="col" class="num">Jumlah</th></tr></thead><tbody>' +
        PRODUCTS.map(function (p) {
          var t = totalStock(p.id);
          var lowN = p.sizes.filter(function (s) { var n = stockOf(p.id, s); return n > 0 && n <= 2; }).length;
          var outN = p.sizes.filter(function (s) { return stockOf(p.id, s) === 0; }).length;
          return "<tr>" +
            '<td data-l="Produk"><div class="o-prod"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><div>' + esc(p.name) + '<span class="o-sub">' + rm(p.price) + ", " + CAT_TITLE[p.cat] + "</span>" +
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
      save("rk3_stock", stock); renderOwner(); renderGrid();
      var again = $('[data-st="' + id + '"][data-sz="' + cssEsc(sz) + '"][data-d="' + d + '"]', ownerEl); if (again) again.focus();
      return;
    }
    if (e.target.closest("[data-reset]")) {
      if (!window.confirm("Set semula pesanan, stok dan troli demo dalam pelayar ini?")) return;
      ["rk3_stock", "rk3_orders", "rk3_status", "rk3_cart", "rk3_form"].forEach(function (k) { try { localStorage.removeItem(k); } catch (er) { /* ignore */ } });
      stock = JSON.parse(JSON.stringify(STOCK_SEED)); myOrders = []; statusOverride = {}; cart = [];
      updateCount(); renderOwner(); renderGrid();
    }
  });
  ownerEl.addEventListener("change", function (e) {
    var s = e.target.closest("[data-oid]");
    if (s) { statusOverride[s.dataset.oid] = s.value; save("rk3_status", statusOverride); renderOwner(); var a = $('[data-oid="' + s.dataset.oid + '"]', ownerEl); if (a) a.focus(); }
  });

  function route() {
    var owner = location.hash === "#owner";
    document.body.classList.toggle("is-owner", owner);
    ownerEl.hidden = !owner;
    if (owner) {
      closeProduct(); closeCart(); closeDlg(menuDlg);
      renderOwner();
      window.scrollTo(0, 0);
      document.title = "Paparan pemilik, Maison Ve’ra";
    } else {
      document.title = "Maison Ve’ra, pakaian jalanan, beg dan kasut tumit";
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

  // ---------- Floating chat: questions about size and stock (demo, nothing sent) ----------
  var chatDlg = $("[data-chat]");
  function renderChat() {
    var now = new Date().toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit" });
    var last = myOrders.length ? myOrders[myOrders.length - 1] : null;
    var lastStatus = last ? (statusOverride[last.id] || last.status) : "";
    var bubbles = '<p class="bubble in">Salam, ada soalan tentang saiz, stok atau pesanan? Tanya di sini.<time>' + esc(now) + "</time></p>";
    if (last) {
      bubbles += '<p class="bubble">Status pesanan ' + esc(last.id) + "?<time>" + esc(now) + "</time></p>" +
        '<p class="bubble in">Pesanan ' + esc(last.id) + " berstatus <b>" + esc(lastStatus) + "</b>. " +
        (lastStatus === "Dipos" ? "Nombor tracking sudah dihantar ke " + esc(last.email || "emel anda") + "." : "Kami bungkus dan pos dalam masa satu hari bekerja.") + "<time>" + esc(now) + "</time></p>";
    } else {
      bubbles += '<p class="bubble">Saiz M untuk blazer tu muat dada 38 inci?<time>' + esc(now) + "</time></p>" +
        '<p class="bubble in">Muat. Blazer kami potongan longgar, jadi kalau suka lebih kemas pilih S.<time>' + esc(now) + "</time></p>";
    }
    chatDlg.innerHTML = '<div class="chat-top"><div><h2 id="chat-title">Maison Ve’ra</h2><p>Demo. Tiada mesej dihantar.</p></div>' +
      '<button type="button" class="icon-btn" data-close-chat aria-label="Tutup"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6"/></svg></button></div>' +
      '<div class="chat-scroll"><p class="chat-note">Pesanan dibuat dan dibayar terus di troli. Chat ini untuk soalan.</p>' + bubbles + "</div>" +
      '<div class="chat-actions">' + (cart.length ? '<button type="button" class="btn btn-accent btn-block" data-chat-cart>Daftar keluar</button>' :
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

})();
