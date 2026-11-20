/* Lindap Dining Room demo: plain JS, no build step. */
(function () {
  "use strict";

  var WA_NUMBER = "60000000000"; // fake demo number, nobody receives these messages
  var CLOSED_WEEKDAY = 2; // Tuesday
  var OPEN_H = 18, CLOSE_H = 23;
  var DAYS_AHEAD = 21;
  var MAX_GUESTS = 12;
  var TIMES_EARLY = ["18:00", "18:30", "19:00", "19:30"];
  var TIMES_LATE = ["20:00", "20:30", "21:00", "21:30"];

  var DISHES = {
    satay: { name: "Satay ayam", price: 24, img: "img/satay.jpg", kind: "Kecil", desc: "Ten chicken skewers marinated in lemongrass and turmeric, with kuah kacang, nasi impit and cucumber.", alt: "Chicken satay with peanut sauce, rice cakes and cucumber" },
    ulam: { name: "Ulam platter", price: 28, img: "img/ulam-sambal.jpg", kind: "Kecil", desc: "Market ulam and cucumber with sambal belacan and sambal hijau, plus a grilled chicken leg to share.", alt: "Ulam, cucumber and two sambals with grilled chicken on a banana leaf", tag: "To share" },
    ikan: { name: "Ikan bakar", price: 38, img: "img/ikan-bakar.jpg", kind: "Dari api", desc: "Whole fish grilled on banana leaf over charcoal, with air asam and lime.", alt: "Whole grilled fish on a banana leaf" },
    ayam: { name: "Ayam bakar", price: 34, img: "img/ayam-bakar.jpg", kind: "Dari api", desc: "Half chicken basted in sweet soy and spice, grilled slowly, with sambal merah and rice.", alt: "Grilled chicken with rice, sambal and salad on a plate" },
    rendang: { name: "Rendang daging", price: 42, img: "img/rendang.jpg", kind: "Gulai", desc: "Beef cooked down for hours with kerisik, galangal and chilli until dark and dry. Best with rice.", alt: "Beef rendang in a blue and white bowl with fresh chillies" },
    nasi: { name: "Nasi lemak", price: 18, img: "img/nasi-lemak.jpg", kind: "Nasi", desc: "Coconut rice in banana leaf with sambal, crispy anchovies, peanuts and egg.", alt: "Nasi lemak with sambal on a banana leaf" },
    koci: { name: "Kuih koci", price: 12, img: "img/kuih-daun.jpg", kind: "Manis", desc: "Glutinous rice parcels wrapped in banana leaf, filled with coconut and gula melaka.", alt: "Pyramid shaped kuih wrapped in banana leaf" },
    lapis: { name: "Kuih lapis", price: 10, img: "img/kuih-lapis.jpg", kind: "Manis", desc: "Steamed layer cake, coconut milk and rose, cut fresh each evening.", alt: "Trays of colourful layered kuih" },
    teh: { name: "Teh tarik", price: 8, img: "img/teh-tarik.jpg", kind: "Minum", desc: "Strong tea and condensed milk, pulled to order until frothy. Hot or iced.", alt: "A glass mug of frothy teh tarik" }
  };
  var SIGNATURES = ["ikan", "satay", "rendang", "ayam", "nasi"];
  var MENU = [
    { id: "kecil", title: "Kecil", lead: "Small plates to start the table.", items: ["satay", "ulam"] },
    { id: "api", title: "Dari Api", lead: "Off the charcoal.", items: ["ikan", "ayam"] },
    { id: "nasi", title: "Nasi & Gulai", lead: "Rice and slow cooked curry for the middle.", items: ["rendang", "nasi"] },
    { id: "manis", title: "Manis & Minum", lead: "Something sweet, something cold.", items: ["koci", "lapis", "teh"] }
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
    else if (h < OPEN_H) t.textContent = "Open tonight · 6 PM to 11 PM";
    else if (h < CLOSE_H) t.textContent = "Open now · Kitchen until 10:30 PM";
    else { el.classList.add("closed"); t.textContent = (d + 1) % 7 === CLOSED_WEEKDAY ? "Closed now · Back Wednesday at 6 PM" : "Closed now · Back tomorrow at 6 PM"; }
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
      return { x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: Math.random() * 1.6 + 0.4, vy: Math.random() * 0.6 + 0.25, vx: (Math.random() - 0.5) * 0.3, life: Math.random() * 0.6 + 0.4, ph: Math.random() * 6.28 };
    }
    size();
    var n = w < 768 ? 28 : 55;
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
        ctx.fillStyle = "rgba(255," + (150 + (p.r * 30 | 0)) + ",90," + a.toFixed(3) + ")";
        ctx.shadowColor = "rgba(255,140,60,.8)"; ctx.shadowBlur = 8;
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
    return '<button type="button" class="card" data-dish="' + k + '"><img loading="lazy" src="' + d.img + '" alt="' + esc(d.alt) + '" width="900" height="900"><span class="price">RM' + d.price + '</span><span class="body"><span class="kind label">' + esc(d.kind) + '</span><h3>' + esc(d.name) + "</h3><p>" + esc(d.desc) + "</p></span></button>";
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
    panel.innerHTML = '<p class="lead">' + esc(s.lead) + '</p><div class="dishes">' + s.items.map(function (k) {
      var d = DISHES[k];
      return '<button type="button" class="dish" data-dish="' + k + '"><span class="thumb"><img loading="lazy" src="' + d.img + '" alt="' + esc(d.alt) + '" width="900" height="900"></span><span><span class="row"><h3>' + esc(d.name) + '</h3><span class="dots" aria-hidden="true"></span><span class="price">RM' + d.price + '</span></span><span class="desc" style="display:block">' + esc(d.desc) + "</span>" + (d.tag ? '<span class="tag">' + esc(d.tag) + "</span>" : "") + "</span></button>";
    }).join("") + "</div>";
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
    $("dishName").textContent = d.name; $("dishPrice").textContent = "RM" + d.price;
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
  var STEP_NAMES = ["When", "Time", "Details", "Review"];
  var NEXT_LABELS = ["Choose a time", "Your details", "Review booking", ""];

  function fmtTime(hhmm) { var h = Number(hhmm.slice(0, 2)); return (h % 12 || 12) + ":" + hhmm.slice(3) + " " + (h >= 12 ? "PM" : "AM"); }
  function fmtDate(d) { return fullDays[d.getDay()] + ", " + d.getDate() + " " + monNames[d.getMonth()]; }
  function sameDay(a, b) { return a && b && a.toDateString() === b.toDateString(); }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var dates = [];
  for (var k = 0; k < DAYS_AHEAD; k++) { var dd = new Date(today); dd.setDate(today.getDate() + k); dates.push(dd); }
  function lastSlotPassed(d) {
    if (!sameDay(d, new Date())) return false;
    var s = new Date(d); s.setHours(21, 30, 0, 0);
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
        b.type = "button"; b.className = "time"; b.textContent = fmtTime(t);
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
    $("timeFor").textContent = state.date ? fmtDate(state.date) + " · " + state.guests + (state.guests === 1 ? " guest" : " guests") : "";
  }

  function renderGuests() {
    $("gCount").textContent = state.guests + (state.guests === 1 ? " guest" : " guests");
    $("gMinus").disabled = state.guests <= 1;
    $("gPlus").disabled = state.guests >= MAX_GUESTS;
  }
  $("gMinus").addEventListener("click", function () { if (state.guests > 1) { state.guests--; renderGuests(); } });
  $("gPlus").addEventListener("click", function () { if (state.guests < MAX_GUESTS) { state.guests++; renderGuests(); } });
  renderGuests();

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
    if (s === 1) { if (!state.time) { $("timeErr").textContent = "Please pick a time."; return false; } }
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
    var lines = ["Hi Lindap, saya nak tempah meja.", "", "Name: " + $("name").value.trim(), "Date: " + fmtDate(state.date) + " " + state.date.getFullYear(), "Time: " + fmtTime(state.time), "Guests: " + state.guests, "Phone: " + $("phone").value.trim()];
    if (state.occasions.length) lines.push("Occasion: " + state.occasions.join(", "));
    if (notes) lines.push("Notes: " + notes);
    lines.push("", "Terima kasih!");
    return lines.join("\n");
  }
  function buildReview() {
    var rows = [["Date", fmtDate(state.date), 0], ["Time", fmtTime(state.time), 1], ["Guests", String(state.guests), 0], ["Name", $("name").value.trim(), 2], ["Phone", $("phone").value.trim(), 2]];
    if (state.occasions.length) rows.push(["Occasion", state.occasions.join(", "), 2]);
    $("reviewList").innerHTML = rows.map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + esc(r[1]) + ' <button type="button" class="edit" data-goto="' + r[2] + '">Edit</button></dd></div>';
    }).join("");
    var msg = message();
    var now = new Date();
    $("bubble").innerHTML = esc(msg) + '<span class="ts">' + now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0") + "</span>";
    $("waLink").href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
  }
  $("reviewList").addEventListener("click", function (e) { var b = e.target.closest("[data-goto]"); if (b) go(Number(b.getAttribute("data-goto"))); });

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
