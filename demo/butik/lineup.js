/* Maison Ve’ra line-up intro: the next look steps out of the queue into the centre.
   Buttons, arrow keys, swipe and the scroll wheel all move it; reduced motion gets a crossfade. */
(function () {
  "use strict";
  var root = document.querySelector("[data-lineup]");
  if (!root) return;
  var stage = root.querySelector("[data-lu-stage]");
  var wrap = root.querySelector(".lu-models");
  var models = Array.prototype.slice.call(root.querySelectorAll("[data-lu-model]"));
  var pieces = Array.prototype.slice.call(root.querySelectorAll("[data-lu-pieces]"));
  var infos = Array.prototype.slice.call(root.querySelectorAll("[data-lu-info]"));
  var N = models.length;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var cur = 0, busy = false, DUR = 520;

  root.classList.add("is-ready");

  function slotPos(k, W, phone) {
    // k = 0 is the centre, 1..N-1 queue up behind on the right, "out" leaves to the left
    if (k === "out") return { x: W * (phone ? 0.08 : 0.2), s: 0.9, o: 0, z: 12 };
    if (k === 0) return { x: W * (phone ? 0.58 : 0.44), s: 1, o: 1, z: 11 };
    var o = [1, 0.85, 0.55, 0.3][k] || 0; // only three wait visibly in the queue
    k = Math.min(k, 4);
    if (phone) return { x: W * (0.86 + 0.09 * (k - 1)), s: 0.4 - 0.07 * (k - 1), o: o, z: 10 - k };
    return { x: W * (0.67 + 0.085 * (k - 1)), s: 0.56 - 0.09 * (k - 1), o: o, z: 10 - k };
  }
  function place(el, p) {
    var w = el.getBoundingClientRect().width / (parseFloat(el.dataset.s) || 1);
    el.style.transform = "translate3d(" + (p.x - w / 2).toFixed(1) + "px,0,0) scale(" + p.s.toFixed(3) + ")";
    el.style.opacity = p.o;
    el.style.zIndex = p.z;
    el.dataset.s = p.s;
  }
  function layout(skipAnim) {
    var W = stage.clientWidth, phone = W < 700;
    models.forEach(function (el, i) {
      var k = (i - cur + N) % N;
      if (skipAnim) el.classList.add("no-anim");
      place(el, slotPos(k, W, phone));
      el.setAttribute("aria-hidden", String(k !== 0));
    });
    if (skipAnim) { void wrap.offsetWidth; models.forEach(function (el) { el.classList.remove("no-anim"); }); }
  }
  // On small screens the pieces column must end above the giant name: size the tiles
  // so every piece of the current look fits in the room between the intro and the name.
  var side = root.querySelector(".lu-side");
  var markEl = root.querySelector(".lu-mark span");
  function fitPieces() {
    if (!side || !markEl) return;
    var list = pieces[cur];
    if (!list) return;
    if (window.innerWidth >= 900 && window.innerHeight >= 560) { side.style.removeProperty("--piece-h"); return; }
    var items = list.querySelectorAll("li");
    var n = items.length || 1;
    var top = side.getBoundingClientRect().top;
    var limit = Math.min(markEl.getBoundingClientRect().top - 14, side.getBoundingClientRect().bottom - 2);
    var gap = parseFloat(getComputedStyle(list).rowGap) || 12;
    var img = items[0] && items[0].querySelector("img");
    var label = items[0] ? items[0].getBoundingClientRect().height - (img ? img.getBoundingClientRect().height : 0) : 20;
    var h = Math.floor((limit - top - (n - 1) * gap) / n - label);
    side.style.setProperty("--piece-h", Math.max(40, Math.min(h, 104)) + "px");
  }
  function swapText(list) {
    list.forEach(function (el, i) {
      el.hidden = i !== cur;
      el.classList.remove("lu-in");
      if (i === cur && !reduce.matches) { void el.offsetWidth; el.classList.add("lu-in"); }
    });
  }

  function go(dir) {
    if (busy) return;
    busy = true;
    var W = stage.clientWidth, phone = W < 700;
    var prev = cur;
    cur = (cur + dir + N) % N;
    swapText(pieces); swapText(infos); fitPieces();
    if (reduce.matches) { // plain crossfade
      wrap.style.opacity = 0;
      setTimeout(function () { layout(true); wrap.style.opacity = 1; busy = false; }, 180);
      return;
    }
    if (dir > 0) {
      // old centre steps out to the left, then quietly joins the back of the queue
      models.forEach(function (el, i) { if (i !== prev) place(el, slotPos((i - cur + N) % N, W, phone)); });
      place(models[prev], slotPos("out", W, phone));
      setTimeout(function () {
        var el = models[prev];
        el.classList.add("no-anim");
        var back = slotPos(N - 1, W, phone); back.o = 0;
        place(el, back);
        void el.offsetWidth;
        el.classList.remove("no-anim");
        place(el, slotPos(N - 1, W, phone));
        busy = false;
      }, DUR);
    } else {
      // going back: the look comes in from the left, the centre moves back into the queue
      var el = models[cur];
      el.classList.add("no-anim");
      place(el, slotPos("out", W, phone));
      void el.offsetWidth;
      el.classList.remove("no-anim");
      layout(false);
      setTimeout(function () { busy = false; }, DUR);
    }
    models.forEach(function (m, i) { m.setAttribute("aria-hidden", String(i !== cur)); });
  }

  root.querySelector("[data-lu-next]").addEventListener("click", function () { go(1); });
  root.querySelector("[data-lu-prev]").addEventListener("click", function () { go(-1); });

  // Arrow keys whenever the line-up is on screen and nobody is typing
  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) || document.querySelector("dialog[open]")) return;
    var r = stage.getBoundingClientRect();
    if (r.bottom < window.innerHeight * 0.3 || r.top > window.innerHeight * 0.7) return;
    e.preventDefault();
    go(e.key === "ArrowRight" ? 1 : -1);
  });

  // Swipe left or right; vertical swipes still scroll the page
  var sx = 0, sy = 0, down = false;
  stage.addEventListener("pointerdown", function (e) { if (e.button) return; down = true; sx = e.clientX; sy = e.clientY; });
  stage.addEventListener("pointerup", function (e) {
    if (!down) return; down = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
  });
  stage.addEventListener("pointercancel", function () { down = false; });

  // Scroll wheel over the stage steps through the looks, then lets the page scroll on
  var lastWheel = 0;
  stage.addEventListener("wheel", function (e) {
    var dx = e.deltaX, dy = e.deltaY;
    var horiz = Math.abs(dx) > Math.abs(dy);
    var d = horiz ? dx : dy;
    if (Math.abs(d) < 8) return;
    var dir = d > 0 ? 1 : -1;
    if (!horiz && ((dir > 0 && cur === N - 1) || (dir < 0 && cur === 0))) return; // hand back to the page
    e.preventDefault();
    var now = Date.now();
    if (now - lastWheel < DUR + 120) return;
    lastWheel = now;
    go(dir);
  }, { passive: false });

  // Skip goes straight to the shop
  root.querySelector("[data-lu-skip]").addEventListener("click", function (e) {
    var target = document.getElementById("top");
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 64, behavior: "instant" });
    var h = target.querySelector("h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  });

  // Fill the first screen below the demo notice, so the controls are never cut off
  function fitHeight() {
    var top = root.getBoundingClientRect().top + window.scrollY;
    var h = Math.max(window.innerHeight < 560 ? 340 : 560, Math.min(window.innerHeight - top, 980)); // short landscape phones get a short stage
    root.style.setProperty("--lu-h", h + "px");
  }
  var lastW = 0;
  function relayout() { if (stage.clientWidth !== lastW) { lastW = stage.clientWidth; fitHeight(); layout(true); } fitPieces(); }
  fitHeight();
  // The chat button sits where "Skip to shop" is, so it waits until the line-up has scrolled away
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { document.body.classList.toggle("lu-on", es[0].intersectionRatio > 0.5); }, { threshold: [0, 0.5, 1] }).observe(stage);
  }
  window.addEventListener("resize", relayout);
  models.forEach(function (m) { if (!m.complete) m.addEventListener("load", function () { layout(true); }); });
  layout(true);
  lastW = stage.clientWidth;
  fitPieces();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPieces);
  window.addEventListener("load", fitPieces);
})();

