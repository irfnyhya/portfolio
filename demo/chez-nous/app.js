/* Chez Nous demo: counter seat plan and the reservation system. Plain JS, no build step.
   Bookings are kept in this browser (localStorage). Nothing is sent anywhere. */
(function () {
  "use strict";

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
  for (var i = 0; i < 12; i++) {
    var x = -3.575 + 0.65 * i;
    var st = STATIONS.reduce(function (a, b) { return Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a; });
    SEATS.push({ id: "S" + String(i + 1).padStart(2, "0"), n: i + 1, x: x, station: st });
  }
  var CHEFS_TABLE = { id: "CT", name: "Chef's table", covers: 6, note: "A table for four to six beside the pastry station, at right angles to the kitchen, so you face each other and the chefs." };
  var SEATINGS = { "18:00": "6:00 PM", "20:45": "8:45 PM" };
  var CLOSED = [1, 2]; // Monday, Tuesday
  var DAYS_AHEAD = 42;
  var KEY = "chezNous.bookings.v1";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var viewImg = function (id) { return "img/view-" + id.toLowerCase() + ".jpg"; };
  var seatById = function (id) { return SEATS.filter(function (s) { return s.id === id; })[0]; };

  /* ── Reservation book (this browser) + simulated other guests ── */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode: the booking still shows */ } }
  var book = load();
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  // Other guests: the same pattern every visit for the same night, busier on Friday and Saturday
  function takenByOthers(date, time, id) {
    var dow = new Date(date + "T12:00").getDay();
    var busy = (dow === 5 || dow === 6 ? 0.5 : 0.28) + (time === "20:45" ? 0.08 : 0);
    // other guests book in pairs, so a taken seat usually has a taken neighbour
    var n = id === "CT" ? 99 : Number(id.slice(1)), pair = Math.ceil(n / 2);
    return hash(date + time + (id === "CT" ? "CT" : "P" + pair)) < busy;
  }
  function takenByMe(date, time, id) {
    return book.some(function (b) { return b.status !== "cancelled" && b.date === date && b.time === time && b.seats.indexOf(id) > -1; });
  }
  function isTaken(date, time, id) { return takenByOthers(date, time, id) || takenByMe(date, time, id); }
  function anyTaken(date, time) { return SEATS.concat([CHEFS_TABLE]).some(function (s) { return isTaken(date, time, s.id); }); }

  /* ── The counter plan (used on the page and in the booking) ── */
  function buildPlan(el) {
    var halves = [SEATS.slice(0, 6), SEATS.slice(6)];
    var range = [[-3.9, 0], [0, 3.9]];
    var html = '<div class="halves">' + halves.map(function (seats, h) {
      var sts = STATIONS.filter(function (s) { return s.x >= range[h][0] && s.x < range[h][1]; });
      return '<div class="half"><div class="stations" aria-hidden="true">' + sts.map(function (s) {
        var left = (s.x - range[h][0]) / (range[h][1] - range[h][0]) * 100;
        return '<span class="station ' + s.key + '" style="left:' + left.toFixed(1) + '%">' + s.name + "<i></i></span>";
      }).join("") + '</div><div class="bar" aria-hidden="true"></div><div class="seat-row" role="group" aria-label="Counter seats ' + seats[0].n + " to " + seats[seats.length - 1].n + '">' + seats.map(function (s) {
        return '<button type="button" class="seat" data-seat="' + s.id + '" aria-pressed="false" aria-label="Seat ' + s.n + ', facing ' + esc(s.station.long) + '">' + s.n + "</button>";
      }).join("") + "</div></div>";
    }).join("") + "</div>" +
    '<button type="button" class="ct" data-seat="CT" aria-pressed="false"><b>Chef\'s table</b><span>4 to 6 guests, beside the pastry station</span></button>' +
    '<p class="plan-key">Kitchen at the top, your seats below the counter. Numbers run from the grill end.</p>';
    el.innerHTML = html;
  }

  /* ── The live thing on the page: pick a seat, see its view ── */
  var current = "S07";
  var plan = $("plan");
  buildPlan(plan);
  plan.addEventListener("click", function (e) { var b = e.target.closest("[data-seat]"); if (b) selectSeat(b.dataset.seat); });
  function seatText(id) {
    if (id === "CT") return { name: CHEFS_TABLE.name, meta: "Table for 4 to 6 · beside the pastry station", note: CHEFS_TABLE.note };
    var s = seatById(id);
    return { name: "Seat " + s.n, meta: "Counter · facing " + s.station.long, note: NOTES[s.station.key] };
  }
  function selectSeat(id) {
    current = id;
    plan.querySelectorAll("[data-seat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.seat === id)); });
    var t = seatText(id);
    $("seatName").textContent = t.name; $("seatMeta").textContent = t.meta; $("seatNote").textContent = t.note;
    $("seatBook").textContent = id === "CT" ? "Book the chef's table" : "Book seat " + seatById(id).n;
    var poster = $("viewerPoster"); poster.src = viewImg(id); poster.alt = "The view from " + t.name.toLowerCase() + ", " + t.meta.split("· ")[1];
    document.dispatchEvent(new CustomEvent("cn:seat", { detail: { id: id } }));
  }
  selectSeat("S07");
  $("seatBook").addEventListener("click", function () {
    state.prefer = current;
    if (current === "CT" && state.guests < 4) state.guests = 4;
    openBooking(0);
  });

  /* ── Menu ──────────────────────────────────────────── */
  var COURSES = [
    ["Gougères au comté", "Warm cheese puffs from the pastry marble, with a glass of crémant", "Pastry"],
    ["Velouté de topinambour", "Jerusalem artichoke soup, hazelnut oil, crisp shallots", "Stove"],
    ["Saint-Jacques, beurre noisette", "Scallops seared in front of you, brown butter, cauliflower", "Stove"],
    ["Maquereau à la braise", "Mackerel over charcoal, pickled shallot, sorrel", "Grill"],
    ["Canard à l'orange", "Duck breast from the grill, bitter orange sauce poured at the pass", "Grill"],
    ["Le chariot de fromages", "Three French cheeses, walnut bread", "Pass"],
    ["Soufflé au Grand Marnier", "Risen to order and opened at the counter with crème anglaise", "Pastry"]
  ];
  $("courses").innerHTML = COURSES.map(function (c, i) {
    return '<li class="course rise" style="--d:' + (i * 0.05).toFixed(2) + 's"><h3>' + esc(c[0]) + '</h3><span class="fr">' + esc(c[2]) + "</span><p>" + esc(c[1]) + "</p></li>";
  }).join("");

  /* ── Header + entrances ────────────────────────────── */
  var header = $("header"), lastY = 0;
  var heroImg = document.querySelector(".hero-media img");
  function onScroll() {
    var y = window.scrollY;
    if (!reduce && y < window.innerHeight * 1.2) heroImg.style.transform = "translate3d(0," + (y * 0.18).toFixed(1) + "px,0) scale(" + (1 + y / window.innerHeight * 0.06).toFixed(3) + ")";
    header.classList.toggle("solid", y > 40);
    header.classList.toggle("hide", y > window.innerHeight && y > lastY + 4 && !document.body.classList.contains("locked"));
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var rises = document.querySelectorAll(".rise");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -10% 0px" });
    rises.forEach(function (el) { io.observe(el); });
  } else rises.forEach(function (el) { el.classList.add("in"); });

  /* ── Booking sheet ─────────────────────────────────── */
  var sheet = $("booking"), lastFocus = null, step = 0;
  var stepsEls = sheet.querySelectorAll(".step"), progress = sheet.querySelectorAll(".progress span");
  var STEP_NAMES = ["Step 1 of 4 · When", "Step 2 of 4 · Seats", "Step 3 of 4 · Details", "Step 4 of 4 · Confirm", "Confirmed", "Saved in this browser"];
  var NEXT = ["Choose your seats", "Your details", "Check the booking", "Confirm reservation"];
  var state = { date: null, time: null, guests: 2, seats: [], prefer: null, occasions: [] };
  var lastBooking = null;
  var dayN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], monN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var fullDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function fmtDate(s) { var d = new Date(s + "T12:00"); return fullDay[d.getDay()] + ", " + d.getDate() + " " + monN[d.getMonth()] + " " + d.getFullYear(); }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var dates = [];
  for (var k = 0; k < DAYS_AHEAD; k++) { var dd = new Date(today); dd.setDate(today.getDate() + k); dates.push(dd); }
  function seatingPassed(date, time) {
    if (date !== iso(new Date())) return false;
    var t = new Date(); var s = new Date(); s.setHours(Number(time.slice(0, 2)), Number(time.slice(3)), 0, 0);
    return s - t < 2 * 3600 * 1000;
  }
  function buildDays() {
    var box = $("days"); box.innerHTML = "";
    dates.forEach(function (d, i) {
      var b = document.createElement("button"), id = iso(d);
      var closed = CLOSED.indexOf(d.getDay()) > -1 || (seatingPassed(id, "18:00") && seatingPassed(id, "20:45"));
      b.type = "button"; b.className = "day"; b.disabled = closed;
      b.setAttribute("aria-pressed", String(state.date === id));
      b.setAttribute("aria-label", fmtDate(id) + (closed ? ", closed" : ""));
      b.innerHTML = '<span class="dw">' + (i === 0 ? "Today" : dayN[d.getDay()]) + '</span><span class="dn">' + d.getDate() + '</span><span class="dm">' + monN[d.getMonth()] + "</span>";
      b.addEventListener("click", function () {
        state.date = id; $("dateErr").textContent = "";
        Array.prototype.forEach.call(box.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        syncTimes();
      });
      box.appendChild(b);
    });
    syncTimes();
  }
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
    $("gCount").textContent = g + (g === 1 ? " guest" : " guests");
    $("gMinus").disabled = g <= 1; $("gPlus").disabled = g >= 18;
    $("guestHint").textContent = g <= 3 ? "You choose the seats next, side by side at the counter."
      : g <= 6 ? "Side by side at the counter, or the chef's table facing each other."
      : "Seven or more takes the whole room: twelve counter seats and the chef's table. We confirm by phone.";
  }
  $("gMinus").addEventListener("click", function () { if (state.guests > 1) { state.guests--; renderGuests(); } });
  $("gPlus").addEventListener("click", function () { if (state.guests < 18) { state.guests++; renderGuests(); } });

  /* Seats step: N guests take N seats in a row, starting from the one tapped */
  var bookPlan = $("bookPlan");
  buildPlan(bookPlan);
  function free(id) { return !isTaken(state.date, state.time, id); }
  function blockFrom(n, g) {
    // try the block that starts at seat n, then blocks that still include n
    for (var start = n; start >= Math.max(1, n - g + 1); start--) {
      var end = start + g - 1; if (end > 12) continue;
      var ids = []; for (var j = start; j <= end; j++) ids.push("S" + String(j).padStart(2, "0"));
      if (ids.every(free)) return ids;
    }
    return null;
  }
  function buildSeatStep() {
    var g = state.guests, whole = g >= 7;
    $("seatFor").textContent = fmtDate(state.date) + ", " + SEATINGS[state.time] + " · " + g + (g === 1 ? " guest" : " guests");
    bookPlan.querySelectorAll("[data-seat]").forEach(function (b) {
      var id = b.dataset.seat, taken = !free(id);
      if (id === "CT") {
        b.disabled = whole || taken || g < 4;
        b.querySelector("span").textContent = taken ? "Taken for this seating" : g < 4 ? "For 4 to 6 guests" : "4 to 6 guests, beside the pastry station";
      } else {
        b.disabled = whole || taken;
        b.setAttribute("aria-label", "Seat " + id.slice(1).replace(/^0/, "") + (taken ? ", taken" : ", facing " + seatById(id).station.long));
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
    if (b.dataset.seat === "CT") { state.seats = ["CT"]; }
    else {
      var bl = blockFrom(Number(b.dataset.seat.slice(1)), g);
      if (bl) state.seats = bl;
      else { $("seatErr").textContent = "There are not " + g + " free seats together there. Try another part of the counter."; }
    }
    syncSeats();
  });
  function syncSeats() {
    bookPlan.querySelectorAll("[data-seat]").forEach(function (b) { b.setAttribute("aria-pressed", String(state.seats.indexOf(b.dataset.seat) > -1)); });
    var prev = $("seatPreview");
    if (!state.seats.length) { prev.hidden = true; $("pickSum").textContent = ""; return; }
    prev.hidden = false;
    var lead = state.seats.length > 12 ? "HERO" : state.seats[Math.floor((state.seats.length - 1) / 2)];
    prev.src = lead === "HERO" ? "img/view-hero.jpg" : viewImg(lead);
    prev.alt = "The view from your seats";
    $("pickSum").textContent = seatsLabel(state.seats);
  }
  function seatsLabel(ids) {
    if (ids.length > 12) return "The whole room, 18 seats";
    if (ids[0] === "CT") return "The chef's table";
    var a = Number(ids[0].slice(1)), b = Number(ids[ids.length - 1].slice(1));
    var st = seatById(ids[Math.floor((ids.length - 1) / 2)]).station;
    return (a === b ? "Seat " + a : "Seats " + a + " to " + b) + ", facing " + st.long;
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
    return {
      ref: null, date: state.date, time: state.time, guests: state.guests, seats: state.seats.slice(), where: seatsLabel(state.seats),
      name: $("name").value.trim(), phone: $("phone").value.trim(), email: $("email").value.trim(),
      occasions: state.occasions.slice(), notes: $("notes").value.trim(), status: state.guests >= 7 ? "requested" : "confirmed"
    };
  }
  function rows(b, editable) {
    var r = [["Night", fmtDate(b.date), 0], ["Seating", SEATINGS[b.time], 0], ["Guests", String(b.guests), 0], ["Seats", b.where, 1], ["Name", b.name, 2], ["Phone", b.phone, 2], ["Email", b.email, 2]];
    if (b.occasions.length) r.push(["Occasion", b.occasions.join(", "), 2]);
    if (b.notes) r.push(["Notes", b.notes, 2]);
    return "<dl>" + r.map(function (x) {
      return "<div><dt>" + x[0] + "</dt><dd>" + esc(x[1]) + "</dd>" + (editable ? '<button type="button" class="edit" data-goto="' + x[2] + '" aria-label="Change ' + x[0].toLowerCase() + '">Change</button>' : "<span></span>") + "</div>";
    }).join("") + "</dl>";
  }
  function viewFor(b) { return b.seats.length > 12 ? "img/view-hero.jpg" : viewImg(b.seats[Math.floor((b.seats.length - 1) / 2)]); }
  $("review").addEventListener("click", function (e) { var x = e.target.closest("[data-goto]"); if (x) go(Number(x.dataset.goto)); });

  function confirmBooking() {
    book = load(); // another tab may have booked meanwhile
    if (!state.seats.every(free)) { state.seats = []; go(1); $("seatErr").textContent = "Those seats were just taken. Please choose others."; return; }
    var b = draft();
    b.ref = "CN-" + b.date.slice(5).replace("-", "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    b.created = new Date().toISOString();
    book.push(b); save(book); lastBooking = b;
    $("doneTitle").textContent = b.status === "requested" ? "Request received" : "You're booked";
    $("done").innerHTML = '<p class="ref">' + b.ref + '</p><img class="review-view" src="' + viewFor(b) + '" alt="The view from your seats" style="margin-top:1rem">' + rows(b, false) +
      '<p class="hint" style="padding:0 1.25rem 1.25rem">' + (b.status === "requested"
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
    if (!list.length) { $("mineList").innerHTML = '<p class="empty">No bookings in this browser yet.</p><div class="done-actions"><button type="button" class="btn btn-copper" data-new>Reserve a seat</button></div>'; return; }
    $("mineList").innerHTML = list.map(function (b) {
      var st = b.status === "cancelled" ? "Cancelled" : b.status === "requested" ? "Requested, we will call" : "Confirmed";
      return '<div class="mine' + (b.status === "cancelled" ? " cancelled" : "") + '"><b>' + esc(b.ref) + "</b><span>" + esc(fmtDate(b.date)) + ", " + SEATINGS[b.time] + " · " + b.guests + (b.guests === 1 ? " guest" : " guests") + "</span><span>" + esc(b.where) + '</span><span class="status">' + st + "</span>" +
        (b.status === "cancelled" ? "" : '<div class="mine-actions"><button type="button" class="link-btn" data-ics="' + b.ref + '">Add to calendar</button><button type="button" class="link-btn" data-cancel="' + b.ref + '">Cancel booking</button></div>') + "</div>";
    }).join("") + '<div class="done-actions"><button type="button" class="btn btn-copper" data-new>Book another night</button></div>';
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

  function go(n) {
    if (n === 0) { buildDays(); renderGuests(); }
    if (n === 1) { $("seatErr").textContent = ""; buildSeatStep(); }
    if (n === 3) { var b = draft(); $("review").innerHTML = '<img class="review-view" src="' + viewFor(b) + '" alt="The view from your seats">' + rows(b, true); }
    if (n === 5) buildMine();
    step = n;
    stepsEls.forEach(function (el, i) { el.classList.toggle("active", i === n); el.setAttribute("aria-hidden", String(i !== n)); });
    $("stepName").textContent = STEP_NAMES[n];
    progress.forEach(function (p, i) { p.classList.toggle("on", n >= 4 || i <= n); });
    $("stepBack").hidden = n === 0;
    $("sheetFoot").hidden = n >= 4;
    $("stepNext").textContent = NEXT[n] || "";
    $("bookForm").scrollTop = 0;
    var h = stepsEls[n].querySelector("h2");
    setTimeout(function () { h.focus({ preventScroll: true }); }, 60);
  }
  $("stepNext").addEventListener("click", function () { if (!validate(step)) return; if (step === 3) confirmBooking(); else go(step + 1); });
  $("stepBack").addEventListener("click", function () { go(Math.max(0, step - 1)); });
  $("bookForm").addEventListener("submit", function (e) { e.preventDefault(); });

  function openBooking(at) {
    lastFocus = document.activeElement;
    sheet.classList.add("open"); document.body.classList.add("locked");
    go(at);
  }
  function closeBooking() {
    sheet.classList.remove("open"); document.body.classList.remove("locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-book]")) openBooking(0);
    else if (e.target.closest("[data-mine]")) openBooking(5);
    else if (e.target.closest("#booking [data-close]")) closeBooking();
  });
  document.addEventListener("keydown", function (e) {
    if (!sheet.classList.contains("open")) return;
    if (e.key === "Escape") closeBooking();
    if (e.key === "Tab") {
      var f = Array.prototype.filter.call(sheet.querySelectorAll("button, a[href], input, textarea"), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  renderGuests();
})();
