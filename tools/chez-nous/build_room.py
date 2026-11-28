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
CT_Z = 0.95          # counter top
CT_Y0, CT_Y1 = -0.4, 0.35   # counter depth (guest edge .. kitchen edge)
SEAT_Y = -0.92
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

TEX = {"tiles": tex_tiles(), "counter": tex_wood("counter_wood", "#8c5a34", stretch=60),
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
    "tiles": mat("Tile_Blue", "#ffffff", 0.18, tex=TEX["tiles"]),
    "strip": mat("Strip_Light", "#fff0d0", 1.0, emit="#ffd49a", strength=10),
    "counter": mat("Counter_Wood", "#ffffff", 0.32, tex=TEX["counter"]),
    "floor": mat("Floor_Oak", "#ffffff", 0.5, tex=TEX["floor"]),
    "slat": mat("Slat_Oak", "#ffffff", 0.55, tex=TEX["slat"]),
    "copper": mat("Copper_Hood", "#ffffff", 0.32, 1.0, tex=TEX["copper"]),
    "steel": mat("Steel", "#c7cacc", 0.28, 1.0),
    "steel_dark": mat("Steel_Brushed", "#8d9194", 0.4, 1.0),
    "wall": mat("Wall_Charcoal", "#1c1c1f", 0.85),
    "ceiling": mat("Ceiling", "#141416", 0.9),
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

# ── kitchen ──────────────────────────────────────────────────────
KX0, KX1 = -4.6, 4.6
# back bench along the tile wall
boxb(KX1 - KX0, 0.65, 0.88, 0, Y1 - 0.33, 0, M["steel_dark"])
boxb(KX1 - KX0, 0.7, 0.04, 0, Y1 - 0.35, 0.88, M["steel"])
boxb(KX1 - KX0, 0.3, 0.03, 0, Y1 - 0.15, 1.6, M["steel"])       # shelf
boxb(KX1 - KX0, 0.03, 0.012, 0, Y1 - 0.06, 1.585, M["strip"])  # LED strip under the shelf
# combi oven + fridge doors on the left end of the back bench
boxb(0.85, 0.7, 0.9, -4.0, Y1 - 0.4, 0.92, M["steel"]); boxb(0.6, 0.02, 0.6, -4.05, Y1 - 0.76, 1.05, M["black"])
for x in (-3.0, -1.6, 0.6, 2.2): boxb(0.02, 0.01, 0.45, x, Y1 - 0.66, 0.3, M["steel"])

# island / stations between counter and back bench
IY = 1.15
boxb(KX1 - KX0, 0.8, 0.86, 0, IY, 0, M["steel_dark"])
boxb(KX1 - KX0 + 0.04, 0.84, 0.04, 0, IY, 0.86, M["steel"])
# Station 1 (left): charcoal grill
boxb(1.4, 0.6, 0.12, -3.3, IY, 0.9, M["black"])
boxb(1.3, 0.5, 0.02, -3.3, IY, 0.98, M["ember"])
for i in range(14): box(0.01, 0.52, 0.01, -3.92 + i * 0.095, IY, 1.02, M["steel_dark"])
for i in range(5): cyl(0.03, 0.03, 0.04, -3.7 + i * 0.2, IY - 0.05 + (i % 2) * 0.12, 1.02, M["food"], seg=8, rx=math.pi / 2)
# Station 2: stove with copper pans
for i, x in enumerate((-1.95, -1.45, -0.95)):
    cyl(0.12, 0.12, 0.01, x, IY, 0.9, M["flame"], seg=16)
# Station 3: the pass (centre) with plates being finished, heat lamps
for i in range(5):
    x = -0.2 + i * 0.42
    cyl(0.13, 0.11, 0.015, x, IY - 0.15, 0.9, M["plate"], seg=24)
    sphere(0.04, x, IY - 0.15, 0.93, M["food"], seg=10, sz=0.5)
    sphere(0.018, x + 0.03, IY - 0.13, 0.94, M["green"], seg=6)
boxb(2.2, 0.35, 0.04, 0.65, IY - 0.15, 1.6, M["steel"])
for x in (0.0, 0.65, 1.3): cyl(0.06, 0.09, 0.05, x, IY - 0.15, 1.55, M["bulb"], seg=12)
for x in (-0.4, 1.7): cyl(0.012, 0.012, 0.7, x, IY - 0.15, 0.9, M["steel"], seg=6)
# Station 4: pastry on marble, right side
boxb(1.4, 0.7, 0.03, 3.3, IY, 0.9, M["marble"])
boxb(0.5, 0.3, 0.02, 3.0, IY, 0.93, M["board"])
for i in range(4): sphere(0.05, 3.5 + (i % 2) * 0.16, IY - 0.1 + (i // 2) * 0.18, 0.97, M["plate"], seg=10, sz=0.7)
cyl(0.12, 0.09, 0.12, 3.85, IY + 0.1, 0.93, M["steel"], seg=16)

# Copper hood over the stations, with downlights
boxb(8.6, 1.5, 0.7, 0, 1.55, 2.3, M["copper"], uvs=(6, 1))
boxb(8.4, 1.3, 0.02, 0, 1.55, 2.29, M["steel_dark"])
for x in (-3.3, -1.45, 0.65, 3.3):
    cyl(0.07, 0.07, 0.02, x, 1.2, 2.27, M["bulb"], seg=12)

# Guest counter: oak top, dark front, brass foot rail
boxb(KX1 - KX0 - 0.6, CT_Y1 - CT_Y0, 0.06, 0, (CT_Y0 + CT_Y1) / 2, CT_Z - 0.06, M["counter"], uvs=(6, 1))
boxb(KX1 - KX0 - 0.7, 0.55, CT_Z - 0.06, 0, 0.05, 0, M["wall"])
cyl(0.022, 0.022, KX1 - KX0 - 0.8, 0, CT_Y0 - 0.14, 0.22, M["brass"], seg=10, ry=math.pi / 2, rz=0)
# the counter's kitchen-side upstand (low, so you see over it)
boxb(KX1 - KX0 - 0.6, 0.08, 0.12, 0, CT_Y1 - 0.04, CT_Z - 0.06, M["counter"])

# Downlights in the dark ceiling over the counter
for x in SEATS_X[::2]: cyl(0.05, 0.05, 0.02, x + 0.32, -0.2, H - 0.02, M["bulb"], seg=10)

# ── seats and place settings ────────────────────────────────────
def stool(x, y):
    cyl(0.2, 0.18, 0.06, x, y, 0.68, M["leather"], seg=16)
    cyl(0.03, 0.03, 0.66, x, y, 0.02, M["black"], seg=8)
    cyl(0.2, 0.2, 0.02, x, y, 0.0, M["black"], seg=16)
    cyl(0.16, 0.16, 0.015, x, y, 0.3, M["black"], seg=16)
    boxb(0.34, 0.05, 0.12, x, y - 0.2, 0.8, M["leather"])
    for s in (-1, 1): cyl(0.012, 0.012, 0.1, x + s * 0.14, y - 0.2, 0.72, M["black"], seg=6)

def setting(x):
    y = CT_Y0 + 0.2
    boxb(0.16, 0.16, 0.03, x, y, CT_Z, M["napkin"])                     # folded napkin with the mark
    boxb(0.05, 0.03, 0.002, x, y, CT_Z + 0.03, M["black"])
    cyl(0.04, 0.045, 0.12, x + 0.07, y + 0.22, CT_Z, M["glass"], seg=12)  # water glass
    box(0.012, 0.22, 0.008, x + 0.13, y, CT_Z + 0.01, M["steel"])          # knife + fork on the rest
    box(0.012, 0.22, 0.008, x + 0.16, y, CT_Z + 0.01, M["steel"])
    boxb(0.06, 0.02, 0.015, x + 0.145, y + 0.08, CT_Z, M["black"])

# Brass pendant lamps over the counter (one between every two seats)
for i in range(6):
    x = SEATS_X[2 * i] + 0.325
    cyl(0.004, 0.004, H - 2.25, x, -0.05, 2.25, M["black"], seg=4)
    cyl(0.05, 0.03, 0.06, x, -0.05, 2.19, M["brass"], seg=12)
    sphere(0.085, x, -0.05, 2.12, M["globe"], seg=16)

# Chef's table for six, by the oak wall on the right, facing the pastry station
CTX, CTY = 5.15, -1.45
boxb(0.85, 1.9, 0.05, CTX, CTY, 0.74, M["counter"], uvs=(1, 3))
for sy in (-1, 1): boxb(0.08, 0.08, 0.74, CTX, CTY + sy * 0.8, 0, M["black"])
CHEF_TABLE_SEATS = []
for i in range(3):
    yy = CTY - 0.62 + i * 0.62
    for side in (-1, 1):
        sx = CTX + side * 0.68
        boxb(0.42, 0.42, 0.05, sx, yy, 0.45, M["leather"]); boxb(0.05 + 0.0, 0.4, 0.42, sx + side * 0.2, yy, 0.5, M["leather"])
        for lx in (-0.17, 0.17):
            for ly in (-0.17, 0.17): cyl(0.015, 0.015, 0.45, sx + lx, yy + ly, 0, M["black"], seg=6)
        CHEF_TABLE_SEATS.append((sx, yy))
        boxb(0.16, 0.16, 0.03, CTX + side * 0.25, yy, 0.79, M["napkin"])
        cyl(0.035, 0.04, 0.11, CTX + side * 0.2, yy + 0.18, 0.79, M["glass"], seg=12)
cyl(0.01, 0.01, 1.2, CTX, CTY, H - 1.2, M["black"], seg=6)            # pendant over the chef's table
cyl(0.22, 0.05, 0.22, CTX, CTY, H - 1.42, M["brass"], seg=18)
sphere(0.06, CTX, CTY, H - 1.42, M["bulb"], seg=8)

# Entrance wall: a wine rack and the door, behind the guests
for zz in (0.4, 0.9, 1.4, 1.9):
    boxb(2.4, 0.3, 0.03, -3.6, Y0 + 0.15, zz, M["slat"])
    for k in range(10): cyl(0.038, 0.038, 0.3, -4.7 + k * 0.24, Y0 + 0.15, zz + 0.03, M["bottle"], seg=8)
boxb(1.1, 0.06, 2.3, 2.6, Y0 + 0.03, 0, M["slat"])
boxb(0.04, 0.08, 0.5, 2.15, Y0 + 0.08, 1.0, M["brass"])

CHEFS = []
# ── seat data, cameras ───────────────────────────────────────────
STATIONS = [(-3.3, "the charcoal grill"), (-1.45, "the stove and copper pans"), (0.65, "the pass, where every plate is finished"), (3.3, "the pastry marble")]
def nearest_station(x):
    return min(STATIONS, key=lambda s: abs(s[0] - x))

SEATS = []
for i, x in enumerate(SEATS_X):
    st = nearest_station(x)
    SEATS.append(dict(id="S%02d" % (i + 1), n=i + 1, x=x, y=SEAT_Y, station=st[1]))
CAMS = {}
for s in SEATS:
    eye = Vector((s["x"], SEAT_Y - 0.05, 1.33))
    look = Vector((s["x"] * 0.75, IY + 0.5, 1.32))   # look at the kitchen, a little towards the centre
    CAMS[s["id"]] = (eye, look, 22)
CAMS["CT"] = (Vector((CTX - 0.55, CTY - 0.62, 1.2)), Vector((2.2, IY + 0.3, 1.15)), 20)
CAMS["HERO"] = (Vector((0.65, -1.55, 1.45)), Vector((0.65, 2.6, 1.12)), 24)   # straight on, like the brief photo

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

stool = list(load_protos("stool/scene.gltf", ["barStool"], 0.0078).values()); recentre(stool)
for s in SEATS_X: place("Stool", stool, s, SEAT_Y, 0, rz=random.uniform(-0.3, 0.3))

kit = load_protos("kitchen/scene.gltf", ["SM_"], 0.01)
def kpart(key):
    hit = [m for n, m in kit.items() if n.startswith(key + "_") and "Dirty" not in n]
    recentre(hit); return hit
plate, wglass = kpart("SM_Plate_04"), kpart("SM_WineGlass")
for m in plate: m.transform(Matrix.Scale(0.62, 4))
for m in wglass: m.transform(Matrix.Scale(1.9, 4))
for x in SEATS_X:  # a place at every seat: plate, wine glass
    place("Plate", plate, x, CT_Y0 + 0.2, CT_Z, 0)
    place("Glass", wglass, x + 0.16, CT_Y0 + 0.36, CT_Z, 0)
# Clean pots on the back shelf and the stove, a tray on the pastry marble
for i, key in enumerate(["SM_Pot_01", "SM_Pot_02", "SM_Pot_05", "SM_Pot_04", "SM_Pot_06", "SM_Pot_01", "SM_Pot_05", "SM_Pot_02"]):
    place("ShelfPot", kpart(key), KX0 + 0.7 + i * 1.12, Y1 - 0.15, 1.63, random.uniform(0, 6.28))
for key, x in (("SM_Pot_03", -1.95), ("SM_Pot_05", -0.95)):
    place("StovePot", kpart(key), x, IY, 0.91, 0.4)
place("PassPlate", kpart("SM_Plate_05"), 2.0, IY - 0.15, 0.9)

# Copper pans: on the stove and on the back bench by the grill
copper = list(load_protos("copper/scene.gltf", ["material"], 0.55).values()); recentre(copper)
place("Copper", copper, -1.45, IY + 0.05, 0.905, 0.2)
place("Copper", copper, -2.6, Y1 - 0.38, 0.92, 1.4)

# Wine: a bottle and glass for each seat at the chef's table end, one at the pass
wine = list(load_protos("wine/scene.gltf", ["poly"], 1.9).values()); recentre(wine)
place("Wine", wine, 3.55, CT_Y0 + 0.3, CT_Z, 0.3)
place("Wine", wine, -3.0, CT_Y0 + 0.3, CT_Z, -0.2)
place("Wine", wine, 5.15, -1.3, 0.79, 0)

# Keep the web file small: textures to 512 px
for img in bpy.data.images:
    if img.size[0] > 512 and img.name not in ("tiles", "counter_wood", "floor_wood"):
        img.scale(512, 512)

for key, (eye, look, lens) in CAMS.items():
    cd = bpy.data.cameras.new("CAM_" + key); cd.lens = lens; cd.sensor_width = 36; cd.clip_start = 0.05; cd.clip_end = 40
    co = bpy.data.objects.new("CAM_" + key, cd); col.objects.link(co)
    co.location = eye; co.rotation_euler = (look - eye).to_track_quat("-Z", "Y").to_euler()

LIGHTS = [dict(kind="hood", p=(x, 1.2, 2.2)) for x in (-3.3, -1.45, 0.65, 3.3)] + \
         [dict(kind="pass", p=(0.65, IY - 0.15, 1.5))] + \
         [dict(kind="down", p=(x, -0.2, H - 0.1)) for x in (-2.6, 0.0, 2.6)] + \
         [dict(kind="globe", p=(SEATS_X[2 * i] + 0.325, -0.05, 2.0)) for i in range(6)] + \
         [dict(kind="grill", p=(-3.3, IY, 1.05)), dict(kind="wall", p=(X1 - 0.3, -1.0, 1.95)), dict(kind="pendant", p=(CTX, CTY, H - 1.5))]

data = dict(room=dict(x0=X0, x1=X1, y0=Y0, y1=Y1, h=H), counter=dict(x0=KX0 + 0.3, x1=KX1 - 0.3, y0=CT_Y0, y1=CT_Y1, z=CT_Z),
            island=dict(y=IY), stations=[dict(x=x, name=n) for x, n in STATIONS],
            seats=SEATS, chefs_table=dict(x=CTX, y=CTY, w=0.85, d=1.9, seats=[[round(a, 3), round(b, 3)] for a, b in CHEF_TABLE_SEATS]),
            chefs=CHEFS, lights=[dict(kind=l["kind"], p=[round(v, 3) for v in l["p"]]) for l in LIGHTS])
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
    E = {"hood": 110, "pass": 55, "down": 20, "grill": 70, "wall": 30, "pendant": 40, "globe": 18}
    C = {"grill": (1.0, 0.45, 0.15), "pass": (1.0, 0.7, 0.45)}
    for l in LIGHTS:
        ld = bpy.data.lights.new("L_" + l["kind"], "SPOT" if l["kind"] in ("hood", "down") else "POINT")
        ld.energy = E[l["kind"]]; ld.color = C.get(l["kind"], (1.0, 0.78, 0.55)); ld.shadow_soft_size = 0.15
        if ld.type == "SPOT": ld.spot_size = math.radians(75); ld.spot_blend = 0.6
        lo = bpy.data.objects.new("L_" + l["kind"], ld); col.objects.link(lo); lo.location = l["p"]
    for x in (-3.0, 0.0, 3.0):
        wd = bpy.data.lights.new("L_tiles", "AREA"); wd.energy = 45; wd.size = 2.6; wd.color = (1.0, 0.85, 0.7)
        wo = bpy.data.objects.new("L_tiles", wd); col.objects.link(wo); wo.location = (x, Y1 - 1.0, 2.2); wo.rotation_euler = (math.radians(60), 0, 0)
    fill = bpy.data.lights.new("L_fill", "AREA"); fill.energy = 15; fill.size = 6; fill.color = (0.75, 0.82, 1.0)
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
