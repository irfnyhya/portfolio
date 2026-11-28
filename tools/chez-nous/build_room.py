# Chez Nous chef's counter: built from code in Blender, one camera per seat.
# Run:  blender --background --factory-startup --python build_room.py -- <out_dir> [--render] [--only=HERO,S03] [--no-cutaway]
# Writes <out_dir>/model/room.glb + scene.json, chez-nous-counter.blend (lit), chez-nous-cutaway.blend (no ceiling,
# no front wall, top camera) and, with --render, <out_dir>/img/view-*.jpg and previews/cutaway-top.jpg
import bpy, bmesh, math, json, os, sys, random
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else ".")
RENDER = "--render" in argv
HERE = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(HERE, "tex")
PREV_DIR = os.path.join(HERE, "previews")
for d in (os.path.join(OUT, "model"), os.path.join(OUT, "img"), TEX_DIR, PREV_DIR): os.makedirs(d, exist_ok=True)
random.seed(7); np.random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection

# Room: x -7..7, y -4.6 (entrance wall) .. 4.4 (kitchen back wall), z 0..3.4
X0, X1, Y0, Y1, H = -7.0, 7.0, -4.6, 4.4, 3.4
CT_Z = 0.76          # counter top (table height, as at Noir)

def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)

# ── textures made in numpy ────────────────────────────────────────
def save_img(name, arr):
    h, w, _ = arr.shape
    img = bpy.data.images.new(name, w, h, alpha=False)
    rgba = np.ones((h, w, 4), dtype=np.float32); rgba[..., :3] = np.clip(arr, 0, 1)
    img.pixels.foreach_set(rgba[::-1].ravel())
    img.filepath_raw = os.path.join(TEX_DIR, name + ".png"); img.file_format = "PNG"; img.save()
    return img

def tex_wood(name, hexcol, n=512, stretch=40.0):
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    base = np.array(lin(hexcol))
    g = np.sin(y * stretch + 4 * np.sin(x * 3.0) + 2 * np.sin(x * 11 + y * 5)) * 0.5 + 0.5
    g2 = np.sin(y * stretch * 3.7 + np.sin(x * 7) * 2) * 0.5 + 0.5
    img = base[None, None, :] * (0.8 + 0.22 * g + 0.08 * g2)[..., None]
    img *= (1 + (np.random.rand(n, n, 1) - 0.5) * 0.05)
    return save_img(name, img.astype(np.float32))

def tex_chevron(n=1024):
    # Point de Hongrie: smoked oak chevron parquet, tileable
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    cols = 4; plank_w = 1 / 16
    c = np.floor(x * cols); lx = (x * cols) % 1
    dirn = np.where(c % 2 == 0, 1.0, -1.0)
    s = (y + dirn * (lx - 0.5) * (1 / cols)) / plank_w
    idx = np.floor(s)
    rnd = (np.sin(idx * 12.9898 + c * 78.233) * 43758.5453) % 1
    base = np.array(lin("#2b1d14"))
    tone = 0.78 + 0.3 * rnd
    grain = 0.05 * np.sin((lx * 40 + rnd * 9) + 3 * np.sin(s * 3.1)) + 0.03 * np.random.rand(n, n)
    img = base[None, None, :] * (tone + grain)[..., None]
    seam = np.minimum(s % 1, 1 - s % 1) < 0.03
    edge = np.minimum(lx, 1 - lx) < 0.005
    img[seam | edge] *= 0.45
    return save_img("chevron", img.astype(np.float32))

def tex_granite(n=512):
    # black stone with fine gold and white flecks
    img = np.full((n, n, 3), 0.012, np.float32) + (np.random.rand(n, n, 1) * 0.01).astype(np.float32)
    for col_, cnt in (((0.55, 0.42, 0.2), 900), ((0.5, 0.5, 0.5), 500)):
        xs, ys = np.random.randint(0, n, cnt), np.random.randint(0, n, cnt)
        img[ys, xs] = col_
    return save_img("granite", img)

def tex_panels(n=512):
    # black kitchen panels with faint vertical seams
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    img = np.full((n, n, 3), 0.018, np.float32)
    img += (np.sin(y * 40 + x * 3) * 0.002)[..., None]
    seam = np.minimum((x * 6) % 1, 1 - (x * 6) % 1) < 0.008
    img[seam] = 0.006
    return save_img("panels", img)

