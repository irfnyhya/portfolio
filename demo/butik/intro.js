/* Maison Ve’ra intro: six looks driven by scroll or swipe.
   Without JS, or with reduced motion, the intro stays a plain stack of photos. */
(function () {
  "use strict";
  var intro = document.querySelector("[data-intro]");
  if (!intro || !("requestAnimationFrame" in window)) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  var looks = Array.prototype.slice.call(intro.querySelectorAll("[data-look]"));
  var pics = looks.map(function (l) { return l.querySelector(".look-pic"); });
  var imgs = looks.map(function (l) { return l.querySelector("img"); });
  var caps = looks.map(function (l) { return l.querySelector(".look-cap"); });
  var head = intro.querySelector(".intro-head");
  var ui = intro.querySelector(".intro-ui");
  var dots = Array.prototype.slice.call(intro.querySelectorAll("[data-intro-go]"));
  var N = looks.length;
  var SEG = 0.7; // scroll per look, in screen heights: short, so the shop is never far away
  var seg = 0, top = 0, ticking = false, current = -1;

  intro.classList.add("is-live");
  document.documentElement.classList.add("intro-snapping");
  // Snap points, one per look, so a swipe settles on a look instead of between two
  // (none on the first look, so the demo notice above the intro stays in view at the top)
  var snaps = looks.slice(1).map(function () {
    var s = document.createElement("span");
    s.className = "intro-snap"; s.setAttribute("aria-hidden", "true");
    intro.appendChild(s); return s;
  });

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  function measure() {
    var vh = window.innerHeight;
    seg = vh * SEG;
    intro.style.setProperty("--intro-h", (vh + seg * (N - 1)) + "px");
    top = intro.getBoundingClientRect().top + window.scrollY;
    snaps.forEach(function (s, i) { s.style.top = ((i + 1) * seg) + "px"; });
    render();
  }

  function render() {
    ticking = false;
    var p = clamp((window.scrollY - top) / seg, 0, N - 1);
    intro.classList.toggle("is-moving", p > 0.05);
    var r = intro.getBoundingClientRect();
    document.body.classList.toggle("intro-on", r.bottom > window.innerHeight * 0.5);
    // Before the stage sticks (demo bar still above it), lift the bottom controls into view
    ui.style.transform = r.top > 0 ? "translateY(" + (-r.top).toFixed(1) + "px)" : "";
    for (var i = 0; i < N; i++) {
      var d = p - i, look = looks[i], img = imgs[i], cap = caps[i];
      if (d <= -1) { // still below: hidden behind a closed curtain
        look.style.visibility = "hidden";
        continue;
      }
      look.style.visibility = "";
      if (d < 0) { // coming in: curtain opens from the bottom, photo settles from a zoom
        var e = ease(1 + d);
        look.style.clipPath = "inset(" + ((1 - e) * 100).toFixed(2) + "% 0 0 0)";
        look.style.transform = "none";
        img.style.transform = "translateY(" + ((1 - e) * -8).toFixed(2) + "%) scale(" + (1.25 - 0.25 * e).toFixed(4) + ")";
        pics[i].style.setProperty("--shade", "0");
        cap.style.opacity = clamp(e * 2 - 1, 0, 1).toFixed(3);
        cap.style.transform = "translateY(" + ((1 - e) * 60).toFixed(1) + "px)";
      } else if (d < 1) { // going out: sinks back into the scene, tilts and darkens
        var o = ease(d);
        look.style.clipPath = "none";
        look.style.transform = "translateZ(" + (-o * 260).toFixed(1) + "px) rotateX(" + (o * 7).toFixed(2) + "deg) scale(" + (1 - o * 0.08).toFixed(4) + ")";
        img.style.transform = "translateY(" + (o * 6).toFixed(2) + "%) scale(1)";
        pics[i].style.setProperty("--shade", (o * 0.6).toFixed(3));
        cap.style.opacity = clamp(1 - o * 2.2, 0, 1).toFixed(3);
        cap.style.transform = "translateY(" + (-o * 50).toFixed(1) + "px)";
      } else { // fully covered by the next look
        look.style.visibility = "hidden";
      }
    }
    // The title belongs to the first look and drifts up and away as you start
    var h = clamp(p / 0.6, 0, 1);
    head.style.opacity = (1 - h).toFixed(3);
    head.style.transform = "translateY(" + (-h * 60).toFixed(1) + "px) scale(" + (1 - h * 0.06).toFixed(4) + ")";
    // First look's caption waits until the title has moved away
    if (p < 0.6) { caps[0].style.opacity = h.toFixed(3); caps[0].style.transform = "translateY(" + ((1 - h) * 30).toFixed(1) + "px)"; }

    var now = Math.round(p);
    if (now !== current) {
      current = now;
      dots.forEach(function (b, j) { b.setAttribute("aria-current", String(j === now)); });
    }
  }

  function onScroll() {
    if (ticking) return;
    var r = intro.getBoundingClientRect();
    if (r.bottom < -50 || r.top > window.innerHeight) { // off screen: only fix the end state once
      if (current !== -2) { current = -2; render(); }
      return;
    }
    ticking = true;
    requestAnimationFrame(render);
  }

  dots.forEach(function (b) {
    b.addEventListener("click", function () {
      window.scrollTo({ top: top + Number(b.dataset.introGo) * seg, behavior: "smooth" });
    });
  });
  // Skip goes straight to the shop, no long animated scroll
  intro.querySelector("[data-intro-skip]").addEventListener("click", function (e) {
    var target = document.getElementById("top");
    if (!target) return;
    e.preventDefault();
    document.documentElement.classList.remove("intro-snapping");
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 64, behavior: "instant" });
    setTimeout(function () { document.documentElement.classList.add("intro-snapping"); }, 100);
    var h = target.querySelector("h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  // Re-measure once everything has loaded or the page comes back from the cache with a restored scroll
  window.addEventListener("load", measure);
  window.addEventListener("pageshow", measure);
  // Phone address bars change the height while scrolling; only re-measure on real resizes
  var lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener("resize", function () {
    if (window.innerWidth !== lastW || Math.abs(window.innerHeight - lastH) > 120) { lastW = window.innerWidth; lastH = window.innerHeight; measure(); }
  });
  // If the person turns on reduced motion while here, drop back to the plain stack
  if (reduce.addEventListener) reduce.addEventListener("change", function (e) { if (e.matches) window.location.reload(); });
  measure();
})();
