/* Chez Nous demo (Noir layout): plain JS, no build step.
   Bookings are kept in this browser (localStorage). Nothing is sent anywhere. */
(function () {
  "use strict";

  var CLOSED = [1, 2]; // Monday, Tuesday
  var DAYS_AHEAD = 42;
  var KEY = "chezNous.bookings.v1";
  var SEATINGS = { "18:00": "First seating, 6:00 PM", "20:45": "Second seating, 8:45 PM" };

  var DISHES = {
    thon: { name: "Thon cru, agrumes", price: "RM 58", img: "img/hero-tall.jpg", kind: "Entrée", desc: "Raw tuna cured lightly at the pass, toasted seeds, young herbs and a sharp citrus dressing.", alt: "Raw tuna topped with herbs in a stone bowl" },
    huitre: { name: "Huître, concombre", price: "RM 22 each", img: "img/c1.jpg", kind: "Entrée", desc: "Opened to order at the counter, with cucumber granité and a drop of shiso oil.", alt: "A chef dressing an oyster with a spoon" },
    crabe: { name: "Royale de crabe", price: "RM 48", img: "img/c2.jpg", kind: "Entrée", desc: "A soft crab custard with a quail egg and a crisp herb crumb.", alt: "Small white spheres placed on a crab custard on a blue plate" },
    consomme: { name: "Consommé de poisson", price: "RM 38", img: "img/c3.jpg", kind: "Entrée", desc: "A clear, deep fish broth with lemon verbena oil, poured at the counter.", alt: "A chef garnishing a small bowl of broth with herbs" },
    poulpe: { name: "Poulpe à la braise", price: "RM 88", img: "img/c4.jpg", kind: "Plat", desc: "Octopus braised slowly, then charred over the coals, with smoked chilli butter and bitter leaves.", alt: "Charred octopus topped with greens on a white plate" },
    boeuf: { name: "Contre-filet, jus au vin", price: "RM 178", img: "img/c5.jpg", kind: "Plat", desc: "Grass-fed striploin from the grill, a layered potato gratin and a red wine jus poured in front of you.", alt: "Sauce poured over plated beef and a potato terrine" },
    dome: { name: "Dôme pistache", price: "RM 36", img: "img/c6.jpg", kind: "Dessert", desc: "Pistachio mousse with an apricot centre, flowers and a little gold.", alt: "A green dome dessert topped with white flowers" },
    caramel: { name: "Caramel, sorbet goyave", price: "RM 34", img: "img/c7.jpg", kind: "Dessert", desc: "Salted butter caramel, guava sorbet and butterfly pea flowers.", alt: "Caramel and sorbet with purple flowers on a dark plate" },
    pomme: { name: "Pomme de pin chocolat", price: "RM 32", img: "img/petit.jpg", kind: "Dessert", desc: "Dark chocolate shell, coffee cream and cocoa crumb. Made for sharing.", alt: "A chocolate dessert shaped like a pinecone beside a candle" }
  };
  var SIGNATURES = ["thon", "crabe", "poulpe", "boeuf", "dome", "caramel"];
  var MENU = [
    { id: "entrees", title: "Entrées", lead: "Cold and warm, from the pass and the stove.", items: ["thon", "huitre", "crabe", "consomme"] },
    { id: "plats", title: "Plats", lead: "From the grill and the copper pans.", items: ["poulpe", "boeuf"] },
    { id: "desserts", title: "Desserts", lead: "Finished on the pastry marble.", items: ["dome", "caramel", "pomme"] },
    { id: "cave", title: "La cave", lead: "French wine by the glass, and pours without alcohol.", text: [
      ["Crémant de Bourgogne", "RM 48", "A glass to start, while the counter fills."],
      ["Wine pairing, five glasses", "RM 240", "Chosen for the seven-course menu, poured at your seat."],
      ["Without alcohol, five pours", "RM 120", "House cordials, teas and ferments made for each course."]
    ] }
  ];

  /* The room as built in Blender (model/scene.json, metres; y points to the kitchen).
     Ten seats around a U counter: 2 on the left arm, 6 along the front, 2 on the right arm. */
  var STATION_LONG = { grill: "the charcoal grill", stove: "the stove and the copper pans", pass: "the plating table, where every plate is finished", pastry: "the pastry marble" };
  var NOTES = {
    grill: "Closest to the charcoal grill. You feel the heat and watch the meat turned over the coals.",
    stove: "Facing the stove, where the sauces reduce in copper pans and the fish is cooked.",
    pass: "Right in front of the plating table, where the head chef finishes every plate before it is served.",
    pastry: "Beside the pastry marble. You watch the soufflé rise and the tarts glazed for dessert."
  };
  var SEAT_DEF = [[-4.22, 0.4, "grill", "Left arm"], [-4.22, -0.35, "grill", "Left arm"],
    [-2.25, -1.52, "grill", "Front"], [-1.35, -1.52, "grill", "Front"], [-0.45, -1.52, "pass", "Front"],
    [0.45, -1.52, "pass", "Front"], [1.35, -1.52, "stove", "Front"], [2.25, -1.52, "stove", "Front"],
    [4.22, -0.35, "pastry", "Right arm"], [4.22, 0.4, "pastry", "Right arm"]];
  var SEATS = SEAT_DEF.map(function (d, i) {
    return { id: "S" + String(i + 1).padStart(2, "0"), n: i + 1, x: d[0], y: d[1], station: d[2], side: d[3] };
  });
  var MAX_GUESTS = 10, WHOLE_FROM = 7;
  // Plan drawing (schematic, metres). Side seats are drawn a little further apart than in the room so they stay tappable.
  var PLAN = {
    x0: -4.8, x1: 4.8, y0: -2.0, y1: 4.45,
    kitchen: [["Grill", -4.2, -2.0], ["Stove", -1.2, 1.8], ["Pastry", 2.6, 4.0]], ky0: 3.3, ky1: 4.1,
    plating: [-3.6, 3.6, 1.35, 2.1], frame: [-4.6, 4.6, 1.2, 4.35],
    counter: [[-3.7, 3.7, -1.0, -0.35], [-3.7, -3.05, -0.37, 0.75], [3.05, 3.7, -0.37, 0.75]],
    lamps: [[-1.8, -0.62], [0, -0.62], [1.8, -0.62], [-3.38, 0.02], [3.38, 0.02]],
    seatY: { 1: 0.5, 2: -0.45, 9: -0.45, 10: 0.5 }
  };

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var viewImg = function (id) { return "img/view-" + id.toLowerCase() + ".jpg"; };
  var seatById = function (id) { return SEATS.filter(function (s) { return s.id === id; })[0]; };
  var allSeatIds = function () { return SEATS.map(function (s) { return s.id; }); };

  /* ── Live status in hero ──────────────────────────── */
  (function () {
    var now = new Date(), d = now.getDay(), h = now.getHours();
    var el = $("status"), t = $("statusText");
    if (CLOSED.indexOf(d) > -1) { el.classList.add("closed"); t.textContent = "Closed today · Back Wednesday at 6 PM"; }
    else if (h < 18) t.textContent = "Seatings tonight at 6:00 PM and 8:45 PM";
    else if (h < 23) t.textContent = "Kitchen open now · Last seating 8:45 PM";
    else { el.classList.add("closed"); t.textContent = CLOSED.indexOf((d + 1) % 7) > -1 ? "Closed now · Back Wednesday at 6 PM" : "Closed now · Back tomorrow at 6 PM"; }
    $("ticketStatus").parentNode.classList.toggle("closed", el.classList.contains("closed"));
  })();

  /* ── Header, mobile menu, sticky bar ───────────────── */
  var header = $("header"), toggle = $("menuToggle"), mobile = $("mobileMenu"), bar = $("bookBar");
  function setHeaderH() { document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px"); }
  setHeaderH();
  window.addEventListener("resize", setHeaderH);
  function setMenu(open) {
    header.classList.toggle("open", open);
    mobile.classList.toggle("open", open);
    document.body.classList.toggle("locked", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobile.querySelectorAll("a").forEach(function (a, i) { a.style.transitionDelay = open ? (0.05 + i * 0.03) + "s" : "0s"; });
  }
  toggle.addEventListener("click", function () { setMenu(!mobile.classList.contains("open")); });
  mobile.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });

  var heroMedia = $("heroMedia"), heroCopy = $("heroCopy");
  var drifts = document.querySelectorAll("[data-drift]");
  var statement = document.querySelector(".statement");
  var parallaxImgs = document.querySelectorAll(".parallax img");
  var navLinks = document.querySelectorAll(".nav-links a");
  var sections = Array.prototype.map.call(navLinks, function (a) { return document.querySelector(a.getAttribute("href")); });
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY, vh = window.innerHeight;
    header.classList.toggle("scrolled", y > 30);
    var menuOpen = mobile.classList.contains("open");
    header.classList.toggle("hide", !menuOpen && y > vh && y > lastY + 4);
    if (y < lastY - 4 || y < vh) header.classList.remove("hide");
    lastY = y;
    var show = y > vh * 0.7 && !document.body.classList.contains("locked");
    bar.classList.toggle("show", show);
    bar.setAttribute("aria-hidden", String(!show));
    bar.querySelector("button").tabIndex = show ? 0 : -1;
    var mid = vh * 0.35;
    sections.forEach(function (s, i) {
      if (!s) return;
      var r = s.getBoundingClientRect();
      navLinks[i].classList.toggle("active", r.top < mid && r.bottom > mid);
    });
    if (!reduce) {
      var p = Math.min(Math.max(y / vh, 0), 1);
      heroMedia.style.transform = "translate3d(0," + (p * 10) + "%,0)";
      heroCopy.style.transform = "translate3d(0," + (-70 * p) + "px,0)";
      heroCopy.style.opacity = String(Math.max(0, 1 - p / 0.75));
      var sr = statement.getBoundingClientRect();
      var sp = Math.min(Math.max((vh - sr.top) / (vh + sr.height), 0), 1);
      drifts.forEach(function (el) {
        var dir = Number(el.getAttribute("data-drift"));
        el.style.transform = "translate3d(" + (dir > 0 ? 4 - 26 * sp : -24 + 26 * sp) + "%,0,0)";
      });
      parallaxImgs.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var q = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        img.style.transform = "translate3d(0," + (q * -14) + "%,0)";
      });
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ── Embers over the hero (from the grill) ─────────── */
  (function () {
    var cv = $("embers");
    if (reduce || !cv.getContext) return;
    var ctx = cv.getContext("2d"), parts = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(init) { return { x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: Math.random() * 1.1 + 0.3, vy: Math.random() * 0.25 + 0.08, vx: (Math.random() - 0.5) * 0.15, life: Math.random() * 0.45 + 0.2, ph: Math.random() * 6.28 }; }
    size();
    var n = w < 768 ? 18 : 34;
    for (var i = 0; i < n; i++) parts.push(spawn(true));
    window.addEventListener("resize", size);
    new IntersectionObserver(function (es) { running = es[0].isIntersecting; if (running) requestAnimationFrame(tick); }).observe(cv);
    function tick(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      parts.forEach(function (p, i) {
        p.y -= p.vy; p.x += p.vx + Math.sin(t / 900 + p.ph) * 0.25;
        var a = Math.max(0, Math.min(1, p.y / h)) * p.life;
        if (p.y < -10) parts[i] = spawn(false);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = "rgba(240," + (190 + (p.r * 20 | 0)) + ",140," + a.toFixed(3) + ")";
        ctx.shadowColor = "rgba(217,160,102,.7)"; ctx.shadowBlur = 6;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ── Reveals ──────────────────────────────────────── */
  var revealEls = document.querySelectorAll(".reveal, .wipe");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add("in"); });

  /* ── Signature rail ───────────────────────────────── */
  var rail = $("rail"), railBar = $("railBar");
  rail.innerHTML = SIGNATURES.map(function (k) {
    var d = DISHES[k];
    return '<button type="button" class="card" data-dish="' + k + '"><img loading="lazy" src="' + d.img + '" alt="' + esc(d.alt) + '" width="900" height="1125"><span class="price">' + esc(d.price) + '</span><span class="body"><span class="kind label">' + esc(d.kind) + '</span><h3>' + esc(d.name) + "</h3><p>" + esc(d.desc) + "</p></span></button>";
  }).join("");
  function railProgress() {
    var max = rail.scrollWidth - rail.clientWidth, vis = rail.clientWidth / rail.scrollWidth;
    var p = max > 0 ? rail.scrollLeft / max : 0;
    railBar.style.width = (vis * 100) + "%";
    railBar.style.transform = "translateX(" + (p * (1 / vis - 1) * 100) + "%)";
  }
  rail.addEventListener("scroll", railProgress, { passive: true });
  window.addEventListener("resize", railProgress);
  railProgress();
  function railStep(dir) { var c = rail.querySelector(".card"); rail.scrollBy({ left: dir * (c.offsetWidth + 20), behavior: reduce ? "auto" : "smooth" }); }
  $("railPrev").addEventListener("click", function () { railStep(-1); });
  $("railNext").addEventListener("click", function () { railStep(1); });

  /* ── Menu tabs ────────────────────────────────────── */
  var tabsEl = $("menuTabs"), panel = $("menuPanel");
  MENU.forEach(function (s, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.id = "tab-" + s.id;
    b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "menuPanel");
    b.textContent = s.title;
    b.addEventListener("click", function () { selectTab(i, false, true); });
    b.addEventListener("keydown", function (e) {
      var n = i;
      if (e.key === "ArrowRight") n = (i + 1) % MENU.length;
      else if (e.key === "ArrowLeft") n = (i - 1 + MENU.length) % MENU.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = MENU.length - 1;
      else return;
      e.preventDefault(); selectTab(n, true, false);
    });
    tabsEl.appendChild(b);
  });
  function selectTab(i, focus, fromClick) {
    var s = MENU[i];
    tabsEl.querySelectorAll(".chip").forEach(function (t, j) { t.setAttribute("aria-selected", String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    var chip = tabsEl.children[i];
    tabsEl.scrollTo({ left: chip.offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
    panel.setAttribute("aria-labelledby", "tab-" + s.id);
    var body = s.items ? s.items.map(function (k) {
      var d = DISHES[k];
      return '<button type="button" class="dish" data-dish="' + k + '"><span class="thumb"><img loading="lazy" src="' + d.img + '" alt="' + esc(d.alt) + '" width="900" height="1125"></span><span><span class="row"><h3>' + esc(d.name) + '</h3><span class="dots" aria-hidden="true"></span><span class="price">' + esc(d.price) + '</span></span><span class="desc" style="display:block">' + esc(d.desc) + "</span></span></button>";
    }).join("") : s.text.map(function (t) {
      return '<div class="dish dish-text"><span><span class="row"><h3>' + esc(t[0]) + '</h3><span class="dots" aria-hidden="true"></span><span class="price">' + esc(t[1]) + '</span></span><span class="desc" style="display:block">' + esc(t[2]) + "</span></span></div>";
    }).join("");
    panel.innerHTML = '<p class="lead">' + esc(s.lead) + '</p><div class="dishes">' + body + "</div>";
    panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    if (focus) chip.focus();
    if (fromClick) {
      var top = $("menu").querySelector(".chips").getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) tabsEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }
  selectTab(0, false, false);

  /* ── Sheets (shared open/close) ───────────────────── */
  var openSheet = null, lastFocus = null;
  function showSheet(el, focusEl) {
    if (openSheet && openSheet !== el) hideSheet(openSheet, true);
    lastFocus = lastFocus || document.activeElement;
    el.classList.add("open");
    document.body.classList.add("locked");
    bar.classList.remove("show");
    openSheet = el;
    setTimeout(function () { (focusEl || el.querySelector("[data-close]:not(.sheet-backdrop)")).focus({ preventScroll: true }); }, 120);
  }
  function hideSheet(el, silent) {
    el.classList.remove("open");
    openSheet = null;
    if (!silent) {
      document.body.classList.remove("locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      lastFocus = null;
      onScroll();
    }
  }
  document.querySelectorAll(".sheet-wrap").forEach(function (w) {
    w.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) hideSheet(w); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (openSheet) hideSheet(openSheet);
    else if (mobile.classList.contains("open")) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !openSheet) return;
    var f = Array.prototype.filter.call(openSheet.querySelectorAll("button, a[href], input, textarea"), function (x) {
      return !x.disabled && !x.hidden && x.offsetParent !== null && !x.closest(".step:not(.active)");
    });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Dish detail */
  var dishSheet = $("dishSheet");
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-dish]"); if (!b) return;
    var d = DISHES[b.getAttribute("data-dish")];
    $("dishImg").src = d.img; $("dishImg").alt = d.alt;
    $("dishName").textContent = d.name; $("dishPrice").textContent = d.price;
    $("dishDesc").textContent = d.desc;
    lastFocus = b;
    showSheet(dishSheet);
  });

  /* ── Reservation book (this browser) + simulated other guests ── */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode: the booking still shows */ } }
  var book = load();
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function takenByOthers(date, time, id) {
    var dow = new Date(date + "T12:00").getDay();
    var busy = (dow === 5 || dow === 6 ? 0.5 : 0.28) + (time === "20:45" ? 0.08 : 0);
    var n = id === "CT" ? 99 : Number(id.slice(1)), pair = Math.ceil(n / 2); // other guests book in pairs
    return hash(date + time + (id === "CT" ? "CT" : "P" + pair)) < busy;
  }
  function takenByMe(date, time, id) { return book.some(function (b) { return b.status !== "cancelled" && b.date === date && b.time === time && b.seats.indexOf(id) > -1; }); }
  function isTaken(date, time, id) { return takenByOthers(date, time, id) || takenByMe(date, time, id); }
  function anyTaken(date, time) { return SEATS.some(function (s) { return isTaken(date, time, s.id); }); }

  /* ── The counter plan (page and booking sheet) ─────── */
  // Wide containers: kitchen at the top. Narrow ones (phones): turned a quarter so the kitchen is on the right.
  function buildPlan(el) {
    var W = PLAN.x1 - PLAN.x0, H = PLAN.y1 - PLAN.y0;
    var rot = el.clientWidth > 0 && el.clientWidth < 440;
    el.classList.toggle("rot", rot);
    el.style.paddingBottom = (rot ? W / H : H / W) * 100 + "%";
    function rect(x0, x1, y0, y1) { // metres -> % box
      if (!rot) return "left:" + ((x0 - PLAN.x0) / W * 100) + "%;top:" + ((PLAN.y1 - y1) / H * 100) + "%;width:" + ((x1 - x0) / W * 100) + "%;height:" + ((y1 - y0) / H * 100) + "%";
      return "left:" + ((y0 - PLAN.y0) / H * 100) + "%;top:" + ((x0 - PLAN.x0) / W * 100) + "%;width:" + ((y1 - y0) / H * 100) + "%;height:" + ((x1 - x0) / W * 100) + "%";
    }
    function pt(x, y) {
      return rot ? "left:" + ((y - PLAN.y0) / H * 100) + "%;top:" + ((x - PLAN.x0) / W * 100) + "%"
                 : "left:" + ((x - PLAN.x0) / W * 100) + "%;top:" + ((PLAN.y1 - y) / H * 100) + "%";
    }
    var f = PLAN.frame, pl = PLAN.plating, html = "";
    html += '<span class="pl-frame" aria-hidden="true" style="' + rect(f[0], f[1], f[2], f[3]) + '"></span>';
    PLAN.kitchen.forEach(function (k) { html += '<span class="pl-kitchen" aria-hidden="true" style="' + rect(k[1], k[2], PLAN.ky0, PLAN.ky1) + '"><b>' + k[0] + "</b></span>"; });
    html += '<span class="pl-plating" aria-hidden="true" style="' + rect(pl[0], pl[1], pl[2], pl[3]) + '"><b>Plating table</b></span>';
    PLAN.counter.forEach(function (c) { html += '<span class="pl-counter" aria-hidden="true" style="' + rect(c[0], c[1], c[2], c[3]) + '"></span>'; });
    PLAN.lamps.forEach(function (l) { html += '<span class="pl-lamp" aria-hidden="true" style="' + pt(l[0], l[1]) + '"></span>'; });
    html += '<div class="pl-seats" role="group" aria-label="Ten seats around the counter">' + SEATS.map(function (s) {
      var y = PLAN.seatY[s.n] !== undefined ? PLAN.seatY[s.n] : s.y;
      return '<button type="button" class="seat" data-seat="' + s.id + '" aria-pressed="false" style="' + pt(s.x, y) + '" aria-label="Seat ' + s.n + ", " + s.side.toLowerCase() + ", facing " + esc(STATION_LONG[s.station]) + '">' + s.n + "</button>";
    }).join("") + "</div>";
    el.innerHTML = html;
  }
  function refreshPlan(el, after) {
    var pressed = Array.prototype.filter.call(el.querySelectorAll("[aria-pressed=true]"), function () { return true; }).map(function (b) { return b.dataset.seat; });
    var disabled = Array.prototype.filter.call(el.querySelectorAll(".seat:disabled"), function () { return true; }).map(function (b) { return b.dataset.seat; });
    buildPlan(el);
    el.querySelectorAll(".seat").forEach(function (b) {
      b.setAttribute("aria-pressed", String(pressed.indexOf(b.dataset.seat) > -1));
      b.disabled = disabled.indexOf(b.dataset.seat) > -1;
    });
    if (after) after();
  }
  var lastW = {};
  var planRO = "ResizeObserver" in window ? new ResizeObserver(function (es) {
    es.forEach(function (e) {
      var el = e.target, w = Math.round(e.contentRect.width), was = lastW[el.id];
      lastW[el.id] = w;
      if (w && (was === undefined || (was < 440) !== (w < 440))) refreshPlan(el);
    });
  }) : null;

  var current = "S05", plan = $("plan");
  buildPlan(plan);
  if (planRO) planRO.observe(plan);
  plan.addEventListener("click", function (e) { var b = e.target.closest("[data-seat]"); if (b) selectSeat(b.dataset.seat); });
  function seatText(id) {
    var s = seatById(id);
    return { name: "Seat " + s.n, meta: s.side + " · facing the " + (s.station === "pass" ? "plating table" : s.station), note: NOTES[s.station] };
  }
  function selectSeat(id) {
    current = id;
    plan.querySelectorAll("[data-seat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.seat === id)); });
    var t = seatText(id);
    $("seatName").textContent = t.name; $("seatMeta").textContent = t.meta; $("seatNote").textContent = t.note;
    $("seatBook").textContent = "Book seat " + seatById(id).n;
    var poster = $("viewerPoster"); poster.src = viewImg(id); poster.alt = "The view from " + t.name.toLowerCase();
    document.dispatchEvent(new CustomEvent("cn:seat", { detail: { id: id } }));
  }
  selectSeat("S05");
  $("seatBook").addEventListener("click", function () {
    state.prefer = current;
    openBooking(0);
  });

  /* ── Booking sheet ─────────────────────────────────── */
  var booking = $("booking"), step = 0;
  var stepsEls = booking.querySelectorAll(".step"), progressEls = booking.querySelectorAll(".progress span");
  var STEP_NAMES = ["When", "Seats", "Details", "Confirm", "Booked", "My bookings"];
  var NEXT_LABELS = ["Choose your seats", "Your details", "Check the booking", "Confirm reservation"];
  var state = { date: null, time: null, guests: 2, seats: [], prefer: null, occasions: [] };
  var lastBooking = null;
  var dayN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], monN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var fullDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function fmtDate(s) { var d = new Date(s + "T12:00"); return fullDay[d.getDay()] + ", " + d.getDate() + " " + monN[d.getMonth()] + " " + d.getFullYear(); }
  function shortDate(s) { var d = new Date(s + "T12:00"); return dayN[d.getDay()] + " " + d.getDate() + " " + monN[d.getMonth()]; }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var dates = [];
  for (var k = 0; k < DAYS_AHEAD; k++) { var dd = new Date(today); dd.setDate(today.getDate() + k); dates.push(dd); }
  function seatingPassed(date, time) {
    if (date !== iso(new Date())) return false;
    var s = new Date(); s.setHours(Number(time.slice(0, 2)), Number(time.slice(3)), 0, 0);
    return s - new Date() < 2 * 3600 * 1000;
  }
  function buildDays(box) {
    box.innerHTML = "";
    dates.forEach(function (d, i) {
      var b = document.createElement("button"), id = iso(d);
      var closed = CLOSED.indexOf(d.getDay()) > -1 || (seatingPassed(id, "18:00") && seatingPassed(id, "20:45"));
      b.type = "button"; b.className = "day"; b.disabled = closed;
      b.setAttribute("aria-pressed", String(state.date === id));
      b.setAttribute("aria-label", fmtDate(id) + (closed ? ", closed" : ""));
      b.innerHTML = '<span class="dw">' + (i === 0 ? "Today" : i === 1 ? "Tmrw" : dayN[d.getDay()]) + '</span><span class="dn">' + d.getDate() + '</span><span class="dm">' + monN[d.getMonth()] + "</span>";
      b.addEventListener("click", function () {
        state.date = id; $("dateErr").textContent = "";
        syncDays(); syncTimes();
        if (box.id === "quickDays") openBooking(0);
      });
      box.appendChild(b);
    });
  }
  function syncDays() {
    ["days", "quickDays"].forEach(function (id) {
      Array.prototype.forEach.call($(id).children, function (b, i) { b.setAttribute("aria-pressed", String(iso(dates[i]) === state.date)); });
    });
  }
  buildDays($("days")); buildDays($("quickDays"));
  function syncTimes() {
    $("times").querySelectorAll(".time").forEach(function (b) {
      var t = b.dataset.time;
      b.disabled = !!state.date && seatingPassed(state.date, t);
      if (b.disabled && state.time === t) state.time = null;
      b.setAttribute("aria-pressed", String(state.time === t));
    });
  }
  $("times").addEventListener("click", function (e) {
    var b = e.target.closest(".time"); if (!b || b.disabled) return;
    state.time = b.dataset.time; $("timeErr").textContent = ""; syncTimes();
  });

  function renderGuests() {
    var g = state.guests;
    $("gCount").innerHTML = "<b>" + g + '</b><span class="label">' + (g === 1 ? "guest" : "guests") + "</span>";
    $("gMinus").disabled = g <= 1; $("gPlus").disabled = g >= MAX_GUESTS;
    $("guestHint").textContent = g < WHOLE_FROM ? "Side by side at the counter. You choose the seats next."
      : "Seven or more takes the whole counter, all ten seats. We confirm by phone.";
  }
  $("gMinus").addEventListener("click", function () { if (state.guests > 1) { state.guests--; renderGuests(); } });
  $("gPlus").addEventListener("click", function () { if (state.guests < MAX_GUESTS) { state.guests++; renderGuests(); } });

  var bookPlan = $("bookPlan");
  buildPlan(bookPlan);
  if (planRO) planRO.observe(bookPlan);
  function free(id) { return !isTaken(state.date, state.time, id); }
  function blockFrom(n, g) { // g seats side by side, starting at seat n or a block that still includes it
    for (var start = n; start >= Math.max(1, n - g + 1); start--) {
      var end = start + g - 1; if (end > SEATS.length) continue;
      var ids = []; for (var j = start; j <= end; j++) ids.push("S" + String(j).padStart(2, "0"));
      if (ids.every(free)) return ids;
    }
    return null;
  }
  function buildSeatStep() {
    var g = state.guests, whole = g >= WHOLE_FROM;
    $("seatFor").textContent = shortDate(state.date) + " · " + SEATINGS[state.time] + " · " + g + (g === 1 ? " guest" : " guests");
    if (!bookPlan.querySelector(".seat")) buildPlan(bookPlan);
    bookPlan.querySelectorAll("[data-seat]").forEach(function (b) {
      var id = b.dataset.seat, taken = !free(id), s = seatById(id);
      b.disabled = whole || taken;
      b.setAttribute("aria-label", "Seat " + s.n + (taken ? ", taken" : ", " + s.side.toLowerCase() + ", facing " + STATION_LONG[s.station]));
    });
    if (whole) {
      state.seats = anyTaken(state.date, state.time) ? [] : allSeatIds();
      if (!state.seats.length) $("seatErr").textContent = "Some seats are already booked for this seating. Try another night for the whole counter.";
    } else if (state.seats.length !== g || !state.seats.every(free)) {
      state.seats = [];
      if (state.prefer) {
        var bl = blockFrom(Number(state.prefer.slice(1)), g);
        if (bl) state.seats = bl; else $("seatErr").textContent = "Seat " + Number(state.prefer.slice(1)) + " is not free for " + g + " that night. Choose other seats.";
      }
    }
    syncSeats();
  }
  bookPlan.addEventListener("click", function (e) {
    var b = e.target.closest("[data-seat]"); if (!b || b.disabled) return;
    var g = state.guests; $("seatErr").textContent = "";
    var bl = blockFrom(Number(b.dataset.seat.slice(1)), g);
    if (bl) state.seats = bl; else $("seatErr").textContent = "There are not " + g + " free seats together there. Try another part of the counter.";
    syncSeats();
  });
  function seatsLabel(ids) {
    if (ids.length >= SEATS.length) return "The whole counter, all ten seats";
    var a = Number(ids[0].slice(1)), b = Number(ids[ids.length - 1].slice(1));
    return (a === b ? "Seat " + a : "Seats " + a + " to " + b) + ", facing " + STATION_LONG[seatById(ids[Math.floor((ids.length - 1) / 2)]).station];
  }
  function leadView(ids) { return ids.length >= SEATS.length ? "img/view-hero.jpg" : viewImg(ids[Math.floor((ids.length - 1) / 2)]); }
  function syncSeats() {
    bookPlan.querySelectorAll("[data-seat]").forEach(function (b) { b.setAttribute("aria-pressed", String(state.seats.indexOf(b.dataset.seat) > -1)); });
    var prev = $("seatPreview");
    if (!state.seats.length) { prev.hidden = true; $("pickSum").textContent = ""; return; }
    prev.hidden = false; prev.src = leadView(state.seats); prev.alt = "The view from your seats";
    $("pickSum").textContent = seatsLabel(state.seats);
  }

  $("occasions").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
    state.occasions = Array.prototype.filter.call($("occasions").children, function (x) { return x.getAttribute("aria-pressed") === "true"; }).map(function (x) { return x.textContent; });
  });
  function fieldError(id, msg) { $(id + "Err").textContent = msg; $(id + "Field").classList.toggle("invalid", !!msg); }
  ["name", "phone", "email"].forEach(function (id) { $(id).addEventListener("input", function () { fieldError(id, ""); }); });

  function validate(s) {
    if (s === 0) {
      var ok = true;
      if (!state.date) { $("dateErr").textContent = "Please pick a night. We are closed on Monday and Tuesday."; ok = false; }
      if (!state.time) { $("timeErr").textContent = "Please pick a seating."; ok = false; }
      return ok;
    }
    if (s === 1 && !state.seats.length) { $("seatErr").textContent = $("seatErr").textContent || "Please tap a seat on the plan."; return false; }
    if (s === 2) {
      var good = true, first = null;
      if ($("name").value.trim().length < 2) { fieldError("name", "Please enter your name."); good = false; first = first || $("name"); }
      var digits = $("phone").value.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 13) { fieldError("phone", "Please enter a phone number we can call."); good = false; first = first || $("phone"); }
      if (!/^\S+@\S+\.\S+$/.test($("email").value.trim())) { fieldError("email", "Please enter an email for the confirmation."); good = false; first = first || $("email"); }
      if (first) first.focus();
      return good;
    }
    return true;
  }

  function draft() {
    return { ref: null, date: state.date, time: state.time, guests: state.guests, seats: state.seats.slice(), where: seatsLabel(state.seats),
      name: $("name").value.trim(), phone: $("phone").value.trim(), email: $("email").value.trim(),
      occasions: state.occasions.slice(), notes: $("notes").value.trim(), status: state.guests >= WHOLE_FROM ? "requested" : "confirmed" };
  }
  function ticketHtml(b, editable) {
    var rows = [["Date", shortDate(b.date), 0], ["Guests", String(b.guests), 0], ["Seats", b.where.split(",")[0], 1], ["Name", b.name, 2], ["Phone", b.phone, 2], ["Email", b.email, 2]];
    if (b.occasions.length) rows.push(["Occasion", b.occasions.join(", "), 2]);
    var end = String(Number(b.time.slice(0, 2)) + 2).padStart(2, "0") + ":" + (b.time === "18:00" ? "30" : "15");
    return '<img class="review-view" src="' + leadView(b.seats) + '" alt="The view from your seats">' +
      (b.ref ? '<p class="ref">' + esc(b.ref) + "</p>" : "") +
      '<div class="ticket-meta"><span class="tag label">' + (b.ref ? (b.status === "requested" ? "Requested" : "Confirmed") : "Counter") + '</span><span class="label">Chez Nous · Bangsar</span></div>' +
      '<div class="ticket-times"><div><p class="big">' + b.time + '</p><p class="label">' + (b.time === "18:00" ? "First seating" : "Second seating") + '</p></div><span class="ticket-line" aria-hidden="true"></span><div class="r"><p class="big">' + end + '</p><p class="label">About 2.5 hours</p></div></div>' +
      '<div class="tix-perf" aria-hidden="true"></div><dl class="tix-grid">' + rows.map(function (r) {
        return "<div><dt class=\"label\">" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>" + (editable ? '<button type="button" class="edit" data-goto="' + r[2] + '" aria-label="Change ' + r[0].toLowerCase() + '">Change</button>' : "") + "</div>";
      }).join("") + "</dl>";
  }
  $("review").addEventListener("click", function (e) { var x = e.target.closest("[data-goto]"); if (x) go(Number(x.dataset.goto)); });

  function confirmBooking() {
    book = load(); // another tab may have booked meanwhile
    if (!state.seats.every(free)) { state.seats = []; go(1); $("seatErr").textContent = "Those seats were just taken. Please choose others."; return; }
    var b = draft();
    b.ref = "CN-" + b.date.slice(5).replace("-", "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    b.created = new Date().toISOString();
    book.push(b); save(book); lastBooking = b;
    $("doneTitle").innerHTML = b.status === "requested" ? 'Request <em class="accent">received.</em>' : 'You\'re <em class="accent">booked.</em>';
    $("done").innerHTML = ticketHtml(b, false) + '<p class="done-hint">' + (b.status === "requested"
      ? "The whole counter is held for you. We call " + esc(b.phone) + " within a day to confirm and plan the menu."
      : "Your name cards will be on " + esc(b.where.split(",")[0].toLowerCase()) + ". A confirmation goes to " + esc(b.email) + " (demo: nothing is sent).") + "</p>";
    go(4);
  }

  function ics(b) {
    var d = b.date.replace(/-/g, ""), start = b.time.replace(":", "") + "00";
    var endH = String(Number(b.time.slice(0, 2)) + 3).padStart(2, "0");
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Chez Nous demo//EN", "BEGIN:VEVENT",
      "UID:" + b.ref + "@chez-nous.demo", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART:" + d + "T" + start, "DTEND:" + d + "T" + endH + b.time.slice(3) + "00",
      "SUMMARY:Dinner at Chez Nous", "LOCATION:Jalan Telawi\\, Bangsar\\, Kuala Lumpur (demo)",
      "DESCRIPTION:Booking " + b.ref + "\\, " + b.where.replace(/,/g, "\\,") + ". Demo booking\\, not a real reservation.", "END:VEVENT", "END:VCALENDAR"];
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    a.download = "chez-nous-" + b.ref + ".ics";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  $("icsBtn").addEventListener("click", function () { if (lastBooking) ics(lastBooking); });
  $("viewMine").addEventListener("click", function () { go(5); });

  function buildMine() {
    book = load();
    var list = book.slice().sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    if (!list.length) { $("mineList").innerHTML = '<p class="empty">No bookings in this browser yet.</p><div class="done-actions"><button type="button" class="btn btn-solid label" data-new>Reserve a seat</button></div>'; return; }
    $("mineList").innerHTML = list.map(function (b) {
      var st = b.status === "cancelled" ? "Cancelled" : b.status === "requested" ? "Requested, we will call" : "Confirmed";
      return '<div class="mine' + (b.status === "cancelled" ? " cancelled" : "") + '"><b>' + esc(b.ref) + "</b><span>" + esc(fmtDate(b.date)) + " · " + esc(SEATINGS[b.time]) + " · " + b.guests + (b.guests === 1 ? " guest" : " guests") + "</span><span>" + esc(b.where) + '</span><span class="status-line">' + st + "</span>" +
        (b.status === "cancelled" ? "" : '<div class="mine-actions"><button type="button" class="link-inline" data-ics="' + b.ref + '">Add to calendar</button><button type="button" class="link-inline" data-cancel="' + b.ref + '">Cancel booking</button></div>') + "</div>";
    }).join("") + '<div class="done-actions"><button type="button" class="btn btn-solid label" data-new>Book another night</button></div>';
  }
  $("mineList").addEventListener("click", function (e) {
    var c = e.target.closest("[data-cancel]"), i = e.target.closest("[data-ics]"), n = e.target.closest("[data-new]");
    if (c) {
      var b = book.filter(function (x) { return x.ref === c.dataset.cancel; })[0];
      if (b && window.confirm("Cancel " + b.ref + " on " + fmtDate(b.date) + "?")) { b.status = "cancelled"; save(book); buildMine(); }
    }
    if (i) ics(book.filter(function (x) { return x.ref === i.dataset.ics; })[0]);
    if (n) { state.seats = []; state.prefer = null; go(0); }
  });

  function updateNav() {
    $("stepBack").hidden = step === 0 || step >= 4;
    $("sheetFoot").hidden = step >= 4;
    $("nextLabel").textContent = NEXT_LABELS[step] || "";
    $("stepName").textContent = STEP_NAMES[step];
    $("stepCount").textContent = step < 4 ? "Step " + (step + 1) + " of 4" : "Saved in this browser";
    progressEls.forEach(function (p, i) { p.classList.toggle("on", step >= 4 || i <= step); });
  }
  function go(n) {
    var prev = step;
    if (n === 0) { syncDays(); syncTimes(); renderGuests(); }
    if (n === 1) { $("seatErr").textContent = ""; buildSeatStep(); }
    if (n === 3) $("review").innerHTML = ticketHtml(draft(), true);
    if (n === 5) buildMine();
    step = n;
    stepsEls.forEach(function (el, i) {
      el.classList.toggle("active", i === n);
      el.classList.toggle("back", i < n);
      el.setAttribute("aria-hidden", String(i !== n));
      if (i === n) el.scrollTop = 0;
    });
    updateNav();
    if (prev !== n) setTimeout(function () { stepsEls[n].querySelector("h2").focus({ preventScroll: true }); }, 200);
  }
  $("stepNext").addEventListener("click", function () { if (!validate(step)) return; if (step === 3) confirmBooking(); else go(step + 1); });
  $("stepBack").addEventListener("click", function () { go(Math.max(0, step - 1)); });
  $("bookForm").addEventListener("submit", function (e) { e.preventDefault(); });

  function openBooking(at) {
    go(at);
    if (!booking.classList.contains("open")) { lastFocus = document.activeElement; showSheet(booking, stepsEls[at].querySelector("h2")); }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]"), m = e.target.closest("[data-mine]");
    if (b) { if (b.closest("#mobileMenu")) setMenu(false); openBooking(0); }
    else if (m) { e.preventDefault(); if (m.closest("#mobileMenu")) setMenu(false); openBooking(5); }
  });
  stepsEls.forEach(function (el, i) { el.setAttribute("aria-hidden", String(i !== 0)); });
  renderGuests(); updateNav();
})();