/* The name as a monument: fit "Maison Ve'ra" to the full width (first screen and footer),
   and let the first-screen name settle a little as you scroll away. No travel with reduced motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mark = document.querySelector("[data-lu-mark]");
  var stage = document.querySelector("[data-lu-stage]");
  var foot = document.querySelector(".foot-mark");
  function size(el, prop, avail) {
    if (!el) return;
    var probe = document.createElement("span");
    probe.textContent = el.textContent;
    var f = getComputedStyle(el);
    probe.style.cssText = "position:absolute;left:-9999px;top:0;white-space:nowrap;font-family:" + f.fontFamily + ";font-weight:" + f.fontWeight + ";font-size:100px;letter-spacing:-3.5px";
    document.body.appendChild(probe);
    var w = probe.getBoundingClientRect().width;
    probe.remove();
    if (w) document.documentElement.style.setProperty(prop, Math.floor(avail * 100 / w * 0.985) + "px");
  }
  function resize() {
    var m = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--m")) || 16;
    var W = document.documentElement.clientWidth - 2 * m;
    size(mark, "--mark-fs", W);
    // on short screens (landscape phones) the name may not take more than about a fifth of the height
    if (window.innerHeight < 560) {
      var cap = Math.floor(window.innerHeight * 0.2), cur = parseFloat(document.documentElement.style.getPropertyValue("--mark-fs"));
      if (cur > cap) document.documentElement.style.setProperty("--mark-fs", cap + "px");
    }
    size(foot, "--foot-fs", W);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { resize(); window.dispatchEvent(new Event("resize")); });
  resize();
  var lastW = window.innerWidth;
  window.addEventListener("resize", function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; resize(); } });

  // Signature move: the name settles from 1 to 0.94 as the first screen scrolls away
  if (!mark || !stage) return;
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (reduce.matches) { mark.style.removeProperty("--mark-s"); return; }
    var h = stage.offsetHeight || 1;
    var p = Math.min(Math.max(window.scrollY / h, 0), 1);
    mark.style.setProperty("--mark-s", (1 - 0.06 * p).toFixed(4));
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
