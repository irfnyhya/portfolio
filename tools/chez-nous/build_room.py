# Chez Nous chef's counter: built from code in Blender, one camera per seat.
# Run:  blender --background --factory-startup --python build_room.py -- <out_dir> [--render] [--only=HERO,S03]
# Writes <out_dir>/model/room.glb, <out_dir>/model/scene.json, and with --render <out_dir>/img/view-*.jpg
import bpy, bmesh, math, json, os, sys, random
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else ".")
RENDER = "--render" in argv
HERE = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(HERE, "tex")
for d in (os.path.join(OUT, "model"), os.path.join(OUT, "img"), TEX_DIR): os.makedirs(d, exist_ok=True)
random.seed(7); np.random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection

# Room: x -6..6 (along the counter), y -3.2 (entrance wall) .. 2.6 (tile wall), z 0..3.2
X0, X1, Y0, Y1, H = -6.0, 6.0, -3.2, 2.6, 3.2
CT_Z = 0.76          # counter top (table height, as at Noir)
CT_Y0, CT_Y1 = -0.5, 0.35   # counter depth (guest edge .. kitchen edge)
SEAT_Y = -1.02
SEATS_X = [round(-3.575 + 0.65 * i, 3) for i in range(12)]

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

def tex_tiles(n=512):
    # glazed blue subway tiles laid vertically (as in the brief's photo): 4 x 8 tiles per texture
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    cx, cy = x * 8, y * 4
    ix, iy = np.floor(cx), np.floor(cy)
    rnd = (np.sin(ix * 12.9898 + iy * 78.233) * 43758.5453) % 1
    base = np.array(lin("#2f5f96"))
    tone = 0.75 + 0.5 * rnd
    fx, fy = cx % 1, cy % 1
    edge = np.minimum(np.minimum(fx, 1 - fx) * 4, np.minimum(fy, 1 - fy) * 8)  # glaze pools at edges
    shade = 0.75 + 0.25 * np.clip(edge * 3, 0, 1)
    img = base[None, None, :] * (tone * shade)[..., None]
    img += (np.random.rand(n, n, 1) - 0.5) * 0.01
    grout = (np.minimum(fx, 1 - fx) < 0.03) | (np.minimum(fy, 1 - fy) < 0.012)
    img[grout] = np.array(lin("#1a2230"))
    return save_img("tiles", img.astype(np.float32))

def tex_wood(name, hexcol, n=512, stretch=40.0):
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    base = np.array(lin(hexcol))
    g = np.sin(y * stretch + 4 * np.sin(x * 3.0) + 2 * np.sin(x * 11 + y * 5)) * 0.5 + 0.5
    g2 = np.sin(y * stretch * 3.7 + np.sin(x * 7) * 2) * 0.5 + 0.5
    img = base[None, None, :] * (0.8 + 0.22 * g + 0.08 * g2)[..., None]
    img *= (1 + (np.random.rand(n, n, 1) - 0.5) * 0.05)
    return save_img(name, img.astype(np.float32))

def tex_copper(n=512):
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    base = np.array(lin("#c27a3e"))
    streak = np.sin(x * 90 + np.sin(y * 6) * 3) * 0.5 + 0.5
    hammer = np.sin(x * 160 + y * 37) * np.sin(y * 140 - x * 23) * 0.5 + 0.5
    img = base[None, None, :] * (0.7 + 0.25 * streak + 0.12 * hammer)[..., None]
    return save_img("copper", img.astype(np.float32))

def tex_granite(n=512):
    # black stone with fine gold and white flecks
    img = np.full((n, n, 3), 0.012, np.float32) + (np.random.rand(n, n, 1) * 0.01).astype(np.float32)
    for col, cnt in (((0.55, 0.42, 0.2), 900), ((0.5, 0.5, 0.5), 500)):
        xs, ys = np.random.randint(0, n, cnt), np.random.randint(0, n, cnt)
        img[ys, xs] = col
    return save_img("granite", img)

