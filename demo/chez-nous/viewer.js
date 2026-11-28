/* Chez Nous 3D seat view: loads model/room.glb (built in Blender, one camera per seat) with three.js.
   Falls back to the rendered still (the poster image) when WebGL or the network is not available. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const viewer = document.getElementById("viewer");
const canvas = document.getElementById("viewerCanvas");
const stateEl = document.getElementById("viewerState");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let seat = "S05";
let started = false;

document.addEventListener("cn:seat", (e) => { seat = e.detail.id; if (api) api.goTo(seat); });
let api = null;

function start() {
  if (started) return; started = true;
  try { api = init(); } catch (err) { fail(err); }
}
function fail(err) {
  console.warn("3D view unavailable:", err);
  stateEl.textContent = "Showing a still of this seat (3D view unavailable)";
}

const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { start(); io.disconnect(); } }, { rootMargin: "400px 0px" });
io.observe(viewer);

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  const camera = new THREE.PerspectiveCamera(55, 16 / 10, 0.05, 60);
  // A soft glow on the lamps and flames (desktop only, to keep phones smooth)
  let composer = null, bloom = null;
  if (window.innerWidth >= 768) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(512, 320), 0.28, 0.35, 0.96);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  const cams = {};      // seat id -> { pos, quat, hfov }
  const chefs = [];
  let base = null, yaw = 0, pitch = 0, tween = null, needs = true, visible = true;

  // Blender (x, y, z-up) -> three (x, z, -y)
  const toThree = (p) => new THREE.Vector3(p[0], p[2], -p[1]);

  function addLights(data) {
    scene.add(new THREE.HemisphereLight(0xfff1dd, 0x101010, 0.12));
    const I = { dome: 4.5, lamp: 0.7, pass: 1.2, down: 0.5, grill: 2.2, wall: 0.8, pendant: 1.4 };
    const C = { grill: 0xff7a2a, pass: 0xffc488 };
    for (const l of data.lights) {
      const range = l.kind === "lamp" ? 1.6 : l.kind === "dome" ? 3.2 : 7;
      const light = new THREE.PointLight(C[l.kind] || 0xffd2a0, I[l.kind] || 1.5, range, 2);
      light.position.copy(toThree(l.p));
      scene.add(light);
    }
    // wash on the blue tiles, as in the renders
    for (const x of [-3, 0, 3]) {
      const w = new THREE.PointLight(0xffe0c0, 0.5, 4, 2);
      w.position.copy(toThree([x, data.room.y1 - 0.8, 1.9]));
      scene.add(w);
    }
  }

  const draco = new DRACOLoader().setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/");
  const loader = new GLTFLoader().setDRACOLoader(draco);

  Promise.all([
    fetch("model/scene.json").then((r) => r.json()),
    new Promise((res, rej) => loader.load("model/room.glb", res, (ev) => {
      if (ev.total) stateEl.textContent = "Loading the kitchen in 3D, " + Math.round(ev.loaded / ev.total * 100) + "%";
    }, rej))
  ]).then(([data, gltf]) => {
    addLights(data);
    scene.add(gltf.scene);
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (o.isMesh && o.material && o.material.transparent) o.material.depthWrite = false;
      if (/^CHEF_/.test(o.name)) chefs.push({ o, y: o.rotation.y, x: o.position.x, ph: chefs.length * 1.7 });
    });
    gltf.scene.traverse((o) => {
      const m = /^CAM_(.+)$/.exec(o.name);
      if (!m) return;
      let c = o.isCamera ? o : null;
      o.traverse((k) => { if (!c && k.isCamera) c = k; });
      const src = c || o;
      const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
      src.getWorldPosition(pos); src.getWorldQuaternion(quat);
      const hfov = c ? 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(c.fov) / 2) * (c.aspect || 16 / 9)) : THREE.MathUtils.degToRad(76);
      cams[m[1]] = { pos, quat, hfov };
    });
    viewer.classList.add("ready");
    goTo(seat, true);
    resize();
    loop();
  }).catch(fail);

  function setFov(hfov) {
    const aspect = camera.aspect;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hfov / 2) / aspect));
    camera.updateProjectionMatrix();
  }

  function apply() {
    if (!base) return;
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    camera.quaternion.copy(qYaw).multiply(base.quat).multiply(qPitch);
    needs = true;
  }

  function goTo(id, instant) {
    const target = cams[id] || cams.S05;
    if (!target) return;
    yaw = 0; pitch = 0;
    if (instant || reduce || !base) {
      base = { pos: target.pos.clone(), quat: target.quat.clone(), hfov: target.hfov };
      camera.position.copy(base.pos); setFov(base.hfov); apply(); return;
    }
    const from = { pos: camera.position.clone(), quat: base.quat.clone(), hfov: base.hfov };
    tween = { from, to: target, t0: performance.now(), dur: 300 };
  }

  function step(now) {
    if (tween) {
      let k = Math.min(1, (now - tween.t0) / tween.dur);
      k = 1 - Math.pow(1 - k, 3);
      const pos = tween.from.pos.clone().lerp(tween.to.pos, k);
      const quat = tween.from.quat.clone().slerp(tween.to.quat, k);
      base = { pos, quat, hfov: tween.from.hfov + (tween.to.hfov - tween.from.hfov) * k };
      camera.position.copy(pos); setFov(base.hfov); apply();
      if (k >= 1) tween = null;
    }
    if (!reduce && chefs.length) {
      const t = now / 1000;
      for (const c of chefs) {
        c.o.rotation.y = c.y + Math.sin(t * 1.1 + c.ph) * 0.18;
        c.o.position.x = c.x + Math.sin(t * 0.7 + c.ph) * 0.06;
      }
      needs = true;
    }
  }

  function loop(now = performance.now()) {
    if (visible) {
      step(now);
      if (needs) { if (composer) composer.render(); else renderer.render(scene, camera); needs = false; }
    }
    requestAnimationFrame(loop);
  }

  function resize() {
    const w = viewer.clientWidth, h = viewer.clientHeight;
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = w / h;
    if (base) setFov(base.hfov);
    needs = true;
  }
  new ResizeObserver(resize).observe(viewer);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(viewer);

  // Look around: drag (mouse or touch, horizontal), arrow keys, or the two buttons
  const MAXY = THREE.MathUtils.degToRad(60), MAXP = THREE.MathUtils.degToRad(22);
  const clampLook = () => { yaw = Math.max(-MAXY, Math.min(MAXY, yaw)); pitch = Math.max(-MAXP, Math.min(MAXP, pitch)); apply(); };
  let drag = null;
  viewer.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; drag = { x: e.clientX, y: e.clientY, yaw, pitch }; });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const s = 2.2 / viewer.clientWidth;
    yaw = drag.yaw + (e.clientX - drag.x) * s;
    if (e.pointerType === "mouse") pitch = drag.pitch + (e.clientY - drag.y) * s;
    clampLook();
  });
  window.addEventListener("pointerup", () => { drag = null; });
  window.addEventListener("pointercancel", () => { drag = null; });
  viewer.addEventListener("keydown", (e) => {
    const d = THREE.MathUtils.degToRad(8);
    if (e.key === "ArrowLeft") yaw += d; else if (e.key === "ArrowRight") yaw -= d;
    else if (e.key === "ArrowUp") pitch += d; else if (e.key === "ArrowDown") pitch -= d;
    else return;
    e.preventDefault(); clampLook();
  });
  viewer.querySelectorAll("[data-look]").forEach((b) => b.addEventListener("click", () => {
    yaw -= Number(b.dataset.look) * THREE.MathUtils.degToRad(20); clampLook();
  }));

  return { goTo };
}
