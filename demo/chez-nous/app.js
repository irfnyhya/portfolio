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

  /* Seats and stations: the same numbers as model/scene.json, exported from Blender (metres along the counter). */
  var STATIONS = [
    { key: "grill", name: "Grill", x: -3.3, long: "the charcoal grill" },
    { key: "stove", name: "Stove", x: -1.45, long: "the stove and the copper pans" },
    { key: "pass", name: "Pass", x: 0.65, long: "the pass, where every plate is finished" },
    { key: "pastry", name: "Pastry", x: 3.3, long: "the pastry marble" }
  ];
  var NOTES = {
    grill: "Closest to the charcoal. You feel the heat and smell the smoke as the meat is turned.",
    stove: "In front of the stove, where the sauces reduce in copper pans and the fish is cooked.",
    pass: "Right in front of the pass, where the head chef finishes every plate before it is served.",
    pastry: "By the pastry marble. You watch the soufflé rise and the tarts glazed for dessert."
  };
  var SEATS = [];
  for (var si = 0; si < 12; si++) {
    var sx = -3.575 + 0.65 * si;
    var near = STATIONS.reduce(function (a, b) { return Math.abs(b.x - sx) < Math.abs(a.x - sx) ? b : a; });
    SEATS.push({ id: "S" + String(si + 1).padStart(2, "0"), n: si + 1, x: sx, station: near });
  }
  var CT_NOTE = "A table for four to six beside the pastry station, at right angles to the kitchen, so you face each other and the chefs.";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var viewImg = function (id) { return "img/view-" + id.toLowerCase() + ".jpg"; };
  var seatById = function (id) { return SEATS.filter(function (s) { return s.id === id; })[0]; };

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
  function anyTaken(date, time) { return SEATS.concat([{ id: "CT" }]).some(function (s) { return isTaken(date, time, s.id); }); }

  /* ── The counter plan (page and booking sheet) ─────── */
  function buildPlan(el) {
    var halves = [SEATS.slice(0, 6), SEATS.slice(6)], range = [[-3.9, 0], [0, 3.9]];
    el.innerHTML = '<div class="halves">' + halves.map(function (seats, h) {
      var sts = STATIONS.filter(function (s) { return s.x >= range[h][0] && s.x < range[h][1]; });
      return '<div class="half"><div class="stations" aria-hidden="true">' + sts.map(function (s) {
        var left = (s.x - range[h][0]) / (range[h][1] - range[h][0]) * 100;
        return '<span class="station ' + s.key + '" style="left:' + left.toFixed(1) + '%">' + s.name + "<i></i></span>";
      }).join("") + '</div><div class="bar" aria-hidden="true"></div><div class="seat-row" role="group" aria-label="Counter seats ' + seats[0].n + " to " + seats[seats.length - 1].n + '">' + seats.map(function (s) {
        return '<button type="button" class="seat" data-seat="' + s.id + '" aria-pressed="false" aria-label="Seat ' + s.n + ', facing ' + esc(s.station.long) + '">' + s.n + "</button>";
      }).join("") + "</div></div>";
    }).join("") + '</div><button type="button" class="ct" data-seat="CT" aria-pressed="false"><b>Chef\'s table</b><span>4 to 6 guests, by the pastry station</span></button>' +
    '<p class="plan-key">Kitchen at the top, your seats below the counter. Numbers run from the grill end.</p>';
  }

  var current = "S07", plan = $("plan");
  buildPlan(plan);
  plan.addEventListener("click", function (e) { var b = e.target.closest("[data-seat]"); if (b) selectSeat(b.dataset.seat); });
  function seatText(id) {
    if (id === "CT") return { name: "Chef's table", meta: "Table for 4 to 6 · by the pastry station", note: CT_NOTE };
    var s = seatById(id);
    return { name: "Seat " + s.n, meta: "Counter · facing " + s.station.name.toLowerCase(), note: NOTES[s.station.key] };
  }
  function selectSeat(id) {
    current = id;
    plan.querySelectorAll("[data-seat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.seat === id)); });
    var t = seatText(id);
    $("seatName").textContent = t.name; $("seatMeta").textContent = t.meta; $("seatNote").textContent = t.note;
    $("seatBook").textContent = id === "CT" ? "Book the chef's table" : "Book seat " + seatById(id).n;
    var poster = $("viewerPoster"); poster.src = viewImg(id); poster.alt = "The view from " + t.name.toLowerCase();
    document.dispatchEvent(new CustomEvent("cn:seat", { detail: { id: id } }));
  }
  selectSeat("S07");
  $("seatBook").addEventListener("click", function () {
    state.prefer = current;
    if (current === "CT" && state.guests < 4) state.guests = 4;
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
    $("gMinus").disabled = g <= 1; $("gPlus").disabled = g >= 18;
    $("guestHint").textContent = g <= 3 ? "Side by side at the counter. You choose the seats next."
      : g <= 6 ? "Side by side at the counter, or the chef's table facing each other."
      : "Seven or more takes the whole room, up to eighteen. We confirm by phone.";
  }
  $("gMinus").addEventListener("click", function () { if (state.guests > 1) { state.guests--; renderGuests(); } });
  $("gPlus").addEventListener("click", function () { if (state.guests < 18) { state.guests++; renderGuests(); } });

  var bookPlan = $("bookPlan");
  buildPlan(bookPlan);
  function free(id) { return !isTaken(state.date, state.time, id); }
  function blockFrom(n, g) { // g seats side by side, starting at seat n or a block that still includes it
    for (var start = n; start >= Math.max(1, n - g + 1); start--) {
      var end = start + g - 1; if (end > 12) continue;
      var ids = []; for (var j = start; j <= end; j++) ids.push("S" + String(j).padStart(2, "0"));
      if (ids.every(free)) return ids;
    }
    return null;
  }
  function buildSeatStep() {
    var g = state.guests, whole = g >= 7;
    $("seatFor").textContent = shortDate(state.date) + " · " + SEATINGS[state.time] + " · " + g + (g === 1 ? " guest" : " guests");
    bookPlan.querySelectorAll("[data-seat]").forEach(function (b) {
      var id = b.dataset.seat, taken = !free(id);
      if (id === "CT") {
        b.disabled = whole || taken || g < 4;
        b.querySelector("span").textContent = taken ? "Taken for this seating" : g < 4 ? "For 4 to 6 guests" : "4 to 6 guests, by the pastry station";
      } else {
        b.disabled = whole || taken;
        b.setAttribute("aria-label", "Seat " + Number(id.slice(1)) + (taken ? ", taken" : ", facing " + seatById(id).station.long));
      }
    });
    if (whole) {
      state.seats = anyTaken(state.date, state.time) ? [] : SEATS.map(function (s) { return s.id; }).concat(["CT"]);
      if (!state.seats.length) $("seatErr").textContent = "Part of the counter is already booked for this seating. Try another night for the whole room.";
    } else if (state.seats.length !== g || !state.seats.every(free) || (state.seats[0] === "CT" && g < 4)) {
      state.seats = [];
      if (state.prefer === "CT" && g >= 4 && free("CT")) state.seats = ["CT"];
      else if (state.prefer && state.prefer !== "CT") {
        var bl = blockFrom(Number(state.prefer.slice(1)), g);
        if (bl) state.seats = bl; else $("seatErr").textContent = "Seat " + Number(state.prefer.slice(1)) + " is not free for " + g + " that night. Choose other seats.";
      }
    }
    syncSeats();
  }
  bookPlan.addEventListener("click", function (e) {
    var b = e.target.closest("[data-seat]"); if (!b || b.disabled) return;
    var g = state.guests; $("seatErr").textContent = "";
    if (b.dataset.seat === "CT") state.seats = ["CT"];
    else {
      var bl = blockFrom(Number(b.dataset.seat.slice(1)), g);
      if (bl) state.seats = bl; else $("seatErr").textContent = "There are not " + g + " free seats together there. Try another part of the counter.";
    }
    syncSeats();
  });
  function seatsLabel(ids) {
    if (ids.length > 12) return "The whole room, 18 seats";
    if (ids[0] === "CT") return "The chef's table";
    var a = Number(ids[0].slice(1)), b = Number(ids[ids.length - 1].slice(1));
    return (a === b ? "Seat " + a : "Seats " + a + " to " + b) + ", facing " + seatById(ids[Math.floor((ids.length - 1) / 2)]).station.long;
  }
  function leadView(ids) { return ids.length > 12 ? "img/view-hero.jpg" : viewImg(ids[Math.floor((ids.length - 1) / 2)]); }
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
    if (s === 1 && !state.seats.length) { $("seatErr").textContent = $("seatErr").textContent || "Please tap a seat on the counter."; return false; }
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
      occasions: state.occasions.slice(), notes: $("notes").value.trim(), status: state.guests >= 7 ? "requested" : "confirmed" };
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
      ? "The whole room is held for you. We call " + esc(b.phone) + " within a day to confirm and plan the menu."
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
