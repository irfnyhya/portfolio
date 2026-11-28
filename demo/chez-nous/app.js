/* Chez Nous demo (Noir layout): plain JS, no build step.
   Bookings are kept in this browser (localStorage). Nothing is sent anywhere. */
(function () {
  "use strict";

  var CLOSED = [1]; // Monday
  var KEY = "chezNous.bookings.v1";

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
    var wknd = d === 0 || d === 6, first = wknd ? "2 PM" : "4 PM";
    if (CLOSED.indexOf(d) > -1) { el.classList.add("closed"); t.textContent = "Closed today · Back tomorrow at 4 PM"; }
    else if (h < (wknd ? 14 : 16)) t.textContent = "Time slots today from " + first + " to 8:15 PM";
    else if (h < 22) t.textContent = "Kitchen open now · Last slot 8:15 PM";
    else { el.classList.add("closed"); t.textContent = CLOSED.indexOf((d + 1) % 7) > -1 ? "Closed now · Back Tuesday at 4 PM" : "Closed now · Back tomorrow at " + ((d + 1) % 7 === 6 || (d + 1) % 7 === 0 ? "2 PM" : "4 PM"); }
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
    var busy = (dow === 5 || dow === 6 || dow === 0 ? 0.42 : 0.24) + ({ "14:00": -0.06, "16:00": -0.1, "18:00": 0.12, "20:15": 0.06 }[time] || 0);
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
    var rot = el.clientWidth > 0 && el.clientWidth < rotBelow(el);
    el.classList.toggle("rot", rot);
    // seat size follows the plan width so neighbours never overlap (the front seats are 0.9 m apart)
    if (!rot && el.clientWidth) el.style.setProperty("--seat", Math.max(26, Math.min(40, Math.floor(el.clientWidth / W * 0.82))) + "px");
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
  function rotBelow(el) { return el.dataset.rotBelow !== undefined ? Number(el.dataset.rotBelow) : 440; }
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
      if (w && (was === undefined || (was < rotBelow(el)) !== (w < rotBelow(el)) || Math.abs(w - was) > 16)) refreshPlan(el);
    });
  }) : null;

  var current = "S05", plan = $("plan");
  buildPlan(plan);
  if (planRO) planRO.observe(plan);
  plan.addEventListener("click", function (e) {
    var b = e.target.closest("[data-seat]"); if (!b) return;
    selectSeat(b.dataset.seat);
    var v = $("viewer").getBoundingClientRect();
    if (v.top < 0 || v.bottom > window.innerHeight) $("viewer").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  });
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
  $("seatBook").addEventListener("click", function () { bookFromSeat(current); });

  /* ── Reservations: date, time, guests and seats, details, deposit (the Noir flow, plus the seat view) ── */
  var SLOTS = [
    { t: "14:00", label: "2:00 PM", days: [0, 6], note: "Sat & Sun only" },
    { t: "16:00", label: "4:00 PM" },
    { t: "18:00", label: "6:00 PM" },
    { t: "20:15", label: "8:15 PM" }
  ];
  var STRIP_DAYS = 14, MAX_AHEAD = 60, CUTOFF_MIN = 60, DEPOSIT = 100, CAPACITY = 10, MAX_GUESTS = 10;
  var dayN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], monN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var fullDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function fmtDate(s) { var d = new Date(s + "T12:00"); return fullDay[d.getDay()] + ", " + d.getDate() + " " + monN[d.getMonth()]; }
  function shortDate(s) { var d = new Date(s + "T12:00"); return dayN[d.getDay()] + ", " + d.getDate() + " " + monN[d.getMonth()]; }
  function slotLabel(t) { var s = SLOTS.filter(function (x) { return x.t === t; })[0]; if (s) return s.label; var h = Number(t.slice(0, 2)); return (h % 12 || 12) + ":" + t.slice(3) + (h >= 12 ? " PM" : " AM"); }
  function rm(n) { return "RM" + n; }

  var todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  var todayIso = iso(todayD), maxD = new Date(todayD); maxD.setDate(maxD.getDate() + MAX_AHEAD);
  function slotRuns(slot, date) {
    var dow = new Date(date + "T12:00").getDay();
    return CLOSED.indexOf(dow) < 0 && (!slot.days || slot.days.indexOf(dow) > -1);
  }
  function slotClosedNow(date, t) { // online booking closes an hour before the slot starts
    var s = new Date(date + "T" + t + ":00");
    return s - new Date() < CUTOFF_MIN * 60000;
  }
  function freeSeats(date, t) { return SEATS.filter(function (s) { return !isTaken(date, t, s.id); }).map(function (s) { return s.id; }); }
  function slotInfo(date, slot) {
    var runs = slotRuns(slot, date), shut = runs && slotClosedNow(date, slot.t);
    var free = runs ? freeSeats(date, slot.t) : [];
    return { slot: slot, runs: runs, shut: shut, free: free, booked: CAPACITY - free.length, ok: runs && !shut && free.length > 0 };
  }
  function dayInfo(date) {
    var infos = SLOTS.map(function (s) { return slotInfo(date, s); }).filter(function (x) { return x.runs; });
    var open = infos.filter(function (x) { return x.ok; });
    return { infos: infos, open: open, left: open.reduce(function (n, x) { return n + x.free.length; }, 0), closed: !infos.length || infos.every(function (x) { return x.shut; }) };
  }

  var rv = { date: null, time: null, seats: [], last: null, prefer: null };
  var rvDone = null;

  function buildDays() {
    var box = $("rvDays"); box.innerHTML = "";
    for (var k = 0; k < STRIP_DAYS; k++) {
      var d = new Date(todayD); d.setDate(d.getDate() + k);
      var id = iso(d), info = dayInfo(id), b = document.createElement("button");
      var state = info.open.length ? info.left + " left" : info.closed ? "Closed" : "Full";
      b.type = "button"; b.className = "rv-day"; b.dataset.date = id; b.disabled = !info.open.length;
      b.setAttribute("aria-pressed", String(rv.date === id));
      b.setAttribute("aria-label", fmtDate(id) + ": " + (info.open.length ? info.left + " seats available" : state.toLowerCase()));
      b.innerHTML = '<span class="dw label">' + (k === 0 ? "Today" : dayN[d.getDay()]) + '</span><span class="dn">' + d.getDate() + '</span><span class="dl">' + state + "</span>";
      box.appendChild(b);
    }
    var inp = $("rvDate"); inp.min = todayIso; inp.max = iso(maxD);
    $("rvUntil").textContent = "bookable until " + shortDate(iso(maxD));
  }
  $("rvDays").addEventListener("click", function (e) { var b = e.target.closest(".rv-day"); if (b && !b.disabled) chooseDate(b.dataset.date); });
  $("rvDate").addEventListener("change", function () {
    var v = this.value; if (!v) return;
    if (v < todayIso || v > iso(maxD)) { $("rvDateErr").textContent = "Please choose a date between today and " + shortDate(iso(maxD)) + "."; return; }
    chooseDate(v);
  });

  function chooseDate(id) {
    rv.date = id; rv.time = null; rv.seats = [];
    $("rvDateErr").textContent = ""; $("rvAlert").hidden = true;
    Array.prototype.forEach.call($("rvDays").children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.date === id)); });
    $("rvDate").value = $("rvDays").querySelector('[data-date="' + id + '"]') ? "" : id;
    var info = dayInfo(id);
    if (!info.open.length) $("rvDateErr").textContent = info.closed ? "We are closed on " + fmtDate(id) + ". Mondays are closed." : "Every time slot on " + fmtDate(id) + " is full.";
    renderSlots(); renderGuests(); renderSeats(); renderSubmit();
  }

  function renderSlots() {
    var box = $("rvSlots");
    $("rvTimeTitle").textContent = rv.date ? "Choose a time · " + fmtDate(rv.date) : "Choose a time";
    if (!rv.date) { box.innerHTML = '<p class="rv-hint">Select a date to see the available times.</p>'; return; }
    var info = dayInfo(rv.date);
    if (!info.infos.length) { box.innerHTML = '<p class="rv-hint">No time slots on this day.</p>'; return; }
    box.innerHTML = info.infos.map(function (x) {
      var status = x.shut ? "Booking closed" : !x.free.length ? "Fully booked" : x.free.length + " of " + CAPACITY + " seats left";
      var meter = ""; for (var n = 0; n < CAPACITY; n++) meter += '<i class="' + (n < x.booked ? "b" : "") + '"></i>';
      var on = rv.time === x.slot.t;
      return '<button type="button" class="rv-slot' + (x.ok && x.free.length <= 3 ? " few" : "") + '" data-time="' + x.slot.t + '" aria-pressed="' + on + '"' + (x.ok ? "" : " disabled") +
        ' aria-label="' + x.slot.label + (x.slot.note ? " (" + x.slot.note + ")" : "") + ": " + status + '">' +
        '<span class="st">' + x.slot.label + "</span>" + (x.slot.note ? '<span class="sn label">' + x.slot.note + "</span>" : "") +
        '<span class="ss">' + status + '</span><span class="sm" aria-hidden="true">' + meter + "</span></button>";
    }).join("");
  }
  $("rvSlots").addEventListener("click", function (e) {
    var b = e.target.closest(".rv-slot"); if (!b || b.disabled) return;
    rv.time = b.dataset.time; $("rvTimeErr").textContent = ""; $("rvAlert").hidden = true;
    Array.prototype.forEach.call($("rvSlots").querySelectorAll(".rv-slot"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    // nothing is chosen for you: only the seat you picked in the 3D view, if it is free
    rv.seats = rv.prefer && !isTaken(rv.date, rv.time, rv.prefer) ? [rv.prefer] : [];
    rv.last = rv.seats[0] || null;
    if (!preloaded) { preloaded = true; SEATS.forEach(function (x) { var im = new Image(); im.src = viewImg(x.id); }); } // taps then swap views instantly
    renderGuests(); renderSeats(); renderSubmit();
    if (window.innerWidth < 900) setTimeout(function () { $("rvSeats").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }, 60);
  });

  var preloaded = false;
  // Guests = the seats you have chosen. Tap seats on the plan, or use + and - (adds the nearest free seat / drops the last one).
  var seatNum = function (id) { return Number(id.slice(1)); };
  function guests() { return rv.seats.length; }
  function renderGuests() {
    var g = guests(), free = rv.date && rv.time ? freeSeats(rv.date, rv.time) : [];
    $("rvCount").innerHTML = (rv.time ? g : "–") + '<span class="sr-only"> ' + (g === 1 ? "guest" : "guests") + "</span>";
    $("rvMinus").disabled = !rv.time || g < 1;
    $("rvPlus").disabled = !rv.time || g >= Math.min(MAX_GUESTS, free.length);
    $("rvGuestHint").textContent = !rv.time ? "Choose a time first, then tap your seats on the plan."
      : g ? g + (g === 1 ? " seat" : " seats") + " chosen · " + (free.length - g) + " more free in this time slot."
      : "Tap a seat for each guest. " + free.length + " seats are free in this time slot.";
    $("rvDeposit").textContent = rm(g * DEPOSIT);
    $("rvDepositFor").textContent = rm(DEPOSIT) + " × " + g + (g === 1 ? " guest" : " guests");
  }
  function nearestFree() {
    var free = freeSeats(rv.date, rv.time).filter(function (id) { return rv.seats.indexOf(id) < 0; });
    var a = rv.last ? seatNum(rv.last) : 5.5;
    free.sort(function (x, y) { return Math.abs(seatNum(x) - a) - Math.abs(seatNum(y) - a) || seatNum(x) - seatNum(y); });
    return free[0] || null;
  }
  function addSeat(id) { if (!id || rv.seats.indexOf(id) > -1 || guests() >= MAX_GUESTS) return; rv.seats.push(id); rv.last = id; }
  function dropSeat(id) { rv.seats = rv.seats.filter(function (x) { return x !== id; }); rv.last = rv.seats[rv.seats.length - 1] || null; }
  function seatsChanged() { $("rvSeatErr").textContent = ""; renderGuests(); renderSeats(); renderSubmit(); }
  $("rvMinus").addEventListener("click", function () { if (guests()) { dropSeat(rv.seats[rv.seats.length - 1]); seatsChanged(); } });
  $("rvPlus").addEventListener("click", function () { if (rv.time) { addSeat(nearestFree()); seatsChanged(); } });

  function sorted(ids) { return ids.slice().sort(function (a, b) { return seatNum(a) - seatNum(b); }); }
  function together(ids) { var s = sorted(ids); for (var i = 1; i < s.length; i++) if (seatNum(s[i]) !== seatNum(s[i - 1]) + 1) return false; return true; }
  function seatsText(ids) {
    if (ids.length >= CAPACITY) return "The whole counter, all ten seats";
    var nums = sorted(ids).map(seatNum);
    if (nums.length === 1) return "Seat " + nums[0];
    return together(ids) ? "Seats " + nums[0] + " to " + nums[nums.length - 1] : "Seats " + nums.slice(0, -1).join(", ") + " and " + nums[nums.length - 1];
  }
  function viewFor(ids) { var s = sorted(ids); return ids.length >= CAPACITY ? "img/view-hero.jpg" : viewImg(s[Math.floor((s.length - 1) / 2)]); }

  // Crossfade: the new view loads underneath, then fades in over the old one (no flash to black)
  var viewToken = 0;
  function setView(src, alt) {
    var frame = $("rvViewFrame"), top = frame.lastElementChild;
    if (top && top.getAttribute("src") === src) return;
    var token = ++viewToken, img = new Image();
    img.className = "layer"; img.alt = alt; img.decoding = "async"; img.src = src;
    var show = function () {
      if (token !== viewToken) return;
      frame.appendChild(img);
      if (reduce) { Array.prototype.slice.call(frame.children, 0, -1).forEach(function (o) { o.remove(); }); img.classList.add("on"); return; }
      requestAnimationFrame(function () { requestAnimationFrame(function () { img.classList.add("on"); }); });
      setTimeout(function () { if (token === viewToken) Array.prototype.slice.call(frame.children, 0, -1).forEach(function (o) { o.remove(); }); }, 650);
    };
    (img.decode ? img.decode() : Promise.resolve()).then(show, show);
  }

  var rvPlan = $("rvPlan");
  function renderSeats() {
    var box = $("rvSeats");
    if (!rv.date || !rv.time) { box.hidden = true; return; }
    box.hidden = false;
    if (!rvPlan.querySelector(".seat")) buildPlan(rvPlan);
    rv.seats = rv.seats.filter(function (id) { return !isTaken(rv.date, rv.time, id); });
    if (rv.last && rv.seats.indexOf(rv.last) < 0) rv.last = rv.seats[rv.seats.length - 1] || null;
    rvPlan.querySelectorAll("[data-seat]").forEach(function (b) {
      var id = b.dataset.seat, taken = isTaken(rv.date, rv.time, id), mine = rv.seats.indexOf(id) > -1, s = seatById(id);
      b.disabled = taken;
      b.setAttribute("aria-pressed", String(mine));
      b.classList.toggle("last", id === rv.last);
      b.setAttribute("aria-label", "Seat " + s.n + (taken ? ", taken" : mine ? ", yours, tap to remove" : ", free") + ", facing " + STATION_LONG[s.station]);
    });
    if (rv.last) {
      var s = seatById(rv.last);
      setView(viewImg(rv.last), "The view from seat " + s.n);
      $("rvViewCap").innerHTML = "<b>The view from seat " + s.n + "</b>, facing " + esc(STATION_LONG[s.station]) +
        (guests() > 1 ? '<span class="rv-view-all">Your seats: ' + esc(seatsText(rv.seats)) + (together(rv.seats) ? "" : " (not side by side)") + "</span>" : "");
    } else {
      setView("img/view-hero.jpg", "The counter");
      $("rvViewCap").innerHTML = "<b>Tap a seat</b> to see the view from it. Tap it again to remove it.";
    }
  }
  rvPlan.addEventListener("click", function (e) {
    var b = e.target.closest("[data-seat]"); if (!b || b.disabled) return;
    var id = b.dataset.seat;
    if (rv.seats.indexOf(id) > -1) {
      if (rv.last !== id) rv.last = id;          // first tap on one of yours shows its view
      else dropSeat(id);                          // tapping it again removes it
    } else if (guests() >= MAX_GUESTS) { $("rvSeatErr").textContent = "Up to " + MAX_GUESTS + " seats per online booking."; return; }
    else addSeat(id);
    seatsChanged();
  });
  if (planRO) planRO.observe(rvPlan);

  function renderSubmit() {
    var g = guests();
    $("rvGo").textContent = rv.date && rv.time && g ? "Reserve " + g + (g === 1 ? " seat" : " seats") + " · " + shortDate(rv.date) + ", " + slotLabel(rv.time) : rv.time ? "Choose your seats" : "Reserve seats";
  }

  function fieldErr(k, msg) { $("rv" + k + "Err").textContent = msg; $("rv" + k + "F").classList.toggle("invalid", !!msg); }
  ["Name", "Phone", "Email"].forEach(function (k, i, all) {
    var el = $("rv" + k);
    el.addEventListener("input", function () { fieldErr(k, ""); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); if (i < all.length - 1) $("rv" + all[i + 1]).focus(); else $("rvNotes").focus(); } });
  });
  $("rvAgree").addEventListener("change", function () { if (this.checked) { $("rvAgreeErr").textContent = ""; $("rvAgreeBox").classList.remove("invalid"); } $("rvAgreeBox").classList.toggle("on", this.checked); });

  var GUEST_KEY = "chezNous.guest.v1";
  (function () {
    var g = null; try { g = JSON.parse(localStorage.getItem(GUEST_KEY)); } catch (e) { /* none */ }
    if (g) { if (g.name) $("rvName").value = g.name; if (g.phone) $("rvPhone").value = g.phone; if (g.email) $("rvEmail").value = g.email; }
  })();

  $("rvForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var first = null, mark = function (el) { first = first || el; };
    $("rvAlert").hidden = true;
    if (!rv.date) { $("rvDateErr").textContent = "Please choose a date."; mark($("rvDays").querySelector(".rv-day:not(:disabled)")); }
    if (rv.date && !rv.time) { $("rvTimeErr").textContent = "Please choose a time."; mark($("rvSlots").querySelector(".rv-slot:not(:disabled)")); }
    if (rv.time && !rv.seats.length) { $("rvSeatErr").textContent = "Please tap a seat on the plan for each guest."; mark(rvPlan); }
    var name = $("rvName").value.trim(), phone = $("rvPhone").value.trim(), email = $("rvEmail").value.trim();
    if (name.length < 2) { fieldErr("Name", "Please enter your full name."); mark($("rvName")); }
    var digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 13) { fieldErr("Phone", "Please enter a number we can call."); mark($("rvPhone")); }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) { fieldErr("Email", "This email does not look right."); mark($("rvEmail")); }
    if (!$("rvAgree").checked) { $("rvAgreeErr").textContent = "Please confirm you have read the deposit policy."; $("rvAgreeBox").classList.add("invalid"); mark($("rvAgree")); }
    if (first) { if (first.focus) first.focus({ preventScroll: true }); first.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); return; }

    book = load(); // another tab may have booked meanwhile
    if (slotClosedNow(rv.date, rv.time) || !rv.seats.every(function (id) { return !isTaken(rv.date, rv.time, id); })) {
      buildDays(); renderSlots(); rv.seats = []; renderGuests(); renderSeats();
      $("rvAlert").textContent = "Those seats were just taken or the slot has closed. Here is the latest availability.";
      $("rvAlert").hidden = false; return;
    }
    var ref = "CN-"; for (var i = 0; i < 6; i++) ref += "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32));
    var b = { ref: ref, date: rv.date, time: rv.time, guests: guests(), seats: sorted(rv.seats), where: seatsText(rv.seats) + ", facing " + STATION_LONG[seatById(sorted(rv.seats)[Math.floor((rv.seats.length - 1) / 2)]).station],
      name: name, phone: phone, email: email, occasions: [], notes: $("rvNotes").value.trim(), status: "held", deposit: guests() * DEPOSIT, created: new Date().toISOString() };
    book.push(b); save(book); rvDone = b;
    buildDays(); renderSlots();
    try { localStorage.setItem(GUEST_KEY, JSON.stringify({ name: name, phone: phone, email: email })); } catch (e2) { /* fine */ }
    showDone(b);
  });

  function showDone(b) {
    var d = $("rvDone");
    d.innerHTML = '<span class="rv-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<h3>Your seats are <em class="accent">held.</em></h3>' +
      '<p class="rv-done-text">Thank you. We will contact you on ' + esc(b.phone) + ' with deposit details. Your booking is confirmed once the deposit of <b>' + rm(b.deposit) + '</b> arrives, and it comes off your bill on the day.' + (b.email ? " The details are on their way to " + esc(b.email) + " (demo: nothing is sent)." : " Please keep your reference.") + "</p>" +
      '<img class="rv-done-view" src="' + viewFor(b.seats) + '" alt="The view from your seats">' +
      '<dl class="rv-done-grid">' + [["Reference", b.ref], ["Guests", String(b.guests)], ["Date", fmtDate(b.date)], ["Time", slotLabel(b.time)], ["Seats", seatsText(b.seats)], ["Deposit due", rm(b.deposit)]].map(function (r) {
        return "<div><dt class=\"label\">" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd></div>";
      }).join("") + "</dl>" +
      '<div class="rv-done-actions"><button type="button" class="btn btn-solid label" data-ics="' + b.ref + '">Add to calendar</button><button type="button" class="btn btn-ghost label" data-again>Make another booking</button><button type="button" class="link-inline" data-mine>My bookings</button></div>';
    $("rvForm").hidden = true; d.hidden = false;
    $("rv").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setTimeout(function () { d.focus({ preventScroll: true }); }, 300);
  }
  $("rvDone").addEventListener("click", function (e) {
    if (e.target.closest("[data-again]")) {
      rvDone = null; rv.date = null; rv.time = null; rv.seats = []; rv.last = null; rv.prefer = null;
      $("rvAgree").checked = false; $("rvAgreeBox").classList.remove("on"); $("rvNotes").value = "";
      $("rvDone").hidden = true; $("rvForm").hidden = false;
      buildDays(); renderSlots(); renderGuests(); renderSeats(); renderSubmit();
      $("rv").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  });

  function ics(b) {
    var d = b.date.replace(/-/g, ""), start = new Date(b.date + "T" + b.time + ":00"), end = new Date(start.getTime() + 90 * 60000);
    var hm = function (x) { return String(x.getHours()).padStart(2, "0") + String(x.getMinutes()).padStart(2, "0") + "00"; };
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Chez Nous demo//EN", "BEGIN:VEVENT",
      "UID:" + b.ref + "@chez-nous.demo", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
      "DTSTART:" + d + "T" + hm(start), "DTEND:" + d + "T" + hm(end),
      "SUMMARY:Dinner at Chez Nous", "LOCATION:Jalan Telawi\\, Bangsar\\, Kuala Lumpur (demo)",
      "DESCRIPTION:Booking " + b.ref + "\\, " + b.where.replace(/,/g, "\\,") + ". Demo booking\\, not a real reservation.", "END:VEVENT", "END:VCALENDAR"];
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    a.download = "chez-nous-" + b.ref + ".ics";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  document.addEventListener("click", function (e) {
    var i = e.target.closest("[data-ics]");
    if (i) { book = load(); var b = book.filter(function (x) { return x.ref === i.dataset.ics; })[0]; if (b) ics(b); }
  });

  /* ── My bookings (sheet) ── */
  var booking = $("booking");
  function buildMine() {
    book = load();
    var list = book.slice().sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    if (!list.length) { $("mineList").innerHTML = '<p class="empty">No bookings in this browser yet.</p>'; return; }
    $("mineList").innerHTML = list.map(function (b) {
      var dep = b.deposit || b.guests * DEPOSIT;
      var st = b.status === "cancelled" ? "Released" : b.status === "held" ? "Seats held · deposit " + rm(dep) + " due" : b.status === "requested" ? "Requested, we will call" : "Confirmed";
      return '<div class="mine' + (b.status === "cancelled" ? " cancelled" : "") + '"><b>' + esc(b.ref) + "</b><span>" + esc(fmtDate(b.date)) + " · " + esc(slotLabel(b.time)) + " · " + b.guests + (b.guests === 1 ? " guest" : " guests") + "</span><span>" + esc(b.where) + '</span><span class="status-line">' + st + "</span>" +
        (b.status === "cancelled" ? "" : '<div class="mine-actions"><button type="button" class="link-inline" data-ics="' + b.ref + '">Add to calendar</button><button type="button" class="link-inline" data-cancel="' + b.ref + '">Release seats</button></div>') + "</div>";
    }).join("");
  }
  $("mineList").addEventListener("click", function (e) {
    var c = e.target.closest("[data-cancel]"); if (!c) return;
    var b = book.filter(function (x) { return x.ref === c.dataset.cancel; })[0];
    if (b && window.confirm("Release the seats for " + b.ref + " on " + fmtDate(b.date) + "?")) {
      b.status = "cancelled"; save(book); buildMine();
      buildDays(); if (rv.date) { renderSlots(); renderGuests(); renderSeats(); }
    }
  });
  function openMine() { buildMine(); lastFocus = document.activeElement; showSheet(booking, booking.querySelector(".mine-h")); }

  /* ── Every "Reserve" button goes to the booking panel ── */
  function firstOpenDate() {
    for (var k = 0; k < STRIP_DAYS; k++) { var d = new Date(todayD); d.setDate(d.getDate() + k); if (dayInfo(iso(d)).open.length) return iso(d); }
    return null;
  }
  function goReserve(focusEl) {
    if (rvDone) { $("rvDone").hidden = false; $("rvForm").hidden = true; }
    $("rv").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setTimeout(function () { var f = focusEl || $("rvDays").querySelector('[aria-pressed="true"]') || $("rvDays").querySelector(".rv-day:not(:disabled)"); if (f) f.focus({ preventScroll: true }); }, reduce ? 0 : 600);
  }
  function bookFromSeat(id) {
    if (rvDone) $("rvDone").querySelector("[data-again]").click();
    rv.prefer = id;
    if (!rv.date) { var d = firstOpenDate(); if (d) chooseDate(d); }
    if (rv.time && !isTaken(rv.date, rv.time, id)) { addSeat(id); rv.last = id; seatsChanged(); }
    goReserve($("rvSlots").querySelector(".rv-slot:not(:disabled)"));
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]"), m = e.target.closest("[data-mine]");
    if (b) { e.preventDefault(); if (b.closest("#mobileMenu")) setMenu(false); goReserve(); }
    else if (m) { e.preventDefault(); if (m.closest("#mobileMenu")) setMenu(false); openMine(); }
  });

  buildDays(); renderSlots(); renderGuests(); renderSeats(); renderSubmit();
})();
