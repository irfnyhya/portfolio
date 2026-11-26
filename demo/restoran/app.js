/* Lindap chef's counter demo: plain JS, no build step. */
(function () {
  "use strict";

  var WA_NUMBER = "60000000000"; // fake demo number, nobody receives these messages
  var CLOSED_WEEKDAY = 2; // Tuesday
  var OPEN_H = 18, CLOSE_H = 23;
  var DAYS_AHEAD = 28;
  var MAX_GUESTS = 12;
  var PRIVATE_FROM = 12; // 12 guests = the whole counter
  var TIMES_EARLY = ["18:00", "20:30"];
  var TIMES_LATE = [];

  var DISHES = {
    tuna: { name: "Tuna Crudo", price: "RM 46", img: "img/hero-tall.jpg", kind: "To start", desc: "Line caught tuna, cured lightly, with toasted seeds, young herbs and a sharp citrus dressing.", alt: "Raw tuna topped with herbs in a stone bowl" },
    c1: { name: "Oyster, Cucumber, Shiso", price: "RM 18 each", img: "img/c1.jpg", kind: "To start", desc: "Opened to order at the counter, with cucumber granita and a drop of shiso oil.", alt: "A chef dressing an oyster with a spoon" },
    c2: { name: "Crab Custard", price: "RM 42", img: "img/c2.jpg", kind: "To start", desc: "Blue swimmer crab, soft egg yolk custard, quail egg and a crisp curry leaf crumb.", alt: "Small white spheres placed on a yellow crab custard on a blue plate" },
    c3: { name: "Clear Fish Consomme", price: "RM 34", img: "img/c3.jpg", kind: "To start", desc: "A clear, deep fish broth with lime leaf oil and garden flowers, poured at the counter.", alt: "A chef garnishing a small bowl of broth with herbs" },
    c4: { name: "Charred Octopus", price: "RM 78", img: "img/c4.jpg", kind: "Mains", desc: "Octopus braised slowly then charred over coals, with smoked chilli glaze and bitter leaves.", alt: "Charred octopus topped with greens on a white plate" },
    c5: { name: "Dry Aged Striploin", price: "RM 168", img: "img/c5.jpg", kind: "Mains", desc: "Grass fed striploin, layered potato terrine and a red wine jus poured in front of you.", alt: "Sauce poured over plated beef and a potato terrine" },
    c6: { name: "Pandan Dome", price: "RM 32", img: "img/c6.jpg", kind: "Desserts", desc: "Pandan and coconut mousse, palm sugar centre, edible flowers and a little gold.", alt: "A green dome dessert topped with white flowers and gold flakes" },
    c7: { name: "Palm Sugar Caramel", price: "RM 30", img: "img/c7.jpg", kind: "Desserts", desc: "Burnt palm sugar caramel, guava sorbet and butterfly pea flowers.", alt: "Caramel and sorbet with purple flowers on a dark plate" },
    pf: { name: "Chocolate Pinecone", price: "RM 28", img: "img/petit.jpg", kind: "Desserts", desc: "Dark chocolate shell, coffee cream and cocoa crumb. Made for sharing.", alt: "A chocolate dessert shaped like a pinecone beside a candle" }
  };
  var SIGNATURES = ["tuna", "c2", "c4", "c5", "c6", "c7"];
  var MENU = [
    { id: "start", title: "To Start", lead: "Small plates, cold and hot.", items: ["tuna", "c1", "c2", "c3"] },
    { id: "mains", title: "Mains", lead: "From the stove and the coals.", items: ["c4", "c5"] },
    { id: "desserts", title: "Desserts", lead: "Plated at the counter.", items: ["c6", "c7", "pf"] },
    { id: "drinks", title: "Drinks", lead: "House made, alcohol free.", text: [
      ["House Lime Soda", "RM 16", "Fresh lime, cane sugar and soda, poured over hand cut ice."],
      ["Cold Brew Tea", "RM 18", "Slow steeped black tea with orange peel and a little honey."],
      ["Seasonal Spritz", "RM 22", "Fruit from the market, bitter herbs and sparkling water."]
    ] }
  ];

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ── Live status in hero ──────────────────────────── */
  (function () {
    var now = new Date(), d = now.getDay(), h = now.getHours();
    var el = $("status"), t = $("statusText");
    if (d === CLOSED_WEEKDAY) { el.classList.add("closed"); t.textContent = "Closed today · Back tomorrow at 6 PM"; }
    else if (h < OPEN_H) t.textContent = "Seatings tonight at 6:00 PM and 8:30 PM";
    else if (h < CLOSE_H) t.textContent = "Kitchen open now · Last seating 8:30 PM";
    else { el.classList.add("closed"); t.textContent = (d + 1) % 7 === CLOSED_WEEKDAY ? "Closed now · Back Wednesday at 6 PM" : "Closed now · Back tomorrow at 6 PM"; }
    // The hero ticket's dot goes grey when the kitchen is closed
    if ($("ticketStatus")) $("ticketStatus").parentNode.classList.toggle("closed", el.classList.contains("closed"));
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
    mobile.querySelectorAll("a").forEach(function (a, i) { a.style.transitionDelay = open ? (0.15 + i * 0.05) + "s" : "0s"; });
  }
  toggle.addEventListener("click", function () { setMenu(!mobile.classList.contains("open")); });
  mobile.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) return;
    setMenu(false);
  });

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

  /* ── Embers over the hero ─────────────────────────── */
  (function () {
    var cv = $("embers");
    if (reduce || !cv.getContext) return;
    var ctx = cv.getContext("2d"), parts = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(init) {
      return { x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: Math.random() * 1.1 + 0.3, vy: Math.random() * 0.25 + 0.08, vx: (Math.random() - 0.5) * 0.15, life: Math.random() * 0.45 + 0.2, ph: Math.random() * 6.28 };
    }
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
        ctx.fillStyle = "rgba(240," + (200 + (p.r * 20 | 0)) + ",160," + a.toFixed(3) + ")";
        ctx.shadowColor = "rgba(235,194,164,.7)"; ctx.shadowBlur = 6;
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
    var max = rail.scrollWidth - rail.clientWidth;
    var vis = rail.clientWidth / rail.scrollWidth;
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
  // Keep Tab focus inside an open sheet
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

  /* ── Booking ──────────────────────────────────────── */
  var booking = $("booking");
  var state = { date: null, time: null, guests: 2, occasions: [] };
  var step = 0;
  var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var monNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var fullDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var STEP_NAMES = ["When", "Seating", "Details", "Review"];
  var NEXT_LABELS = ["Choose a seating", "Your details", "Review request", ""];
  var SEATING_NAMES = { "18:00": "First seating", "20:30": "Second seating" };
  function endTime(hhmm) { return String((Number(hhmm.slice(0, 2)) + 2) % 24).padStart(2, "0") + ":" + hhmm.slice(3); } // dinner runs about two hours

  function fmtTime(hhmm) { var h = Number(hhmm.slice(0, 2)); return (h % 12 || 12) + ":" + hhmm.slice(3) + " " + (h >= 12 ? "PM" : "AM"); }
  function fmtDate(d) { return fullDays[d.getDay()] + ", " + d.getDate() + " " + monNames[d.getMonth()]; }
  function sameDay(a, b) { return a && b && a.toDateString() === b.toDateString(); }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var dates = [];
  for (var k = 0; k < DAYS_AHEAD; k++) { var dd = new Date(today); dd.setDate(today.getDate() + k); dates.push(dd); }
  function lastSlotPassed(d) {
    if (!sameDay(d, new Date())) return false;
    var s = new Date(d); s.setHours(20, 30, 0, 0);
    return s - new Date() < 60 * 60 * 1000;
  }
  function buildDays(container) {
    container.innerHTML = "";
    dates.forEach(function (d, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "day";
      var closed = d.getDay() === CLOSED_WEEKDAY || lastSlotPassed(d);
      b.disabled = closed;
      b.setAttribute("aria-pressed", String(sameDay(d, state.date)));
      b.setAttribute("aria-label", fmtDate(d) + (closed ? ", unavailable" : ""));
      b.innerHTML = '<span class="dw">' + (i === 0 ? "Today" : i === 1 ? "Tmrw" : dayNames[d.getDay()]) + '</span><span class="dn">' + d.getDate() + '</span><span class="dm">' + monNames[d.getMonth()] + "</span>";
      b.addEventListener("click", function () {
        state.date = d;
        if (state.time && timeDisabled(state.time)) state.time = null;
        syncDays(); $("dateErr").textContent = "";
        if (container.id === "quickDays") openBooking(1);
        updateNav();
      });
      container.appendChild(b);
    });
  }
  function syncDays() {
    ["days", "quickDays"].forEach(function (id) {
      Array.prototype.forEach.call($(id).children, function (b, i) { b.setAttribute("aria-pressed", String(sameDay(dates[i], state.date))); });
    });
  }
  buildDays($("days")); buildDays($("quickDays"));

  function timeDisabled(t) {
    if (!state.date || !sameDay(state.date, new Date())) return false;
    var s = new Date(state.date); s.setHours(Number(t.slice(0, 2)), Number(t.slice(3)), 0, 0);
    return s - new Date() < 60 * 60 * 1000;
  }
  function buildTimes() {
    [["timesEarly", TIMES_EARLY], ["timesLate", TIMES_LATE]].forEach(function (g) {
      var el = $(g[0]); el.innerHTML = "";
      g[1].forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "time";
        b.innerHTML = '<span class="big">' + t + '</span><span class="label">' + (SEATING_NAMES[t] || "Seating") + "</span>";
        b.disabled = timeDisabled(t);
        b.setAttribute("aria-pressed", String(state.time === t));
        b.addEventListener("click", function () {
          state.time = t; $("timeErr").textContent = "";
          document.querySelectorAll(".time").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          updateNav();
          // Small pause so the choice registers, then move on
          setTimeout(function () { if (step === 1) go(2); }, reduce ? 0 : 280);
        });
        el.appendChild(b);
      });
    });
    $("timeFor").textContent = state.date ? fmtDate(state.date) + " · " + state.guests + (state.guests === 1 ? " seat" : " seats") : "";
  }

  function renderGuests() {
    $("gCount").innerHTML = "<b>" + state.guests + '</b><span class="label">' + (state.guests === 1 ? "seat" : "seats") + "</span>";
    $("gMinus").disabled = state.guests <= 1;
    $("gPlus").disabled = state.guests >= MAX_GUESTS;
    $("guestHint").textContent = state.guests >= PRIVATE_FROM ? "That is the whole counter. We will reply with options for your group."
      : state.guests > 6 ? "For 7 to 11 guests we check seats by hand. Send the request and we will reply."
      : "Up to 6 seats online. Choose 12 to book the whole counter.";
  }
  $("gMinus").addEventListener("click", function () { if (state.guests > 1) { state.guests--; renderGuests(); } });
  $("gPlus").addEventListener("click", function () { if (state.guests < MAX_GUESTS) { state.guests++; renderGuests(); } });
  renderGuests();

  state.pairing = "";
  $("pairings").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    var on = b.getAttribute("aria-pressed") !== "true";
    Array.prototype.forEach.call($("pairings").children, function (x) { x.setAttribute("aria-pressed", String(x === b && on)); });
    state.pairing = on ? b.textContent : "";
  });
  $("occasions").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    var on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
    state.occasions = Array.prototype.filter.call($("occasions").children, function (x) { return x.getAttribute("aria-pressed") === "true"; }).map(function (x) { return x.textContent; });
  });

  function fieldError(id, msg) { $(id + "Err").textContent = msg; $(id + "Field").classList.toggle("invalid", !!msg); }
  ["name", "phone"].forEach(function (id) { $(id).addEventListener("input", function () { fieldError(id, ""); }); });
  $("name").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("phone").focus(); } });
  $("phone").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); next(); } });

  function validate(s) {
    if (s === 0) { if (!state.date) { $("dateErr").textContent = "Please pick a date."; return false; } }
    if (s === 1) { if (!state.time) { $("timeErr").textContent = "Please pick a seating."; return false; } }
    if (s === 2) {
      var name = $("name").value.trim(), digits = $("phone").value.replace(/\D/g, "");
      var ok = true;
      if (name.length < 2) { fieldError("name", "Please enter your name."); ok = false; }
      if (digits.length < 9 || digits.length > 13) { fieldError("phone", "Please enter a phone number we can reach."); ok = false; }
      if (!ok) { (name.length < 2 ? $("name") : $("phone")).focus(); return false; }
    }
    return true;
  }

  function message() {
    var notes = $("notes").value.trim();
    var lines = ["Hi Lindap, I would like to reserve seats at the counter.", "", "Name: " + $("name").value.trim(), "Date: " + fmtDate(state.date) + " " + state.date.getFullYear(), "Seating: " + fmtTime(state.time), "Seats: " + state.guests, "Phone: " + $("phone").value.trim()];
    if (state.guests >= PRIVATE_FROM) lines.push("Booking: whole counter");
    if (state.pairing) lines.push("Seat preference: " + state.pairing);
    if (state.occasions.length) lines.push("Occasion: " + state.occasions.join(", "));
    if (notes) lines.push("Notes: " + notes);
    lines.push("", "Thank you!");
    return lines.join("\n");
  }
  function buildReview() {
    var rows = [["Date", fmtDate(state.date), 0], ["Seats", String(state.guests), 0], ["Name", $("name").value.trim(), 2], ["Phone", $("phone").value.trim(), 2]];
    if (state.guests >= PRIVATE_FROM) rows.push(["Booking", "Whole counter", 0]);
    if (state.pairing) rows.push(["Seat", state.pairing, 2]);
    if (state.occasions.length) rows.push(["Occasion", state.occasions.join(", "), 2]);
    var cells = rows.map(function (r) {
      return '<div><dt class="label">' + r[0] + "</dt><dd>" + esc(r[1]) + '</dd><button type="button" class="edit" data-goto="' + r[2] + '" aria-label="Edit ' + r[0].toLowerCase() + '">Edit</button></div>';
    }).join("");
    $("ticket").innerHTML =
      '<div class="ticket-meta"><span class="tag label">Counter</span><span class="label">Lindap · Kuala Lumpur</span></div>' +
      '<div class="ticket-times">' +
        '<div><p class="big">' + state.time + '</p><p class="label">' + esc(SEATING_NAMES[state.time] || "Seating") + "</p></div>" +
        '<span class="ticket-line" aria-hidden="true"></span>' +
        '<div class="r"><p class="big">' + endTime(state.time) + '</p><p class="label">About 2 hours</p></div>' +
      "</div>" +
      '<button type="button" class="edit edit-time" data-goto="1">Change seating</button>' +
      '<div class="tix-perf" aria-hidden="true"></div>' +
      '<dl class="tix-grid">' + cells + "</dl>";
    var msg = message();
    var now = new Date();
    $("bubble").innerHTML = esc(msg) + '<span class="ts">' + now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0") + "</span>";
    $("waLink").href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
  }
  $("ticket").addEventListener("click", function (e) { var b = e.target.closest("[data-goto]"); if (b) go(Number(b.getAttribute("data-goto"))); });

  var stepsEls = booking.querySelectorAll(".step");
  var progressEls = booking.querySelectorAll(".progress span");
  function updateNav() {
    $("stepBack").hidden = step === 0;
    $("stepNext").hidden = step === 3;
    $("waLink").hidden = step !== 3;
    $("nextLabel").textContent = NEXT_LABELS[step];
    $("stepName").textContent = STEP_NAMES[step];
    $("stepCount").textContent = "Step " + (step + 1) + " of 4";
    progressEls.forEach(function (p, i) { p.classList.toggle("on", i <= step); });
  }
  function go(n) {
    var prev = step;
    if (n === 1) buildTimes();
    if (n === 3) buildReview();
    step = n;
    stepsEls.forEach(function (el, i) {
      el.classList.toggle("active", i === n);
      el.classList.toggle("back", i < n);
      el.setAttribute("aria-hidden", String(i !== n));
      if (i === n) el.scrollTop = 0;
    });
    updateNav();
    if (prev !== n) {
      var target = n === 2 && !$("name").value ? $("name") : stepsEls[n].querySelector("h2");
      if (target === stepsEls[n].querySelector("h2")) target.setAttribute("tabindex", "-1");
      setTimeout(function () { target.focus({ preventScroll: true }); }, 350);
    }
  }
  function next() { if (validate(step)) go(Math.min(step + 1, 3)); }
  $("stepNext").addEventListener("click", next);
  $("stepBack").addEventListener("click", function () { go(Math.max(step - 1, 0)); });
  $("bookForm").addEventListener("submit", function (e) { e.preventDefault(); next(); });

  function openBooking(at) {
    var startAt = typeof at === "number" ? at : (state.date ? 1 : 0);
    go(startAt);
    if (!booking.classList.contains("open")) { lastFocus = document.activeElement; showSheet(booking, stepsEls[startAt].querySelector("h2")); }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]"); if (!b) return;
    if (b.closest("#mobileMenu")) setMenu(false);
    openBooking(state.date ? 1 : 0);
  });
  // Links to #reserve from the mobile menu still scroll to the section; buttons open the sheet.
  stepsEls.forEach(function (el, i) { el.setAttribute("aria-hidden", String(i !== 0)); });
  updateNav();
})();
