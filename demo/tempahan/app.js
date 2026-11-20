/* Klinik Pergigian Teratai Biru: demo booking app + clinic admin.
   Everything lives in localStorage; nothing leaves the browser.
   No wa.me link on purpose: the demo shows the prefilled WhatsApp message on screen,
   so a test booking can never reach a real person's phone. */
(function () {
  "use strict";

  var STORE = "teratai-biru-demo-v1";
  var PIN = "1234";
  var STEP = 30; // minutes per slot
  var DAYS_AHEAD = 28;

  var SERVICES = [
    { id: "periksa", cat: "periksa", name: "Pemeriksaan dan cuci gigi", desc: "Pemeriksaan penuh, scaling dan polish.", price: 90, mins: 30, deposit: 20 },
    { id: "anak", cat: "periksa", name: "Pemeriksaan gigi anak", desc: "Untuk anak berumur 12 tahun ke bawah.", price: 50, mins: 30, deposit: 20 },
    { id: "tampal", cat: "rawatan", name: "Tampalan gigi", desc: "Tampalan warna gigi untuk satu gigi.", price: 150, mins: 60, deposit: 30 },
    { id: "cabut", cat: "rawatan", name: "Cabut gigi", desc: "Cabutan biasa dengan bius setempat.", price: 120, mins: 30, deposit: 30 },
    { id: "akar", cat: "rawatan", name: "Rawatan saluran akar", desc: "Sesi pertama untuk satu gigi.", price: 850, mins: 90, deposit: 150 },
    { id: "pendakap", cat: "estetik", name: "Konsultasi pendakap gigi", desc: "Penilaian, gambar gigi dan pelan rawatan.", price: 80, mins: 30, deposit: 20 },
    { id: "putih", cat: "estetik", name: "Pemutihan gigi", desc: "Rawatan di klinik, satu sesi.", price: 700, mins: 90, deposit: 100 }
  ];
  var CATS = [["all", "Semua"], ["periksa", "Pemeriksaan"], ["rawatan", "Rawatan"], ["estetik", "Estetik"]];
  var SVC = {};
  SERVICES.forEach(function (s) { SVC[s.id] = s; });

  // Extra strokes drawn on the tooth glyph, one per service
  var GLYPH = {
    periksa: '<path d="M9 9.5c1 .7 2 1 3 1s2-.3 3-1"/>',
    anak: '<circle cx="9.5" cy="9" r=".6"/><circle cx="14.5" cy="9" r=".6"/><path d="M10 11.5c.6.5 1.3.7 2 .7s1.4-.2 2-.7"/>',
    tampal: '<circle cx="12" cy="9" r="2.2"/>',
    cabut: '<path d="M12 12V6.5M9.8 8.6 12 6.4l2.2 2.2"/>',
    akar: '<path d="M10.5 9v5M13.5 9v5"/>',
    pendakap: '<path d="M5 10h14M8.5 8.7v2.6M12 8.7v2.6M15.5 8.7v2.6"/>',
    putih: '<path d="M18.5 2.5v3M17 4h3M20 9.5v2M19 10.5h2"/>'
  };

  // Sessions per weekday, 0 = Sunday
  var HOURS = {
    0: [],
    1: [["09:00", "13:00"], ["14:00", "18:00"]],
    2: [["09:00", "13:00"], ["14:00", "18:00"]],
    3: [["09:00", "13:00"], ["14:00", "18:00"]],
    4: [["09:00", "13:00"], ["14:00", "18:00"]],
    5: [["09:00", "12:30"], ["15:00", "18:00"]],
    6: [["09:00", "14:00"]]
  };

  var DOW = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
  var DOW_S = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
  var MON = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
  var MON_L = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

  /* ---------------- helpers ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function fromIso(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function toMin(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
  function toHM(m) { return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
  function rm(n) { return "RM" + n.toLocaleString("en-MY"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function part(h) { return h < 12 ? "pagi" : h < 14 ? "tengah hari" : "petang"; }
  function timeLabel(hm) {
    var m = toMin(hm), h = Math.floor(m / 60);
    return (h > 12 ? h - 12 : h) + "." + pad(m % 60) + " " + part(h);
  }
  function timeNum(hm) { var m = toMin(hm), h = Math.floor(m / 60); return (h > 12 ? h - 12 : h) + "." + pad(m % 60); }
  function timeShort(hm) { return timeLabel(hm).replace(" tengah hari", " tgh").replace(" petang", " ptg"); }
  function dateLong(s) { var d = fromIso(s); return DOW[d.getDay()] + ", " + d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear(); }
  function dateMid(s) { var d = fromIso(s); return DOW[d.getDay()] + ", " + d.getDate() + " " + MON[d.getMonth()]; }
  function dateShort(s) { var d = fromIso(s); return DOW_S[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()]; }
  function mondayOf(d) { var x = new Date(d); x.setDate(x.getDate() - (x.getDay() + 6) % 7); x.setHours(0, 0, 0, 0); return x; }
  function nowMin() { var n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
  function initials(n) { var p = n.trim().split(/\s+/); return ((p[0] || "")[0] + ((p[1] || "")[0] || "")).toUpperCase(); }
  function glyph(id) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-tooth"/>' + (GLYPH[id] || "") + "</svg>"; }
  function icon(id) { return '<svg aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- store ---------------- */
  var db;
  function load() {
    try { db = JSON.parse(localStorage.getItem(STORE)); } catch (e) { db = null; }
    if (!db || !Array.isArray(db.bookings)) { db = seed(); save(); }
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch (e) { /* private mode: memory only */ } }

  var REF_CH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function newRef(rand) {
    var r;
    do {
      r = "TB";
      for (var i = 0; i < 4; i++) r += REF_CH[Math.floor((rand ? rand() : Math.random()) * REF_CH.length)];
    } while (db && db.bookings && db.bookings.some(function (b) { return b.ref === r; }));
    return r;
  }

  function sessionsFor(dIso) { return HOURS[fromIso(dIso).getDay()] || []; }
  function fits(dIso, start, mins) {
    return sessionsFor(dIso).some(function (s) { return start >= toMin(s[0]) && start + mins <= toMin(s[1]); });
  }
  function occupied(dIso, skipRef) {
    var set = {};
    db.bookings.forEach(function (b) {
      if (b.date !== dIso || b.status === "cancelled" || b.ref === skipRef) return;
      var st = toMin(b.time);
      for (var t = st; t < st + SVC[b.service].mins; t += STEP) set[t] = true;
    });
    return set;
  }
  function slotsFor(dIso, svc) {
    var occ = occupied(dIso), out = [];
    var isToday = dIso === iso(today()), cutoff = nowMin() + 60;
    sessionsFor(dIso).forEach(function (s) {
      var a = toMin(s[0]), z = toMin(s[1]);
      for (var t = a; t + svc.mins <= z; t += STEP) {
        if (isToday && t < cutoff) continue;
        var free = true;
        for (var u = t; u < t + svc.mins; u += STEP) if (occ[u]) { free = false; break; }
        out.push({ t: t, ok: free, hm: toHM(t) });
      }
    });
    return out;
  }

  function seed() {
    var s = 7;
    function rand() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    db = { bookings: [], blocked: {}, created: Date.now() };
    var t0 = today();
    var names = ["Nurul Aina", "Ahmad Faiz", "Tan Wei Ling", "Siti Hajar", "Muthu Kumar", "Farah Nadia", "Lim Kok Seng",
      "Aiman Hakim", "Priya Devi", "Hafiz Rahman", "Chong Mei Yee", "Zulaikha Omar", "Rizal Ismail", "Kavitha Rao",
      "Amirul Haziq", "Wong Jia Hui", "Nadia Sofea", "Syafiq Azmi", "Lee Chee Keong", "Aisyah Humaira", "Danial Iskandar",
      "Ong Pei Shan", "Haslinda Yusof", "Ravi Shankar", "Izzati Kamal"];
    var patterns = [
      [["09:00", "periksa"], ["10:00", "tampal"], ["11:30", "anak"], ["15:00", "akar"], ["16:30", "periksa"]],
      [["09:30", "pendakap"], ["10:30", "cabut"], ["11:00", "periksa"], ["15:30", "putih"]],
      [["09:00", "putih"], ["11:00", "periksa"], ["12:00", "anak"], ["15:00", "tampal"], ["17:00", "cabut"]],
      [["10:00", "periksa"], ["11:30", "pendakap"], ["16:00", "periksa"]]
    ];
    var notes = ["Gigi geraham kiri sakit bila minum sejuk", "", "", "Anak agak takut, mohon sabar ya", "", "Mahu tanya kos pendakap", "", ""];
    var work = [];
    for (var off = -3; off <= 11; off++) if (addDays(t0, off).getDay() !== 0) work.push(off);
    var blockOff = work.filter(function (o) { return o > 1; })[4];
    db.blocked[iso(addDays(t0, blockOff))] = "Cuti klinik (latihan staf)";

    var n = 0, nowM = nowMin();
    work.forEach(function (off, wi) {
      if (off === blockOff) return;
      var dIso = iso(addDays(t0, off));
      var pat = patterns[wi % patterns.length];
      if (off > 7) pat = pat.slice(0, 2);
      pat.forEach(function (p, pi) {
        var svc = SVC[p[1]], st = toMin(p[0]);
        if (!fits(dIso, st, svc.mins)) return;
        var status = "confirmed", paid = (n % 3) !== 0;
        if (off < 0 || (off === 0 && st + svc.mins <= nowM)) { status = "done"; paid = true; }
        if ((off === -2 && pi === 1) || (off === 3 && pi === 2)) { status = "cancelled"; paid = false; }
        db.bookings.push({
          ref: newRef(rand), service: svc.id, date: dIso, time: p[0],
          name: names[n % names.length], phone: "010 000 " + (1000 + ((n * 379) % 9000)),
          note: notes[n % notes.length], status: status, paid: paid,
          createdAt: addDays(t0, Math.min(off, 0) - 2 - (n % 4)).getTime() + 9 * 3600e3, seeded: true
        });
        n++;
      });
    });
    return db;
  }

  /* ---------------- toast ---------------- */
  var toastTimer;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2800);
  }

  /* =========================================================
     CUSTOMER
     ========================================================= */
  var pick = { service: null, date: null, time: null };
  var ui = { step: 1, cat: "all", month: null };

  function openNow() {
    var t = iso(today()), now = nowMin(), el = $("#open-now");
    var sess = db.blocked[t] ? [] : sessionsFor(t);
    var inS = sess.filter(function (s) { return now >= toMin(s[0]) && now < toMin(s[1]); })[0];
    if (inS) { el.className = "open-now"; el.innerHTML = "Buka sekarang <span>hingga " + timeLabel(inS[1]) + "</span>"; return; }
    var later = sess.filter(function (s) { return now < toMin(s[0]); })[0];
    if (later) { el.className = "open-now is-closed"; el.innerHTML = "Tutup sekarang <span>buka semula " + timeLabel(later[0]) + "</span>"; return; }
    for (var i = 1; i < 8; i++) {
      var d = iso(addDays(today(), i));
      if (!db.blocked[d] && sessionsFor(d).length) {
        el.className = "open-now is-closed";
        el.innerHTML = "Tutup sekarang <span>buka " + (i === 1 ? "esok" : DOW[fromIso(d).getDay()]) + " " + timeLabel(sessionsFor(d)[0][0]) + "</span>";
        return;
      }
    }
  }

  function renderCats() {
    $("#cats").innerHTML = CATS.map(function (c) {
      return '<button type="button" role="tab" class="chip" data-cat="' + c[0] + '" aria-selected="' + (ui.cat === c[0]) + '">' + c[1] + "</button>";
    }).join("");
  }

  function renderServices() {
    $("#svc-list").innerHTML = SERVICES.filter(function (s) { return ui.cat === "all" || s.cat === ui.cat; }).map(function (s) {
      return '<button type="button" role="radio" class="svc" data-svc="' + s.id + '" aria-checked="' + (pick.service === s.id) + '">' +
        '<span class="svc__icon">' + glyph(s.id) + "</span>" +
        '<span class="svc__name">' + esc(s.name) + "</span>" +
        '<span class="svc__price num">' + rm(s.price) + "</span>" +
        '<span class="svc__desc">' + esc(s.desc) + "</span>" +
        '<span class="svc__meta"><span>' + icon("clock") + s.mins + ' minit</span><span>' + icon("wallet") + "Deposit " + rm(s.deposit) + "</span></span>" +
        '<span class="svc__tick">' + icon("check") + "</span>" +
        "</button>";
    }).join("");
  }

  function dayState(dIso, svc) {
    var d = fromIso(dIso), t = iso(today());
    if (dIso < t || dIso > iso(addDays(today(), DAYS_AHEAD))) return { off: true, why: "di luar tempoh tempahan" };
    if (d.getDay() === 0) return { off: true, why: "Ahad, tutup" };
    if (db.blocked[dIso]) return { off: true, blocked: true, why: "klinik tutup" };
    var slots = slotsFor(dIso, svc || SVC.periksa);
    var free = slots.filter(function (x) { return x.ok; }).length;
    if (!slots.length) return { off: true, why: "waktu tamat" };
    if (!free) return { off: true, why: "penuh" };
    return { off: false, few: free <= 3, free: free, why: free + " slot kosong" };
  }

  function renderCal() {
    var svc = pick.service ? SVC[pick.service] : null;
    var m = ui.month, y = m.getFullYear(), mo = m.getMonth();
    var first = new Date(y, mo, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
    var t = iso(today()), html = "";
    $("#c-month").textContent = MON_L[mo] + " " + y;
    $("[data-cmonth='-1']").disabled = y === today().getFullYear() && mo === today().getMonth();
    var last = addDays(today(), DAYS_AHEAD);
    $("[data-cmonth='1']").disabled = new Date(y, mo + 1, 1) > last;
    ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"].forEach(function (d) { html += '<span class="ccal__dow">' + d + "</span>"; });
    for (var i = 0; i < lead; i++) html += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var dIso = iso(new Date(y, mo, d)), st = dayState(dIso, svc);
      if (pick.date === dIso && st.off) { pick.date = null; pick.time = null; }
      var sel = pick.date === dIso;
      html += '<button type="button" class="cday num' + (st.few ? " is-few" : "") + (st.blocked ? " is-blocked" : "") + (dIso === t ? " is-today" : "") +
        '" data-date="' + dIso + '" aria-selected="' + sel + '"' + (st.off ? " disabled" : "") +
        ' aria-label="' + dateLong(dIso) + ", " + st.why + '">' + d + "</button>";
    }
    $("#ccal").innerHTML = html;
  }

  function renderSlots() {
    var el = $("#slots"), count = $("#slots-count");
    if (!pick.date) {
      $("#slots-title").textContent = "Masa yang kosong";
      count.textContent = "";
      el.innerHTML = '<p class="empty">Pilih tarikh pada kalendar untuk lihat masa yang kosong.</p>';
      return;
    }
    var svc = SVC[pick.service], slots = slotsFor(pick.date, svc);
    if (pick.time && !slots.some(function (s) { return s.hm === pick.time && s.ok; })) pick.time = null;
    $("#slots-title").textContent = dateMid(pick.date);
    var free = slots.filter(function (s) { return s.ok; }).length;
    count.textContent = free + " slot kosong · " + svc.mins + " minit";
    var groups = [{ label: "Pagi", items: [] }, { label: "Tengah hari dan petang", items: [] }];
    slots.forEach(function (s) { groups[s.t < 12 * 60 ? 0 : 1].items.push(s); });
    var html = "";
    groups.forEach(function (g) {
      if (!g.items.length) return;
      html += '<div class="slots__group"><h4>' + g.label + '</h4><div class="slots__grid">' +
        g.items.map(function (s) {
          var h = Math.floor(s.t / 60), sel = pick.time === s.hm;
          return '<button type="button" class="slot num" data-time="' + s.hm + '"' +
            (s.ok ? ' aria-pressed="' + sel + '" aria-label="' + timeLabel(s.hm) + '"' : ' disabled aria-label="' + timeLabel(s.hm) + ', sudah ditempah"') + ">" +
            '<span class="t">' + timeNum(s.hm) + "</span><small>" + (s.ok ? part(h) : "penuh") + "</small></button>";
        }).join("") + "</div></div>";
    });
    el.innerHTML = html || '<p class="empty">Tiada masa kosong pada tarikh ini. Cuba tarikh lain.</p>';
  }

  function phoneOk(v) { var d = v.replace(/\D/g, ""); return d.length >= 9 && d.length <= 12; }

  function renderReceipt() {
    var svc = SVC[pick.service];
    if (!svc || !pick.date || !pick.time) { $("#receipt").innerHTML = ""; return; }
    var d = fromIso(pick.date);
    $("#receipt").innerHTML =
      '<div class="receipt__top"><div class="receipt__date num"><small>' + DOW_S[d.getDay()] + "</small><strong>" + d.getDate() + "</strong><small>" + MON[d.getMonth()] + "</small></div>" +
      '<div class="receipt__what"><strong>' + esc(svc.name) + "</strong><span>" + timeLabel(pick.time) + " · " + svc.mins + " minit</span></div></div>" +
      '<dl class="num"><div><dt>Anggaran harga</dt><dd>' + rm(svc.price) + "</dd></div>" +
      "<div><dt>Baki dibayar di klinik</dt><dd>" + rm(svc.price - svc.deposit) + "</dd></div>" +
      '<div class="is-key"><dt>Deposit untuk kunci slot</dt><dd>' + rm(svc.deposit) + "</dd></div></dl>";
  }

  function stepReady(n) {
    if (n === 1) return !!pick.service;
    if (n === 2) return !!(pick.date && pick.time);
    return $("#f-name").value.trim().length >= 2 && phoneOk($("#f-phone").value);
  }

  function renderBar() {
    var svc = pick.service ? SVC[pick.service] : null, sum = "", label = "Seterusnya", ready = stepReady(ui.step);
    if (ui.step === 1) sum = svc ? '<span class="trunc">' + esc(svc.name) + '</span><strong class="num">' + rm(svc.price) + "</strong>" : "<span>Pilih satu rawatan</span><strong>Mula di sini</strong>";
    if (ui.step === 2) sum = pick.time ? '<span class="trunc">' + dateMid(pick.date) + "</span><strong>" + timeLabel(pick.time) + "</strong>" : '<span class="trunc">' + esc(svc.name) + "</span><strong>Pilih tarikh dan masa</strong>";
    if (ui.step === 3) { sum = '<span>Deposit sekarang</span><strong class="num">' + rm(svc.deposit) + "</strong>"; label = "Sahkan tempahan"; }
    $("#bar-sum").innerHTML = sum;
    var b = $("#bar-btn");
    b.textContent = label;
    if (ready) b.removeAttribute("aria-disabled"); else b.setAttribute("aria-disabled", "true");
  }

  function renderSteps() {
    $$(".step").forEach(function (s) { s.hidden = +s.dataset.step !== ui.step; });
    $("#steps-fill").style.width = (ui.step / 3 * 100) + "%";
    $$("[data-step-label]").forEach(function (l) {
      var n = +l.dataset.stepLabel;
      l.className = n === ui.step ? "is-on" : n < ui.step ? "is-done" : "";
    });
    $("#back").hidden = ui.step === 1;
    if (ui.step === 2) { renderCal(); renderSlots(); }
    if (ui.step === 3) renderReceipt();
    renderBar();
  }

  function go(n) {
    ui.step = n;
    renderSteps();
    var top = $("#book").getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
  }

  function renderCustomer() { openNow(); renderCats(); renderServices(); renderSteps(); }

  function waText(b) {
    var s = SVC[b.service];
    return [
      "Salam Klinik Pergigian Teratai Biru, saya ingin sahkan tempahan saya.", "",
      "Rujukan: " + b.ref, "Rawatan: " + s.name, "Tarikh: " + dateLong(b.date), "Masa: " + timeLabel(b.time),
      "Nama: " + b.name, "Telefon: " + b.phone, "Deposit: " + rm(s.deposit),
      b.note ? "Nota: " + b.note : null, "", "(Tempahan demo)"
    ].filter(function (x) { return x !== null; }).join("\n");
  }

  function ics(b) {
    var s = SVC[b.service], d = b.date.replace(/-/g, ""), st = toMin(b.time), en = st + s.mins;
    function t(m) { return pad(Math.floor(m / 60)) + pad(m % 60) + "00"; }
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Teratai Biru Demo//MS", "BEGIN:VEVENT",
      "UID:" + b.ref + "@teratai-biru.demo", "DTSTAMP:" + stamp, "DTSTART:" + d + "T" + t(st), "DTEND:" + d + "T" + t(en),
      "SUMMARY:" + s.name + " (Klinik Pergigian Teratai Biru\\, demo)",
      "LOCATION:No. 12\\, Jalan Teratai 3\\, Seksyen 9\\, Bandar Baru Bangi",
      "DESCRIPTION:Rujukan " + b.ref + ". Ini tempahan demo.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  }

  function showConfirm(b) {
    var s = SVC[b.service], el = $("#confirm");
    el.innerHTML =
      '<div class="confirm__hero"><div class="burst">' + icon("check") + "</div>" +
      '<h2 id="confirm-title">Slot anda sudah disimpan</h2>' +
      '<p class="confirm__lead">Terima kasih, ' + esc(b.name.split(" ")[0]) + ". Bayar deposit untuk sahkan tempahan ini.</p></div>" +
      '<div class="ticket">' +
      '<div class="ticket__top"><div><small>Nombor rujukan</small><div class="ticket__ref num">' + b.ref + "</div></div>" +
      '<div class="ticket__brand"><svg aria-hidden="true"><use href="#i-lotus"/></svg>Teratai Biru</div></div>' +
      '<div class="ticket__cut"></div>' +
      '<div class="ticket__body">' +
      '<div class="wide"><small>Rawatan</small><strong>' + esc(s.name) + "</strong></div>" +
      "<div><small>Tarikh</small><strong>" + dateMid(b.date) + "</strong></div>" +
      "<div><small>Masa</small><strong>" + timeLabel(b.time) + "</strong></div>" +
      "<div><small>Nama</small><strong>" + esc(b.name) + "</strong></div>" +
      '<div><small>Telefon</small><strong class="num">' + esc(b.phone) + "</strong></div>" +
      "</div></div>" +
      '<div class="deposit-due"><strong class="num">Deposit ' + rm(s.deposit) + " dalam 24 jam</strong>" +
      "Hantar butiran tempahan ke WhatsApp klinik dan kaunter akan balas dengan cara bayaran. Baki " + rm(s.price - s.deposit) + " dibayar di klinik.</div>" +
      '<div class="confirm__actions">' +
      '<button type="button" class="btn btn--accent" id="wa-btn" aria-expanded="false" aria-controls="wa-preview">' + icon("chat") + "Hantar ke WhatsApp</button>" +
      '<div id="wa-preview" class="wa" hidden><p class="wa__label">Mesej yang akan dihantar ke WhatsApp klinik</p>' +
      '<div class="wa__bubble">' + esc(waText(b)) + "</div>" +
      '<p class="wa__note">Dalam demo ini mesej ini tidak dihantar kepada sesiapa. Pada laman sebenar, butang ini membuka WhatsApp dengan mesej ini sedia ditaip.</p></div>' +
      '<button type="button" class="btn btn--ghost" id="ics-btn">' + icon("cal") + "Simpan ke kalendar</button>" +
      '<button type="button" class="btn btn--ghost" id="again">Buat tempahan lain</button>' +
      "</div>" +
      '<p class="confirm__fine">Mahu lihat sisi klinik? <a href="#admin">Buka paparan admin</a> dan cari ' + b.ref + ".</p>";
    $("#book-form").hidden = true;
    el.hidden = false;
    document.body.classList.add("is-confirmed");
    el.focus({ preventScroll: true });
    var top = $("#book").getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    $("#wa-btn").addEventListener("click", function () {
      var pv = $("#wa-preview"), open = pv.hidden;
      pv.hidden = !open;
      this.setAttribute("aria-expanded", open);
      if (open) pv.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    });
    $("#ics-btn").addEventListener("click", function () {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics(b)], { type: "text/calendar" }));
      a.download = "tempahan-" + b.ref + ".ics";
      document.body.appendChild(a); a.click(); a.remove();
      toast("Fail kalendar " + b.ref + " dimuat turun");
    });
    $("#again").addEventListener("click", function () { resetFlow(); window.scrollTo(0, 0); });
  }

  function resetFlow() {
    pick = { service: null, date: null, time: null };
    ui.step = 1; ui.cat = "all"; ui.month = new Date(today().getFullYear(), today().getMonth(), 1);
    $("#book-form").reset();
    $("#confirm").hidden = true; $("#book-form").hidden = false;
    document.body.classList.remove("is-confirmed");
    renderCustomer();
  }

  function bindCustomer() {
    $("#cats").addEventListener("click", function (e) {
      var c = e.target.closest("[data-cat]");
      if (!c) return;
      ui.cat = c.dataset.cat; renderCats(); renderServices();
    });
    $("#svc-list").addEventListener("click", function (e) {
      var b = e.target.closest(".svc");
      if (!b) return;
      pick.service = b.dataset.svc;
      $$(".svc", this).forEach(function (x) { x.setAttribute("aria-checked", x === b); });
      renderBar();
    });
    $("#ccal").addEventListener("click", function (e) {
      var b = e.target.closest(".cday");
      if (!b || b.disabled) return;
      pick.date = b.dataset.date;
      $$(".cday", this).forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      renderSlots(); renderBar();
      if (window.innerWidth < 900) {
        var y = $(".slots-wrap").getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      }
    });
    $(".cal-card__head").addEventListener("click", function (e) {
      var b = e.target.closest("[data-cmonth]");
      if (!b || b.disabled) return;
      ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + +b.dataset.cmonth, 1);
      renderCal();
    });
    $("#slots").addEventListener("click", function (e) {
      var b = e.target.closest(".slot");
      if (!b || b.disabled) return;
      pick.time = b.dataset.time;
      $$(".slot", this).forEach(function (x) { if (!x.disabled) x.setAttribute("aria-pressed", x === b); });
      renderBar();
    });
    ["#f-name", "#f-phone"].forEach(function (id) {
      $(id).addEventListener("input", function () { this.removeAttribute("aria-invalid"); renderBar(); });
    });
    $("#back").addEventListener("click", function () { go(Math.max(1, ui.step - 1)); });
    $("#book-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (ui.step === 1) {
        if (!pick.service) { toast("Pilih satu rawatan dahulu"); return; }
        go(2); return;
      }
      if (ui.step === 2) {
        if (!pick.date) { toast("Pilih tarikh pada kalendar"); return; }
        if (!pick.time) { toast("Pilih masa yang kosong"); var s = $(".slot:not([disabled])"); if (s) s.focus(); return; }
        go(3); setTimeout(function () { if (window.innerWidth >= 900) $("#f-name").focus(); }, 50); return;
      }
      var svc = SVC[pick.service], name = $("#f-name").value.trim(), phone = $("#f-phone").value.trim();
      if (name.length < 2) { $("#f-name").setAttribute("aria-invalid", "true"); $("#f-name").focus(); toast("Masukkan nama penuh"); return; }
      if (!phoneOk(phone)) { $("#f-phone").setAttribute("aria-invalid", "true"); $("#f-phone").focus(); toast("Semak nombor telefon"); return; }
      load();
      var still = !db.blocked[pick.date] && slotsFor(pick.date, svc).some(function (x) { return x.hm === pick.time && x.ok; });
      if (!still) { toast("Maaf, slot itu baru sahaja diambil. Pilih masa lain."); pick.time = null; go(2); return; }
      var b = { ref: newRef(), service: svc.id, date: pick.date, time: pick.time, name: name, phone: phone,
        note: $("#f-note").value.trim(), status: "confirmed", paid: false, createdAt: Date.now() };
      db.bookings.push(b);
      save();
      showConfirm(b);
    });
  }

  /* =========================================================
     ADMIN
     ========================================================= */
  var adm = { view: "week", status: "any", q: "", day: null, calMonth: null };

  function find(ref) { return db.bookings.filter(function (x) { return x.ref === ref; })[0]; }
  function newestRef() {
    var n = db.bookings.filter(function (b) { return !b.seeded; }).sort(function (a, b) { return b.createdAt - a.createdAt; })[0];
    return n && n.ref;
  }
  function live(b) { return b.status !== "cancelled"; }
  function depOf(b) { return SVC[b.service].deposit; }
  function narrow() { return window.innerWidth < 1000; }

  function renderStats() {
    var t = iso(today()), wk = mondayOf(today()), a = iso(wk), z = iso(addDays(wk, 6));
    var todayRows = db.bookings.filter(function (b) { return b.date === t && live(b); });
    var doneToday = todayRows.filter(function (b) { return b.status === "done"; }).length;
    var week = db.bookings.filter(function (b) { return b.date >= a && b.date <= z && live(b); });
    var paid = week.filter(function (b) { return b.paid; }).reduce(function (s, b) { return s + depOf(b); }, 0);
    var expected = week.reduce(function (s, b) { return s + depOf(b); }, 0);
    var owed = db.bookings.filter(function (b) { return b.date >= t && b.status === "confirmed" && !b.paid; });
    var owedSum = owed.reduce(function (s, b) { return s + depOf(b); }, 0);
    var value = week.reduce(function (s, b) { return s + SVC[b.service].price; }, 0);
    var pct = expected ? Math.round(paid / expected * 100) : 0;
    var zEnd = addDays(wk, 6);
    $("#stats").innerHTML =
      stat("Pesakit hari ini", todayRows.length, todayRows.length ? doneToday + " selesai, " + (todayRows.length - doneToday) + " lagi" : (fromIso(t).getDay() === 0 ? "Ahad, klinik tutup" : "Tiada tempahan")) +
      stat("Tempahan minggu ini", week.length, wk.getDate() + " " + MON[wk.getMonth()] + " hingga " + zEnd.getDate() + " " + MON[zEnd.getMonth()]) +
      stat("Deposit diterima", rm(paid), pct + "% daripada " + rm(expected) + " minggu ini", false, pct) +
      stat("Deposit tertunggak", rm(owedSum), owed.length + " tempahan akan datang", owedSum > 0);
    function stat(l, v, c, warn, track) {
      return '<div class="stat' + (warn ? " stat--warn" : "") + '"><span class="stat__label">' + l + '</span><span class="stat__value num">' + v +
        '</span><span class="stat__cap">' + c + "</span>" +
        (track !== undefined ? '<div class="stat__track" aria-hidden="true"><span style="width:' + track + '%"></span></div>' : "") + "</div>";
    }
    var hr = new Date().getHours();
    $("#greet").textContent = (hr < 12 ? "Selamat pagi" : hr < 19 ? "Selamat petang" : "Selamat malam") + ", Pn. Rohana";
    var left = db.bookings.filter(function (b) { return b.date === t && b.status === "confirmed"; }).length;
    $("#today-line").textContent = dateLong(t) + " · " + (left ? left + " pesakit belum dirawat hari ini" : "tiada pesakit menunggu hari ini") + " · nilai rawatan minggu ini " + rm(value);
  }

  function renderDayPills() {
    var html = "";
    for (var i = 0; i < 7; i++) {
      var d = addDays(today(), i), dIso = iso(d);
      var off = d.getDay() === 0 || !!db.blocked[dIso];
      var n = db.bookings.filter(function (b) { return b.date === dIso && live(b); }).length;
      html += '<button type="button" role="tab" class="daypill' + (off ? " is-off" : "") + '" data-day="' + dIso + '" aria-selected="' + (adm.day === dIso) + '">' +
        (i === 0 ? "Hari ini" : DOW_S[d.getDay()]) + '<strong class="num">' + d.getDate() + "</strong><i>" + (off ? "tutup" : n + " pesakit") + "</i></button>";
    }
    $("#daypills").innerHTML = html;
  }

  function renderTimeline() {
    var dIso = adm.day, el = $("#timeline"), nr = newestRef();
    var sess = sessionsFor(dIso);
    var rows = db.bookings.filter(function (b) { return b.date === dIso && live(b); }).sort(function (a, b) { return a.time < b.time ? -1 : 1; });
    var paidN = rows.filter(function (b) { return b.paid; }).length;
    $("#sched-title").textContent = dIso === iso(today()) ? "Jadual hari ini" : "Jadual " + dateMid(dIso);
    $("#sched-sub").textContent = rows.length ? rows.length + " temujanji · " + paidN + " deposit dibayar · 1 kerusi rawatan" : "";
    if (!sess.length || db.blocked[dIso]) {
      el.style.height = "";
      el.innerHTML = '<div class="tl__closed"><strong>' + (db.blocked[dIso] ? "Klinik ditutup" : "Ahad, klinik tutup") + "</strong>" +
        (db.blocked[dIso] ? esc(db.blocked[dIso]) + ". " : "") + (rows.length ? rows.length + " tempahan pada hari ini perlu dihubungi." : "Tiada temujanji.") + "</div>";
      return;
    }
    var start = toMin(sess[0][0]), end = toMin(sess[sess.length - 1][1]);
    var ppm = parseFloat(getComputedStyle(el).getPropertyValue("--ppm")) || 1.2;
    var html = "";
    for (var h = Math.ceil(start / 60) * 60; h <= end; h += 60) {
      html += '<div class="tl__hour" style="top:' + (h - start) * ppm + 'px"><span class="num">' + timeShort(toHM(h)).replace(".00", "") + "</span></div>";
    }
    for (var i = 0; i < sess.length - 1; i++) {
      var bs = toMin(sess[i][1]), be = toMin(sess[i + 1][0]);
      html += '<div class="tl__break" style="top:' + ((bs - start) * ppm + 2) + "px;height:" + ((be - bs) * ppm - 4) + 'px">Rehat</div>';
    }
    rows.forEach(function (b) {
      var s = SVC[b.service], st = toMin(b.time), hgt = s.mins * ppm - 4, short = hgt < 44;
      var cls = "tl__appt" + (b.status === "done" ? " is-done" : !b.paid ? " is-unpaid" : "") + (b.ref === nr ? " is-new" : "") + (short ? " is-short" : "");
      var pill = b.status === "done" ? '<span class="pill pill--neutral">Selesai</span>' : b.paid ? '<span class="pill pill--pos">Dibayar</span>' : '<span class="pill pill--warn">Belum bayar</span>';
      html += '<button type="button" class="' + cls + '" data-ref="' + b.ref + '" style="top:' + ((st - start) * ppm + 2) + "px;height:" + hgt + 'px">' +
        "<strong><b>" + timeNum(b.time) + " · " + esc(b.name) + "</b>" + pill + "</strong>" +
        "<span>" + esc(s.name) + " · " + s.mins + " minit</span></button>";
    });
    if (dIso === iso(today())) {
      var now = nowMin();
      if (now >= start && now <= end) html += '<div class="tl__now" style="top:' + (now - start) * ppm + 'px" aria-hidden="true"></div>';
    }
    el.style.height = (end - start) * ppm + 8 + "px";
    el.innerHTML = html;
  }

  function renderTodo() {
    var t = iso(today());
    var rows = db.bookings.filter(function (b) { return b.date >= t && b.status === "confirmed" && !b.paid; })
      .sort(function (a, b) { return a.date === b.date ? (a.time < b.time ? -1 : 1) : (a.date < b.date ? -1 : 1); });
    $("#todo-count").textContent = rows.length ? rows.length + " · " + rm(rows.reduce(function (s, b) { return s + depOf(b); }, 0)) : "";
    $("#todo").innerHTML = rows.length ? rows.slice(0, 5).map(function (b) {
      return '<li><span class="avatar">' + esc(initials(b.name)) + '</span><button type="button" class="todo__who" data-open="' + b.ref + '">' + esc(b.name) +
        "<span>" + dateShort(b.date) + ", " + timeShort(b.time) + " · " + rm(depOf(b)) + "</span></button>" +
        '<button type="button" class="act act--main" data-pay="' + b.ref + '">Dibayar</button></li>';
    }).join("") + (rows.length > 5 ? '<li><span class="meta">Dan ' + (rows.length - 5) + " lagi dalam senarai tempahan.</span></li>" : "")
      : '<li><p class="empty">Semua deposit akan datang sudah dibayar.</p></li>';
  }

  function inView(b) {
    var t = iso(today());
    if (adm.view === "today") return b.date === t;
    if (adm.view === "week") { var a = iso(mondayOf(today())), z = iso(addDays(mondayOf(today()), 6)); return b.date >= a && b.date <= z; }
    if (adm.view === "upcoming") return b.date >= t;
    return true;
  }
  function passStatus(b) {
    if (adm.status === "any") return true;
    if (adm.status === "unpaid") return !b.paid && b.status === "confirmed";
    return b.status === adm.status;
  }
  function passQ(b) {
    if (!adm.q) return true;
    var q = adm.q.toLowerCase();
    return (b.name + " " + b.ref + " " + b.phone.replace(/\s/g, "") + " " + b.phone + " " + SVC[b.service].name).toLowerCase().indexOf(q) >= 0;
  }

  function statusPill(b) {
    return b.status === "done" ? '<span class="pill pill--neutral">Selesai</span>'
      : b.status === "cancelled" ? '<span class="pill pill--neg">Batal</span>'
      : '<span class="pill pill--accent">Disahkan</span>';
  }
  function depPill(b) {
    if (b.status === "cancelled") return "";
    return b.paid ? '<span class="pill pill--pos num">' + rm(depOf(b)) + " dibayar</span>"
      : '<span class="pill pill--warn num">' + rm(depOf(b)) + " belum</span>";
  }

  function renderList() {
    var rows = db.bookings.filter(inView).filter(passStatus).filter(passQ).sort(function (a, b) {
      return a.date === b.date ? (a.time < b.time ? -1 : 1) : (a.date < b.date ? -1 : 1);
    });
    if (adm.view === "all") rows.reverse();
    $("#list-count").textContent = rows.length + " tempahan";
    var el = $("#list"), nr = newestRef();
    if (!rows.length) {
      el.innerHTML = '<p class="empty">' + (adm.q ? "Tiada tempahan sepadan dengan carian ini." : adm.status !== "any" ? "Tiada tempahan dengan status ini dalam tempoh ini." : "Tiada tempahan dalam tempoh ini.") + "</p>";
      return;
    }
    var html = '<div class="thead" role="row"><span></span><span>Pesakit</span><span>Rawatan</span><span>Tarikh dan masa</span><span>Deposit</span><span>Status</span><span class="r">Tindakan</span></div>';
    var lastDay = null, showDays = narrow() && adm.view !== "today";
    rows.forEach(function (b) {
      if (showDays && b.date !== lastDay) {
        lastDay = b.date;
        html += '<div class="day-head' + (db.blocked[b.date] ? " is-blocked" : "") + '"><span>' + dateLong(b.date) + '</span><span class="num">' +
          rows.filter(function (x) { return x.date === b.date; }).length + "</span></div>";
      }
      html += rowHtml(b, b.ref === nr);
    });
    el.innerHTML = html;
  }

  function rowHtml(b, isNew) {
    var s = SVC[b.service], n = narrow();
    var mobilePill = b.status === "confirmed" ? depPill(b) : statusPill(b);
    var acts = b.status === "confirmed" && !b.paid ? '<button type="button" class="act act--main" data-pay="' + b.ref + '">Tanda dibayar</button>' : "";
    acts += '<button type="button" class="act" data-open="' + b.ref + '">Urus</button>';
    return '<div class="trow' + (b.status === "cancelled" ? " is-cancelled" : "") + (isNew ? " is-new" : "") + '" role="row" tabindex="0" data-open="' + b.ref + '">' +
      '<span class="avatar">' + esc(initials(b.name)) + "</span>" +
      '<div class="t-main"><span class="t-name"><b>' + esc(b.name) + "</b>" + (isNew ? '<span class="pill pill--accent">Baru</span>' : "") + "</span>" +
      '<span class="t-sub"><span class="ref-id">' + b.ref + "</span> · " + (n ? esc(s.name) : '<span class="num">' + esc(b.phone) + "</span>") + "</span></div>" +
      '<span class="t-svc">' + esc(s.name) + "</span>" +
      '<span class="t-when num">' + (n ? timeShort(b.time) : dateShort(b.date) + "<small>" + timeLabel(b.time) + "</small>") + "</span>" +
      '<span class="t-dep">' + (depPill(b) || '<span class="meta">Tiada</span>') + "</span>" +
      '<span class="t-pills">' + (n ? mobilePill : statusPill(b)) + "</span>" +
      '<span class="t-act">' + acts + "</span>" +
      "</div>";
  }

  function renderBlockCal() {
    var m = adm.calMonth, y = m.getFullYear(), mo = m.getMonth();
    $("#cal-label").textContent = MON_L[mo] + " " + y;
    var first = new Date(y, mo, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
    var t = iso(today()), html = "";
    ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"].forEach(function (d) { html += '<span class="cal__dow">' + d + "</span>"; });
    for (var i = 0; i < lead; i++) html += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, mo, d), dIso = iso(dt), sun = dt.getDay() === 0, past = dIso < t;
      var count = db.bookings.filter(function (b) { return b.date === dIso && live(b); }).length;
      var cls = "cal__day num" + (dIso === t ? " is-today" : "") + (db.blocked[dIso] ? " is-blocked" : "") + (count ? " has-bookings" : "");
      var label = dateLong(dIso) + (db.blocked[dIso] ? ", ditutup" : sun ? ", Ahad, tutup" : "") + (count ? ", " + count + " tempahan" : "");
      html += '<button type="button" class="' + cls + '" data-date="' + dIso + '"' + (sun || past ? " disabled" : "") +
        ' aria-pressed="' + !!db.blocked[dIso] + '" aria-label="' + label + '">' + d + "</button>";
    }
    $("#cal").innerHTML = html;
    var list = Object.keys(db.blocked).filter(function (k) { return k >= t; }).sort();
    $("#block-list").innerHTML = list.length ? list.map(function (k) {
      var c = db.bookings.filter(function (b) { return b.date === k && b.status === "confirmed"; }).length;
      return "<li><div>" + dateLong(k) + "<span>" + esc(db.blocked[k]) + (c ? " · " + c + " tempahan perlu dihubungi" : "") + "</span></div>" +
        '<button type="button" class="act" data-unblock="' + k + '">Buka semula</button></li>';
    }).join("") : '<li><span class="empty">Tiada tarikh ditutup selain hari Ahad.</span></li>';
  }

  function renderWeek() {
    var a = mondayOf(today()), t = iso(today()), counts = [];
    for (var i = 0; i < 7; i++) {
      var dIso = iso(addDays(a, i));
      counts.push({ d: dIso, n: db.bookings.filter(function (b) { return b.date === dIso && live(b); }).length });
    }
    var max = Math.max.apply(null, counts.map(function (c) { return c.n; }).concat([1]));
    $("#week-chart").innerHTML = counts.map(function (c) {
      var d = fromIso(c.d), off = d.getDay() === 0 || db.blocked[c.d];
      return '<div class="bar' + (c.d === t ? " is-today" : "") + '" title="' + dateLong(c.d) + ": " + c.n + ' tempahan">' +
        '<span class="bar__n num">' + (off && !c.n ? "—" : c.n) + "</span>" +
        '<div class="bar__track"><div class="bar__fill" style="height:' + Math.round(c.n / max * 100) + '%"></div></div>' +
        '<span class="bar__d">' + DOW_S[d.getDay()] + "</span></div>";
    }).join("");
  }

  function renderAdmin() {
    if (!adm.day) {
      var t = iso(today());
      adm.day = t;
      if (!db.bookings.some(function (b) { return b.date === t && b.status === "confirmed"; })) {
        for (var i = 1; i < 7; i++) {
          var d = iso(addDays(today(), i));
          if (sessionsFor(d).length && !db.blocked[d]) { adm.day = d; break; }
        }
      }
    }
    $$(".tabs [role=tab]").forEach(function (x) { x.setAttribute("aria-selected", x.dataset.view === adm.view); });
    renderStats(); renderDayPills(); renderTimeline(); renderTodo(); renderList(); renderBlockCal(); renderWeek();
  }

  /* booking sheet */
  function openSheet(ref) {
    var b = find(ref);
    if (!b) return;
    var s = SVC[b.service], st = b.status, acts = "";
    if (st === "confirmed") {
      acts += b.paid ? '<button type="button" class="btn btn--ghost" data-act="unpay">Batal tanda bayar</button>'
        : '<button type="button" class="btn btn--accent" data-act="pay">Deposit dibayar</button>';
      acts += '<button type="button" class="btn btn--primary" data-act="done">Tanda selesai</button>';
      acts += '<button type="button" class="btn btn--danger btn--wide" data-act="cancel">Batalkan tempahan</button>';
    } else {
      acts += '<button type="button" class="btn btn--primary btn--wide" data-act="reopen">' + (st === "done" ? "Buka semula" : "Pulihkan tempahan") + "</button>";
    }
    $("#sheet-body").innerHTML =
      '<div class="sheet__in" data-ref="' + b.ref + '"><span class="sheet__grab" aria-hidden="true"></span>' +
      '<div class="sheet__head"><span class="avatar">' + esc(initials(b.name)) + '</span><div><h2 id="sheet-title">' + esc(b.name) + "</h2>" +
      '<p class="num">' + b.ref + " · " + esc(b.phone) + '</p></div><button type="button" class="icon-btn" data-close aria-label="Tutup">' + icon("x") + "</button></div>" +
      '<div class="sheet__pills">' + statusPill(b) + depPill(b) + "</div>" +
      "<dl>" +
      '<div class="wide"><small>Rawatan</small><strong>' + esc(s.name) + "</strong></div>" +
      "<div><small>Tarikh</small><strong>" + dateMid(b.date) + "</strong></div>" +
      "<div><small>Masa</small><strong>" + timeLabel(b.time) + " (" + s.mins + " minit)</strong></div>" +
      '<div><small>Anggaran harga</small><strong class="num">' + rm(s.price) + "</strong></div>" +
      '<div><small>Deposit</small><strong class="num">' + rm(s.deposit) + "</strong></div>" +
      (b.note ? '<div class="wide"><small>Nota pesakit</small><strong>' + esc(b.note) + "</strong></div>" : "") +
      "</dl>" +
      '<div class="sheet__acts">' + acts + "</div></div>";
    var dlg = $("#sheet");
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute("open", "");
  }
  function closeSheet() { var d = $("#sheet"); if (!d.open) return; if (d.close) d.close(); else d.removeAttribute("open"); }

  function act(ref, what) {
    var b = find(ref);
    if (!b) return;
    var dep = rm(depOf(b));
    if (what === "pay") { b.paid = true; toast("Deposit " + dep + " untuk " + ref + " diterima"); }
    if (what === "unpay") { b.paid = false; toast("Tanda bayar untuk " + ref + " dibatalkan"); }
    if (what === "done") { b.status = "done"; toast(ref + " ditanda selesai"); }
    if (what === "cancel") { b.status = "cancelled"; toast(ref + " dibatalkan. Slot dibuka semula untuk pelanggan."); }
    if (what === "reopen") {
      if (b.status === "cancelled") {
        var occ = occupied(b.date, b.ref), s0 = toMin(b.time);
        for (var u = s0; u < s0 + SVC[b.service].mins; u += STEP) if (occ[u]) { toast("Tidak boleh pulihkan: slot " + timeLabel(b.time) + " sudah diambil"); return; }
      }
      b.status = "confirmed"; toast(ref + " dibuka semula");
    }
    save(); renderAdmin();
    if ($("#sheet").open) openSheet(ref);
  }

  function toggleBlock(dIso) {
    if (db.blocked[dIso]) {
      delete db.blocked[dIso];
      toast(dateMid(dIso) + " dibuka semula untuk tempahan");
    } else {
      db.blocked[dIso] = $("#block-reason").value.trim() || "Klinik tutup";
      var c = db.bookings.filter(function (b) { return b.date === dIso && b.status === "confirmed"; }).length;
      toast(dateMid(dIso) + " ditutup" + (c ? ". " + c + " tempahan perlu dihubungi." : ""));
    }
    save(); renderAdmin();
  }

  function bindAdmin() {
    var pinIn = $("#pin-input");
    function dots() { $$(".pin__dots span").forEach(function (s, i) { s.classList.toggle("is-on", i < pinIn.value.length); }); }
    $("#pin-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (pinIn.value === PIN) {
        try { sessionStorage.setItem(STORE + "-pin", "1"); } catch (x) { /* ignore */ }
        pinIn.value = ""; dots(); $("#pin-err").textContent = "";
        route();
      } else {
        $("#pin-err").textContent = "PIN salah. Cuba 1234.";
        var c = $(".pin__card"); c.classList.remove("is-shake"); void c.offsetWidth; c.classList.add("is-shake");
        pinIn.select();
      }
    });
    pinIn.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 4); dots();
      if (this.value.length === 4) $("#pin-form").requestSubmit();
    });
    $("#logout").addEventListener("click", function () {
      try { sessionStorage.removeItem(STORE + "-pin"); } catch (x) { /* ignore */ }
      route();
    });
    $(".tabs").addEventListener("click", function (e) {
      var t = e.target.closest("[role=tab]");
      if (!t) return;
      adm.view = t.dataset.view; renderAdmin();
    });
    $("#status-filter").addEventListener("change", function () { adm.status = this.value; renderList(); });
    $("#q").addEventListener("input", function () { adm.q = this.value.trim(); renderList(); });
    $("#daypills").addEventListener("click", function (e) {
      var b = e.target.closest("[data-day]");
      if (!b) return;
      adm.day = b.dataset.day; renderDayPills(); renderTimeline();
    });
    $("#console").addEventListener("click", function (e) {
      var p = e.target.closest("[data-pay]");
      if (p) { e.stopPropagation(); act(p.dataset.pay, "pay"); return; }
      var o = e.target.closest("[data-open]");
      if (o) { openSheet(o.dataset.open); return; }
      var tl = e.target.closest(".tl__appt");
      if (tl) openSheet(tl.dataset.ref);
    });
    $("#list").addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("trow")) { e.preventDefault(); openSheet(e.target.dataset.open); }
    });
    $("#sheet").addEventListener("click", function (e) {
      if (e.target === this || e.target.closest("[data-close]")) { closeSheet(); return; }
      var a = e.target.closest("[data-act]");
      if (a) act($(".sheet__in", this).dataset.ref, a.dataset.act);
    });
    $(".cal__head").addEventListener("click", function (e) {
      var b = e.target.closest("[data-month]");
      if (!b) return;
      adm.calMonth = new Date(adm.calMonth.getFullYear(), adm.calMonth.getMonth() + +b.dataset.month, 1);
      renderBlockCal();
    });
    $("#cal").addEventListener("click", function (e) {
      var b = e.target.closest(".cal__day");
      if (b && !b.disabled) toggleBlock(b.dataset.date);
    });
    $("#block-list").addEventListener("click", function (e) {
      var b = e.target.closest("[data-unblock]");
      if (b) toggleBlock(b.dataset.unblock);
    });
    $$("[data-jump]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-jump]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        closeMenu();
        document.getElementById(b.dataset.jump).scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
    });
    $("#menu-btn").addEventListener("click", function () {
      var open = !$("#side").classList.contains("is-open");
      $("#side").classList.toggle("is-open", open);
      this.setAttribute("aria-expanded", open);
    });
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (!$("#console").hidden) { renderTimeline(); renderList(); } }, 150);
    });
  }
  function closeMenu() { $("#side").classList.remove("is-open"); $("#menu-btn").setAttribute("aria-expanded", "false"); }

  /* =========================================================
     ROUTING, RESET
     ========================================================= */
  function unlocked() { try { return sessionStorage.getItem(STORE + "-pin") === "1"; } catch (e) { return true; } }

  function route() {
    load();
    var isAdmin = location.hash.indexOf("#admin") === 0;
    document.body.classList.toggle("is-admin", isAdmin);
    $("#customer").hidden = isAdmin;
    $("#admin").hidden = !isAdmin;
    $("[data-to-admin]").hidden = isAdmin;
    $("[data-to-customer]").hidden = !isAdmin;
    document.title = (isAdmin ? "Admin · " : "") + "Klinik Pergigian Teratai Biru · Tempahan (demo)";
    if (isAdmin) {
      var ok = unlocked();
      $("#pin").hidden = ok;
      $("#console").hidden = !ok;
      if (ok) { closeMenu(); renderAdmin(); } else setTimeout(function () { $("#pin-input").focus(); }, 30);
    } else {
      closeSheet();
      if ($("#confirm").hidden) renderCustomer();
    }
    window.scrollTo(0, 0);
  }

  function reset() {
    try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ }
    db = null; load();
    adm.view = "week"; adm.status = "any"; adm.q = ""; adm.day = null;
    adm.calMonth = new Date(today().getFullYear(), today().getMonth(), 1);
    $("#status-filter").value = "any"; $("#q").value = "";
    closeSheet();
    resetFlow();
    route();
    toast("Demo dikembalikan ke data asal");
  }

  window.addEventListener("storage", function (e) {
    if (e.key !== STORE) return;
    load();
    if (!$("#admin").hidden && !$("#console").hidden) renderAdmin();
    else if (!$("#customer").hidden && $("#confirm").hidden) renderSteps();
  });

  if (window.matchMedia("(min-width: 900px)").matches) $("#hours").open = true;
  load();
  ui.month = new Date(today().getFullYear(), today().getMonth(), 1);
  adm.calMonth = new Date(today().getFullYear(), today().getMonth(), 1);
  bindCustomer();
  bindAdmin();
  $$("[data-reset]").forEach(function (b) { b.addEventListener("click", reset); });
  window.addEventListener("hashchange", route);
  route();
})();