def tex_plaster(n=512):
    # dark limewash plaster, soft clouds
    rng = np.random.default_rng(3)
    base = np.array(lin("#23231f"))
    noise = np.zeros((n, n), np.float32)
    for k, a in ((8, 0.5), (32, 0.3), (128, 0.2)):
        small = rng.random((k, k)).astype(np.float32)
        noise += a * np.kron(small, np.ones((n // k, n // k), np.float32))
    img = base[None, None, :] * (0.85 + 0.3 * noise)[..., None]
    return save_img("plaster", img.astype(np.float32))

def tex_ktile(n=512):
    # matte black kitchen floor tiles
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    img = np.full((n, n, 3), 0.02, np.float32) + (np.random.rand(n, n, 1) * 0.006).astype(np.float32)
    grout = (np.minimum((x * 4) % 1, 1 - (x * 4) % 1) < 0.012) | (np.minimum((y * 4) % 1, 1 - (y * 4) % 1) < 0.012)
    img[grout] = 0.045
    return save_img("ktile", img)

def tex_marble(name, base, vein, n=512, seed=1, veins=5.0, sharp=24.0):
    """Veined marble: turbulence-warped sine bands, thin and soft-edged."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    turb = np.zeros((n, n), np.float32)
    for k, a in ((4, 1.0), (8, 0.5), (16, 0.25), (32, 0.12)):
        small = rng.random((k + 1, k + 1)).astype(np.float32)
        xi = np.minimum((x * k).astype(int), k - 1); yi = np.minimum((y * k).astype(int), k - 1)
        fx, fy = x * k - xi, y * k - yi
        a00, a10, a01, a11 = small[yi, xi], small[yi, xi + 1], small[yi + 1, xi], small[yi + 1, xi + 1]
        turb += a * ((a00 * (1 - fx) + a10 * fx) * (1 - fy) + (a01 * (1 - fx) + a11 * fx) * fy)
    v = np.abs(np.sin((x * 1.3 + y * 0.7) * veins * math.pi + turb * 6.0))
    vein_m = np.exp(-v * sharp)[..., None]
    b = np.array(lin(base)); c = np.array(lin(vein))
    img = b[None, None, :] * (0.92 + 0.12 * turb[..., None] / 1.9) * (1 - vein_m) + c[None, None, :] * vein_m
    return save_img(name, img.astype(np.float32))

TEX = {"nero": tex_marble("nero_marquina", "#0d0d0e", "#d9d4cb", seed=4, veins=4.0, sharp=30.0),
       "calacatta": tex_marble("calacatta", "#ece7de", "#9b8a6d", seed=9, veins=3.0, sharp=18.0),
       "onyx": tex_marble("onyx", "#a98d6c", "#f4e8d4", seed=2, veins=6.0, sharp=9.0),
       "panels": tex_panels(), "granite": tex_granite(), "chevron": tex_chevron(), "plaster": tex_plaster(), "ktile": tex_ktile(),
       "slat": tex_wood("slat_wood", "#6b4a2f", stretch=90), "walnut": tex_wood("walnut", "#3a2618", stretch=120)}

# ── materials ────────────────────────────────────────────────────
MATS = []
def mat(name, hexcol, rough=0.6, metal=0.0, emit=None, strength=0.0, tex=None, alpha=1.0, emit_tex=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*lin(hexcol), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if tex is not None:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = tex
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit:
        b.inputs["Emission Color"].default_value = (*lin(emit), 1)
        b.inputs["Emission Strength"].default_value = strength
    if emit_tex is not None:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = emit_tex
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
            try: setattr(m, attr, val)
            except Exception: pass
    MATS.append(m)
    return len(MATS) - 1

M = {
    "panels": mat("Panel_Black", "#ffffff", 0.35, tex=TEX["panels"]),
    "led": mat("LED_Line", "#ffe9c8", 1.0, emit="#ffd9a6", strength=1.1),
    "dome": mat("Dome_Black", "#0c0c0c", 0.3, 0.8),
    "dome_in": mat("Dome_Glow", "#ffe7c4", 1.0, emit="#ffcf8a", strength=10),
    "lampglow": mat("Lamp_Glow", "#ffe4b8", 1.0, emit="#ffc477", strength=7),
    "velvet": mat("Velvet_Emerald", "#1d3528", 0.92),
    "drape": mat("Velvet_Drape_Oxblood", "#3a1216", 0.9),
    "opal": mat("Opal_Globe", "#fff0d6", 0.3, emit="#ffd49a", strength=6),
    "flame_s": mat("Candle_Flame", "#ffd08a", 1.0, emit="#ffb34f", strength=14),
    "bloom": mat("Flower_Cream", "#efe2cf", 0.7),
    "bloom2": mat("Flower_Blush", "#d9a7a0", 0.7),
    "onyx": mat("Onyx_Backlit", "#ffffff", 0.3, emit_tex=TEX["onyx"], strength=0.28),
    "calacatta": mat("Marble_Calacatta", "#ffffff", 0.12, tex=TEX["calacatta"]),
    "crystal": mat("Crystal", "#f4f8fa", 0.02, alpha=0.18),
    "menu": mat("Menu_Paper", "#e9e4d8", 0.9),
    "strip": mat("Strip_Light", "#fff0d0", 1.0, emit="#ffd49a", strength=10),
    "counter": mat("Marble_Nero_Marquina", "#ffffff", 0.14, tex=TEX["nero"]),
    "floor": mat("Floor_Chevron_Oak_Polished", "#ffffff", 0.18, tex=TEX["chevron"]),
    "kfloor": mat("Floor_Kitchen_Tile", "#ffffff", 0.6, tex=TEX["ktile"]),
    "slat": mat("Slat_Oak", "#ffffff", 0.55, tex=TEX["slat"]),
    "walnut": mat("Fluted_Walnut", "#ffffff", 0.5, tex=TEX["walnut"]),
    "plaster": mat("Plaster_Dark", "#ffffff", 0.95, tex=TEX["plaster"]),
    "wall_front": mat("Wall_Front_Walnut", "#ffffff", 0.5, tex=TEX["walnut"]),   # removed in the cutaway
    "steel": mat("Steel", "#c7cacc", 0.28, 1.0),
    "steel_dark": mat("Steel_Brushed", "#5d6166", 0.4, 1.0),
    "wall": mat("Wall_Black", "#0c0c0d", 0.85),
    "soffit": mat("Soffit_Black", "#0a0a0a", 0.9),                       # removed in the cutaway
    "ceiling": mat("Ceiling", "#0a0a0a", 0.9),                           # removed in the cutaway
    "ceil_slat": mat("Ceiling_Slats_Walnut", "#ffffff", 0.6, tex=TEX["walnut"]),  # removed in the cutaway
    "ceil_light": mat("Ceiling_Downlight", "#fff2dc", 1.0, emit="#ffd9a0", strength=8),  # removed in the cutaway
    "cove": mat("Cove_Light", "#ffe2b8", 1.0, emit="#ffc887", strength=4.0),
    "black": mat("Black_Metal", "#111214", 0.45, 0.6),
    "bronze": mat("Bronze_Door", "#2b2219", 0.4, 0.9),
    "brass": mat("Brass", "#c9a24a", 0.3, 1.0),
    "napkin": mat("Linen_Cream", "#ebe2d1", 0.85),
    "glass": mat("Glass", "#e6eef0", 0.05, alpha=0.2),
    "slate": mat("Charger_Black_Porcelain", "#121212", 0.25),
    "board": mat("Board", "#c8a070", 0.6),
    "plate": mat("Porcelain", "#f4f2ec", 0.2),
    "marble": mat("Marble", "#e7e3db", 0.2),
    "ember": mat("Embers", "#ff6a1a", 1.0, emit="#ff5a10", strength=8),
    "flame": mat("Gas_Flame", "#7fb0ff", 1.0, emit="#5c8dff", strength=6),
    "green": mat("Herbs", "#3f6a2a", 0.7),
    "food": mat("Food", "#c96b3c", 0.6),
    "bottle": mat("Bottle", "#1c2a1f", 0.15, alpha=0.9),
    "bottle_red": mat("Bottle_Red", "#3a0f14", 0.15, alpha=0.9),
    "winelight": mat("Wine_Wall_Back", "#c98a45", 1.0, emit="#ffa850", strength=1.2),
    "rug": mat("Door_Mat", "#1a1a18", 0.95),
}
CUTAWAY_MATS = {"ceiling", "ceil_slat", "ceil_light", "soffit", "wall_front"}

BM = bmesh.new(); UV = BM.loops.layers.uv.new("UVMap")
def _finish(bm, verts, mi, M4, smooth=False):
    bmesh.ops.transform(bm, matrix=M4, verts=verts)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = mi; f.smooth = smooth

def box(sx, sy, sz, x, y, z, mi, rz=0.0, rx=0.0, bm=None, uvs=None):
    bm = bm or BM
    r = bmesh.ops.create_cube(bm, size=1, calc_uvs=True)
    M4 = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(rx, 4, "X") @ Matrix.Diagonal((sx, sy, sz, 1))
    if uvs:
        uvl = bm.loops.layers.uv.active
        for f in {f for v in r["verts"] for f in v.link_faces}:
            for l in f.loops: l[uvl].uv = (l[uvl].uv[0] * uvs[0], l[uvl].uv[1] * uvs[1])
    _finish(bm, r["verts"], mi, M4)

def boxb(sx, sy, sz, x, y, z0, mi, rz=0.0, bm=None, uvs=None):
    box(sx, sy, sz, x, y, z0 + sz / 2, mi, rz, bm=bm, uvs=uvs)

def cyl(r1, r2, h, x, y, z0, mi, seg=16, rx=0.0, ry=0.0, rz=0.0, smooth=True, bm=None):
    bm = bm or BM
    r = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h, calc_uvs=True)
    M4 = Matrix.Translation((x, y, z0)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(ry, 4, "Y") @ Matrix.Rotation(rx, 4, "X") @ Matrix.Translation((0, 0, h / 2))
    _finish(bm, r["verts"], mi, M4, smooth)

def sphere(rad, x, y, z, mi, seg=10, sz=1.0, bm=None):
    bm = bm or BM
    r = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(4, seg // 2), radius=rad, calc_uvs=True)
    _finish(bm, r["verts"], mi, Matrix.Translation((x, y, z)) @ Matrix.Diagonal((1, 1, sz, 1)), True)

def quad(pts, uvs, mi):
    vs = [BM.verts.new(p) for p in pts]
    f = BM.faces.new(vs); f.material_index = mi
    for loop, uv in zip(f.loops, uvs): loop[UV].uv = uv

W, D = X1 - X0, Y1 - Y0
KF = 1.15   # where the kitchen floor starts (y)

# ── floor and ceiling ───────────────────────────────────────────
quad([(X0, Y0, 0), (X1, Y0, 0), (X1, KF, 0), (X0, KF, 0)], [(0, 0), (W / 1.6, 0), (W / 1.6, (KF - Y0) / 1.6), (0, (KF - Y0) / 1.6)], M["floor"])
quad([(X0, KF, 0), (X1, KF, 0), (X1, Y1, 0), (X0, Y1, 0)], [(0, 0), (W / 1.2, 0), (W / 1.2, (Y1 - KF) / 1.2), (0, (Y1 - KF) / 1.2)], M["kfloor"])
quad([(X0, Y1, H), (X1, Y1, H), (X1, Y0, H), (X0, Y0, H)], [(0, 0)] * 4, M["ceiling"])
# walnut slat ceiling over the guests, running across the room
yy = Y0 + 0.12
while yy < 1.05:
    boxb(W - 0.3, 0.07, 0.09, 0, yy, H - 0.1, M["ceil_slat"], uvs=(8, 1)); yy += 0.17
for x in (-5.0, -2.5, 0.0, 2.5, 5.0):
    for y in (-3.6, -2.2, -0.75):
        cyl(0.045, 0.045, 0.015, x, y, H - 0.125, M["ceil_light"], seg=12)

# ── walls ───────────────────────────────────────────────────────
PANEL_H = 2.55
def fluted(axis, fixed, a, b, inward, mi):
    """Fluted walnut panelling: upright half-round reeds along a wall, brass reveal on top, plaster above."""
    n = int((b - a) / 0.075)
    for i in range(n):
        c = a + 0.0375 + i * 0.075
        x, y = (c, fixed + inward * 0.03) if axis == "x" else (fixed + inward * 0.03, c)
        if i % 16 == 8:   # brass inlay instead of a reed
            boxb(0.02 if axis == "x" else 0.03, 0.03 if axis == "x" else 0.02, PANEL_H - 0.12, x, y, 0.12, M["brass"])
            continue
        cyl(0.032, 0.032, PANEL_H - 0.12, x, y, 0.12, mi, seg=8)
    if axis == "x":
        boxb(b - a, 0.06, 0.12, (a + b) / 2, fixed + inward * 0.03, 0, M["black"])            # shadow plinth
        boxb(b - a, 0.02, 0.012, (a + b) / 2, fixed + inward * 0.075, 0.12, M["cove"])        # uplight at the plinth
        boxb(b - a, 0.07, 0.025, (a + b) / 2, fixed + inward * 0.035, PANEL_H, M["brass"])
        boxb(b - a, 0.04, 0.03, (a + b) / 2, fixed + inward * 0.05, H - 0.32, M["cove"])      # cove light line
    else:
        boxb(0.06, b - a, 0.12, fixed + inward * 0.03, (a + b) / 2, 0, M["black"])
        boxb(0.02, b - a, 0.012, fixed + inward * 0.075, (a + b) / 2, 0.12, M["cove"])
        boxb(0.07, b - a, 0.025, fixed + inward * 0.035, (a + b) / 2, PANEL_H, M["brass"])
        boxb(0.04, b - a, 0.03, fixed + inward * 0.05, (a + b) / 2, H - 0.32, M["cove"])

# plaster shells of the room
boxb(W, 0.1, H, 0, Y1 + 0.05, 0, M["panels"], uvs=(W / 1.2, 2))           # kitchen back wall: black panels
boxb(W, 0.1, H, 0, Y0 - 0.05, 0, M["wall_front"], uvs=(10, 2))             # entrance wall (front)
boxb(0.1, D, H, X0 - 0.05, (Y0 + Y1) / 2, 0, M["plaster"], uvs=(6, 2))
boxb(0.1, D, H, X1 + 0.05, (Y0 + Y1) / 2, 0, M["plaster"], uvs=(6, 2))
# fluted walnut on the guest side of both side walls (the wine wall takes part of the right one)
fluted("y", X0, Y0, KF - 0.1, 1, M["walnut"])
fluted("y", X1, 0.8, KF - 0.1, -1, M["walnut"])
fluted("y", X1, Y0, -3.75, -1, M["walnut"])
# brass picture light over the painting on the left wall
boxb(0.12, 0.9, 0.03, X0 + 0.2, -1.1, 2.42, M["brass"])
boxb(0.06, 0.86, 0.01, X0 + 0.22, -1.1, 2.415, M["lampglow"])
# the entrance wall: fluted walnut too (tagged so the cutaway can drop it), with a bronze door and a brass pull
n = int(W / 0.075)
for i in range(n):
    c = X0 + 0.0375 + i * 0.075
    if -5.85 < c < -4.55: continue
    cyl(0.032, 0.032, PANEL_H - 0.12, c, Y0 + 0.03, 0.12, M["wall_front"], seg=8)
boxb(1.2, 0.08, 2.45, -5.2, Y0 + 0.04, 0, M["bronze"])
cyl(0.015, 0.015, 0.9, -4.75, Y0 + 0.12, 0.65, M["brass"], seg=8)
boxb(1.4, 0.9, 0.012, -5.2, Y0 + 0.55, 0, M["rug"])
cyl(0.018, 0.018, 2.6, -5.2, Y0 + 0.28, 3.02, M["brass"], seg=10, ry=math.pi / 2)
for side in (-1, 1):
    for k in range(6):
        px = -5.2 + side * (0.66 + k * 0.1)
        cyl(0.065, 0.065, 2.98, px, Y0 + 0.26 + (k % 2) * 0.04, 0.02, M["drape"], seg=10)
cyl(1.1, 1.1, 0.012, -4.9, -3.3, 0, M["rug"], seg=40)

# ── host stand at the entrance ──────────────────────────────────
HX, HY = -5.1, -3.35
boxb(0.75, 0.48, 1.02, HX, HY, 0, M["walnut"], uvs=(1, 2))
boxb(0.8, 0.53, 0.03, HX, HY, 1.02, M["brass"])
box(0.24, 0.32, 0.01, HX + 0.15, HY, 1.06, M["menu"], rz=0.2)   # reservation book
cyl(0.05, 0.045, 0.015, HX - 0.25, HY + 0.1, 1.05, M["brass"], seg=16)       # small lamp on the stand
cyl(0.011, 0.011, 0.22, HX - 0.25, HY + 0.1, 1.065, M["brass"], seg=8)
cyl(0.07, 0.016, 0.05, HX - 0.25, HY + 0.1, 1.285, M["brass"], seg=16)
cyl(0.065, 0.065, 0.004, HX - 0.25, HY + 0.1, 1.282, M["lampglow"], seg=16)

# ── wine wall on the right side wall: black steel grid, backlit, glass front ──
WY0, WY1, WZ = -3.7, 0.7, 2.6
boxb(0.04, WY1 - WY0, WZ, X1 - 0.08, (WY0 + WY1) / 2, 0.05, M["winelight"])
nc, nr = 9, 8
for i in range(nc + 1):
    boxb(0.36, 0.03, WZ, X1 - 0.22, WY0 + i * (WY1 - WY0) / nc, 0.05, M["brass"])
for j in range(nr + 1):
    boxb(0.36, WY1 - WY0, 0.02, X1 - 0.22, (WY0 + WY1) / 2, 0.05 + j * WZ / nr, M["brass"])
for i in range(nc):
    for j in range(nr):
        cy0 = WY0 + (i + 0.5) * (WY1 - WY0) / nc; cz = 0.07 + j * WZ / nr
        for k in (-1, 0, 1):
            m_ = M["bottle_red"] if (i + j + k) % 3 == 0 else M["bottle"]
            cyl(0.036, 0.036, 0.2, X1 - 0.24, cy0 + k * 0.13, cz, m_, seg=8)
            cyl(0.036, 0.012, 0.06, X1 - 0.24, cy0 + k * 0.13, cz + 0.2, m_, seg=8)
boxb(0.01, WY1 - WY0, WZ, X1 - 0.4, (WY0 + WY1) / 2, 0.05, M["crystal"])
for zz in (0.02, WZ + 0.05): boxb(0.06, WY1 - WY0 + 0.1, 0.05, X1 - 0.42, (WY0 + WY1) / 2, zz, M["brass"])
for yy_ in (WY0 - 0.03, WY1 + 0.03): boxb(0.06, 0.05, WZ + 0.08, X1 - 0.42, yy_, 0.02, M["brass"])

# ── kitchen: deeper, with room to move ──────────────────────────
KX0, KX1 = -4.6, 4.6                   # light frame around the kitchen
KY0, KY1 = 3.3, 4.1                    # kitchen blocks (against the back wall units)
KYc = (KY0 + KY1) / 2
PY0, PY1 = 1.35, 2.1                   # plating table ("the pass"), wider and further back
IY = (PY0 + PY1) / 2
# back wall: open shelves with a light strip, tall black units at the ends
boxb(9.6, 0.3, 0.03, 0, Y1 - 0.15, 1.65, M["steel_dark"]); boxb(9.6, 0.03, 0.012, 0, Y1 - 0.04, 1.635, M["strip"])
boxb(9.6, 0.3, 0.03, 0, Y1 - 0.15, 2.1, M["steel_dark"]); boxb(9.6, 0.03, 0.012, 0, Y1 - 0.04, 2.085, M["strip"])
for x in (-5.5, 5.5):
    boxb(1.6, 0.65, 2.9, x, Y1 - 0.33, 0, M["panels"], uvs=(2, 3))
    boxb(1.3, 0.02, 2.5, x, Y1 - 0.665, 0.2, M["onyx"])                      # backlit onyx panel
    for e in (-0.67, 0.67): boxb(0.04, 0.04, 2.58, x + e, Y1 - 0.67, 0.16, M["brass"])
    for zz in (0.16, 2.72): boxb(1.38, 0.04, 0.04, x, Y1 - 0.67, zz, M["brass"])
BLOCKS = [("grill", -4.2, -2.0), ("stove", -1.2, 1.8), ("pastry", 2.6, 4.0)]
WT_TOP = 0.9   # top of the stainless work tables (Sketchfab model), checked in the renders
RANGE_TOP = 0.92  # cooking surface of the range model
# grill block: charcoal under a grate
GZ = WT_TOP + 0.02
boxb(1.5, 0.48, 0.12, -3.1, KYc - 0.1, GZ, M["black"]); boxb(1.42, 0.4, 0.02, -3.1, KYc - 0.1, GZ + 0.07, M["ember"])
for i in range(16): box(0.01, 0.42, 0.01, -3.8 + i * 0.093, KYc - 0.1, GZ + 0.11, M["steel_dark"])
for i in range(6): cyl(0.03, 0.03, 0.04, -3.6 + i * 0.22, KYc - 0.15 + (i % 2) * 0.1, GZ + 0.11, M["food"], seg=8, rx=math.pi / 2)
for i in range(4): cyl(0.012, 0.012, 0.03, -3.75 + i * 0.45, KYc - 0.35, GZ + 0.02, M["steel"], seg=8, rx=math.pi / 2)   # grill knobs
# stove block: six flames and a dark steel hood above

boxb(3.2, 0.95, 0.6, 0.3, KYc + 0.05, 2.25, M["steel_dark"])
boxb(3.1, 0.85, 0.01, 0.3, KYc + 0.05, 2.245, M["strip"])
# pastry block: marble top, a board, little cakes under glass
boxb(0.95, 0.6, 0.03, 2.95, KYc - 0.15, WT_TOP, M["calacatta"]); boxb(0.4, 0.28, 0.02, 2.85, KYc - 0.2, WT_TOP + 0.03, M["board"])
for i in range(3): sphere(0.045, 3.2, KYc - 0.3 + i * 0.13, WT_TOP + 0.07, M["plate"], seg=10, sz=0.7)
sphere(0.15, 3.2, KYc - 0.17, WT_TOP + 0.03, M["crystal"], seg=16, sz=0.9)

# the plating table: black stone, a row of plates being finished
boxb(7.2, PY1 - PY0, 0.86, 0, IY, 0, M["wall"])
boxb(7.24, PY1 - PY0 + 0.04, 0.04, 0, IY, 0.86, M["calacatta"], uvs=(4, 1))
boxb(7.26, PY1 - PY0 + 0.06, 0.012, 0, IY, 0.848, M["brass"])
for i in range(7):
    x = -2.7 + i * 0.9
    cyl(0.13, 0.11, 0.015, x, IY - 0.1, 0.9, M["plate"], seg=24)
    sphere(0.04, x, IY - 0.1, 0.93, M["food"], seg=10, sz=0.5)
    sphere(0.018, x + 0.03, IY - 0.08, 0.94, M["green"], seg=6)
for x in (-3.3, 3.3): cyl(0.05, 0.04, 0.18, x, IY + 0.2, 0.9, M["steel"], seg=12)   # herb pots, sauce jugs

# White light lines framing the kitchen; the black soffit above it
LY0, LY1, FZ = 1.2, Y1 - 0.05, 2.75
box(KX1 - KX0, 0.025, 0.025, 0, LY0, FZ, M["led"]); box(KX1 - KX0, 0.025, 0.025, 0, LY1, FZ, M["led"])
for x in (KX0, KX1):
    box(0.025, LY1 - LY0, 0.025, x, (LY0 + LY1) / 2, FZ, M["led"])
    box(0.025, 0.025, FZ - 0.95, x, LY0, (FZ + 0.95) / 2, M["led"])
boxb(KX1 - KX0 + 0.1, LY1 - LY0 + 0.1, H - FZ - 0.02, 0, (LY0 + LY1) / 2, FZ + 0.02, M["soffit"])

# Black dome pendants over the plating table
DOMES = [-2.7, -0.9, 0.9, 2.7]
for x in DOMES:
    cyl(0.004, 0.004, FZ - 1.9, x, IY, 1.9, M["black"], seg=4)
    cyl(0.32, 0.04, 0.2, x, IY, 1.7, M["dome"], seg=28)
    cyl(0.3, 0.3, 0.004, x, IY, 1.697, M["dome_in"], seg=28)

# Statement chandelier over the front of the counter: brass bar, opal globes at staggered heights
CHX0, CHX1, CHY, CHZ = -2.8, 2.8, -0.68, 2.55
cyl(0.022, 0.022, CHX1 - CHX0, CHX0, CHY, CHZ, M["brass"], seg=12, ry=math.pi / 2)
for x in (CHX0 + 0.3, 0.0, CHX1 - 0.3): cyl(0.004, 0.004, H - CHZ, x, CHY, CHZ, M["brass"], seg=4)
CHANDELIER = []
for i in range(15):
    x = CHX0 + 0.2 + i * (CHX1 - CHX0 - 0.4) / 14
    drop = 0.18 + 0.22 * (0.5 + 0.5 * math.sin(i * 1.9))
    cyl(0.003, 0.003, drop, x, CHY, CHZ - drop, M["brass"], seg=4)
    cyl(0.018, 0.024, 0.03, x, CHY, CHZ - drop - 0.02, M["brass"], seg=10)
    sphere(0.06, x, CHY, CHZ - drop - 0.08, M["opal"], seg=14)
    CHANDELIER.append((x, CHY, CHZ - drop - 0.08))

# ── the U counter (seats exactly as Irfan's sketch: 2-6-2) ─────
UX, ARM_W, UF0, UF1, ARM_Y1 = 3.7, 0.65, -1.0, -0.35, 0.75
def stone(x0, x1, y0, y1):
    boxb(x1 - x0, y1 - y0, 0.05, (x0 + x1) / 2, (y0 + y1) / 2, CT_Z - 0.05, M["counter"], uvs=(max(1, (x1 - x0) / 1.8), max(1, (y1 - y0) / 1.8)))
    boxb(x1 - x0 + 0.012, y1 - y0 + 0.012, 0.014, (x0 + x1) / 2, (y0 + y1) / 2, CT_Z - 0.064, M["brass"])
    boxb(x1 - x0 - 0.1, y1 - y0 - 0.1, CT_Z - 0.05, (x0 + x1) / 2, (y0 + y1) / 2, 0, M["wall"])
stone(-UX, UX, UF0, UF1)
stone(-UX, -UX + ARM_W, UF1 - 0.02, ARM_Y1)
stone(UX - ARM_W, UX, UF1 - 0.02, ARM_Y1)
x = -UX + 0.06
while x < UX - 0.04:
    boxb(0.045, 0.04, CT_Z - 0.07, x, UF0 + 0.03, 0.02, M["slat"], uvs=(1, 2)); x += 0.07
y = UF0 + 0.06
while y < ARM_Y1 - 0.03:
    for sx_ in (-1, 1): boxb(0.04, 0.045, CT_Z - 0.07, sx_ * (UX - 0.03), y, 0.02, M["slat"], uvs=(1, 2))
    y += 0.07
# warm light line under the counter overhang (front and arms)
boxb(2 * UX - 0.2, 0.02, 0.015, 0, UF0 + 0.07, CT_Z - 0.085, M["cove"])
for sx_ in (-1, 1): boxb(0.02, ARM_Y1 - UF1, 0.015, sx_ * (UX - 0.07), (UF1 + ARM_Y1) / 2, CT_Z - 0.085, M["cove"])

# ── seats and place settings ────────────────────────────────────
def tub_chair(x, y, face=math.pi / 2):
    """Green velvet channel-tufted tub chair: a ring of upright tubes around a round seat."""
    cyl(0.25, 0.25, 0.1, x, y, 0.36, M["velvet"], seg=20)
    cyl(0.23, 0.2, 0.06, x, y, 0.3, M["velvet"], seg=20)
    for lx, ly in ((-0.15, -0.15), (0.15, -0.15), (-0.15, 0.15), (0.15, 0.15)):
        cyl(0.012, 0.01, 0.3, x + lx, y + ly, 0.0, M["brass"], seg=6)
    back = face + math.pi
    for k in range(13):
        a = back - 1.45 + k * (2.9 / 12)
        h = 0.36 + 0.14 * math.cos((k - 6) / 6 * 1.4)
        cx, cy = x + 0.235 * math.cos(a), y + 0.235 * math.sin(a)
        cyl(0.045, 0.045, h, cx, cy, 0.4, M["velvet"], seg=8)
        sphere(0.045, cx, cy, 0.4 + h, M["velvet"], seg=8)

GLASS_SPOTS = []
def place_setting(x, y, face):
    """Black slate charger with a folded napkin, menu card, gold cutlery either side, water tumbler; wine glass added later."""
    fx, fy = math.cos(face), math.sin(face); sx_, sy_ = -fy, fx
    cx, cy = x + fx * 0.68, y + fy * 0.68
    cyl(0.158, 0.158, 0.008, cx, cy, CT_Z, M["brass"], seg=32)
    cyl(0.15, 0.15, 0.012, cx, cy, CT_Z + 0.002, M["slate"], seg=32)
    box(0.14, 0.09, 0.018, cx, cy, CT_Z + 0.022, M["napkin"], rz=face)
    box(0.11, 0.16, 0.002, cx - sx_ * 0.0 + fx * 0.0, cy, CT_Z + 0.032, M["menu"], rz=face - math.pi / 2 + 0.06)
    for off in (0.2, 0.225):
        box(0.006, 0.2, 0.005, cx - sx_ * off, cy - sy_ * off, CT_Z + 0.004, M["brass"], rz=face - math.pi / 2)
    box(0.006, 0.2, 0.005, cx + sx_ * 0.2, cy + sy_ * 0.2, CT_Z + 0.004, M["brass"], rz=face - math.pi / 2)
    gx, gy = cx + fx * 0.2 + sx_ * 0.22, cy + fy * 0.2 + sy_ * 0.22
    cyl(0.032, 0.028, 0.085, gx, gy, CT_Z, M["crystal"], seg=14)
    GLASS_SPOTS.append((cx + fx * 0.22 + sx_ * 0.08, cy + fy * 0.22 + sy_ * 0.08))

def table_lamp(x, y, z=CT_Z):
    """Gold cordless table lamp."""
    cyl(0.055, 0.05, 0.015, x, y, z, M["brass"], seg=16)
    cyl(0.011, 0.011, 0.25, x, y, z + 0.015, M["brass"], seg=8)
    cyl(0.075, 0.018, 0.05, x, y, z + 0.255, M["brass"], seg=18)
    cyl(0.07, 0.07, 0.004, x, y, z + 0.252, M["lampglow"], seg=18)

E_, N_, W_ = 0.0, math.pi / 2, math.pi
SEAT_DEF = [(-4.22, 0.4, E_, "grill"), (-4.22, -0.35, E_, "grill"),
            (-2.25, -1.52, N_, "grill"), (-1.35, -1.52, N_, "grill"), (-0.45, -1.52, N_, "pass"),
            (0.45, -1.52, N_, "pass"), (1.35, -1.52, N_, "stove"), (2.25, -1.52, N_, "stove"),
            (4.22, -0.35, W_, "pastry"), (4.22, 0.4, W_, "pastry")]
for sx_, sy_, f, _ in SEAT_DEF:
    place_setting(sx_, sy_, f)
LAMPS = [(-1.8, -0.62), (0.0, -0.62), (1.8, -0.62), (-3.38, 0.02), (3.38, 0.02)]
for lx, ly in LAMPS: table_lamp(lx, ly)
CANDLES = [(-2.7, -0.5), (-0.9, -0.5), (0.9, -0.5), (2.7, -0.5), (-3.38, 0.5), (3.38, 0.5), (-3.38, -0.55), (3.38, -0.55)]
for cx_, cy_ in CANDLES:   # votives: crystal cup, wax, flame
    cyl(0.03, 0.03, 0.06, cx_, cy_, CT_Z, M["crystal"], seg=12)
    cyl(0.024, 0.024, 0.03, cx_, cy_, CT_Z + 0.004, M["napkin"], seg=10)
    sphere(0.008, cx_, cy_, CT_Z + 0.045, M["flame_s"], seg=6, sz=1.8)
FLOWERS = [(-2.25, -0.42), (-0.45, -0.42), (1.35, -0.42), (-3.5, 0.3), (3.5, -0.2)]
for fx_, fy_ in FLOWERS:   # bud vase with three small blooms
    cyl(0.02, 0.012, 0.12, fx_, fy_, CT_Z, M["crystal"], seg=10)
    for k, (dx, dy, dz) in enumerate(((0, 0, 0.2), (0.025, 0.01, 0.17), (-0.02, -0.015, 0.16))):
        cyl(0.002, 0.002, dz - 0.02, fx_ + dx * 0.4, fy_ + dy * 0.4, CT_Z + 0.02, M["green"], seg=4)
        sphere(0.022, fx_ + dx, fy_ + dy, CT_Z + dz, M["bloom"] if k else M["bloom2"], seg=8, sz=0.8)
FIGS = [(-6.4, -4.05), (6.35, -4.1), (-6.3, 0.75)]
for px_, py_ in FIGS:      # brushed brass planters
    cyl(0.3, 0.26, 0.5, px_, py_, 0, M["brass"], seg=28)
    cyl(0.27, 0.27, 0.02, px_, py_, 0.46, M["black"], seg=24)

# a low walnut console on the left wall, for the pothos and a lamp
boxb(0.42, 1.6, 0.78, X0 + 0.32, -2.6, 0, M["walnut"], uvs=(1, 2)); boxb(0.45, 1.64, 0.025, X0 + 0.32, -2.6, 0.78, M["brass"])
table_lamp(X0 + 0.32, -3.15, 0.805)

CHEFS = []
# ── seat data, cameras ───────────────────────────────────────────
SEATS = [dict(id="S%02d" % (i + 1), n=i + 1, x=round(sx_, 3), y=round(sy_, 3), face=round(f, 4), station=st)
         for i, (sx_, sy_, f, st) in enumerate(SEAT_DEF)]
CAMS = {}
for s_ in SEATS:
    f = s_["face"]
    eye = Vector((s_["x"] + math.cos(f) * 0.06, s_["y"] + math.sin(f) * 0.06, 1.16))
    if abs(f - N_) < 0.01: look = Vector((s_["x"] * 0.7, KYc, 1.2))
    elif f < 0.01: look = Vector((1.4, IY + 0.4, 1.1))
    else: look = Vector((-1.4, IY + 0.4, 1.1))
    CAMS[s_["id"]] = (eye, look, 22)
CAMS["HERO"] = (Vector((0.0, -4.3, 1.75)), Vector((0.0, 2.8, 1.05)), 18)

me = bpy.data.meshes.new("Room"); bmesh.ops.remove_doubles(BM, verts=BM.verts, dist=0.0003); BM.to_mesh(me); BM.free()
for m in MATS: me.materials.append(m)
room = bpy.data.objects.new("Room", me); col.objects.link(room)

# ── Sketchfab models (CC BY 4.0, credited on the page) ──────────
ASSETS = os.path.join(HERE, "assets")
def load_protos(rel, keep, scale):
    """Import a glTF, bake each wanted mesh into world space, scale to metres. Returns {name: mesh}."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ASSETS, rel))
    new = [o for o in bpy.data.objects if o not in before]
    bpy.context.view_layer.update()
    out = {}
    for o in new:
        if o.type == "MESH" and any(k in o.name for k in keep):
            m = o.data.copy(); m.transform(o.matrix_world); m.transform(Matrix.Scale(scale, 4))
            out[o.name] = m
    for o in new: bpy.data.objects.remove(o, do_unlink=True)
    return out

def recentre(meshes):
    vs = [v.co for m in meshes for v in m.vertices]
    cx = (min(v.x for v in vs) + max(v.x for v in vs)) / 2; cy = (min(v.y for v in vs) + max(v.y for v in vs)) / 2; z0 = min(v.z for v in vs)
    for m in meshes: m.transform(Matrix.Translation((-cx, -cy, -z0)))

def height(meshes):
    vs = [v.co.z for m in meshes for v in m.vertices]
    return max(vs) - min(vs)

def place(name, meshes, x, y, z, rz=0.0, decimate=None):
    for i, m in enumerate(meshes):
        o = bpy.data.objects.new("%s_%d" % (name, i), m); col.objects.link(o)
        o.location = (x, y, z); o.rotation_euler = (0, 0, rz)
        if decimate:
            md = o.modifiers.new("Lighter", "DECIMATE"); md.ratio = decimate

def decimated(meshes, ratio):
    """Return lighter copies of meshes (decimated once, so every placed copy shares the same mesh)."""
    out = []
    for m in meshes:
        tmp = bpy.data.objects.new("tmp_dec", m); col.objects.link(tmp)
        md = tmp.modifiers.new("d", "DECIMATE"); md.ratio = ratio
        dg = bpy.context.evaluated_depsgraph_get()
        out.append(bpy.data.meshes.new_from_object(tmp.evaluated_get(dg)))
        bpy.data.objects.remove(tmp, do_unlink=True)
    return out

def restyle(meshes, mapping):
    """Swap a model's materials for ours by material name (substring match)."""
    for m in meshes:
        for i, slot in enumerate(m.materials):
            for key, mi in mapping.items():
                if slot and key.lower() in slot.name.lower():
                    m.materials[i] = MATS[mi]

def fit_height(meshes, h):
    s_ = h / height(meshes)
    for m in meshes: m.transform(Matrix.Scale(s_, 4))

# Lena chairs in emerald velvet with brass legs, facing the counter
chair = list(load_protos("chair/scene.gltf", [""], 1.0).values()); recentre(chair)
chair = decimated(chair, 0.3); recentre(chair)
restyle(chair, {"Seat": M["velvet"], "Back": M["velvet"], "Legs": M["brass"]})
for sx_, sy_, f, _ in SEAT_DEF:
    place("Chair", chair, sx_, sy_, 0, rz=f + math.pi / 2)

# three commercial ranges under the hood (the stove station)
rng_ = list(load_protos("range/scene.gltf", [""], 1.0).values()); recentre(rng_)
for x in (-0.85, 0.15, 1.15): place("Range", rng_, x, KYc + 0.05, 0, rz=0.0)

# stainless work tables under the grill and the pastry station
wt = list(load_protos("worktable/scene.gltf", [""], 1.0).values()); recentre(wt)
wt = decimated(wt, 0.3); recentre(wt)
restyle(wt, {"material": M["steel"]})
place("WorkTable", wt, -3.1, KYc + 0.05, 0, rz=0.0)
place("WorkTable", wt, 3.35, KYc + 0.05, 0, rz=0.0)

# combi oven on the pastry table
combi = list(load_protos("combi/scene.gltf", [""], 1.0).values()); recentre(combi)
fit_height(combi, 0.75); recentre(combi)
restyle(combi, {"front": M["black"], "touch": M["black"], "color": M["steel"], "auto": M["steel"], "zone": M["steel"]})
place("Combi", combi, 3.85, KYc + 0.15, WT_TOP, rz=0.0)

kit = load_protos("kitchen/scene.gltf", ["SM_"], 0.01)
def kpart(key):
    hit = [m for n_, m in kit.items() if n_.startswith(key + "_") and "Dirty" not in n_]
    recentre(hit); return hit
wglass = kpart("SM_WineGlass")
for m in wglass: m.transform(Matrix.Scale(1.9, 4))
for gx, gy in GLASS_SPOTS: place("WineGlass", wglass, gx, gy, CT_Z)
for i, key in enumerate(["SM_Pot_01", "SM_Pot_02", "SM_Pot_05", "SM_Pot_04", "SM_Pot_06", "SM_Pot_01", "SM_Pot_05", "SM_Pot_02"]):
    place("ShelfPot", kpart(key), -4.2 + i * 1.2, Y1 - 0.15, 1.68, random.uniform(0, 6.28))
for key, x in (("SM_Pot_03", -0.85), ("SM_Pot_05", 1.15)):
    place("StovePot", kpart(key), x, KYc - 0.1, RANGE_TOP, 0.4)

copper = list(load_protos("copper/scene.gltf", ["material"], 0.5).values()); recentre(copper)
place("Copper", copper, 0.15, KYc - 0.1, RANGE_TOP, 0.2)
place("Copper", copper, -3.0, Y1 - 0.18, 2.13, 1.2)

wine = list(load_protos("wine/scene.gltf", ["poly"], 1.9).values()); recentre(wine)
place("Wine", wine, -2.7, -0.55, CT_Z, 0.3)
place("Wine", wine, 2.7, -0.55, CT_Z, -0.2)

# Plants, art and a vase (new in this round)
fig = list(load_protos("fig/scene.gltf", [""], 1.0).values()); recentre(fig)
s_ = 1.9 / height(fig)
for m in fig: m.transform(Matrix.Scale(s_, 4))
place("FigEntrance", fig, -6.4, -4.05, 0.25, 0.4, decimate=0.18)
place("FigCorner", fig, 6.35, -4.1, 0.25, 2.0, decimate=0.18)
place("FigKitchen", fig, -6.3, 0.75, 0.25, 1.1, decimate=0.18)
pothos = list(load_protos("pothos/scene.gltf", ["POT"], 1.0).values()); recentre(pothos)
s_ = 0.75 / height(pothos)
for m in pothos: m.transform(Matrix.Scale(s_, 4))
place("Pothos", pothos, X0 + 0.32, -2.2, 0.805, 0.6, decimate=0.4)
painting = list(load_protos("painting/scene.gltf", ["Painting"], 1.0).values()); recentre(painting)
s_ = 1.25 / height(painting)
for m in painting: m.transform(Matrix.Scale(s_, 4))
place("Painting", painting, X0 + 0.12, -1.1, 1.05, 0.0)      # faces +x, seen from the right arm (seats 9 and 10)
vase = list(load_protos("vase/scene.gltf", ["Object"], 1.0).values()); recentre(vase)
s_ = 0.5 / height(vase)
for m in vase: m.transform(Matrix.Scale(s_, 4))
place("Vase", vase, HX - 0.05, HY - 0.05, 1.05, 0.0, decimate=0.15)

# Keep the web file small: textures to 512 px (the floor keeps 1024)
for img in bpy.data.images:
    own = img.name in ("chevron", "granite", "panels", "plaster", "ktile", "slat_wood", "walnut") or img.name.startswith("Painting")
    side = 512 if own else 256            # downloaded models: 256 px is plenty at the distance they are seen
    if img.size[0] > side:
        img.scale(side, side)

for key, (eye, look, lens) in CAMS.items():
    cd = bpy.data.cameras.new("CAM_" + key); cd.lens = lens; cd.sensor_width = 36; cd.clip_start = 0.05; cd.clip_end = 60
    co = bpy.data.objects.new("CAM_" + key, cd); col.objects.link(co)
    co.location = eye; co.rotation_euler = (look - eye).to_track_quat("-Z", "Y").to_euler()

LIGHTS = [dict(kind="dome", p=(x, IY, 1.62)) for x in DOMES] + \
         [dict(kind="lamp", p=(lx, ly, CT_Z + 0.22)) for lx, ly in LAMPS] + \
         [dict(kind="pass", p=(0.0, IY, 1.3)), dict(kind="hood", p=(0.3, KYc, 2.15)), dict(kind="grill", p=(-3.1, KYc, 1.05))] + \
         [dict(kind="down", p=(x, -2.2, H - 0.2)) for x in (-4.0, 0.0, 4.0)] + \
         [dict(kind="chandelier", p=(x, CHY, CHZ - 0.3)) for x in (-2.0, 0.0, 2.0)] + \
         [dict(kind="candle", p=(cx_, cy_, CT_Z + 0.08)) for cx_, cy_ in CANDLES[:4]] + \
         [dict(kind="onyx", p=(x, Y1 - 1.2, 1.4)) for x in (-5.5, 5.5)] + \
         [dict(kind="wine", p=(X1 - 0.6, -1.5, 1.4)), dict(kind="art", p=(X0 + 0.6, -1.1, 2.2)), dict(kind="host", p=(HX - 0.25, HY + 0.1, 1.25)),
          dict(kind="console", p=(X0 + 0.32, -3.15, 1.05))]

data = dict(room=dict(x0=X0, x1=X1, y0=Y0, y1=Y1, h=H),
            kitchen=[dict(key=k, x0=a, x1=b, y0=KY0, y1=KY1) for k, a, b in BLOCKS],
            plating=dict(x0=-3.6, x1=3.6, y0=PY0, y1=PY1), frame=dict(x0=KX0, x1=KX1, y0=LY0, y1=LY1),
            counter=dict(ux=UX, arm=ARM_W, y0=UF0, y1=UF1, arm_y1=ARM_Y1, z=CT_Z),
            lamps=[[a, b] for a, b in LAMPS], seats=SEATS,
            lights=[dict(kind=l["kind"], p=[round(v, 3) for v in l["p"]]) for l in LIGHTS])
with open(os.path.join(OUT, "model", "scene.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

glb = os.path.join(OUT, "model", "room.glb")
# The web model leaves out what no seat can see (the entrance fig and the vase on the host stand); the .blend keeps them.
for o in bpy.data.objects:
    o.select_set(not (o.name.startswith("Vase") or o.name.startswith("FigEntrance")))
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_cameras=True, export_lights=False, use_selection=True,
                          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                          export_draco_position_quantization=14, export_draco_normal_quantization=10,
                          export_draco_texcoord_quantization=12,
                          export_image_format="JPEG", export_image_quality=70, export_apply=True)
print("GLB", os.path.getsize(glb), "bytes", flush=True)

# ── lighting for Blender (renders and the saved .blend files) ───
E = {"dome": 55, "lamp": 5, "pass": 18, "hood": 35, "down": 5, "grill": 40, "wine": 30, "art": 30, "host": 4, "console": 4, "chandelier": 40, "candle": 1.5, "onyx": 30}
C = {"grill": (1.0, 0.45, 0.15), "wine": (1.0, 0.72, 0.42), "candle": (1.0, 0.6, 0.3), "onyx": (1.0, 0.7, 0.4), "chandelier": (1.0, 0.76, 0.5)}
for l in LIGHTS:
    spot = l["kind"] in ("dome", "down", "hood", "art")
    ld = bpy.data.lights.new("L_" + l["kind"], "SPOT" if spot else "POINT")
    ld.energy = E[l["kind"]]; ld.color = C.get(l["kind"], (1.0, 0.78, 0.55)); ld.shadow_soft_size = 0.15
    if spot: ld.spot_size = math.radians(70 if l["kind"] != "art" else 50); ld.spot_blend = 0.8
    lo = bpy.data.objects.new("L_" + l["kind"], ld); col.objects.link(lo); lo.location = l["p"]
    if l["kind"] == "art": lo.rotation_euler = (0, math.radians(-35), 0)
for wx, wy, rot in ((X0 + 0.5, -3.3, -1), (X0 + 0.5, 0.2, -1), (X1 - 0.5, 0.95, 1), (X1 - 0.5, -4.1, 1), (-2.5, Y0 + 0.5, 0), (2.5, Y0 + 0.5, 0)):
    wd = bpy.data.lights.new("L_wash", "SPOT"); wd.energy = 45; wd.spot_size = math.radians(80); wd.spot_blend = 1.0; wd.color = (1.0, 0.76, 0.5)
    wo = bpy.data.objects.new("L_wash", wd); col.objects.link(wo); wo.location = (wx, wy, H - 0.35)
    wo.rotation_euler = (math.radians(25) if rot == 0 else 0, math.radians(25) * rot, 0)
fill = bpy.data.lights.new("L_fill", "AREA"); fill.energy = 4; fill.size = 8; fill.color = (0.9, 0.85, 0.8)
fo = bpy.data.objects.new("L_fill", fill); col.objects.link(fo); fo.location = (0, -1.8, H - 0.3)
world = bpy.data.worlds.new("W"); world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.004, 0.004, 0.005, 1)
scene.world = world
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try: scene.render.engine = eng; break
    except Exception: pass
try:
    scene.eevee.taa_render_samples = 32
    scene.eevee.use_raytracing = True
    scene.eevee.ray_tracing_options.resolution_scale = "2"
except Exception: pass
scene.view_settings.view_transform = "AgX"
try: scene.view_settings.look = "AgX - Medium High Contrast"
except Exception: pass
scene.view_settings.exposure = 0.45
scene.render.image_settings.file_format = "JPEG"; scene.render.image_settings.quality = 80
scene.camera = bpy.data.objects["CAM_HERO"]

def viewport_rendered_camera():
    """Open the file looking through the scene camera, in material preview."""
    for scr in bpy.data.screens:
        for area in scr.areas:
            if area.type != "VIEW_3D": continue
            for sp in area.spaces:
                if sp.type == "VIEW_3D":
                    sp.shading.type = "MATERIAL"
                    sp.region_3d.view_perspective = "CAMERA"

viewport_rendered_camera()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "chez-nous-counter.blend"))

if RENDER:
    only = [a for a in argv if a.startswith("--only=")]
    keys = only[0][7:].split(",") if only else list(CAMS.keys())
    for key in keys:
        if key == "NONE": continue
        scene.camera = bpy.data.objects["CAM_" + key]
        sizes = [(1600, 1000, "")] + ([(900, 1300, "-tall")] if key == "HERO" else [])
        for (rx, ry, suf) in sizes:
            scene.render.resolution_x, scene.render.resolution_y = rx, ry
            scene.render.filepath = os.path.join(OUT, "img", "view-" + key.lower() + suf + ".jpg")
            bpy.ops.render.render(write_still=True)
            print("rendered", key, suf, flush=True)

# ── cutaway copy: no ceiling, no soffit, no entrance wall; a camera from above ──
if "--no-cutaway" not in argv:
    drop = {i for i, m in enumerate(MATS) if any(m is MATS[M[k]] for k in CUTAWAY_MATS)}
    bm = bmesh.new(); bm.from_mesh(room.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in drop], context="FACES")
    bm.to_mesh(room.data); bm.free()
    # Irfan's ask: the lit file is open too (no roof, no entrance wall), looking through the hero camera
    scene.camera = bpy.data.objects["CAM_HERO"]
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "chez-nous-counter.blend"))
    room.name = "Room_cutaway"
    top = bpy.data.cameras.new("CAM_TOP"); top.lens = 24; top.sensor_width = 36; top.clip_end = 80
    to = bpy.data.objects.new("CAM_TOP", top); col.objects.link(to)
    to.location = (0.0, -9.5, 12.5); to.rotation_euler = (Vector((0.0, 0.6, 0.0)) - to.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = to
    top_l = bpy.data.lights.new("L_cutaway_top", "AREA"); top_l.energy = 900; top_l.size = 14; top_l.color = (1.0, 0.93, 0.85)
    tl = bpy.data.objects.new("L_cutaway_top", top_l); col.objects.link(tl); tl.location = (0, -0.2, 9.0)
    scene.view_settings.exposure = 0.9
    viewport_rendered_camera()
    if RENDER:
        scene.render.resolution_x, scene.render.resolution_y = 1600, 1100
        scene.render.filepath = os.path.join(PREV_DIR, "cutaway-top.jpg")
        bpy.ops.render.render(write_still=True)
        print("rendered CUTAWAY", flush=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "chez-nous-cutaway.blend"))
    print("saved cutaway", flush=True)
