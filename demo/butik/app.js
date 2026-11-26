/* Maison Ve’ra demo shop. Plain script, no build step. */
(function () {
  "use strict";

  // Demo safety: checkout is simulated. The payment step asks for no card or bank details,
  // charges nothing and contacts no one. A real shop would hand off to a gateway (Billplz, Stripe).
  var FREE_POS_FROM = 250;

  // ---------- Colours (rona) ----------
  var R = {
    charcoal: ["Charcoal", "#1d1c1b"],
    smokeGrey: ["Smoke Grey", "#8a8c90"],
    fadedBlue: ["Faded Blue", "#9db3c9"],
    indigo: ["Indigo", "#2e3f5c"],
    sand: ["Sand", "#c8b49a"],
    cream: ["Cream", "#ece3d2"],
    ivory: ["Ivory", "#efe6d4"],
    milk: ["Milk White", "#f4f1ea"],
    camel: ["Camel", "#b07f52"],
    olive: ["Olive", "#5d6148"],
    espresso: ["Espresso", "#6b4a35"],
    blush: ["Blush Pink", "#e7b3b5"],
    emerald: ["Emerald", "#1f4f47"],
    silver: ["Silver", "#bfc0c4"],
    nude: ["Nude", "#d9bfa8"],
    chocolate: ["Chocolate", "#4a2f24"],
    rust: ["Rust", "#8d4630"],
    burgundy: ["Burgundy", "#5a2229"],
    cherry: ["Cherry", "#8f2a2a"],
    taupe: ["Taupe", "#a49a8f"],
    leopard: ["Leopard", "#a9774a"]
  };
  function rona(keys) { return keys.map(function (k) { return { key: k, name: R[k][0], hex: R[k][1] }; }); }

  var SZ = ["XS", "S", "M", "L", "XL"];
  var SZ_SELUAR = ["24", "26", "28", "30", "32"];
  var SZ_KASUT = ["36", "37", "38", "39", "40", "41"];
  var ONE = "One size";

  // ---------- Catalogue (first colour is the one in the photo) ----------
  var PRODUCTS = [
    { id: "trench-pasir", cat: "pakaian", name: "Belted Wool Jacket", price: 289, img: "trench-pasir",
      colours: rona(["chocolate", "charcoal", "camel"]), sizes: SZ,
      desc: "A soft-shouldered jacket with a tie waist, worn with matching wide trousers. A stone pendant finishes it.",
      spec: [["Fabric", "Wool and linen blend"], ["Fit", "Tie waist, hip length"], ["Care", "Dry clean recommended"]] },
    { id: "blazer-pasir", cat: "pakaian", name: "Belted Utility Jacket", price: 289, img: "blazer-pasir",
      colours: rona(["espresso", "charcoal", "olive"]), sizes: SZ,
      desc: "A stand collar jacket with an off-centre button front and a tie belt. Great over wide jeans.",
      spec: [["Fabric", "Brushed wool blend"], ["Fit", "Belted, hip length"], ["Care", "Dry clean recommended"]] },
    { id: "sut-krim", cat: "pakaian", name: "Chunky Knit Cardigan", price: 219, img: "sut-krim",
      colours: rona(["espresso", "camel", "cream"]), sizes: SZ,
      desc: "A chunky V-neck cardigan with a belted waist. Layer it over a check shirt for an easy autumn look.",
      spec: [["Fabric", "Wool and alpaca blend"], ["Fit", "Cropped, relaxed"], ["Care", "Hand wash, dry flat"]] },
    { id: "kot-unta", cat: "pakaian", name: "Tweed Funnel Neck Jacket", price: 309, img: "kot-unta",
      colours: rona(["smokeGrey", "camel", "charcoal"]), sizes: SZ,
      desc: "A cropped tweed jacket with a tall funnel neck and epaulettes. Pairs well with light wide jeans.",
      spec: [["Fabric", "Wool blend tweed, lined"], ["Fit", "Cropped, boxy"], ["Care", "Dry clean"]] },
    { id: "jaket-kulit", cat: "pakaian", name: "Brown V-Neck Knit", price: 189, img: "jaket-kulit",
      colours: rona(["chocolate", "camel", "smokeGrey"]), sizes: SZ,
      desc: "A relaxed V-neck knit worn over a crisp blue shirt. The collar and cuffs peek out just right.",
      spec: [["Fabric", "Merino wool blend"], ["Fit", "Relaxed"], ["Care", "Hand wash, dry flat"]] },
    { id: "seluar-lebar", cat: "pakaian", name: "Wide Charcoal Trousers", price: 189, img: "seluar-lebar",
      colours: rona(["charcoal", "smokeGrey", "chocolate"]), sizes: SZ,
      desc: "Fluid wide leg trousers with a high waist and front pleats. Worn here with a soft grey mohair knit.",
      spec: [["Fabric", "Wool blend flannel"], ["Waist", "High, side zip"], ["Care", "Dry clean recommended"]] },
    { id: "kait-krim", cat: "pakaian", name: "Grey Layered Knit", price: 169, img: "kait-krim",
      colours: rona(["smokeGrey", "cream", "chocolate"]), sizes: SZ,
      desc: "A soft grey knit worn over a striped shirt, sleeves pushed up. A long pendant finishes it.",
      spec: [["Fabric", "Cotton and wool blend"], ["Fit", "Relaxed"], ["Care", "Hand wash, dry flat"]] },
    { id: "beg-karat", cat: "beg", name: "Structured Top Handle Bag", price: 459, img: "beg-karat",
      colours: rona(["rust", "espresso", "charcoal"]), sizes: [ONE],
      desc: "A structured top handle bag with a strap closure and a little padlock charm. Holds a tablet, wallet and keys.",
      spec: [["Material", "Pebbled faux leather"], ["Size", "30 x 22 x 16 cm"], ["Strap", "Top handles only"]] },
    { id: "beg-kroko", cat: "beg", name: "Croc Effect Top Handle Bag", price: 429, img: "beg-kroko",
      colours: rona(["espresso", "charcoal", "camel"]), sizes: [ONE],
      desc: "Glossy croc effect leather in deep espresso, with gold-tone hardware. Dressy enough for a dinner out.",
      spec: [["Material", "Croc embossed faux leather"], ["Size", "28 x 20 x 14 cm"], ["Strap", "Top handles only"]] },
    { id: "beg-zamrud", cat: "beg", name: "Quilted Sofa Bag", price: 319, img: "beg-zamrud",
      colours: rona(["emerald", "espresso", "cream"]), sizes: [ONE],
      desc: "A playful little bag shaped like a sofa, with contrast stitching and a slim shoulder strap.",
      spec: [["Material", "Soft faux leather"], ["Size", "24 x 16 x 9 cm"], ["Strap", "Shoulder, 50 cm drop"]] },
    { id: "beg-merah", cat: "beg", name: "Drawstring Pouch Bag", price: 219, img: "beg-merah",
      colours: rona(["cherry", "espresso", "cream"]), sizes: [ONE],
      desc: "A soft drawstring pouch with a knotted handle. Swings from the wrist and fits your phone and lipstick.",
      spec: [["Material", "Smooth faux leather"], ["Size", "18 x 20 cm"], ["Closure", "Drawstring"]] },
    { id: "beg-taupe", cat: "beg", name: "Taupe Shoulder Bag", price: 279, img: "beg-taupe",
      colours: rona(["taupe", "charcoal", "cream"]), sizes: [ONE],
      desc: "A clean shoulder bag in soft taupe with a slim strap that sits close under the arm.",
      spec: [["Material", "Smooth faux leather"], ["Size", "30 x 18 x 8 cm"], ["Strap", "Shoulder, 24 cm drop"]] },
    { id: "beg-hitam", cat: "beg", name: "Curved Shoulder Bag", price: 299, img: "beg-hitam",
      colours: rona(["charcoal", "espresso", "cream"]), sizes: [ONE],
      desc: "A crescent shaped shoulder bag in black with a gold-tone toggle. Polished with tailoring or denim.",
      spec: [["Material", "Smooth faux leather"], ["Size", "32 x 16 x 7 cm"], ["Strap", "Shoulder, 22 cm drop"]] },
    { id: "beg-krim", cat: "beg", name: "Knot Handle Bag", price: 249, img: "beg-krim",
      colours: rona(["cream", "taupe", "charcoal"]), sizes: [ONE],
      desc: "A slouchy bag in cream with a knotted handle. Soft, light and easy to carry all day.",
      spec: [["Material", "Soft faux leather"], ["Size", "26 x 18 x 12 cm"], ["Strap", "Knotted top handle"]] },
    { id: "kasut-but-merah", cat: "kasut", name: "Patent Knee Boots", price: 399, img: "kasut-but-merah",
      colours: rona(["burgundy", "charcoal", "espresso"]), sizes: SZ_KASUT,
      desc: "High shine knee boots in burgundy patent on a slim 8 cm heel. The statement piece of the season.",
      spec: [["Material", "Faux patent leather"], ["Heel", "8 cm, slim"], ["Shaft", "Knee high, side zip"]] },
    { id: "kasut-but-coklat", cat: "kasut", name: "Lace-Up Lug Boots", price: 329, img: "kasut-but-coklat",
      colours: rona(["espresso", "charcoal", "sand"]), sizes: SZ_KASUT,
      desc: "Chunky lace-up boots on a lug sole in dark brown leather. Ready for rain and long city days.",
      spec: [["Material", "Faux leather"], ["Heel", "4 cm, lug sole"], ["Fastening", "Laces and side zip"]] },
    { id: "kasut-leopard", cat: "kasut", name: "Leopard Mary Janes", price: 249, img: "kasut-leopard",
      colours: rona(["leopard", "charcoal", "espresso"]), sizes: SZ_KASUT,
      desc: "Soft leopard print Mary Janes with a slim ankle strap. A low heel that goes with everything.",
      spec: [["Material", "Faux calf hair"], ["Heel", "2 cm"], ["Fastening", "Buckle strap"]] },
    { id: "kasut-zaitun", cat: "kasut", name: "Metal Toe Slingbacks", price: 279, img: "kasut-zaitun",
      colours: rona(["olive", "charcoal", "nude"]), sizes: SZ_KASUT,
      desc: "Pointed slingbacks in olive satin with a gold-tone metal toe cap on a slim kitten heel.",
      spec: [["Material", "Satin upper"], ["Heel", "5 cm, kitten"], ["Toe", "Metal cap"]] },
    { id: "kasut-tali", cat: "kasut", name: "Thong Kitten Heels", price: 229, img: "kasut-tali",
      colours: rona(["espresso", "charcoal", "nude"]), sizes: SZ_KASUT,
      desc: "Minimal thong sandals in brown leather on a low kitten heel. Holiday ready, office friendly.",
      spec: [["Material", "Faux leather"], ["Heel", "5 cm, kitten"], ["Sole", "Non slip rubber"]] },
    { id: "kasut-suede", cat: "kasut", name: "Suede Slingbacks", price: 259, img: "kasut-suede",
      colours: rona(["taupe", "espresso", "charcoal"]), sizes: SZ_KASUT,
      desc: "Pointed slingbacks in taupe suede on a low block heel. Soft, quiet and easy to walk in.",
      spec: [["Material", "Faux suede"], ["Heel", "4 cm, block"], ["Strap", "Elastic slingback"]] },
    { id: "kasut-mule", cat: "kasut", name: "Bar Mule Sandals", price: 239, img: "kasut-mule",
      colours: rona(["burgundy", "espresso", "nude"]), sizes: SZ_KASUT,
      desc: "Open toe mules in burgundy leather with a slim gold-tone bar across the strap, on a curved 7 cm heel.",
      spec: [["Material", "Smooth faux leather"], ["Heel", "7 cm, curved"], ["Sole", "Non slip rubber"]] },
    { id: "kasut-paten", cat: "kasut", name: "Patent Point Slingbacks", price: 299, img: "kasut-paten",
      colours: rona(["espresso", "charcoal", "burgundy"]), sizes: SZ_KASUT,
      desc: "Sharp pointed slingbacks in glossy espresso patent on a slim 9 cm heel. Evening ready.",
      spec: [["Material", "Faux patent leather"], ["Heel", "9 cm, stiletto"], ["Strap", "Elastic slingback"]] }
  ];
  var TAGS = {
    baru: ["sut-krim", "kot-unta", "kait-krim", "trench-pasir", "beg-krim", "beg-merah", "kasut-leopard", "kasut-zaitun"]
  };
  var CAT_TITLE = { semua: "All products", baru: "New in", pakaian: "Clothing", beg: "Handbags", kasut: "Heels" };
  var byId = {};
  PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  function inCat(p, cat) { return cat === "semua" || p.cat === cat || (TAGS[cat] && TAGS[cat].indexOf(p.id) > -1); }
  function imgSrc(p) { return "img/" + p.img + ".webp"; }

  // Seed stock per product and size. A few low and sold out sizes so the owner view has something to flag.
  var STOCK_SEED = {
    "trench-pasir": { XS: 3, S: 5, M: 6, L: 4, XL: 2 },
    "blazer-pasir": { XS: 4, S: 7, M: 8, L: 5, XL: 3 },
    "sut-krim": { XS: 1, S: 2, M: 1, L: 0, XL: 1 },
    "kot-unta": { XS: 3, S: 6, M: 7, L: 4, XL: 2 },
    "jaket-kulit": { XS: 5, S: 9, M: 11, L: 7, XL: 4 },
    "seluar-lebar": { XS: 6, S: 9, M: 10, L: 7, XL: 4 },
    "kait-krim": { XS: 2, S: 3, M: 2, L: 0, XL: 0 },
    "beg-karat": { "One size": 3 },
    "beg-kroko": { "One size": 6 },
    "beg-zamrud": { "One size": 0 },
    "beg-merah": { "One size": 12 },
    "beg-taupe": { "One size": 9 },
    "beg-hitam": { "One size": 14 },
    "beg-krim": { "One size": 7 },
    "kasut-but-merah": { "36": 2, "37": 4, "38": 3, "39": 2, "40": 1, "41": 0 },
    "kasut-but-coklat": { "36": 4, "37": 6, "38": 8, "39": 6, "40": 4, "41": 2 },
    "kasut-leopard": { "36": 5, "37": 7, "38": 9, "39": 6, "40": 3, "41": 2 },
    "kasut-zaitun": { "36": 1, "37": 2, "38": 1, "39": 0, "40": 1, "41": 0 },
    "kasut-tali": { "36": 5, "37": 8, "38": 9, "39": 7, "40": 4, "41": 2 },
    "kasut-suede": { "36": 4, "37": 6, "38": 7, "39": 5, "40": 3, "41": 1 },
    "kasut-mule": { "36": 3, "37": 5, "38": 6, "39": 4, "40": 2, "41": 1 },
    "kasut-paten": { "36": 2, "37": 3, "38": 4, "39": 3, "40": 1, "41": 0 }
  };

  // Seed orders: sample data for the owner view, dated relative to today.
  function daysAgo(d, h, m) { var t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, m, 0, 0); return t.toISOString(); }
  var SEED_ORDERS = [
    { at: daysAgo(0, 9, 42), name: "Nur Aisyah", phone: "012 xxx 4471", area: "Shah Alam", pos: "semenanjung", pay: "fpx", pick: "Maybank2u",
      items: [{ id: "trench-pasir", c: "Chocolate", s: "M", q: 1 }, { id: "kait-krim", c: "Smoke Grey", s: "S", q: 1 }], status: "Paid" },
    { at: daysAgo(0, 8, 15), name: "Siti Hajar", phone: "019 xxx 2208", area: "Kuantan", pos: "semenanjung", pay: "dompet", pick: "Touch 'n Go eWallet",
      items: [{ id: "kot-unta", c: "Smoke Grey", s: "S", q: 1 }, { id: "beg-hitam", c: "Charcoal", s: "One size", q: 1 }], status: "Paid" },
    { at: daysAgo(1, 21, 3), name: "Farah Nadia", phone: "013 xxx 9150", area: "Kuching", pos: "sabahsarawak", pay: "atome", pick: "",
      items: [{ id: "sut-krim", c: "Espresso", s: "M", q: 1 }, { id: "seluar-lebar", c: "Charcoal", s: "S", q: 1 }], status: "Packed" },
    { at: daysAgo(1, 14, 27), name: "Amira Zulaikha", phone: "011 xxx 6632", area: "Ipoh", pos: "semenanjung", pay: "kad", pick: "",
      items: [{ id: "blazer-pasir", c: "Camel", s: "S", q: 1 }], status: "Shipped" },
    { at: daysAgo(2, 11, 50), name: "Hidayah Rahman", phone: "017 xxx 0384", area: "Shah Alam", pos: "ambil", pay: "duitnow", pick: "",
      items: [{ id: "kasut-tali", c: "Espresso", s: "38", q: 1 }], status: "Shipped" },
    { at: daysAgo(3, 16, 8), name: "Liyana Ismail", phone: "016 xxx 7719", area: "Johor Bahru", pos: "semenanjung", pay: "fpx", pick: "CIMB Clicks",
      items: [{ id: "seluar-lebar", c: "Charcoal", s: "M", q: 1 }, { id: "kot-unta", c: "Smoke Grey", s: "M", q: 1 }], status: "Shipped" }
  ];
  // Sample orders use the same number format as new ones (MV + month + day + sequence).
  SEED_ORDERS.forEach(function (o, i) {
    var d = new Date(o.at);
    o.id = "MV" + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + String(i + 1).padStart(2, "0"); // taste-skill-ignore
  });

  var POS = {
    semenanjung: { label: "Peninsular shipping", fee: 8 },
    sabahsarawak: { label: "Sabah and Sarawak shipping", fee: 15 },
    ambil: { label: "Pick up in Shah Alam", fee: 0 }
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

  var stock = load("rk4_stock", null) || JSON.parse(JSON.stringify(STOCK_SEED));
  var cart = load("rk4_cart", []).filter(function (l) { return byId[l.id]; });
  var myOrders = load("rk4_orders", []);
  var statusOverride = load("rk4_status", {});

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
    toastEl.innerHTML = "<span>" + esc(msg) + "</span>" + (withCart ? '<button type="button" data-open-cart>View bag</button>' : "");
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }

  // ---------- Catalogue grid ----------
  var grid = $("[data-grid]");
  var currentCat = "semua";

  function stockFlag(p) {
    var t = totalStock(p.id);
    if (t === 0) return "Sold out";
    if (t <= 8) return "Few left";
    return "";
  }

  function renderGrid() {
    var list = PRODUCTS.filter(function (p) { return inCat(p, currentCat); });
    grid.innerHTML = list.map(function (p, i) {
      var flag = stockFlag(p);
      return '<li class="card enter" style="animation-delay:' + i * 50 + 'ms" data-id="' + p.id + '">' +
        '<button class="card-pic" type="button" data-open="' + p.id + '" aria-label="Choose colour and size for ' + esc(p.name) + '">' +
        '<img src="' + imgSrc(p) + '" width="800" height="1000" loading="lazy" alt="' + esc(p.name) + ", " + esc(p.colours[0].name) + '">' +
        (flag ? '<span class="card-flag">' + flag + "</span>" : "") +
        '<span class="card-add" aria-hidden="true">+</span></button>' +
        '<div class="card-txt"><h3 class="card-name"><button type="button" data-open="' + p.id + '">' + esc(p.name) + "</button></h3>" +
        '<div class="card-meta"><span class="card-price">' + rm(p.price) + "</span>" +
        '<span class="dots" aria-label="' + p.colours.length + ' colours">' + p.colours.map(function (c) {
          return '<span class="dot" title="' + esc(c.name) + '"><span style="background:' + c.hex + '"></span></span>';
        }).join("") + "</span></div></div></li>";
    }).join("");
  }

  function setCat(cat) {
    currentCat = cat;
    $all(".tabs [data-cat]").forEach(function (o) { o.setAttribute("aria-selected", String(o.dataset.cat === cat)); });
    var t = $("[data-koleksi-title]"); if (t) t.textContent = CAT_TITLE[cat] || "All products";
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
      '<div class="sheet-pic"><img src="' + imgSrc(p) + '" width="800" height="1000" alt="' + esc(p.name) + ", " + esc(p.colours[0].name) + '">' +
      '<button type="button" class="sheet-close" data-close-sheet aria-label="Close">&times;</button>' +
      '<span class="sheet-note">Shown in: ' + esc(p.colours[0].name) + "</span></div>" +
      '<div class="sheet-body">' +
      '<div><h2 class="sheet-title" id="pv-title" tabindex="-1">' + esc(p.name) + '</h2><p class="sheet-price">' + rm(p.price) + "</p></div>" +
      '<div><p class="opt-label"><span>Colour: <b>' + esc(c.name) + "</b></span></p>" +
      '<div class="chips" role="group" aria-label="Choose colour">' + p.colours.map(function (o, j) {
        return '<button type="button" class="chip chip-colour" data-ci="' + j + '" aria-pressed="' + (j === sel.ci) + '" aria-label="' + esc(o.name) + '" title="' + esc(o.name) + '"><i style="background:' + o.hex + '"></i></button>';
      }).join("") + "</div></div>" +
      '<div><p class="opt-label"><span>Size' + (sel.size ? ": <b>" + esc(sel.size) + "</b>" : "") + "</span></p>" +
      '<div class="chips" role="group" aria-label="Choose size">' + p.sizes.map(function (s) {
        var n = stockOf(p.id, s) - inCart(p.id, s);
        return '<button type="button" class="chip" data-size="' + esc(s) + '" aria-pressed="' + (s === sel.size) + '"' + (n <= 0 ? " disabled" : "") + ">" + esc(s) +
          (n > 0 && n <= 2 ? " <small>" + n + " left</small>" : "") + "</button>";
      }).join("") + "</div>" +
      (p.cat === "pakaian" ? '<details class="size-guide"' + (guideOpen ? " open" : "") + '><summary>Size guide</summary>' + sizeTableHTML() + "</details>" : "") +
      "</div>" +
      '<p class="sheet-desc">' + esc(p.desc) + "</p>" +
      '<dl class="spec">' + p.spec.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" +
      '<p class="sheet-msg ' + (kind || "") + '" role="status">' + (msg || "") + "</p>" +
      "</div></div>" +
      '<div class="sheet-buy"><div class="stepper" role="group" aria-label="Kuantiti">' +
      '<button type="button" data-q="-1" aria-label="One less">&minus;</button><output aria-live="polite">' + sel.qty + "</output>" +
      '<button type="button" data-q="1" aria-label="One more">+</button></div>' +
      '<button type="button" class="btn btn-solid" data-add' + (canBuy ? "" : " disabled") + ">" +
      (sel.size ? (left > 0 ? "Add to bag &middot; " + rm(p.price * sel.qty) : "This size is sold out") : "Choose a size first") + "</button></div>";
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
      sel.qty = nq; renderSheet(capped ? "Only " + max + " left in this size." : "", capped ? "err" : "");
      $('[data-q="' + q.dataset.q + '"]', sheet).focus(); return;
    }
    if (e.target.closest("[data-add]")) {
      addToCart(p, p.colours[sel.ci].name, sel.size, sel.qty);
      closeProduct();
      toast("Added to your bag", true);
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
    fpx: { label: "FPX online banking", sub: "Choose your bank in the next step", picks: ["Maybank2u", "CIMB Clicks", "Public Bank", "RHB", "Bank Islam", "Hong Leong", "AmBank", "BSN"] },
    kad: { label: "Credit or debit card", sub: "Visa and Mastercard" },
    duitnow: { label: "DuitNow QR", sub: "Scan with any banking or e-wallet app" },
    dompet: { label: "E-wallet", sub: "Touch 'n Go eWallet, GrabPay, ShopeePay", picks: ["Touch 'n Go eWallet", "GrabPay", "ShopeePay"] },
    atome: { label: "Atome", sub: "Pay in 3, interest free" }
  };
  var STEP_TITLE = { troli: "Bag", checkout: "Checkout", gateway: "Payment", processing: "Payment", done: "Order confirmed" };

  function addToCart(p, colour, size, qty) {
    var line = cart.filter(function (l) { return l.id === p.id && l.colour === colour && l.size === size; })[0];
    if (line) line.qty += qty; else cart.push({ id: p.id, colour: colour, size: size, qty: qty });
    save("rk4_cart", cart);
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
    return '<div class="steps" aria-hidden="true">' + ["Bag", "Details", "Pay", "Done"].map(function (s, i) {
      return '<span class="' + (i < n ? "on" : "") + '">' + s + "</span>";
    }).join("") + "</div>";
  }
  function freeBar(sub) {
    var left = FREE_POS_FROM - sub;
    var pct = Math.min(100, Math.round(sub / FREE_POS_FROM * 100));
    return '<div class="freebar">' + (left > 0 ? "Add " + rm(left) + " more for free Peninsular shipping." : "You get free Peninsular shipping.") +
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
      step = "troli"; cartTitle.textContent = "Bag";
      cartBody.innerHTML = '<div class="empty"><p>Your bag is empty.</p><button type="button" class="btn btn-solid" data-close-cart data-goto="#koleksi">Browse the collection</button></div>';
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
          '<p class="line-opts">' + esc(l.colour) + ", size " + esc(l.size) + "</p>" +
          '<div class="line-row"><div class="stepper" role="group" aria-label="Kuantiti ' + esc(p.name) + '">' +
          '<button type="button" data-lq="-1" data-l="' + i + '" aria-label="One less">&minus;</button><output>' + l.qty + "</output>" +
          '<button type="button" data-lq="1" data-l="' + i + '" aria-label="One more">+</button></div>' +
          "<b>" + rm(p.price * l.qty) + "</b></div>" +
          '<button type="button" class="rm" data-rm="' + i + '">Remove</button></div></li>';
      }).join("") + "</ul>" +
      '<dl class="sum"><dt class="total">Subtotal</dt><dd class="total">' + rm2(sub) + "</dd></dl>" +
      '<p class="fine">Shipping is worked out at checkout. Pay with FPX, card, DuitNow QR, e-wallet or Atome.</p>';
    setFoot('<button type="button" class="btn btn-solid btn-block" data-go="checkout">Checkout &middot; ' + rm2(sub) + "</button>");
  }

  function summaryBlock(open) {
    var sub = subtotal(), fee = posFee(form.pos, sub);
    return '<details class="co-sum"' + (open ? " open" : "") + '><summary><span>Order summary</span><b>' + rm2(sub + fee) + "</b></summary>" +
      '<ul class="co-lines">' + cart.map(function (l) {
        var p = byId[l.id];
        return '<li><span class="co-pic"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><i>' + l.qty + "</i></span><span>" + esc(p.name) + "<small>" + esc(l.colour) + ", " + esc(l.size) + "</small></span><b>" + rm2(p.price * l.qty) + "</b></li>";
      }).join("") + "</ul>" +
      '<dl class="sum"><dt>Subtotal</dt><dd>' + rm2(sub) + "</dd><dt>" + esc(POS[form.pos].label) + "</dt><dd>" + (fee ? rm2(fee) : "Free") +
      '</dd><dt class="total">Total</dt><dd class="total">MYR ' + rm2(sub + fee) + "</dd></dl></details>";
  }

  function renderCheckout(errors) {
    var sub = subtotal(), t = total();
    var ship = form.pos !== "ambil";
    cartBody.innerHTML = stepsBar(2) +
      '<button type="button" class="back" data-go="troli">&larr; Back to bag</button>' +
      summaryBlock(false) +
      '<form class="form" novalidate data-form id="co-form">' +
      '<fieldset><legend>Contact</legend>' +
      field("email", "Email for your receipt", textIn("email", "email", "email", ' inputmode="email" placeholder="name@example.com"', errors.email), errors.email) +
      field("phone", "Phone number for the courier", textIn("phone", "tel", "tel", ' inputmode="tel" placeholder="012 345 6789"', errors.phone), errors.phone) +
      "</fieldset>" +
      '<fieldset><legend>Shipping</legend>' + Object.keys(POS).map(function (k) {
        var f = posFee(k, sub);
        return '<label class="radio"><input type="radio" name="pos" value="' + k + '"' + (form.pos === k ? " checked" : "") + "><span>" + POS[k].label + "</span><span>" + (f ? rm(f) : "Free") + "</span></label>";
      }).join("") + "</fieldset>" +
      '<fieldset><legend>' + (ship ? "Delivery address" : "Who is collecting") + "</legend>" +
      field("name", "Full name", textIn("name", "text", "name", "", errors.name), errors.name) +
      (ship ?
        field("address", "Address", textIn("address", "text", "street-address", ' placeholder="House number, street, area"', errors.address), errors.address) +
        '<div class="fld-row">' +
        field("postcode", "Postcode", textIn("postcode", "text", "postal-code", ' inputmode="numeric" maxlength="5"', errors.postcode), errors.postcode) +
        field("city", "City", textIn("city", "text", "address-level2", "", errors.city), errors.city) + "</div>" +
        field("state", "State", '<select id="f-state" name="state" autocomplete="address-level1">' + STATES.map(function (s) {
          return "<option" + (s === form.state ? " selected" : "") + ">" + s + "</option>";
        }).join("") + "</select>", "") : '<p class="fine">Collect from our studio in Shah Alam, Monday to Saturday, 10am to 6pm. We will text you when it is ready.</p>') +
      "</fieldset>" +
      '<fieldset><legend>Payment</legend><p class="fine">All transactions are secure and encrypted.</p>' + Object.keys(PAY).map(function (k) {
        var sub2 = k === "atome" ? "3 payments of " + rm2(Math.ceil(t / 3 * 100) / 100) + ", interest free" : PAY[k].sub;
        return '<label class="radio pay"><input type="radio" name="pay" value="' + k + '"' + (form.pay === k ? " checked" : "") + "><span>" + PAY[k].label + "<small>" + esc(sub2) + "</small></span></label>";
      }).join("") + "</fieldset>" +
      field("note", "Note for the shop (optional)", textIn("note", "text", "off", ' placeholder="For example: it is a gift, please wrap"', ""), "") +
      '<p class="fine">Demo site: the next payment step asks for no card number or bank login, and nothing is charged.</p>' +
      "</form>";
    setFoot('<button type="submit" form="co-form" class="btn btn-accent btn-block">Pay now &middot; ' + rm2(t) + "</button>");
  }

  function renderGateway(errors) {
    var t = total(), m = PAY[form.pay];
    var body = "";
    if (m.picks) {
      if (m.picks.indexOf(form.pick) < 0) form.pick = "";
      body = '<p class="gw-ask">' + (form.pay === "fpx" ? "Choose your bank" : "Choose your e-wallet") + '</p><div class="gw-picks" role="radiogroup" aria-label="' + (form.pay === "fpx" ? "Bank" : "E-wallet") + '">' +
        m.picks.map(function (b) { return '<button type="button" role="radio" aria-checked="' + (b === form.pick) + '" data-pick="' + esc(b) + '">' + esc(b) + "</button>"; }).join("") + "</div>" +
        '<p class="field-err" role="alert">' + (errors.pick || "") + "</p>";
    } else if (form.pay === "kad") {
      body = '<div class="gw-card"><span>Visa / Mastercard</span><b>&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242</b><small>Sample card. This demo never asks for a real card number.</small></div>';
    } else if (form.pay === "duitnow") {
      body = '<div class="gw-qr"><svg viewBox="0 0 21 21" aria-hidden="true" shape-rendering="crispEdges">' + fakeQr() + '</svg><small>Sample only, this code cannot be scanned.</small></div>';
    } else if (form.pay === "atome") {
      var part = Math.ceil(t / 3 * 100) / 100;
      body = '<ol class="gw-plan">' + [0, 1, 2].map(function (i) {
        var d = new Date(); d.setMonth(d.getMonth() + i);
        return "<li><span>" + (i === 0 ? "Today" : d.toLocaleDateString("en-MY", { day: "numeric", month: "long" })) + "</span><b>" + rm2(i < 2 ? part : Math.round((t - part * 2) * 100) / 100) + "</b></li>";
      }).join("") + "</ol>";
    }
    cartBody.innerHTML = stepsBar(3) +
      '<div class="gw">' +
      '<div class="gw-top"><span class="gw-tag">Demo payment gateway</span><span>Maison Ve’ra</span></div>' +
      '<p class="gw-amt"><small>Amount</small>MYR ' + rm2(t).replace("RM", "") + "</p>" +
      '<p class="gw-via">' + esc(m.label) + "</p>" + body + "</div>" +
      '<p class="fine">In a real shop this step is handled by a payment gateway such as Billplz or Stripe. In this demo, press Approve to see what happens after a successful payment.</p>';
    setFoot('<button type="button" class="btn btn-accent btn-block" data-approve>Approve payment &middot; ' + rm2(t) + "</button>" +
      '<button type="button" class="btn btn-block link" style="min-height:44px" data-go="checkout">Cancel and go back</button>');
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
    cartBody.innerHTML = stepsBar(3) + '<div class="gw-wait" role="status"><span class="spin" aria-hidden="true"></span><p>Confirming payment</p><small>Please keep this window open.</small></div>';
    setFoot("");
  }

  function readForm() {
    var f = $("[data-form]", cartBody);
    if (!f) return;
    ["email", "phone", "name", "address", "postcode", "city", "state", "note"].forEach(function (k) { if (f.elements[k]) form[k] = f.elements[k].value; });
    var r = f.querySelector('input[name="pos"]:checked'); if (r) form.pos = r.value;
    var p = f.querySelector('input[name="pay"]:checked'); if (p) form.pay = p.value;
    save("rk4_form", { email: form.email, phone: form.phone, name: form.name, address: form.address, postcode: form.postcode, city: form.city, state: form.state, pos: form.pos, pay: form.pay });
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
      if (PAY[form.pay].picks && !form.pick) { renderGateway({ pick: form.pay === "fpx" ? "Please choose a bank first." : "Please choose an e-wallet first." }); return; }
      step = "processing"; renderCart();
      setTimeout(placeOrder, matchMedia("(prefers-reduced-motion: reduce)").matches ? 300 : 1600);
      return;
    }
    var b = e.target.closest("[data-lq]");
    if (b) {
      var l = cart[+b.dataset.l], d = +b.dataset.lq;
      var max = stockOf(l.id, l.size) - inCart(l.id, l.size) + l.qty;
      l.qty = Math.max(1, Math.min(max, l.qty + d));
      save("rk4_cart", cart); updateCount(); renderCart();
      var again = $('[data-lq="' + d + '"][data-l="' + b.dataset.l + '"]', cartBody); if (again) again.focus();
      return;
    }
    var r = e.target.closest("[data-rm]");
    if (r) { cart.splice(+r.dataset.rm, 1); save("rk4_cart", cart); updateCount(); renderCart(); return; }
    var g = e.target.closest("[data-goto]");
    if (g) { closeCart(); setCat("semua"); location.hash = g.dataset.goto; }
  });
  cartDlg.addEventListener("submit", function (e) {
    e.preventDefault();
    readForm();
    var errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "Please enter a valid email, for example name@example.com.";
    if (form.phone.replace(/\D/g, "").length < 9) errs.phone = "Please enter a phone number, for example 012 345 6789.";
    if (form.name.trim().length < 2) errs.name = "Please enter your full name.";
    if (form.pos !== "ambil") {
      if (form.address.trim().length < 6) errs.address = "Please enter your address.";
      if (!/^\d{5}$/.test(form.postcode.trim())) errs.postcode = "Postcode must be 5 digits.";
      if (form.city.trim().length < 2) errs.city = "Please enter your city.";
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
  function payLabel(o) { return o.pay ? PAY[o.pay].label.replace(" online banking", "") + (o.pick ? ", " + o.pick : "") : ""; }

  function placeOrder() {
    var ship = form.pos !== "ambil";
    var o = {
      id: nextOrderId(), at: new Date().toISOString(),
      name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
      address: ship ? [form.address.trim(), form.postcode.trim() + " " + form.city.trim(), form.state].join(", ") : "",
      note: form.note.trim(), pos: form.pos, area: ship ? form.city.trim() + ", " + form.state : "Pick up",
      pay: form.pay, pick: PAY[form.pay].picks ? form.pick : "",
      items: cart.map(function (l) { return { id: l.id, c: l.colour, s: l.size, q: l.qty }; }),
      status: "Paid", mine: true
    };
    o.items.forEach(function (it) { if (stock[it.id] && it.s in stock[it.id]) stock[it.id][it.s] = Math.max(0, stock[it.id][it.s] - it.q); });
    myOrders.push(o);
    save("rk4_orders", myOrders); save("rk4_stock", stock);
    cart = []; save("rk4_cart", cart); updateCount();
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
    var day = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" }); };
    var ship = o.pos !== "ambil";
    var track = [
      ["Payment received", payLabel(o) + ", " + new Date(o.at).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" }), true],
      ["Packed", "Today", false],
      ship ? ["Shipped", "Tracking number sent by email and text", false] : ["Ready to collect", "We will text you when ready", false],
      ship ? ["Arrives", day(o.pos === "semenanjung" ? 2 : 4) + " to " + day(o.pos === "semenanjung" ? 4 : 7), false] : ["Collected", "Shah Alam studio", false]
    ];
    cartBody.innerHTML = stepsBar(4) +
      '<div class="done" data-done>' +
      '<p class="done-tick" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2"/></svg></p>' +
      '<h3 tabindex="-1">Thank you, ' + esc(o.name.split(" ")[0]) + "</h3>" +
      "<p>Order <b>" + esc(o.id) + "</b> is paid. Your receipt is on its way to <b>" + esc(o.email) + "</b>.</p>" +
      '<ol class="track">' + track.map(function (s) { return '<li class="' + (s[2] ? "on" : "") + '"><b>' + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></li>"; }).join("") + "</ol>" +
      '<ul class="co-lines">' + o.items.map(function (it) {
        var p = byId[it.id];
        return '<li><span class="co-pic"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><i>' + it.q + "</i></span><span>" + esc(p.name) + "<small>" + esc(it.c) + ", " + esc(it.s) + "</small></span><b>" + rm2(p.price * it.q) + "</b></li>";
      }).join("") + "</ul>" +
      '<dl class="sum"><dt>Subtotal</dt><dd>' + rm2(sub) + "</dd><dt>" + esc(POS[o.pos].label) + "</dt><dd>" + (fee ? rm2(fee) : "Free") + '</dd><dt class="total">Paid</dt><dd class="total">' + rm2(sub + fee) + "</dd></dl>" +
      (ship ? '<p class="fine"><b>Shipping to</b><br>' + esc(o.name) + ", " + esc(o.address) + "</p>" : "") +
      '<p class="fine">Demo: nothing was charged and no email was sent. This order is now in the <a href="#owner" data-close-cart>owner view</a> as Paid, and stock has been updated.</p>' +
      "</div>";
    setFoot('<button type="button" class="btn btn-solid btn-block" data-close-cart>Continue shopping</button>');
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-open-cart]")) { e.preventDefault(); openCart(); return; }
    var c = e.target.closest("[data-close-cart]");
    if (c) { if (c.getAttribute("href") !== "#owner") e.preventDefault(); closeCart(); }
  });

  var savedForm = load("rk4_form", null);
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
    var hm = d.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
    var dd = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
    if (dd === 0) return "Today, " + hm;
    if (dd === 1) return "Yesterday, " + hm;
    return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" }) + ", " + hm;
  }
  function lowList() {
    var out = [];
    PRODUCTS.forEach(function (p) { p.sizes.forEach(function (s) { var n = stockOf(p.id, s); if (n <= 2) out.push({ p: p, s: s, n: n }); }); });
    return out;
  }
  function waNum(phone) { var d = String(phone).replace(/\D/g, ""); if (d.charAt(0) === "0") d = "6" + d; return d; }

  function renderOwner() {
    var orders = allOrders().filter(function (o) { return o.items.every(function (it) { return byId[it.id]; }); });
    var baru = orders.filter(function (o) { return o.status === "Paid"; }).length;
    var belumPos = orders.filter(function (o) { return o.status !== "Shipped"; }).length;
    var week = orders.filter(function (o) { return Date.now() - new Date(o.at) < 7 * 864e5; }).reduce(function (a, o) { return a + orderTotal(o); }, 0);
    var lows = lowList();
    var outCount = lows.filter(function (l) { return l.n === 0; }).length;

    var html = '<div class="o-head"><a class="wordmark" href="#top">Maison Ve’ra</a><h1>Owner view</h1>' +
      '<a class="btn btn-solid" href="#top">Back to shop</a></div>' +
      '<p class="o-note">A sample screen for the shop owner. The first six orders are sample data. Orders you pay for in the bag in this browser land here straight away, highlighted, with the status Paid. Stock is updated automatically.</p>' +
      '<div class="o-stats">' +
      '<div class="o-stat' + (baru ? " alert" : "") + '"><b>' + baru + "</b><span>Paid, waiting to be packed</span></div>" +
      '<div class="o-stat"><b>' + belumPos + "</b><span>Not shipped yet</span></div>" +
      '<div class="o-stat"><b>' + rm(week) + "</b><span>Sales, last 7 days (sample data)</span></div>" +
      '<div class="o-stat' + (lows.length ? " alert" : "") + '"><b>' + lows.length + "</b><span>Sizes low on stock, " + outCount + " sold out</span></div></div>" +
      '<div class="tabs o-tabs" role="tablist" aria-label="Section">' +
      '<button role="tab" data-otab="pesanan" aria-selected="' + (ownerTab === "pesanan") + '">Orders (' + orders.length + ")</button>" +
      '<button role="tab" data-otab="stok" aria-selected="' + (ownerTab === "stok") + '">Stock</button></div>';

    if (ownerTab === "pesanan") {
      html += '<table class="o-table"><caption class="sr">Order list</caption><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col" class="num">Total</th><th scope="col">Status</th></tr></thead><tbody>' +
        orders.map(function (o) {
          return '<tr class="' + (o.mine ? "mine" : "") + '">' +
            '<td data-l="Order"><b>' + esc(o.id) + '</b><span class="o-sub">' + fmtDate(o.at) + "</span></td>" +
            '<td data-l="Customer">' + esc(o.name) + '<span class="o-sub">' + esc(o.phone) + (o.area ? ", " + esc(o.area) : "") + "</span>" +
            (o.mine ? '<a class="o-wa" href="https://wa.me/' + waNum(o.phone) + "?text=" + encodeURIComponent("Hi " + o.name + ", thank you. Order " + o.id + " is paid and being packed. We will send the tracking number as soon as it ships.") + '" target="_blank" rel="noopener">Reply on WhatsApp</a>' : "") + "</td>" +
            '<td data-l="Items"><div class="o-items">' + o.items.map(function (it) {
              var p = byId[it.id];
              return '<span class="o-item"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><span>' + it.q + " x " + esc(p.name) + "<small>" + esc(it.c) + ", " + esc(it.s) + "</small></span></span>";
            }).join("") + "<small>" + esc(POS[o.pos].label) + "</small></div></td>" +
            '<td data-l="Total" class="num">' + rm2(orderTotal(o)) + (o.pay ? '<span class="o-sub">' + esc(payLabel(o)) + "</span>" : "") + "</td>" +
            '<td data-l="Status"><select class="o-status" data-oid="' + esc(o.id) + '" data-s="' + o.status + '" aria-label="Status ' + esc(o.id) + '">' +
            ["Paid", "Packed", "Shipped"].map(function (s) { return "<option" + (s === o.status ? " selected" : "") + ">" + s + "</option>"; }).join("") +
            "</select></td></tr>";
        }).join("") + "</tbody></table>";
    } else {
      html += '<table class="o-table"><caption class="sr">Stock by product and size</caption><thead><tr><th scope="col">Product</th><th scope="col">Stock by size</th><th scope="col" class="num">Total</th></tr></thead><tbody>' +
        PRODUCTS.map(function (p) {
          var t = totalStock(p.id);
          var lowN = p.sizes.filter(function (s) { var n = stockOf(p.id, s); return n > 0 && n <= 2; }).length;
          var outN = p.sizes.filter(function (s) { return stockOf(p.id, s) === 0; }).length;
          return "<tr>" +
            '<td data-l="Product"><div class="o-prod"><img src="' + imgSrc(p) + '" alt="" loading="lazy"><div>' + esc(p.name) + '<span class="o-sub">' + rm(p.price) + ", " + CAT_TITLE[p.cat] + "</span>" +
            (outN ? '<span class="flag out">' + outN + " sizes sold out</span>" : "") + (lowN ? '<span class="flag low">' + lowN + " sizes low</span>" : "") + "</div></div></td>" +
            '<td data-l="Stock by size"><div class="o-sizes">' + p.sizes.map(function (s) {
              var n = stockOf(p.id, s);
              return '<span class="o-size' + (n === 0 ? " out" : n <= 2 ? " low" : "") + '"><button type="button" data-st="' + p.id + '" data-sz="' + esc(s) + '" data-d="-1" aria-label="Lower stock for ' + esc(p.name) + " size " + esc(s) + '">&minus;</button>' +
                "<span>" + esc(s) + " <b>" + n + "</b></span>" +
                '<button type="button" data-st="' + p.id + '" data-sz="' + esc(s) + '" data-d="1" aria-label="Raise stock for ' + esc(p.name) + " size " + esc(s) + '">+</button></span>';
            }).join("") + "</div></td>" +
            '<td data-l="Total" class="num">' + t + "</td></tr>";
        }).join("") + "</tbody></table>";
    }
    html += '<div class="o-foot"><p>Low stock means 2 pieces or fewer in a size.</p><button type="button" data-reset>Reset demo data</button>' +
      '<p>Demo by <a href="https://irfanhakimi.com/kerja/">Irfan Hakimi</a></p></div>';
    ownerEl.innerHTML = html;
  }

  ownerEl.addEventListener("click", function (e) {
    var t = e.target.closest("[data-otab]");
    if (t) { ownerTab = t.dataset.otab; renderOwner(); $('[data-otab="' + ownerTab + '"]', ownerEl).focus(); return; }
    var st = e.target.closest("[data-st]");
    if (st) {
      var id = st.dataset.st, sz = st.dataset.sz, d = +st.dataset.d;
      stock[id][sz] = Math.max(0, (stock[id][sz] || 0) + d);
      save("rk4_stock", stock); renderOwner(); renderGrid();
      var again = $('[data-st="' + id + '"][data-sz="' + cssEsc(sz) + '"][data-d="' + d + '"]', ownerEl); if (again) again.focus();
      return;
    }
    if (e.target.closest("[data-reset]")) {
      if (!window.confirm("Reset the demo orders, stock and bag in this browser?")) return;
      ["rk4_stock", "rk4_orders", "rk4_status", "rk4_cart", "rk4_form"].forEach(function (k) { try { localStorage.removeItem(k); } catch (er) { /* ignore */ } });
      stock = JSON.parse(JSON.stringify(STOCK_SEED)); myOrders = []; statusOverride = {}; cart = [];
      updateCount(); renderOwner(); renderGrid();
    }
  });
  ownerEl.addEventListener("change", function (e) {
    var s = e.target.closest("[data-oid]");
    if (s) { statusOverride[s.dataset.oid] = s.value; save("rk4_status", statusOverride); renderOwner(); var a = $('[data-oid="' + s.dataset.oid + '"]', ownerEl); if (a) a.focus(); }
  });

  function route() {
    var owner = location.hash === "#owner";
    document.body.classList.toggle("is-owner", owner);
    ownerEl.hidden = !owner;
    if (owner) {
      closeProduct(); closeCart(); closeDlg(menuDlg);
      renderOwner();
      window.scrollTo(0, 0);
      document.title = "Owner view, Maison Ve’ra";
    } else {
      document.title = "Maison Ve’ra, womenswear, handbags and heels";
    }
  }
  window.addEventListener("hashchange", route);

  // ---------- Entrances ----------
  var revealTargets = $all(".sec-title, .sec-sub, .tile, .hero-copy > *, .edit-copy > *, .edit-pic, .slip, .perks li, .qa, .acc");
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
    var now = new Date().toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
    var last = myOrders.length ? myOrders[myOrders.length - 1] : null;
    var lastStatus = last ? (statusOverride[last.id] || last.status) : "";
    var bubbles = '<p class="bubble in">Hi, any questions about sizes, stock or your order? Ask here.<time>' + esc(now) + "</time></p>";
    if (last) {
      bubbles += '<p class="bubble">What is the status of order ' + esc(last.id) + "?<time>" + esc(now) + "</time></p>" +
        '<p class="bubble in">Order ' + esc(last.id) + " is <b>" + esc(lastStatus) + "</b>. " +
        (lastStatus === "Shipped" ? "The tracking number has been sent to " + esc(last.email || "your email") + "." : "We pack and ship within one working day.") + "<time>" + esc(now) + "</time></p>";
    } else {
      bubbles += '<p class="bubble">Will size M in the blazer fit a 36 inch bust?<time>' + esc(now) + "</time></p>" +
        '<p class="bubble in">Yes. Our blazers are cut loose, so pick S if you like a neater fit.<time>' + esc(now) + "</time></p>";
    }
    chatDlg.innerHTML = '<div class="chat-top"><div><h2 id="chat-title">Maison Ve’ra</h2><p>Demo. No messages are sent.</p></div>' +
      '<button type="button" class="icon-btn" data-close-chat aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6"/></svg></button></div>' +
      '<div class="chat-scroll"><p class="chat-note">Orders are placed and paid in the bag. This chat is for questions.</p>' + bubbles + "</div>" +
      '<div class="chat-actions">' + (cart.length ? '<button type="button" class="btn btn-accent btn-block" data-chat-cart>Checkout</button>' :
        '<a class="btn btn-solid btn-block" href="#koleksi" data-chat-shop>Browse the collection</a>') + "</div>";
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