def tex_panels(n=512):
    # black kitchen panels with faint vertical seams
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    img = np.full((n, n, 3), 0.018, np.float32)
    img += (np.sin(y * 40 + x * 3) * 0.002)[..., None]
    seam = np.minimum((x * 6) % 1, 1 - (x * 6) % 1) < 0.008
    img[seam] = 0.006
    return save_img("panels", img)

TEX = {"tiles": tex_panels(), "granite": tex_granite(), "counter": tex_wood("counter_wood", "#8c5a34", stretch=60),
       "floor": tex_wood("floor_wood", "#3a2619", stretch=24), "slat": tex_wood("slat_wood", "#b07a4c", stretch=90),
       "copper": tex_copper()}

# ── materials ────────────────────────────────────────────────────
MATS = []
def mat(name, hexcol, rough=0.6, metal=0.0, emit=None, strength=0.0, tex=None, alpha=1.0):
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
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
            try: setattr(m, attr, val)
            except Exception: pass
    MATS.append(m)
    return len(MATS) - 1

M = {
    "tiles": mat("Panel_Black", "#ffffff", 0.35, tex=TEX["tiles"]),
    "led": mat("LED_Line", "#ffffff", 1.0, emit="#fff6ea", strength=9),
    "dome": mat("Dome_Black", "#0c0c0c", 0.3, 0.8),
    "dome_in": mat("Dome_Glow", "#ffe7c4", 1.0, emit="#ffcf8a", strength=10),
    "lampglow": mat("Lamp_Glow", "#ffe4b8", 1.0, emit="#ffc477", strength=7),
    "velvet": mat("Velvet_Green", "#2c3a2e", 0.95),
    "menu": mat("Menu_Paper", "#e9e4d8", 0.9),
    "strip": mat("Strip_Light", "#fff0d0", 1.0, emit="#ffd49a", strength=10),
    "counter": mat("Counter_Granite", "#ffffff", 0.22, tex=TEX["granite"]),
    "floor": mat("Floor_Oak", "#ffffff", 0.5, tex=TEX["floor"]),
    "slat": mat("Slat_Oak", "#ffffff", 0.55, tex=TEX["slat"]),
    "copper": mat("Copper_Hood", "#ffffff", 0.32, 1.0, tex=TEX["copper"]),
    "steel": mat("Steel", "#c7cacc", 0.28, 1.0),
    "steel_dark": mat("Steel_Brushed", "#8d9194", 0.4, 1.0),
    "wall": mat("Wall_Black", "#0c0c0d", 0.85),
    "ceiling": mat("Ceiling", "#0a0a0a", 0.9),
    "black": mat("Black_Metal", "#111214", 0.45, 0.6),
    "leather": mat("Leather_Seat", "#2a1a14", 0.5),
    "brass": mat("Brass", "#c9a24a", 0.3, 1.0),
    "jacket": mat("Chef_Jacket", "#ecebe6", 0.8),
    "apron": mat("Apron", "#1d2836", 0.8),
    "skin": mat("Skin", "#b98a6c", 0.6),
    "hair": mat("Hair", "#2a1d16", 0.7),
    "napkin": mat("Napkin", "#f3f1ea", 0.85),
    "glass": mat("Glass", "#e6eef0", 0.05, alpha=0.2),
    "board": mat("Board", "#c8a070", 0.6),
    "plate": mat("Porcelain", "#f4f2ec", 0.2),
    "marble": mat("Marble", "#e7e3db", 0.2),
    "ember": mat("Embers", "#ff6a1a", 1.0, emit="#ff5a10", strength=8),
    "flame": mat("Gas_Flame", "#7fb0ff", 1.0, emit="#5c8dff", strength=6),
    "bulb": mat("Downlight", "#fff2dc", 1.0, emit="#ffd9a0", strength=14),
    "globe": mat("Globe_Opal", "#ffe7c4", 0.3, emit="#ffc27a", strength=4.5),
    "lamp": mat("Wall_Lamp", "#f3c27a", 0.9, emit="#ffb860", strength=5),
    "green": mat("Herbs", "#3f6a2a", 0.7),
    "food": mat("Food", "#c96b3c", 0.6),
    "bottle": mat("Bottle", "#173322", 0.15, alpha=0.85),
    "cream": mat("Cream_Plaster", "#d8cdb8", 0.9),
}

BM = bmesh.new(); UV = BM.loops.layers.uv.new("UVMap")
def _finish(bm, verts, mi, M4, smooth=False):
    bmesh.ops.transform(bm, matrix=M4, verts=verts)
    for f in {f for v in verts for f in v.link_faces}:
        f.material_index = mi; f.smooth = smooth

def box(sx, sy, sz, x, y, z, mi, rz=0.0, rx=0.0, bm=None, uvs=None):
    bm = bm or BM
    r = bmesh.ops.create_cube(bm, size=1, calc_uvs=True)
    M4 = Matrix.Translation((x, y, z)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Rotation(rx, 4, "X") @ Matrix.Diagonal((sx, sy, sz, 1))
    if uvs:  # scale UVs for tiling textures
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
# floor (oak boards), ceiling
quad([(X0, Y0, 0), (X1, Y0, 0), (X1, Y1, 0), (X0, Y1, 0)], [(0, 0), (W / 2, 0), (W / 2, D / 1.2), (0, D / 1.2)], M["floor"])
quad([(X0, Y1, H), (X1, Y1, H), (X1, Y0, H), (X0, Y0, H)], [(0, 0)] * 4, M["ceiling"])

# Walls: blue tile back wall (kitchen), charcoal elsewhere, warm oak slats on the right
boxb(W, 0.1, 2.5, 0, Y1 + 0.05, 0, M["tiles"], uvs=(W / 1.2, 2.5 / 1.2 * 2))
boxb(W, 0.1, H - 2.5, 0, Y1 + 0.05, 2.5, M["wall"])
boxb(W, 0.1, H, 0, Y0 - 0.05, 0, M["wall"])
boxb(0.1, D, H, X0 - 0.05, (Y0 + Y1) / 2, 0, M["wall"])
boxb(0.1, D, H, X1 + 0.05, (Y0 + Y1) / 2, 0, M["wall"])
for i in range(40):  # oak slats on the right wall (guest side), like the photo
    yy = Y0 + 0.25 + i * 0.09
    if yy > 0.9: break
    boxb(0.05, 0.06, 2.9, X1 - 0.04, yy, 0.1, M["slat"], uvs=(1, 3))
boxb(0.08, 0.32, 0.5, X1 - 0.1, -1.0, 1.7, M["lamp"])           # warm wall light on the slats
boxb(0.1, 0.36, 0.04, X1 - 0.1, -1.0, 2.2, M["brass"]); boxb(0.1, 0.36, 0.04, X1 - 0.1, -1.0, 1.66, M["brass"])

# ── kitchen: three blocks along the back wall, a plating table, a U counter (2-6-2 seats) ──
KX0, KX1 = -4.5, 4.5                  # light frame around the kitchen
KY0, KY1 = 1.95, Y1 - 0.02            # back kitchen blocks
KYc = (KY0 + KY1) / 2
PY0, PY1 = 1.0, 1.6                   # plating table ("the pass")
IY = (PY0 + PY1) / 2
boxb(KX1 - KX0 + 0.4, 0.3, 0.03, 0, Y1 - 0.15, 1.6, M["steel_dark"])        # shelf on the black panels
boxb(KX1 - KX0 + 0.4, 0.03, 0.012, 0, Y1 - 0.04, 1.585, M["strip"])         # light strip under the shelf

BLOCKS = [("grill", -3.7, -1.3), ("stove", 0.1, 2.75), ("pastry", 3.4, 4.4)]
for key, bx0, bx1 in BLOCKS:
    boxb(bx1 - bx0, KY1 - KY0, 0.88, (bx0 + bx1) / 2, KYc, 0, M["steel_dark"])
    boxb(bx1 - bx0 + 0.03, KY1 - KY0 + 0.03, 0.04, (bx0 + bx1) / 2, KYc, 0.88, M["steel"])
# grill (left block): charcoal under a grate
boxb(1.6, 0.42, 0.1, -2.5, KYc, 0.92, M["black"]); boxb(1.5, 0.34, 0.02, -2.5, KYc, 0.99, M["ember"])
for i in range(16): box(0.01, 0.36, 0.01, -3.2 + i * 0.093, KYc, 1.03, M["steel_dark"])
for i in range(5): cyl(0.03, 0.03, 0.04, -3.0 + i * 0.25, KYc - 0.05 + (i % 2) * 0.1, 1.03, M["food"], seg=8, rx=math.pi / 2)
# stove (middle block): four flames
for x in (0.55, 1.05, 1.75, 2.25): cyl(0.11, 0.11, 0.01, x, KYc, 0.92, M["flame"], seg=16)
# pastry (narrow right block): marble and a board
boxb(0.95, KY1 - KY0 - 0.05, 0.03, 3.9, KYc, 0.92, M["marble"]); boxb(0.4, 0.26, 0.02, 3.8, KYc, 0.95, M["board"])
for i in range(3): sphere(0.045, 4.15, KYc - 0.12 + i * 0.12, 0.99, M["plate"], seg=10, sz=0.7)

# the plating table: black stone, a row of plates being finished
boxb(7.2, PY1 - PY0, 0.86, 0, IY, 0, M["wall"])
boxb(7.24, PY1 - PY0 + 0.04, 0.04, 0, IY, 0.86, M["counter"], uvs=(8, 1))
for i in range(7):
    x = -2.7 + i * 0.9
    cyl(0.13, 0.11, 0.015, x, IY - 0.08, 0.9, M["plate"], seg=24)
    sphere(0.04, x, IY - 0.08, 0.93, M["food"], seg=10, sz=0.5)
    sphere(0.018, x + 0.03, IY - 0.06, 0.94, M["green"], seg=6)

# White light lines framing the kitchen and the plating table
LY0, LY1, FZ = 0.88, Y1 - 0.05, 2.62
box(KX1 - KX0, 0.025, 0.025, 0, LY0, FZ, M["led"]); box(KX1 - KX0, 0.025, 0.025, 0, LY1, FZ, M["led"])
for x in (KX0, KX1):
    box(0.025, LY1 - LY0, 0.025, x, (LY0 + LY1) / 2, FZ, M["led"])
    box(0.025, 0.025, FZ - 0.95, x, LY0, (FZ + 0.95) / 2, M["led"])
boxb(KX1 - KX0 + 0.1, LY1 - LY0 + 0.1, H - FZ - 0.02, 0, (LY0 + LY1) / 2, FZ + 0.02, M["wall"])  # dropped black soffit

# Black dome pendants over the plating table
DOMES = [-2.7, -0.9, 0.9, 2.7]
for x in DOMES:
    cyl(0.004, 0.004, H - 1.9, x, IY, 1.9, M["black"], seg=4)
    cyl(0.32, 0.04, 0.2, x, IY, 1.7, M["dome"], seg=28)
    cyl(0.3, 0.3, 0.004, x, IY, 1.697, M["dome_in"], seg=28)

# The U counter: black speckled stone on wood-slat fronts. Front bar + two arms.
UX, ARM_W, UF0, UF1, ARM_Y1 = 3.7, 0.65, -1.0, -0.35, 0.75
def stone(x0, x1, y0, y1):
    boxb(x1 - x0, y1 - y0, 0.05, (x0 + x1) / 2, (y0 + y1) / 2, CT_Z - 0.05, M["counter"], uvs=(max(1, (x1 - x0) / 0.9), max(1, (y1 - y0) / 0.9)))
    boxb(x1 - x0 - 0.1, y1 - y0 - 0.1, CT_Z - 0.05, (x0 + x1) / 2, (y0 + y1) / 2, 0, M["wall"])
stone(-UX, UX, UF0, UF1)
stone(-UX, -UX + ARM_W, UF1 - 0.02, ARM_Y1)
stone(UX - ARM_W, UX, UF1 - 0.02, ARM_Y1)
x = -UX + 0.06
while x < UX - 0.04:                       # slats on the front
    boxb(0.045, 0.04, CT_Z - 0.07, x, UF0 + 0.03, 0.02, M["slat"], uvs=(1, 2)); x += 0.07
y = UF0 + 0.06
while y < ARM_Y1 - 0.03:                   # slats on the outer sides of the arms
    for sx_ in (-1, 1): boxb(0.04, 0.045, CT_Z - 0.07, sx_ * (UX - 0.03), y, 0.02, M["slat"], uvs=(1, 2))
    y += 0.07

# Downlights in the dark ceiling over the counter
for x in (-2.5, 0.0, 2.5): cyl(0.05, 0.05, 0.02, x, -0.7, H - 0.02, M["bulb"], seg=10)

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

def place_setting(x, y, face):
    """Menu card, a tumbler with a folded napkin and black cutlery, on the counter in front of a seat."""
    fx, fy = math.cos(face), math.sin(face); sx_, sy_ = -fy, fx
    cx, cy = x + fx * 0.72, y + fy * 0.72
    box(0.2, 0.28, 0.002, cx, cy, CT_Z + 0.001, M["menu"], rz=face - math.pi / 2 + 0.08)
    gx, gy = cx + fx * 0.15 - sx_ * 0.2, cy + fy * 0.15 - sy_ * 0.2
    cyl(0.034, 0.03, 0.09, gx, gy, CT_Z, M["glass"], seg=12)
    cyl(0.032, 0.002, 0.13, gx, gy, CT_Z + 0.02, M["napkin"], seg=4, rx=0.12)
    for off in (0.14, 0.165):
        box(0.006, 0.22, 0.006, cx - sx_ * off, cy - sy_ * off, CT_Z + 0.004, M["black"], rz=face - math.pi / 2)

def table_lamp(x, y):
    """Gold cordless table lamp."""
    cyl(0.055, 0.05, 0.015, x, y, CT_Z, M["brass"], seg=16)
    cyl(0.011, 0.011, 0.25, x, y, CT_Z + 0.015, M["brass"], seg=8)
    cyl(0.075, 0.018, 0.05, x, y, CT_Z + 0.255, M["brass"], seg=18)
    cyl(0.07, 0.07, 0.004, x, y, CT_Z + 0.252, M["lampglow"], seg=18)

E_, N_, W_ = 0.0, math.pi / 2, math.pi
SEAT_DEF = [(-4.22, 0.4, E_, "grill"), (-4.22, -0.35, E_, "grill"),
            (-2.25, -1.52, N_, "grill"), (-1.35, -1.52, N_, "grill"), (-0.45, -1.52, N_, "pass"),
            (0.45, -1.52, N_, "pass"), (1.35, -1.52, N_, "stove"), (2.25, -1.52, N_, "stove"),
            (4.22, -0.35, W_, "pastry"), (4.22, 0.4, W_, "pastry")]
for sx_, sy_, f, _ in SEAT_DEF:
    tub_chair(sx_, sy_, f)
    place_setting(sx_, sy_, f)
LAMPS = [(-1.8, -0.62), (0.0, -0.62), (1.8, -0.62), (-3.38, 0.02), (3.38, 0.02)]
for lx, ly in LAMPS: table_lamp(lx, ly)

# Entrance wall: a wine rack and the door, behind the guests
for zz in (0.4, 0.9, 1.4, 1.9):
    boxb(2.4, 0.3, 0.03, -3.6, Y0 + 0.15, zz, M["slat"])
    for k in range(10): cyl(0.038, 0.038, 0.3, -4.7 + k * 0.24, Y0 + 0.15, zz + 0.03, M["bottle"], seg=8)
boxb(1.1, 0.06, 2.3, 2.6, Y0 + 0.03, 0, M["slat"])
boxb(0.04, 0.08, 0.5, 2.15, Y0 + 0.08, 1.0, M["brass"])

CHEFS = []
# ── seat data, cameras ───────────────────────────────────────────
STATION_TEXT = {"grill": "the charcoal grill", "stove": "the stove and copper pans", "pass": "the plating table, where every plate is finished", "pastry": "the pastry marble"}
SEATS = [dict(id="S%02d" % (i + 1), n=i + 1, x=round(sx_, 3), y=round(sy_, 3), face=round(f, 4), station=st)
         for i, (sx_, sy_, f, st) in enumerate(SEAT_DEF)]
CAMS = {}
for s_ in SEATS:
    f = s_["face"]
    eye = Vector((s_["x"] + math.cos(f) * 0.06, s_["y"] + math.sin(f) * 0.06, 1.16))
    if abs(f - N_) < 0.01: look = Vector((s_["x"] * 0.7, KYc, 1.15))
    elif f < 0.01: look = Vector((1.2, IY + 0.2, 1.1))
    else: look = Vector((-1.2, IY + 0.2, 1.1))
    CAMS[s_["id"]] = (eye, look, 22)
CAMS["HERO"] = (Vector((0.0, -3.05, 1.62)), Vector((0.0, 2.2, 1.05)), 20)   # straight on, as in the Noir photo

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
    """Move a group of meshes so their joint base centre sits at the origin."""
    vs = [v.co for m in meshes for v in m.vertices]
    cx = (min(v.x for v in vs) + max(v.x for v in vs)) / 2; cy = (min(v.y for v in vs) + max(v.y for v in vs)) / 2; z0 = min(v.z for v in vs)
    for m in meshes: m.transform(Matrix.Translation((-cx, -cy, -z0)))

def place(name, meshes, x, y, z, rz=0.0):
    for i, m in enumerate(meshes):
        o = bpy.data.objects.new("%s_%d" % (name, i), m); col.objects.link(o)
        o.location = (x, y, z); o.rotation_euler = (0, 0, rz)

kit = load_protos("kitchen/scene.gltf", ["SM_"], 0.01)
def kpart(key):
    hit = [m for n, m in kit.items() if n.startswith(key + "_") and "Dirty" not in n]
    recentre(hit); return hit
plate, wglass = kpart("SM_Plate_04"), kpart("SM_WineGlass")
# Clean pots on the back shelf and the stove, a plate on the plating table
for i, key in enumerate(["SM_Pot_01", "SM_Pot_02", "SM_Pot_05", "SM_Pot_04", "SM_Pot_06", "SM_Pot_01", "SM_Pot_05", "SM_Pot_02"]):
    place("ShelfPot", kpart(key), -4.2 + i * 1.2, Y1 - 0.15, 1.63, random.uniform(0, 6.28))
for key, x in (("SM_Pot_03", 0.55), ("SM_Pot_05", 2.25)):
    place("StovePot", kpart(key), x, KYc, 0.93, 0.4)

# Copper pans on the stove block
copper = list(load_protos("copper/scene.gltf", ["material"], 0.5).values()); recentre(copper)
place("Copper", copper, 1.4, KYc, 0.92, 0.2)

# Wine on the counter by a few seats
wine = list(load_protos("wine/scene.gltf", ["poly"], 1.9).values()); recentre(wine)
place("Wine", wine, -2.7, -0.55, CT_Z, 0.3)
place("Wine", wine, 2.7, -0.55, CT_Z, -0.2)
place("Wine", wine, 3.4, 0.55, CT_Z, 0.5)

# Keep the web file small: textures to 512 px
for img in bpy.data.images:
    if img.size[0] > 512 and img.name not in ("tiles", "counter_wood", "floor_wood"):
        img.scale(512, 512)

for key, (eye, look, lens) in CAMS.items():
    cd = bpy.data.cameras.new("CAM_" + key); cd.lens = lens; cd.sensor_width = 36; cd.clip_start = 0.05; cd.clip_end = 40
    co = bpy.data.objects.new("CAM_" + key, cd); col.objects.link(co)
    co.location = eye; co.rotation_euler = (look - eye).to_track_quat("-Z", "Y").to_euler()

LIGHTS = [dict(kind="dome", p=(x, IY, 1.62)) for x in DOMES] + \
         [dict(kind="lamp", p=(lx, ly, CT_Z + 0.22)) for lx, ly in LAMPS] + \
         [dict(kind="pass", p=(0.0, IY, 1.3))] + \
         [dict(kind="down", p=(x, -0.7, H - 0.1)) for x in (-2.5, 0.0, 2.5)] + \
         [dict(kind="grill", p=(-2.5, KYc, 1.05)), dict(kind="wall", p=(X1 - 0.3, -1.0, 1.95))]

data = dict(room=dict(x0=X0, x1=X1, y0=Y0, y1=Y1, h=H),
            kitchen=[dict(key=k, x0=a, x1=b, y0=KY0, y1=KY1) for k, a, b in BLOCKS],
            plating=dict(x0=-3.6, x1=3.6, y0=PY0, y1=PY1),
            counter=dict(ux=UX, arm=ARM_W, y0=UF0, y1=UF1, arm_y1=ARM_Y1, z=CT_Z),
            lamps=[[a, b] for a, b in LAMPS], seats=SEATS,
            lights=[dict(kind=l["kind"], p=[round(v, 3) for v in l["p"]]) for l in LIGHTS])
with open(os.path.join(OUT, "model", "scene.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

glb = os.path.join(OUT, "model", "room.glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_cameras=True, export_lights=False,
                          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                          export_draco_position_quantization=14, export_draco_normal_quantization=10,
                          export_draco_texcoord_quantization=12,
                          export_image_format="JPEG", export_image_quality=80, export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "chez-nous-counter.blend"))
print("GLB", os.path.getsize(glb), "bytes")

if RENDER:
    E = {"dome": 60, "lamp": 5, "pass": 20, "down": 6, "grill": 45, "wall": 12}
    C = {"grill": (1.0, 0.45, 0.15), "pass": (1.0, 0.7, 0.45)}
    for l in LIGHTS:
        ld = bpy.data.lights.new("L_" + l["kind"], "SPOT" if l["kind"] in ("dome", "down") else "POINT")
        ld.energy = E[l["kind"]]; ld.color = C.get(l["kind"], (1.0, 0.78, 0.55)); ld.shadow_soft_size = 0.15
        if ld.type == "SPOT": ld.spot_size = math.radians(70); ld.spot_blend = 0.8
        lo = bpy.data.objects.new("L_" + l["kind"], ld); col.objects.link(lo); lo.location = l["p"]
    for x in (-3.0, 0.0, 3.0):
        wd = bpy.data.lights.new("L_tiles", "AREA"); wd.energy = 8; wd.size = 2.6; wd.color = (1.0, 0.85, 0.7)
        wo = bpy.data.objects.new("L_tiles", wd); col.objects.link(wo); wo.location = (x, Y1 - 1.0, 2.2); wo.rotation_euler = (math.radians(60), 0, 0)
    fill = bpy.data.lights.new("L_fill", "AREA"); fill.energy = 3; fill.size = 6; fill.color = (0.75, 0.82, 1.0)
    fo = bpy.data.objects.new("L_fill", fill); col.objects.link(fo); fo.location = (0, -1.5, H - 0.05)
    world = bpy.data.worlds.new("W"); world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.008, 0.008, 0.01, 1)
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
    scene.view_settings.exposure = 0.1
    scene.render.image_settings.file_format = "JPEG"; scene.render.image_settings.quality = 80
    only = [a for a in argv if a.startswith("--only=")]
    keys = only[0][7:].split(",") if only else list(CAMS.keys())
    for key in keys:
        scene.camera = bpy.data.objects["CAM_" + key]
        sizes = [(1600, 1000, "")] + ([(900, 1300, "-tall")] if key == "HERO" else [])
        for (rx, ry, suf) in sizes:
            scene.render.resolution_x, scene.render.resolution_y = rx, ry
            scene.render.filepath = os.path.join(OUT, "img", "view-" + key.lower() + suf + ".jpg")
            bpy.ops.render.render(write_still=True)
            print("rendered", key, suf, flush=True)
