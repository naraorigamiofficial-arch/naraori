#!/usr/bin/env python3
"""
NARA ORIGAMI ORIGINALS - Origami Design, Episode 03: "What Exactly Is a Flap?"

A single continuous Manim Community Edition scene (1080x1920, 9:16, 30 fps,
~115 s). Every scene of the brief is a method on `Reel03Flaps`; a small
timeline helper (`at`, `until`) pins each animation to the brief's keyframes,
and a caption track burns in subtitles that are generated from the same cue
table that writes the .srt and narration files.

Render (see README.md for the full set of commands):
    manim -r 1080,1920 --fps 30 --disable_caching reel03_flaps.py Reel03Flaps
Export narration + subtitles (no rendering):
    python reel03_flaps.py --export-text

Honesty notes built into the animation
- The only crease pattern shown as foldable is the traditional bird base. Its
  flat-foldability (Kawasaki's theorem at every interior vertex) is checked
  in code below before rendering. No collapse is simulated.
- The humanoid "folded base" and every shaping move are labelled/handled as
  schematic changes of representation, not as physical folding simulations.
- Angles (45 deg, 22.5 deg) are constructed from exact trigonometry and asserted.
"""
from __future__ import annotations

import math
import os
import sys
from pathlib import Path

import numpy as np
from manim import *  # noqa: F401,F403

# --------------------------------------------------------------------------
# Render configuration: portrait 9 x 16 units, 30 fps.
# Quality flags such as -ql give a landscape pixel size; swap it to portrait.
# --------------------------------------------------------------------------
if config.pixel_width > config.pixel_height:
    config.pixel_width, config.pixel_height = config.pixel_height, config.pixel_width
config.frame_width = 9.0
config.frame_height = 16.0
if config.frame_rate > 30:
    config.frame_rate = 30
config.background_color = "#0B0F17"

HERE = Path(__file__).resolve().parent
HERO_IMAGE = Path(os.environ.get("NARA_HERO_IMAGE", HERE.parent.parent / "imgs" / "wkkk.webp"))

# --------------------------------------------------------------------------
# Visual identity (one meaning per colour, used consistently)
# --------------------------------------------------------------------------
BG = "#0B0F17"         # background
PAPER = "#F1E7D5"      # primary paper
PAPER2 = "#B8AD99"     # secondary paper / back layers
CYAN = "#65DCE5"       # mathematical structure: tree, creases, constructions
GOLD = "#F5C66B"       # the active flap
INACTIVE = "#596675"   # inactive structure / guides
HI = "#E9F1FF"         # highlight / emphasis text

PAPER_SH = interpolate_color(ManimColor(PAPER), ManimColor(PAPER2), 0.55)
GOLD_SH = interpolate_color(ManimColor(GOLD), ManimColor("#9C7431"), 0.42)
GOLD_DK = interpolate_color(ManimColor(GOLD), ManimColor("#5A4318"), 0.55)
SOFT = interpolate_color(ManimColor(PAPER2), ManimColor(INACTIVE), 0.35)

FONT = "Inter"
GRID_OPACITY = 0.11

# Layout guards from the brief (essential content inside these)
SAFE_X = 4.0
SAFE_TOP = 6.1
SAFE_BOTTOM = -5.3
CAPTION_Y = -6.15


# --------------------------------------------------------------------------
# Narration (exact lines from the brief) and caption cues
# --------------------------------------------------------------------------
VOICEOVER = [
    ("01", "THE HOOK", 0.0, 5.0,
     "This entire figure begins with something surprisingly simple: flaps."),
    ("02", "WHAT IS A FLAP?", 5.0, 16.0,
     "A flap is a section of the folded base that projects from the rest of the paper, "
     "giving us material we can move and shape."),
    ("03", "WHAT CAN A FLAP BECOME?", 16.0, 26.0,
     "An arm, a leg, a wing, or a tail might all begin as flaps. "
     "But a flap isn't automatically any of those features."),
    ("04", "A CREASE IS NOT A FLAP", 26.0, 37.0,
     "And don't confuse it with a crease. A crease is a line where paper bends. "
     "A flap is a region of paper."),
    ("05", "TREE STRUCTURE", 37.0, 48.0,
     "To plan the structure, designers sometimes use a tree. "
     "Its lines represent lengths and its junctions show connections between parts."),
    ("06", "FROM BRANCH TO FLAP TO ARM", 48.0, 62.0,
     "Look at this arm. In the tree it's a terminal branch. "
     "In the base it's a projecting flap. With shaping, it starts to look like an arm."),
    ("07", "WHERE DOES THE FLAP COME FROM?", 62.0, 73.0,
     "So how do we create one? We organise the sheet into a crease pattern: "
     "the folds that allow a base to collapse."),
    ("08", "BOX PLEATING", 73.0, 83.0,
     "In box pleating, the design is built around a square grid, "
     "with horizontal, vertical and forty-five-degree creases."),
    ("09", "22.5° GEOMETRY", 83.0, 91.0,
     "Another common approach uses twenty-two-and-a-half-degree geometry, "
     "which offers different crease arrangements."),
    ("10", "FLAP MODIFICATIONS", 91.0, 100.0,
     "And after collapsing, we can narrow, bend or spread a flap to give it its final form."),
    ("11", "THE BIG PICTURE", 100.0, 110.0,
     "Remember: the tree describes the structure, the crease pattern organizes the paper, "
     "and the flap is what we shape."),
    ("12", "ENDING / NEXT EPISODE", 110.0, 115.0,
     "Next: how long can a flap actually be?"),
]
TOTAL_DURATION = 115.0

# (start, end, scene id, [lines], {substring: colour})
CUES = [
    (0.4, 4.7, "01", ["This entire figure begins with", "something surprisingly simple: flaps."], {"flaps": GOLD}),
    (5.3, 11.4, "02", ["A flap is a section of the folded base", "that projects from the rest of the paper,"], {"flap": GOLD}),
    (11.4, 15.6, "02", ["giving us material we can", "move and shape."], {}),
    (16.3, 21.4, "03", ["An arm, a leg, a wing, or a tail", "might all begin as flaps."], {"flaps": GOLD}),
    (21.4, 25.7, "03", ["But a flap isn't automatically", "any of those features."], {}),
    (26.3, 28.9, "04", ["And don't confuse it with a crease."], {"crease": CYAN}),
    (28.9, 32.1, "04", ["A crease is a line", "where paper bends."], {"crease": CYAN}),
    (32.1, 36.6, "04", ["A flap is a region of paper."], {"flap": GOLD}),
    (37.3, 41.4, "05", ["To plan the structure, designers", "sometimes use a tree."], {"tree": CYAN}),
    (41.4, 43.4, "05", ["Its lines represent lengths"], {}),
    (43.4, 47.6, "05", ["and its junctions show", "connections between parts."], {}),
    (48.3, 50.4, "06", ["Look at this arm."], {}),
    (50.4, 53.8, "06", ["In the tree it's a", "terminal branch."], {"tree": CYAN}),
    (53.8, 57.4, "06", ["In the base it's a", "projecting flap."], {"flap": GOLD}),
    (57.4, 61.8, "06", ["With shaping, it starts", "to look like an arm."], {}),
    (62.3, 64.5, "07", ["So how do we create one?"], {}),
    (64.5, 68.0, "07", ["We organise the sheet", "into a crease pattern:"], {"crease pattern": CYAN}),
    (68.0, 72.6, "07", ["the folds that allow", "a base to collapse."], {}),
    (73.3, 78.2, "08", ["In box pleating, the design is", "built around a square grid,"], {}),
    (78.2, 82.8, "08", ["with horizontal, vertical and", "forty-five-degree creases."], {}),
    (83.3, 87.0, "09", ["Another common approach uses", "twenty-two-and-a-half-degree"], {}),
    (87.0, 90.8, "09", ["geometry, which offers different", "crease arrangements."], {}),
    (91.3, 96.0, "10", ["And after collapsing, we can", "narrow, bend or spread a flap"], {"flap": GOLD}),
    (96.0, 99.7, "10", ["to give it its final form."], {}),
    (100.3, 103.4, "11", ["Remember: the tree", "describes the structure,"], {"tree": CYAN}),
    (103.4, 106.4, "11", ["the crease pattern", "organizes the paper,"], {"crease pattern": CYAN}),
    (106.4, 109.8, "11", ["and the flap is", "what we shape."], {"flap": GOLD}),
    (110.3, 114.0, "12", ["Next: how long can", "a flap actually be?"], {"flap": GOLD}),
]


def check_cues_match_voiceover():
    """QC: captions must reproduce the voiceover word for word, in order, in time."""
    for sid, _title, t0, t1, line in VOICEOVER:
        cues = [c for c in CUES if c[2] == sid]
        joined = " ".join(" ".join(c[3]) for c in cues)
        assert joined == line, f"Scene {sid} captions differ from voiceover:\n{joined!r}\n{line!r}"
        for c in cues:
            assert t0 <= c[0] < c[1] <= t1, f"Cue outside scene {sid}: {c}"
    for a, b in zip(CUES, CUES[1:]):
        assert a[1] <= b[0] + 1e-9, f"Overlapping cues: {a} / {b}"


# --------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------
def P(x, y=None):
    if y is None:
        x, y = x[0], x[1]
    return np.array([float(x), float(y), 0.0])


class Pl:
    """Placement: maps normalized diagram coordinates to scene coordinates."""

    def __init__(self, s=1.0, off=(0.0, 0.0)):
        self.s = float(s)
        self.off = P(*off)

    def __call__(self, p):
        return self.off + self.s * P(p[0], p[1])

    def pts(self, ps):
        return [self(p) for p in ps]


def lerp_pts(a, b, n):
    a, b = P(a), P(b)
    return [a + (b - a) * k / (n - 1) for k in range(n)]


def mirror_x(ps):
    return [(-p[0], p[1]) for p in ps]


def limb_points(axis, widths):
    A = [np.asarray(p, dtype=float) for p in axis]
    n = len(A)
    L, R = [], []
    for i in range(n):
        if i == 0:
            t = A[1] - A[0]
        elif i == n - 1:
            t = A[-1] - A[-2]
        else:
            t1, t2 = A[i] - A[i - 1], A[i + 1] - A[i]
            t = t1 / np.linalg.norm(t1) + t2 / np.linalg.norm(t2)
        t = t / np.linalg.norm(t)
        nv = np.array([-t[1], t[0], 0.0])
        L.append(A[i] + nv * widths[i] / 2)
        R.append(A[i] - nv * widths[i] / 2)
    return A, L, R


STYLE_PAPER = dict(fill=PAPER, shade=PAPER_SH, stroke=PAPER2, op=1.0, sw=1.4)
STYLE_GOLD = dict(fill=GOLD, shade=GOLD_SH, stroke=GOLD_DK, op=1.0, sw=1.4)
STYLE_MUTED = dict(fill=PAPER2, shade=INACTIVE, stroke=SOFT, op=0.20, sw=1.8)


def make_limb(axis, widths, fill=PAPER, shade=PAPER_SH, stroke=PAPER2, op=1.0, sw=1.4):
    """A flap drawn as two halves split along its ridge (subtle fold shading)."""
    A, L, R = limb_points(axis, widths)
    left = Polygon(*A, *L[-2::-1]).set_fill(fill, op).set_stroke(stroke, sw)
    right = Polygon(*A, *R[-2::-1]).set_fill(shade, op).set_stroke(stroke, sw)
    return VGroup(left, right)


def limb_outline(axis, widths, color=GOLD, width=4):
    A, L, R = limb_points(axis, widths)
    return Polygon(*L[:-1], A[-1], *R[-2::-1]).set_fill(opacity=0).set_stroke(color, width)


def style_limb(limb, style):
    limb[0].set_fill(style["fill"], style["op"]).set_stroke(style["stroke"], style["sw"])
    limb[1].set_fill(style["shade"], style["op"]).set_stroke(style["stroke"], style["sw"])
    return limb


def poly_sector(center, r, a0, a1, n=32):
    c = P(center)
    pts = [c] + [c + r * P(math.cos(a), math.sin(a)) for a in np.linspace(a0, a1, n)]
    return Polygon(*pts)


# --------------------------------------------------------------------------
# Humanoid: tree, schematic base and shaped figure share one coordinate set,
# so the branch -> flap -> arm correspondence is exact.
# --------------------------------------------------------------------------
J1, J2 = (0.0, 1.1), (0.0, -0.7)          # junctions: chest hub, pelvis hub
HEAD, LH, RH = (0.0, 2.5), (-1.75, -0.5), (1.75, -0.5)
LF, RF = (-0.95, -3.0), (0.95, -3.0)

HUM_TREE = {  # name: (from, to). 'torso' is the internal edge.
    "head": (J1, HEAD), "larm": (J1, LH), "rarm": (J1, RH),
    "torso": (J1, J2), "lleg": (J2, LF), "rleg": (J2, RF),
}
TERMINALS = ["head", "larm", "rarm", "lleg", "rleg"]


def hum_specs(kind):
    if kind == "base":
        limbs = {
            "head": (lerp_pts(J1, HEAD, 5), [0.55, 0.41, 0.28, 0.14, 0.0]),
            "larm": (lerp_pts(J1, LH, 4), [0.55, 0.37, 0.18, 0.0]),
            "rarm": (lerp_pts(J1, RH, 4), [0.55, 0.37, 0.18, 0.0]),
            "lleg": (lerp_pts(J2, LF, 4), [0.60, 0.40, 0.20, 0.0]),
            "rleg": (lerp_pts(J2, RF, 4), [0.60, 0.40, 0.20, 0.0]),
        }
        body = [(0, 1.38), (-0.50, 1.35), (-0.42, 0.20), (-0.46, -0.92), (0, -0.95)]
    else:  # shaped (stylized) humanoid
        rarm = [(0.50, 1.14), (1.06, 0.25), (1.22, -0.62), (1.28, -1.02)]
        rleg = [(0.24, -0.72), (0.50, -1.85), (0.62, -2.80), (1.00, -3.02)]
        limbs = {
            "head": ([(0, 1.20), (0, 1.55), (0, 1.90), (0, 2.25), (0, 2.58)],
                     [0.26, 0.24, 0.62, 0.52, 0.0]),
            "larm": (mirror_x(rarm), [0.36, 0.26, 0.20, 0.0]),
            "rarm": (rarm, [0.36, 0.26, 0.20, 0.0]),
            "lleg": (mirror_x(rleg), [0.42, 0.30, 0.24, 0.0]),
            "rleg": (rleg, [0.42, 0.30, 0.24, 0.0]),
        }
        body = [(0, 1.32), (-0.68, 1.26), (-0.36, 0.05), (-0.46, -0.82), (0, -0.90)]
    return limbs, body


def make_humanoid(pl, kind="base", gold=("rarm",), wscale=1.0):
    """Returns (VGroup in draw order, dict of parts). Body is drawn last so it
    covers the flap roots, i.e. the attachment area."""
    limbs, body_half = hum_specs(kind)
    parts = {}
    for k, (axis, w) in limbs.items():
        st = STYLE_GOLD if k in gold else STYLE_PAPER
        parts[k] = make_limb(pl.pts(axis), [x * pl.s * wscale for x in w], **st)
    body_half = [(x * wscale, y) for x, y in body_half]
    bl = pl.pts(body_half)
    br = pl.pts(mirror_x(body_half))
    parts["body"] = VGroup(
        Polygon(*bl).set_fill(PAPER, 1).set_stroke(PAPER2, 1.4),
        Polygon(*br).set_fill(PAPER_SH, 1).set_stroke(PAPER2, 1.4),
    )
    order = ["head", "larm", "rarm", "lleg", "rleg", "body"]
    return VGroup(*[parts[k] for k in order]), parts


def humanoid_outlines(pl, kind="base", color=PAPER, width=2.2, gold=()):
    limbs, body_half = hum_specs(kind)
    outs = {}
    for k, (axis, w) in limbs.items():
        outs[k] = limb_outline(pl.pts(axis), [x * pl.s for x in w],
                               color=GOLD if k in gold else color, width=width)
    bl = pl.pts(body_half)
    br = pl.pts(mirror_x(body_half))
    outs["body"] = Polygon(bl[1], bl[2], bl[3], br[3], br[2], br[1]).set_fill(opacity=0).set_stroke(color, width)
    return outs


def make_tree_graph(pl, edges=HUM_TREE, width=5.0, gold=(), color=CYAN):
    return {k: Line(pl(a), pl(b), stroke_width=width, color=GOLD if k in gold else color)
            for k, (a, b) in edges.items()}


def tree_nodes(pl, junctions, leaves, r=0.09, color=CYAN):
    j = VGroup(*[Dot(pl(p), radius=r, color=color) for p in junctions])
    lv = VGroup(*[Circle(radius=r * 0.75).move_to(pl(p)).set_stroke(color, 3).set_fill(BG, 1) for p in leaves])
    return j, lv


# --------------------------------------------------------------------------
# Traditional bird base: crease pattern, flat-foldability check, folded form
# Paper is the square [-1,1]^2 (side 2).
# --------------------------------------------------------------------------
S2 = 2.0 - math.sqrt(2.0)   # where the 22.5 deg lines meet the midlines
T225 = math.tan(math.radians(22.5))
assert abs(T225 - (math.sqrt(2) - 1)) < 1e-12


def bird_cp_segments():
    first = [((-1, -1), (1, 1)), ((-1, 1), (1, -1)), ((-1, 0), (1, 0)), ((0, -1), (0, 1))]
    extra = [((S2, 0), (0, S2)), ((0, S2), (-S2, 0)), ((-S2, 0), (0, -S2)), ((0, -S2), (S2, 0))]
    for cx, cy in [(1, 1), (-1, 1), (-1, -1), (1, -1)]:
        extra.append(((cx, cy), (cx * S2, 0)))
        extra.append(((cx, cy), (0, cy * S2)))
    return first, extra


# Flap region of the bottom-right corner (the pattern is 4-fold symmetric
# without mountain/valley assignment, so any corner may be chosen).
BIRD_FLAP_REGION = [(S2, 0), (1, 0), (1, -1), (0, -1), (0, -S2)]


def verify_flat_foldable(segments, tol=1e-9):
    """Kawasaki's theorem at every interior vertex (alternate angles sum to pi),
    plus even degree. Returns the list of checked vertices."""
    segs = [(np.array(a, float), np.array(b, float)) for a, b in segments]
    pts = []
    for a, b in segs:
        pts += [a, b]
    for i in range(len(segs)):
        for j in range(i + 1, len(segs)):
            p, r = segs[i][0], segs[i][1] - segs[i][0]
            q, s = segs[j][0], segs[j][1] - segs[j][0]
            den = r[0] * s[1] - r[1] * s[0]
            if abs(den) < 1e-12:
                continue
            t = ((q - p)[0] * s[1] - (q - p)[1] * s[0]) / den
            u = ((q - p)[0] * r[1] - (q - p)[1] * r[0]) / den
            if -tol <= t <= 1 + tol and -tol <= u <= 1 + tol:
                pts.append(p + t * r)
    uniq = []
    for p in pts:
        if not any(np.linalg.norm(p - q) < 1e-7 for q in uniq):
            uniq.append(p)
    checked = []
    for v in uniq:
        if abs(v[0]) > 1 - 1e-7 or abs(v[1]) > 1 - 1e-7:
            continue  # boundary vertex: no condition
        dirs = []
        for a, b in segs:
            ab = b - a
            L = np.linalg.norm(ab)
            cross = (v - a)[0] * ab[1] - (v - a)[1] * ab[0]
            if abs(cross) / L > 1e-7:
                continue
            t = np.dot(v - a, ab) / L ** 2
            if t < -1e-7 or t > 1 + 1e-7:
                continue
            if t > 1e-7:
                dirs.append(math.atan2(*(a - v)[::-1]))
            if t < 1 - 1e-7:
                dirs.append(math.atan2(*(b - v)[::-1]))
        dirs = sorted(d % (2 * math.pi) for d in dirs)
        assert len(dirs) % 2 == 0 and len(dirs) >= 4, f"Bad degree {len(dirs)} at {v}"
        gaps = [(dirs[(k + 1) % len(dirs)] - dirs[k]) % (2 * math.pi) for k in range(len(dirs))]
        alt = sum(gaps[0::2])
        assert abs(alt - math.pi) < 1e-7, f"Kawasaki fails at {v}: {alt}"
        checked.append((tuple(np.round(v[:2], 4)), len(dirs)))
    return checked


_first, _extra = bird_cp_segments()
BIRD_CP_VERTICES = verify_flat_foldable(_first + _extra)  # raises if the CP is invalid

# Folded bird base (front view), derived from the CP with paper side 2:
# total length 2, half-width tan(22.5 deg), hinge line at y = 0.
BB_TOP, BB_BOT = (0.0, 1.0), (0.0, -1.0)
BB_L, BB_R = (-T225, 0.0), (T225, 0.0)


def make_bird_base(pl, gold=True):
    c = (0.0, 0.0)
    ul = Polygon(*pl.pts([c, BB_TOP, BB_L])).set_fill(PAPER, 1).set_stroke(PAPER2, 1.4)
    ur = Polygon(*pl.pts([c, BB_TOP, BB_R])).set_fill(PAPER_SH, 1).set_stroke(PAPER2, 1.4)
    ll = Polygon(*pl.pts([c, BB_BOT, BB_L])).set_fill(PAPER, 1).set_stroke(PAPER2, 1.4)
    lr = Polygon(*pl.pts([c, BB_BOT, BB_R]))
    if gold:
        lr.set_fill(GOLD, 1).set_stroke(GOLD_DK, 1.4)
    else:
        lr.set_fill(PAPER_SH, 1).set_stroke(PAPER2, 1.4)
    return VGroup(ul, ur, ll, lr), lr


def make_crease_pattern(pl, sheet_opacity=0.10, crease_w=2.6, region=True):
    corners = [(-1, -1), (1, -1), (1, 1), (-1, 1)]
    sheet = Polygon(*pl.pts(corners)).set_fill(PAPER, sheet_opacity).set_stroke(PAPER, 3)
    first, extra = bird_cp_segments()
    l1 = VGroup(*[Line(pl(a), pl(b), stroke_width=crease_w, color=CYAN) for a, b in first])
    l2 = VGroup(*[Line(pl(a), pl(b), stroke_width=crease_w, color=CYAN) for a, b in extra])
    reg = Polygon(*pl.pts(BIRD_FLAP_REGION)).set_fill(GOLD, 0.62).set_stroke(GOLD, 3)
    return sheet, l1, l2, reg


def make_paper_square(center, side, opacity=1.0):
    sq = Square(side_length=side).move_to(P(center))
    return sq.set_fill(PAPER, opacity).set_stroke(PAPER2, 2)


# Crane (traditional shaping of the bird base); the gold flap becomes the neck.
CRANE_TREE = {
    "w1": ((0, 0), (math.cos(math.radians(122)), math.sin(math.radians(122)))),
    "w2": ((0, 0), (math.cos(math.radians(58)), math.sin(math.radians(58)))),
    "tail": ((0, 0), (math.cos(math.radians(225)), math.sin(math.radians(225)))),
    "neck": ((0, 0), (math.cos(math.radians(315)), math.sin(math.radians(315)))),
}


def make_crane(pl, gold=True):
    def poly(ps, fill, op=1.0, stroke=PAPER2):
        return Polygon(*pl.pts(ps)).set_fill(fill, op).set_stroke(stroke, 1.4)
    back_wing = poly([(-0.10, 0.10), (0.40, 0.10), (0.62, 1.22)], PAPER2)
    tail = make_limb(pl.pts([(-0.40, -0.06), (-0.80, 0.52), (-1.10, 1.02)]),
                     [w * pl.s for w in (0.24, 0.11, 0.0)], **STYLE_PAPER)
    neck_style = STYLE_GOLD if gold else STYLE_PAPER
    neck = make_limb(pl.pts([(0.40, -0.06), (0.78, 0.52), (1.04, 1.02), (1.26, 0.86)]),
                     [w * pl.s for w in (0.24, 0.11, 0.09, 0.0)], **neck_style)
    body_l = poly([(0, 0.20), (-0.64, 0.02), (0, -0.33)], PAPER)
    body_r = poly([(0, 0.20), (0.64, 0.02), (0, -0.33)], PAPER_SH)
    front_wing = poly([(-0.36, 0.08), (0.24, 0.08), (-0.52, 1.36)], PAPER)
    return VGroup(back_wing, tail, neck, body_l, body_r, front_wing), neck


# --------------------------------------------------------------------------
# Scene 03 contexts: the same flap inside different subjects.
# Local coordinates: flap root at the origin, flap direction FLAP_DIR.
# --------------------------------------------------------------------------
FLAP_ANGLE = math.radians(-65)
FLAP_DIR = np.array([math.cos(FLAP_ANGLE), math.sin(FLAP_ANGLE), 0.0])
FLAP_LEN = 3.3
FLAP_W = [0.55, 0.37, 0.18, 0.0]
MIRROR_DIR = np.array([-FLAP_DIR[0], FLAP_DIR[1], 0.0])


def flap_axis(root, s=1.0, direction=FLAP_DIR, length=FLAP_LEN):
    root = P(root)
    return lerp_pts(root, root + direction * length * s, 4)


def make_flap_schematic(root, s=1.0, style=STYLE_GOLD):
    return make_limb(flap_axis(root, s), [w * s for w in FLAP_W], **style)


def _muted(m, op=0.20):
    return m.set_fill(PAPER2, op).set_stroke(SOFT, 1.8)


def make_context(kind):
    """Muted schematic subject around a flap rooted at the origin."""
    g = VGroup()
    if kind == "arm":
        g.add(make_limb(lerp_pts((-1.3, 0), P(-1.3, 0) + MIRROR_DIR * FLAP_LEN, 4), FLAP_W, **STYLE_MUTED))
        g.add(make_limb(lerp_pts((-0.95, -1.85), (-1.15, -4.55), 4), [0.6, 0.42, 0.22, 0], **STYLE_MUTED))
        g.add(make_limb(lerp_pts((-0.35, -1.85), (-0.15, -4.55), 4), [0.6, 0.42, 0.22, 0], **STYLE_MUTED))
        g.add(_muted(Polygon(P(-1.40, 0.18), P(0.10, 0.18), P(-0.12, -1.95), P(-1.18, -1.95)), 0.28))
        g.add(_muted(Circle(radius=0.46).move_to(P(-0.65, 0.88)), 0.28))
    elif kind in ("leg", "tail"):
        if kind == "leg":   # faces right; flap = front leg at the shoulder
            body_c, head_c, neck = P(-1.55, 0.45), P(0.95, 1.62), [(-0.25, 0.75), (0.25, 0.35), (0.85, 1.40), (0.55, 1.70)]
            legs = [((-0.40, 0.05), -98), ((-2.55, 0.05), -82), ((-2.95, 0.10), -96)]
            leg_len, tail_ax = 3.0, [(-3.20, 0.65), (-3.55, -0.30)]
        else:               # faces left; flap = tail at the rump
            body_c, head_c, neck = P(-1.75, -0.30), P(-3.75, 0.75), [(-3.05, 0.05), (-2.55, -0.05), (-3.30, 0.95), (-3.65, 0.80)]
            legs = [((-0.55, -0.70), -86), ((-0.95, -0.72), -96), ((-2.55, -0.72), -84), ((-2.95, -0.70), -94)]
            leg_len, tail_ax = 2.0, None
        for (x, y), ang in legs:
            d = np.array([math.cos(math.radians(ang)), math.sin(math.radians(ang)), 0])
            g.add(make_limb(lerp_pts((x, y), P(x, y) + d * leg_len, 4), [0.42, 0.30, 0.16, 0], **STYLE_MUTED))
        if tail_ax:
            g.add(make_limb([P(*tail_ax[0]), P(*tail_ax[1])], [0.22, 0], **STYLE_MUTED))
        g.add(_muted(Polygon(*[P(*p) for p in neck]), 0.28))
        g.add(_muted(Ellipse(width=3.5, height=1.30).move_to(body_c), 0.28))
        g.add(_muted(Ellipse(width=0.95, height=0.55).rotate(-0.35 if kind == "leg" else 0.35).move_to(head_c), 0.28))
    elif kind == "wing":    # bird seen from above, wings swept back
        g.add(make_limb(lerp_pts((-1.9, 0), P(-1.9, 0) + MIRROR_DIR * FLAP_LEN, 4), FLAP_W, **STYLE_MUTED))
        g.add(_muted(Polygon(P(-1.25, -1.50), P(-0.65, -1.50), P(-0.95, -2.45)), 0.28))
        g.add(_muted(Ellipse(width=1.25, height=2.40).move_to(P(-0.95, -0.40)), 0.28))
        g.add(_muted(Circle(radius=0.40).move_to(P(-0.95, 1.12)), 0.28))
        g.add(_muted(Polygon(P(-1.07, 1.45), P(-0.83, 1.45), P(-0.95, 1.80)), 0.28))
    return g


def make_wing_surface():
    """The later-shaped wing surface (dashed), distinct from the structural flap."""
    tip = FLAP_DIR * FLAP_LEN
    pts = [P(0, 0), tip, tip + P(-0.55, -0.30), FLAP_DIR * FLAP_LEN * 0.62 + P(-0.95, -0.55),
           P(-0.55, -1.35), P(-0.45, -0.35)]
    surf = Polygon(*pts).set_fill(PAPER, 0.07).set_stroke(PAPER, 2)
    return VGroup(surf.copy().set_stroke(opacity=0), DashedVMobject(surf, num_dashes=46, dashed_ratio=0.55))


def make_flap_example(kind, root, s=1.0):
    ctx = make_context(kind).scale(s, about_point=ORIGIN).shift(P(root))
    extra = VGroup()
    if kind == "wing":
        extra = make_wing_surface().scale(s, about_point=ORIGIN).shift(P(root))
    flap = make_flap_schematic(root, s)
    return ctx, extra, flap


# --------------------------------------------------------------------------
# Text helpers
# --------------------------------------------------------------------------
def txt(s, size=28, color=HI, weight=NORMAL, **kw):
    return Text(s, font=FONT, font_size=size, color=color, weight=weight, **kw)


def kicker(s, y=5.35, color=SOFT):
    return txt(s, size=21, color=color, weight="SEMIBOLD").move_to(P(0, y))


def label_pair(a, b, a_color, b_color=HI, size=40, y=0.0):
    t1 = txt(a, size=size, color=a_color, weight=BOLD)
    t2 = txt(b, size=size, color=b_color, weight="MEDIUM")
    return VGroup(t1, t2).arrange(RIGHT, buff=0.22).move_to(P(0, y))


def make_caption(lines, colors):
    rows = VGroup(*[txt(l, size=31, color=HI, weight="MEDIUM", t2c=colors) for l in lines])
    rows.arrange(DOWN, buff=0.16)
    if rows.width > 7.0:
        rows.scale_to_fit_width(7.0)
    box = RoundedRectangle(corner_radius=0.18, width=rows.width + 0.55, height=rows.height + 0.38)
    box.set_fill(BG, 0.62).set_stroke(width=0)
    g = VGroup(box, rows)
    g.move_to(P(0, CAPTION_Y))
    return g


# --------------------------------------------------------------------------
# Time-driven tracks: camera keyframes and burned-in captions
# --------------------------------------------------------------------------
class CameraTrack:
    def __init__(self):
        self.segs = []

    def move(self, t0, t1, width, center=(0, 0)):
        self.segs.append((t0, t1, float(width), P(*center)))
        self.segs.sort(key=lambda s: s[0])

    def state(self, t):
        w, c = config.frame_width, ORIGIN.copy()
        for t0, t1, w1, c1 in self.segs:
            if t >= t1:
                w, c = w1, c1
            elif t > t0:
                a = smooth((t - t0) / (t1 - t0))
                w, c = w + (w1 - w) * a, c + (c1 - c) * a
                break
            else:
                break
        return w, c


class CaptionTrack:
    FADE = 0.18

    def __init__(self, scene, cues):
        self.scene = scene
        self.cues = [(s, e, make_caption(lines, cols)) for s, e, _sid, lines, cols in cues]
        self.holder = VGroup()
        self.holder.z_index = 100
        self.holder.add_updater(self.update)

    def update(self, m, dt):
        t = self.scene.renderer.time
        frame = self.scene.camera.frame
        k = frame.width / config.frame_width
        new = []
        for s, e, mob in self.cues:
            if s <= t < e:
                a = max(0.0, min(1.0, (t - s) / self.FADE, (e - t) / self.FADE))
                c = mob.copy()
                c[0].set_fill(BG, 0.62 * a)
                c[1].set_opacity(a)
                c.scale(k, about_point=ORIGIN).shift(frame.get_center())
                new.append(c)
                break
        m.submobjects = new


# --------------------------------------------------------------------------
# The reel
# --------------------------------------------------------------------------
class Reel03Flaps(MovingCameraScene):

    # The camera is driven by a time-based track and the caption holder swaps
    # its children every frame, so nothing may be baked into a static
    # background: hand the renderer top-level mobjects and let it re-extract
    # live families on every frame.
    def get_moving_and_static_mobjects(self, animations):
        return list_update(self.mobjects, self.foreground_mobjects), []

    # ---------- timeline helpers ----------
    def now(self):
        return self.renderer.time

    def until(self, t):
        d = t - self.now()
        if d > 0.5 / config.frame_rate:
            self.wait(d)

    def at(self, t0, t1, *anims, **kw):
        """Play `anims` so they start at t0 and finish at t1 (seconds)."""
        self.until(t0)
        d = t1 - self.now()
        if d < 1.0 / config.frame_rate:
            print(f"[timeline] behind schedule at {t0:.2f}-{t1:.2f} (now {self.now():.2f})")
            d = 1.0 / config.frame_rate
        self.play(*anims, run_time=d, **kw)

    def stage_fadeout(self, keep=()):
        keep_ids = {id(m) for m in keep} | {id(m) for m in self.persistent}
        return [FadeOut(m) for m in self.mobjects if id(m) not in keep_ids]

    # ---------- construct ----------
    def construct(self):
        check_cues_match_voiceover()
        self.cam = CameraTrack()
        self.register_camera_moves()
        frame = self.camera.frame

        driver = VMobject()

        def drive(m, dt):
            w, c = self.cam.state(self.now())
            frame.set(width=w)
            frame.move_to(c)
        driver.add_updater(drive)

        self.bg_grid = self.make_background_grid()
        self.captions = CaptionTrack(self, CUES)
        self.add(driver, self.bg_grid)
        self.add_foreground_mobject(self.captions.holder)
        self.persistent = [driver, self.bg_grid, self.captions.holder]

        self.scene01_hook()
        self.scene02_what_is_a_flap()
        self.scene03_what_can_it_become()
        self.scene04_crease_vs_flap()
        self.scene05_tree()
        self.scene06_branch_flap_arm()
        self.scene07_crease_pattern()
        self.scene08_box_pleating()
        self.scene09_22_5()
        self.scene10_modifications()
        self.scene11_big_picture()
        self.scene12_outro()
        self.until(TOTAL_DURATION)

    def register_camera_moves(self):
        W = config.frame_width
        self.cam.move(0.5, 4.6, W * 0.94, (0, 0.15))      # S01 controlled push-in
        self.cam.move(4.7, 5.4, W, (0, 0))
        arm_mid = (TREE_PL(J1) + TREE_PL(RH)) / 2
        self.cam.move(52.5, 53.8, W * 0.88, (arm_mid[0] * 0.45, arm_mid[1] * 0.45))  # S06 push
        self.cam.move(59.3, 60.2, W, (0, 0))
        self.cam.move(83.3, 84.3, W / 1.2, (-0.25, -0.35))  # S09 zoom to the vertex
        self.cam.move(90.4, 91.2, W, (0, 0))

    def make_background_grid(self):
        g = VGroup()
        for x in np.arange(-6, 6.01, 1.0):
            g.add(Line(P(x, -10), P(x, 10)))
        for y in np.arange(-10, 10.01, 1.0):
            g.add(Line(P(-6, y), P(6, y)))
        g.set_stroke(INACTIVE, 1.2, opacity=0)
        g.z_index = -10
        return g

    # ======================================================================
    # SCENE 01 - THE HOOK (0-5 s)
    # ======================================================================
    def scene01_hook(self):
        H, C = 9.2, P(0, 0.25)

        def ip(u, v):   # normalized image coords (u right, v down) -> scene
            return C + P((u - 0.5) * H, (0.5 - v) * H)

        hero = None
        if HERO_IMAGE.exists():
            from PIL import Image
            im = Image.open(HERO_IMAGE).convert("RGBA")
            im.thumbnail((1400, 1400))
            hero = ImageMobject(np.array(im)).set(height=H).move_to(C)
        else:  # original vector fallback, never a fabricated photo
            hero = make_humanoid(Pl(1.45, (0, 0.6)), "shaped", gold=())[0].set_opacity(0.6)
        hero.z_index = -5

        n = {"J1": ip(0.515, 0.335), "J2": ip(0.505, 0.69), "HEAD": ip(0.545, 0.20),
             "LH": ip(0.29, 0.585), "RH": ip(0.695, 0.635), "LF": ip(0.375, 0.93), "RF": ip(0.675, 0.945)}
        if not HERO_IMAGE.exists():
            pl = Pl(1.45, (0, 0.6))
            n = {"J1": pl(J1), "J2": pl(J2), "HEAD": pl(HEAD), "LH": pl(LH), "RH": pl(RH), "LF": pl(LF), "RF": pl(RF)}
        E = {"head": ("J1", "HEAD"), "torso": ("J1", "J2"), "larm": ("J1", "LH"), "rarm": ("J1", "RH"),
             "lleg": ("J2", "LF"), "rleg": ("J2", "RF")}
        halo = {k: Line(n[a], n[b], stroke_width=13, color=BG).set_stroke(opacity=0.55) for k, (a, b) in E.items()}
        edge = {k: Line(n[a], n[b], stroke_width=5, color=CYAN) for k, (a, b) in E.items()}
        hub = Dot(n["J1"], radius=0.11, color=CYAN)
        hub2 = Dot(n["J2"], radius=0.09, color=CYAN)
        leaves = {k: Circle(radius=0.075).move_to(n[E[k][1]]).set_stroke(CYAN, 3).set_fill(BG, 1)
                  for k in TERMINALS}

        # 0.0 - grid barely visible
        self.at(0.0, 0.5, self.bg_grid.animate.set_stroke(opacity=GRID_OPACITY))
        # 0.5 - first cyan line from the central junction
        self.at(0.5, 1.3, GrowFromCenter(hub),
                *[Create(halo[k]) for k in ("head", "torso")],
                *[Create(edge[k]) for k in ("head", "torso")])
        # 1.3 - branches extend to the extremities
        self.at(1.3, 2.2, FadeIn(hub2),
                *[Create(halo[k]) for k in ("larm", "rarm", "lleg", "rleg")],
                *[Create(edge[k]) for k in ("larm", "rarm", "lleg", "rleg")],
                LaggedStart(*[FadeIn(leaves[k]) for k in TERMINALS], lag_ratio=0.15))
        # 2.2 - the folded figure materialises behind the tree
        self.at(2.2, 3.1, FadeIn(hero))
        self.until(3.1)  # tree stays visible over the figure
        # 4.0 - FLAPS + one branch glows gold
        word = txt("FLAPS", size=118, color=HI, weight=BOLD).move_to(P(0, 5.0))
        self.at(4.0, 4.6, FadeIn(word, shift=DOWN * 0.15),
                edge["rarm"].animate.set_stroke(GOLD, 7), leaves["rarm"].animate.set_stroke(GOLD),
                hero.animate.set_opacity(0.55))
        # 4.7 - transition through the highlighted branch into scene 2
        self.s02_pl = Pl(1.25, (0, 0.5))
        target = Line(self.s02_pl(J1), self.s02_pl(RH), stroke_width=7, color=GOLD)
        self.hook_branch = edge["rarm"]
        others = [hero, word, hub, hub2, *halo.values(), *[edge[k] for k in E if k != "rarm"], *leaves.values()]
        self.at(4.7, 5.3, *[FadeOut(m) for m in others], Transform(self.hook_branch, target))

    # ======================================================================
    # SCENE 02 - WHAT IS A FLAP? (5-16 s)
    # ======================================================================
    def scene02_what_is_a_flap(self):
        pl = self.s02_pl
        base, parts = make_humanoid(pl, "base", gold=())
        arm = parts["rarm"]
        others = VGroup(*[parts[k] for k in ("head", "larm", "lleg", "rleg", "body")])
        self.add(*base)
        base.set_opacity(0)
        self.bring_to_front(self.hook_branch)
        # 5.0 base enters centred
        self.at(5.3, 6.3, base.animate.set_opacity(1))
        self.at(6.3, 6.6, FadeOut(self.hook_branch))
        # 6.5 projection turns gold
        self.at(6.6, 7.5, arm[0].animate.set_fill(GOLD, 1).set_stroke(GOLD_DK),
                arm[1].animate.set_fill(GOLD_SH, 1).set_stroke(GOLD_DK))
        # 8.0 gold contour traces the projection; surroundings dim
        limbs, _ = hum_specs("base")
        outline = limb_outline(pl.pts(limbs["rarm"][0]), [w * pl.s for w in limbs["rarm"][1]], GOLD, 4)
        self.at(8.0, 9.2, Create(outline), others.animate.set_opacity(0.38))
        # 9.5 label
        lab1 = txt("FLAP", size=66, color=GOLD, weight=BOLD).move_to(P(0, 5.05))
        lab2 = txt("A PROJECTING PART OF THE BASE", size=27, color=HI, weight="MEDIUM").move_to(P(0, 4.4))
        self.at(9.5, 10.3, FadeIn(lab1, shift=UP * 0.1), FadeIn(lab2, shift=UP * 0.1))
        # 11.0 schematic pivot about the attachment area
        hinge = Dot(pl(J1), radius=0.08, color=CYAN)
        hinge_lab = txt("schematic pivot", size=19, color=CYAN).next_to(hinge, LEFT, buff=0.95).shift(UP * 0.35)
        flap = VGroup(arm, outline)
        self.add(hinge)
        self.at(10.6, 11.0, FadeIn(hinge), FadeIn(hinge_lab))
        self.bring_to_front(hinge)
        self.at(11.0, 12.5, Rotate(flap, angle=math.radians(26), about_point=pl(J1)))
        # 13.0 returns to its original position
        self.at(13.0, 14.3, Rotate(flap, angle=math.radians(-26), about_point=pl(J1)))
        # 14.5 other parts fade out
        self.at(14.5, 15.3, *[FadeOut(m) for m in others], FadeOut(lab1), FadeOut(lab2), FadeOut(hinge), FadeOut(hinge_lab))
        # 16.0 the active flap travels into the next scene
        self.s03_root = P(0.5, 1.7)
        new = make_flap_schematic(self.s03_root)
        self.at(15.3, 16.3, Transform(arm, new), FadeOut(outline))
        self.s03_flap = arm

    # ======================================================================
    # SCENE 03 - WHAT CAN A FLAP BECOME? (16-26 s)
    # ======================================================================
    def scene03_what_can_it_become(self):
        R = self.s03_root
        flap = self.s03_flap
        lab_pos = R + FLAP_DIR * FLAP_LEN * 0.55 + P(1.25, 0.35)
        specs = [("arm", "ARM", 17.0, 17.9), ("leg", "LEG", 19.3, 20.1),
                 ("wing", "WING", 21.1, 21.9), ("tail", "TAIL", 23.0, 23.8)]
        ctx_prev, extra_prev, lab_prev = None, None, None
        note = None
        for kind, name, t0, t1 in specs:
            ctx, extra, _ = make_flap_example(kind, R)
            for m in (ctx, extra):
                m.z_index = -1
            lab = txt(name, size=36, color=GOLD, weight=BOLD).move_to(lab_pos)
            anims = [FadeIn(ctx), FadeIn(lab, shift=UP * 0.1)]
            if kind == "wing":
                anims.append(FadeIn(extra))
                note = VGroup(
                    txt("gold = structural flap", size=19, color=GOLD),
                    txt("dashed = surface shaped later", size=19, color=PAPER),
                ).arrange(DOWN, buff=0.1, aligned_edge=LEFT).move_to(P(1.55, 3.55))
                anims.append(FadeIn(note))
            if ctx_prev is not None:
                anims += [FadeOut(ctx_prev), FadeOut(lab_prev, shift=UP * 0.1)]
                if len(extra_prev):
                    anims.append(FadeOut(extra_prev))
                if kind == "tail" and note is not None:
                    anims.append(FadeOut(note))
            self.at(t0, t1, *anims)
            self.bring_to_front(flap)
            ctx_prev, extra_prev, lab_prev = ctx, extra, lab
        # 24.2 - all four together (same flap, four futures)
        cells = {"arm": (-2.05, 2.45), "leg": (2.05, 2.45), "wing": (-2.05, -1.95), "tail": (2.05, -1.95)}
        minis, mini_flaps = VGroup(), []
        s = 0.47
        for kind, name, *_ in specs:
            ctx, extra, mflap = make_flap_example(kind, (0, 0), s)
            grp = VGroup(ctx, extra, mflap)
            shift = P(*cells[kind]) - grp.get_center()
            grp.shift(shift)
            lab = txt(name, size=26, color=GOLD, weight=BOLD).next_to(grp, DOWN, buff=0.18)
            minis.add(VGroup(ctx, extra, lab))
            mini_flaps.append(mflap)
        self.at(24.2, 24.95, FadeOut(ctx_prev), FadeOut(lab_prev), FadeOut(flap),
                FadeIn(minis), *[FadeIn(f) for f in mini_flaps])
        # 26.0 - back to one isolated flap: four features, one structural idea
        iso = make_flap_schematic(P(-0.75, 1.9))
        self.at(25.2, 26.0, FadeOut(minis), *[Transform(f, iso.copy()) for f in mini_flaps])
        self.s04_iso = VGroup(*mini_flaps)

    # ======================================================================
    # SCENE 04 - A CREASE IS NOT A FLAP (26-37 s)
    # ======================================================================
    def scene04_crease_vs_flap(self):
        sq_c, side = P(0, 3.05), 3.5
        sq = make_paper_square(sq_c, side)
        bl, tr = sq_c + P(-side / 2, -side / 2), sq_c + P(side / 2, side / 2)
        crease_halo = Line(bl, tr, stroke_width=11, color=BG).set_stroke(opacity=0.85)
        crease = Line(bl, tr, stroke_width=5, color=CYAN)
        divider = Line(P(-3.6, 0.3), P(3.6, 0.3), stroke_width=1.5, color=INACTIVE)
        up_lab = label_pair("CREASE", "= LINE", CYAN, size=38, y=0.85)
        pl = Pl(0.68, (0, -2.3))
        base, parts = make_humanoid(pl, "base", gold=())
        lo_lab = label_pair("FLAP", "= REGION", GOLD, size=38, y=-4.88)
        lo_note = txt("folded base (schematic)", size=19, color=SOFT).move_to(P(2.75, -0.75))

        # 26.0 unfolded square appears
        self.at(26.0, 26.9, *[FadeOut(m, shift=DOWN * 0.3) for m in self.s04_iso], FadeIn(sq), FadeIn(divider))
        # 27.3 cyan crease traced
        self.at(27.3, 28.6, Create(crease_halo), Create(crease))
        # 29.0 upper label
        self.at(29.0, 29.7, FadeIn(up_lab, shift=UP * 0.1))
        # 30.2 lower folded-base diagram enters
        self.at(30.2, 31.2, FadeIn(base, shift=UP * 0.15), FadeIn(lo_note))
        # 31.7 gold flap region fills
        arm = parts["rarm"]
        self.at(31.7, 32.6, arm[0].animate.set_fill(GOLD, 1).set_stroke(GOLD_DK),
                arm[1].animate.set_fill(GOLD_SH, 1).set_stroke(GOLD_DK),
                VGroup(*[parts[k] for k in ("head", "larm", "lleg", "rleg", "body")]).animate.set_opacity(0.5))
        # 33.0 lower label
        self.at(33.0, 33.7, FadeIn(lo_lab, shift=UP * 0.1))
        # 34.8 labels fade - only the cyan line and the gold region remain
        self.at(34.8, 35.5, FadeOut(up_lab), FadeOut(lo_lab), FadeOut(lo_note))
        # 37.0 both diagrams transition out
        self.at(36.3, 37.1, *self.stage_fadeout())

    # ======================================================================
    # SCENE 05 - TREE STRUCTURE (37-48 s)
    # ======================================================================
    def scene05_tree(self):
        pl = TREE_PL
        outl = humanoid_outlines(pl, "shaped", color=PAPER, width=2.2)
        sil = VGroup(*[outl[k] for k in ("head", "larm", "rarm", "lleg", "rleg", "body")])
        edges = make_tree_graph(pl)
        junc, leaves = tree_nodes(pl, [J1, J2], [HEAD, LH, RH, LF, RF])
        kick = kicker("TREE STRUCTURE")
        # 37.0 silhouette appears
        self.at(37.0, 38.5, Create(sil, lag_ratio=0.1), FadeIn(kick))
        # 39.0 tree lines draw over it, top to bottom
        order = ["head", "larm", "rarm", "torso", "lleg", "rleg"]
        lines = {}
        for k in order:
            a, b = HUM_TREE[k]
            lines[k] = Line(pl(b), pl(a), stroke_width=5, color=CYAN) if k == "head" else edges[k]
        self.at(39.0, 40.4, LaggedStart(*[Create(lines[k]) for k in order], lag_ratio=0.35))
        # 40.5 silhouette fades
        self.at(40.5, 41.4, FadeOut(sil))
        # 42.0 junction points appear
        jlab = txt("junction", size=21, color=CYAN).move_to(pl(J1) + P(-1.05, 0.42))
        self.at(42.0, 42.8, LaggedStart(*[GrowFromCenter(d) for d in junc], lag_ratio=0.3),
                FadeIn(leaves), FadeIn(jlab))
        # 43.5 terminal branches highlight one at a time; internal edge stays cyan
        lab_t = txt("TERMINAL BRANCHES → FLAPS", size=25, color=GOLD, weight="SEMIBOLD").move_to(P(0, -4.35))
        lab_i = txt("INTERNAL EDGE → CONNECTION", size=25, color=CYAN, weight="SEMIBOLD").move_to(P(0, -4.88))
        self.at(43.4, 43.8, FadeIn(lab_t), FadeIn(lab_i))
        seq = ["head", "larm", "lleg", "rleg"]
        t = 43.8
        for k in seq:
            self.at(t, t + 0.25, lines[k].animate.set_stroke(GOLD, 7))
            self.at(t + 0.25, t + 0.5, lines[k].animate.set_stroke(CYAN, 5))
            t += 0.5
        # 46.0 one arm branch remains gold
        rarm_leaf = leaves[2]
        self.at(45.8, 46.4, lines["rarm"].animate.set_stroke(GOLD, 7), rarm_leaf.animate.set_stroke(GOLD))
        self.at(47.2, 47.9, FadeOut(lab_t), FadeOut(lab_i), FadeOut(jlab), FadeOut(kick))
        self.tree = dict(lines=lines, junc=junc, leaves=leaves)

    # ======================================================================
    # SCENE 06 - FROM BRANCH TO FLAP TO ARM (48-62 s)
    # ======================================================================
    def scene06_branch_flap_arm(self):
        pl = TREE_PL
        lines, junc, leaves = self.tree["lines"], self.tree["junc"], self.tree["leaves"]
        gold_line = lines["rarm"]
        kick_a = kicker("A · TREE BRANCH", y=5.2, color=CYAN)
        self.at(48.0, 48.6, FadeIn(kick_a))
        # 49.2 gold branch pulses once
        self.at(49.2, 50.0, gold_line.animate(rate_func=there_and_back).set_stroke(width=13),
                leaves[2].animate(rate_func=there_and_back).scale(1.6))
        # 51.0 unrelated branches dim
        unrelated = VGroup(*[lines[k] for k in lines if k != "rarm"], junc,
                           *[leaves[i] for i in range(5) if i != 2])
        self.at(51.0, 51.8, unrelated.animate.set_opacity(0.35))
        # 52.5 camera moves slightly closer (CameraTrack)
        # 54.0 representation change: each branch widens into its region of the base.
        # The flaps start as zero-width copies lying exactly on the branches.
        base, parts = make_humanoid(pl, "base", gold=("rarm",))
        thin, tparts = make_humanoid(pl, "base", gold=("rarm",), wscale=0.02)
        for k, part in tparts.items():
            if k == "rarm":
                part.set_stroke(GOLD, 7)
            else:
                part.set_stroke(CYAN, 5, opacity=0.35).set_fill(opacity=0.35)
        dim_parts = VGroup(*[parts[k] for k in ("head", "larm", "lleg", "rleg", "body")])
        dim_parts.set_opacity(0.6)
        kick_b = kicker("B \u00b7 FOLDED BASE (SCHEMATIC)", y=5.2, color=GOLD)
        self.remove(*lines.values())
        self.add(*thin)
        self.add(*leaves, *junc)
        self.at(54.0, 55.6, *[Transform(tparts[k], parts[k]) for k in tparts],
                FadeOut(junc), FadeOut(leaves), Succession(FadeOut(kick_a), FadeIn(kick_b)))
        parts = tparts  # the on-screen mobjects from here on
        # 56.0 gold flap highlighted; the rest of the base is supporting structure
        limbs, _ = hum_specs("base")
        trace = limb_outline(pl.pts(limbs["rarm"][0]), [w * pl.s for w in limbs["rarm"][1]], GOLD, 5)
        self.at(56.0, 56.8, Create(trace))
        self.at(56.8, 57.4, FadeOut(trace))
        # 58.0 controlled schematic shaping
        shaped, sparts = make_humanoid(pl, "shaped", gold=("rarm",))
        for k in ("head", "larm", "lleg", "rleg", "body"):
            sparts[k].set_opacity(0.6)
        kick_c = kicker("C · SHAPED MODEL", y=5.2, color=PAPER)
        self.at(57.6, 59.3, *[Transform(parts[k], sparts[k]) for k in parts],
                Succession(FadeOut(kick_b), FadeIn(kick_c)))
        # 60.0 the arm form is clear; 61.0 three-stage comparison
        xs, ss, yc = (-2.8, 0.0, 2.8), 0.64, 0.75
        pls = [Pl(ss, (x, yc)) for x in xs]
        m_tree = make_tree_graph(pls[0], width=3.5, gold=("rarm",))
        mj, ml = tree_nodes(pls[0], [J1, J2], [HEAD, LH, RH, LF, RF], r=0.06)
        ml[2].set_stroke(GOLD)
        m_tree_g = VGroup(*m_tree.values(), mj, ml)
        m_base = make_humanoid(pls[1], "base", gold=("rarm",))[0]
        m_shaped, msp = make_humanoid(pls[2], "shaped", gold=("rarm",))
        for k in ("head", "larm", "lleg", "rleg", "body"):
            msp[k].set_opacity(0.6)
        m_base_parts = m_base
        for i in range(6):
            if i != 2:
                m_base_parts[i].set_opacity(0.6)
        labs = VGroup(txt("TREE BRANCH", size=24, color=CYAN, weight="SEMIBOLD"),
                      txt("FLAP", size=24, color=GOLD, weight="SEMIBOLD"),
                      txt("SHAPED ARM", size=24, color=PAPER, weight="SEMIBOLD"))
        for lab, x in zip(labs, xs):
            lab.move_to(P(x, -1.85))
        arrows = VGroup(*[Arrow(labs[i].get_right() + RIGHT * 0.12, labs[i + 1].get_left() + LEFT * 0.12, buff=0,
                                stroke_width=3, color=GOLD, tip_length=0.16, max_tip_length_to_length_ratio=0.5)
                          for i in range(2)])
        self.at(59.3, 60.4, Transform(VGroup(*parts.values()), m_shaped),
                FadeIn(m_tree_g), FadeIn(m_base), FadeOut(kick_c))
        self.at(60.4, 61.1, LaggedStart(*[FadeIn(l, shift=UP * 0.1) for l in labs], lag_ratio=0.3),
                *[GrowArrow(a) for a in arrows])
        self.until(61.7)
        self.at(61.7, 62.3, *self.stage_fadeout())

    # ======================================================================
    # SCENE 07 - WHERE DOES THE FLAP COME FROM? (62-73 s)
    # ======================================================================
    def scene07_crease_pattern(self):
        pl = Pl(2.8, (0, 0.75))
        sheet, l1, l2, region = make_crease_pattern(pl)
        sheet.set_fill(PAPER, 1.0)
        kick = kicker("TRADITIONAL BIRD BASE", y=4.65)
        # 62.0 blank square (overhead technical view); background grid steps back
        self.at(62.3, 63.2, FadeIn(sheet), self.bg_grid.animate.set_stroke(opacity=0))
        # 63.5 first creases (sheet switches to a drawing view so lines read clearly)
        self.at(63.5, 64.9, sheet.animate.set_fill(PAPER, 0.10), Create(l1, lag_ratio=0.2), FadeIn(kick))
        # 65.0 additional, geometrically consistent creases
        self.at(65.0, 66.7, Create(l2, lag_ratio=0.12))
        # 67.0 one flap's region
        self.at(67.0, 67.9, FadeIn(region))
        self.bring_to_front(l1, l2)
        # 68.2 diagram shifts left
        cp = VGroup(sheet, region, l1, l2)
        self.at(68.2, 69.0, cp.animate.scale(0.6).move_to(P(-2.15, 0.75)), kick.animate.move_to(P(0, 3.7)))
        # 69.0 folded base on the right
        bpl = Pl(1.65, (2.25, 0.75))
        bb, bb_flap = make_bird_base(bpl)
        title = VGroup(txt("CREASE PATTERN", size=30, color=CYAN, weight=BOLD),
                       txt("→", size=30, color=HI),
                       txt("FOLDED BASE", size=30, color=PAPER, weight=BOLD)).arrange(RIGHT, buff=0.2).move_to(P(0, 4.45))
        self.at(69.0, 69.9, FadeIn(bb, shift=LEFT * 0.2), FadeIn(title))
        # 70.5 connecting arrow; the gold region corresponds to the gold flap
        arrow = Arrow(P(-0.2, 0.75), P(1.3, 0.75), buff=0, stroke_width=4, color=HI, tip_length=0.22)
        note = txt("Creases guide the folding.", size=25, color=PAPER2, slant=ITALIC).move_to(P(0, -1.75))
        self.at(70.5, 71.2, GrowArrow(arrow), FadeIn(note))
        ghost = region.copy().set_stroke(GOLD, 3).set_fill(GOLD, 0.5)
        self.add(ghost)
        self.at(71.2, 72.2, Transform(ghost, bb_flap.copy().set_fill(GOLD, 0.0).set_stroke(GOLD, 4)))
        self.at(72.2, 72.5, FadeOut(ghost))
        # 73.0 transition: the sheet returns centre stage, creases fade
        self.s08_side, self.s08_c = 6.4, P(0, 0.3)
        h = self.s08_side / 2
        target = Polygon(*[self.s08_c + P(x * h, y * h) for x, y in [(-1, -1), (1, -1), (1, 1), (-1, 1)]])
        target.set_fill(PAPER, 0.10).set_stroke(PAPER, 3)
        self.at(72.5, 73.4, FadeOut(VGroup(region, l1, l2, bb, arrow, note, title, kick)),
                Transform(sheet, target))
        self.s08_sheet = sheet

    # ======================================================================
    # SCENE 08 - BOX PLEATING (73-83 s)
    # ======================================================================
    def scene08_box_pleating(self):
        side, c, N = self.s08_side, self.s08_c, 8
        cell = side / N
        o = c + P(-side / 2, -side / 2)

        def g(i, j):
            return o + P(i * cell, j * cell)

        title = VGroup(txt("BOX PLEATING", size=44, color=HI, weight=BOLD),
                       txt("GRID-BASED DESIGN", size=23, color=PAPER2, weight="MEDIUM")).arrange(DOWN, buff=0.14).move_to(P(0, 4.6))
        guides = VGroup(*[Line(g(i, 0), g(i, N)) for i in range(1, N)],
                        *[Line(g(0, j), g(N, j)) for j in range(1, N)]).set_stroke(INACTIVE, 1.6)
        # Hinge creases bounding four 3x3 corner allocations (on grid lines)
        hv = [((3, 0), (3, 3)), ((0, 3), (3, 3)), ((5, 0), (5, 3)), ((5, 3), (8, 3)),
              ((0, 5), (3, 5)), ((3, 5), (3, 8)), ((5, 5), (8, 5)), ((5, 5), (5, 8))]
        hv_lines = VGroup(*[Line(g(*a), g(*b)) for a, b in hv]).set_stroke(CYAN, 3.6)
        # 45-degree crease segments between grid intersections
        diag = [((0, 0), (3, 3)), ((8, 0), (5, 3)), ((0, 8), (3, 5)), ((8, 8), (5, 5))]
        for a, b in diag:
            dx, dy = b[0] - a[0], b[1] - a[1]
            assert abs(abs(dy / dx) - 1.0) < 1e-12  # true 45 degrees
        d_lines = VGroup(*[Line(g(*a), g(*b)) for a, b in diag]).set_stroke(CYAN, 3.6)
        legend = VGroup(
            VGroup(Line(ORIGIN, RIGHT * 0.45).set_stroke(INACTIVE, 2.2), txt("guide grid", size=20, color=PAPER2)).arrange(RIGHT, buff=0.12),
            VGroup(Line(ORIGIN, RIGHT * 0.45).set_stroke(CYAN, 3.6), txt("crease segments", size=20, color=PAPER2)).arrange(RIGHT, buff=0.12),
            VGroup(Square(0.28).set_fill(GOLD, 0.45).set_stroke(GOLD, 2), txt("flap allocation", size=20, color=PAPER2)).arrange(RIGHT, buff=0.12),
        ).arrange(RIGHT, buff=0.38).move_to(P(0, -3.55))
        # 73.0 square (carried over) + title
        self.at(73.3, 74.1, FadeIn(title))
        # 74.2 eight equal divisions
        self.at(74.2, 75.7, LaggedStart(*[Create(l) for l in guides], lag_ratio=0.08), FadeIn(legend[0]))
        # 76.0 selected grid lines illuminate as actual crease segments
        self.at(76.0, 76.9, LaggedStart(*[Create(l) for l in hv_lines], lag_ratio=0.1), FadeIn(legend[1]))
        # 77.2 45-degree crease segments
        self.at(77.2, 78.2, LaggedStart(*[Create(l) for l in d_lines], lag_ratio=0.15))
        # 78.5 precise angle annotation at the corner
        V = g(0, 0)
        ref = Line(V, g(3, 0))
        ang = Angle(ref, Line(V, g(3, 3)), radius=1.05, color=HI, stroke_width=3)
        ang_lab = txt("45°", size=28, color=HI, weight="SEMIBOLD").move_to(V + 1.52 * P(math.cos(PI / 8), math.sin(PI / 8)))
        self.at(78.5, 79.3, Create(ang), FadeIn(ang_lab))
        # 80.0 allocated area for one flap
        region = Polygon(g(0, 0), g(3, 0), g(3, 3), g(0, 3)).set_fill(GOLD, 0.30).set_stroke(GOLD, 3.5)
        region.z_index = -1
        self.at(80.0, 80.9, FadeIn(region), FadeIn(legend[2]))
        self.at(81.0, 81.8, region.animate(rate_func=there_and_back).set_fill(opacity=0.5))
        # 83.0 transition keeping the square boundary
        self.at(82.4, 83.2, FadeOut(VGroup(title, guides, hv_lines, d_lines, legend, ang, ang_lab, region)))

    # ======================================================================
    # SCENE 09 - 22.5 DEGREE GEOMETRY (83-91 s)
    # ======================================================================
    def scene09_22_5(self):
        side, c = self.s08_side, self.s08_c
        V = c + P(-side / 2, -side / 2)
        Wc = c + P(side / 2, -side / 2)
        r45_end = c + P(side / 2, side / 2)
        bis_end = V + P(side, side * math.tan(math.radians(22.5)))
        bis_angle = math.degrees(math.atan2(*(bis_end - V)[1::-1]))
        assert abs(bis_angle - 22.5) < 1e-9, bis_angle
        assert abs(math.degrees(math.atan2(*(r45_end - V)[1::-1])) - 45.0) < 1e-9

        ref = Line(V, Wc, stroke_width=4, color=HI)
        r45 = Line(V, r45_end, stroke_width=4, color=CYAN)
        bis = Line(V, bis_end, stroke_width=4, color=CYAN)
        vdot = Dot(V, radius=0.08, color=HI)
        R = 1.75
        arc45 = Arc(radius=R, start_angle=0, angle=PI / 4, arc_center=V, color=HI, stroke_width=3)
        lab45 = txt("45°", size=30, color=HI, weight="SEMIBOLD").move_to(V + (R + 0.5) * P(math.cos(PI / 8), math.sin(PI / 8)))
        sec1 = poly_sector(V, R, 0, PI / 8).set_fill(CYAN, 0.30).set_stroke(width=0)
        sec2 = poly_sector(V, R, PI / 8, PI / 4).set_fill(HI, 0.20).set_stroke(width=0)
        lab_a = txt("22.5°", size=26, color=CYAN, weight="SEMIBOLD").move_to(V + (R + 0.62) * P(math.cos(PI / 16), math.sin(PI / 16)))
        lab_b = txt("22.5°", size=26, color=HI, weight="SEMIBOLD").move_to(V + (R + 0.62) * P(math.cos(3 * PI / 16), math.sin(3 * PI / 16)))
        eq = txt("45° ÷ 2 = 22.5°", size=48, color=HI, weight=BOLD).move_to(P(-0.25, 4.55))
        # 83.0 clean square remains; camera zooms toward the vertex (CameraTrack)
        # 84.0 horizontal reference ray
        self.at(84.0, 84.8, FadeIn(vdot), Create(ref))
        # 85.0 true 45-degree ray (slope 1)
        self.at(85.0, 85.8, Create(r45))
        # 86.0 angle arc
        self.at(86.0, 86.7, Create(arc45), FadeIn(lab45))
        # 87.0 the bisector divides the angle
        self.at(87.0, 87.9, Create(bis), FadeOut(lab45))
        # 88.0 two equal sections + 22.5 labels
        self.add(sec1, sec2)
        sec1.set_opacity(0)
        sec2.set_opacity(0)
        self.bring_to_front(ref, r45, bis, vdot)
        self.at(88.0, 88.8, sec1.animate.set_fill(CYAN, 0.30), sec2.animate.set_fill(HI, 0.20),
                FadeIn(lab_a), FadeIn(lab_b), FadeIn(eq, shift=DOWN * 0.1))
        # 89.5 conceptual 22.5-degree construction guides (not a crease pattern)
        t = math.tan(math.radians(22.5))
        guides = VGroup(
            DashedLine(V, V + P(side * t, side)),                      # 67.5 deg from V
            DashedLine(Wc, Wc + P(-side, side * t)),                   # 157.5 deg from W
            DashedLine(Wc, Wc + P(-side * t, side)),                   # 112.5 deg from W
            DashedLine(Wc, c + P(-side / 2, side / 2)),                # 135 deg from W
        ).set_stroke(CYAN, 2.2, opacity=0.6)
        gl = VGroup(txt("conceptual construction guides", size=21, color=PAPER2),
                    txt("not a complete crease pattern", size=21, color=SOFT)).arrange(DOWN, buff=0.08).move_to(P(-0.25, -3.75))
        self.at(89.5, 90.3, Create(guides, lag_ratio=0.2), FadeIn(gl))
        # 91.0 fade towards the folded flap; camera restores
        self.at(90.4, 91.2, *self.stage_fadeout(), self.bg_grid.animate.set_stroke(opacity=GRID_OPACITY))

    # ======================================================================
    # SCENE 10 - FLAP MODIFICATIONS (91-100 s)
    # ======================================================================
    def scene10_modifications(self):
        def flap_spec(mode, o=(0, 0), s=1.0):
            ys = np.linspace(-1.35, 3.15, 6)
            axis = [P(0, y) for y in ys]
            w = [1.3, 1.04, 0.78, 0.52, 0.26, 0.0]
            if mode == "narrow":
                w = [1.3, 0.56, 0.42, 0.30, 0.15, 0.0]
            elif mode == "bend":
                j = axis[2]
                ang = math.radians(-42)
                rot = np.array([[math.cos(ang), -math.sin(ang), 0], [math.sin(ang), math.cos(ang), 0], [0, 0, 1]])
                axis = axis[:3] + [j + rot @ (p - j) for p in axis[3:]]
            elif mode == "spread":
                w = [1.3, 1.45, 2.05, 2.35, 1.55, 0.0]
            axis = [P(o) + s * p for p in axis]
            return axis, [x * s for x in w]

        def flap_of(mode, o=(0, 0), s=1.0):
            a, w = flap_spec(mode, o, s)
            return make_limb(a, w, **STYLE_GOLD)

        def ghost_of(o=(0, 0), s=1.0):
            a, w = flap_spec("ref", o, s)
            return DashedVMobject(limb_outline(a, w, PAPER, 2), num_dashes=44).set_stroke(opacity=0.7)

        def block_of(o=(0, 0), s=1.0):
            b = RoundedRectangle(corner_radius=0.12 * s, width=3.2 * s, height=0.95 * s)
            return b.move_to(P(o) + s * P(0, -1.75)).set_fill(INACTIVE, 1).set_stroke(SOFT, 1.5)

        def joint_mark(o=(0, 0), s=1.0):
            a, _ = flap_spec("ref", o, s)
            j = a[2]
            return Line(j + s * P(-0.75, 0.0), j + s * P(0.75, 0.0), stroke_width=3, color=CYAN)

        kick = kicker("SHAPING A FLAP")
        flap = flap_of("ref")
        block = block_of()
        ghost = ghost_of()
        lab_y = -2.85

        def mlabel(s):
            return txt(s, size=36, color=GOLD, weight=BOLD).move_to(P(0, lab_y))

        # 91.0 flap appears (with its attachment)
        self.at(91.2, 91.9, FadeIn(flap, shift=UP * 0.2), FadeIn(block), FadeIn(kick))
        # 92.0 NARROW
        l1 = mlabel("NARROW")
        self.at(92.0, 93.3, FadeIn(ghost), Transform(flap, flap_of("narrow")), FadeIn(l1))
        self.at(93.5, 94.2, Transform(flap, flap_of("ref")), FadeOut(l1))
        # 94.5 BEND at a shaping crease
        l2 = mlabel("BEND")
        jm = joint_mark()
        self.at(94.4, 94.7, Create(jm))
        self.at(94.7, 95.8, Transform(flap, flap_of("bend")), FadeIn(l2))
        self.at(95.8, 96.4, Transform(flap, flap_of("ref")), FadeOut(l2), FadeOut(jm))
        # 96.5 SPREAD
        l3 = mlabel("SPREAD")
        self.at(96.5, 97.7, Transform(flap, flap_of("spread")), FadeIn(l3))
        # 98.0 the three results together, each against the reference outline
        xs, s, yo = (-2.85, 0.0, 2.85), 0.5, 0.95
        minis = VGroup()
        for x, mode, name in zip(xs, ("narrow", "bend", "spread"), ("NARROW", "BEND", "SPREAD")):
            o = (x, yo)
            m = VGroup(block_of(o, s), ghost_of(o, s), flap_of(mode, o, s))
            if mode == "bend":
                m.add(joint_mark(o, s))
            m.add(txt(name, size=27, color=GOLD, weight=BOLD).move_to(P(x, yo - 1.5)))
            minis.add(m)
        self.at(98.0, 98.9, FadeOut(VGroup(flap, block, ghost, l3)), FadeIn(minis, lag_ratio=0.15))
        self.at(99.4, 100.1, *self.stage_fadeout())

    # ======================================================================
    # SCENE 11 - THE BIG PICTURE (100-110 s)
    # ======================================================================
    def scene11_big_picture(self):
        ys = (4.15, 1.55, -1.05, -3.65)
        ix, lx = -1.55, 0.25
        # 1) tree (topology of the bird base: four branches from one hub)
        tpl = Pl(1.08, (ix, ys[0] - 0.05))
        tr = make_tree_graph(tpl, CRANE_TREE, width=4.5, gold=("neck",))
        hub = Dot(tpl((0, 0)), radius=0.08, color=CYAN)
        tips = VGroup(*[Circle(radius=0.06).move_to(tpl(b)).set_stroke(GOLD if k == "neck" else CYAN, 3).set_fill(BG, 1)
                        for k, (a, b) in CRANE_TREE.items()])
        tree_g = VGroup(*tr.values(), hub, tips)
        # 2) crease pattern
        cpl = Pl(1.08, (ix, ys[1]))
        sheet, l1, l2, region = make_crease_pattern(cpl, crease_w=1.8)
        cp_g = VGroup(sheet, region, l1, l2)
        # 3) folded base
        bpl = Pl(1.1, (ix, ys[2]))
        bb, bb_flap = make_bird_base(bpl)
        # 4) shaped figure (crane)
        fpl = Pl(0.95, (ix - 0.1, ys[3] - 0.45))
        crane, neck = make_crane(fpl)

        def row_label(a, b, ca, y):
            return VGroup(txt(a, size=30, color=ca, weight=BOLD), txt(b, size=21, color=PAPER2)).arrange(
                DOWN, buff=0.1, aligned_edge=LEFT).move_to(P(lx, y), aligned_edge=LEFT)
        labs = [row_label("TREE", "describes the structure", CYAN, ys[0]),
                row_label("CREASE PATTERN", "organizes the paper", PAPER, ys[1]),
                row_label("FOLDED BASE", "the flap appears", GOLD, ys[2]),
                row_label("SHAPED FIGURE", "the flap is shaped", GOLD, ys[3])]
        arrows = [Arrow(P(ix, ys[i] - 1.12), P(ix, ys[i + 1] + 1.12), buff=0, stroke_width=3, color=HI,
                        tip_length=0.15, max_tip_length_to_length_ratio=0.5) for i in range(3)]

        def corr(src, dst, t0, t1, *extra):
            """animate_correspondence: a gold ghost travels from one representation to the next."""
            g = src.copy().set_fill(GOLD, 0.0).set_stroke(GOLD, 4)
            self.add(g)
            self.at(t0, t1, Transform(g, dst.copy().set_fill(GOLD, 0.0).set_stroke(GOLD, 4)), *extra)
            self.remove(g)

        # 100.0 tree in cyan
        self.at(100.0, 101.3, Create(VGroup(*tr.values()), lag_ratio=0.2), GrowFromCenter(hub), FadeIn(tips), FadeIn(labs[0]))
        self.at(101.3, 101.9, VGroup(*[tr[k] for k in tr if k != "neck"]).animate(rate_func=there_and_back).set_stroke(width=8))
        # 102.0 crease pattern (ivory sheet)
        self.at(102.0, 103.2, GrowArrow(arrows[0]), FadeIn(sheet), Create(VGroup(l1, l2), lag_ratio=0.03), FadeIn(labs[1]))
        corr(tr["neck"], region, 103.2, 103.9, sheet.animate(rate_func=there_and_back).set_fill(PAPER, 0.45))
        self.add(region)
        region.set_opacity(0)
        self.bring_to_front(l1, l2)
        self.at(103.9, 104.0, region.animate.set_fill(GOLD, 0.62).set_stroke(GOLD, 3, opacity=1))
        # 104.0 folded base; one flap in gold
        self.at(104.0, 105.2, GrowArrow(arrows[1]), FadeIn(bb), FadeIn(labs[2]))
        corr(region, bb_flap, 105.2, 105.9)
        # 106.0 shaped figure; the finished feature in gold
        self.at(106.0, 107.2, GrowArrow(arrows[2]), *[FadeIn(m) for m in crane], FadeIn(labs[3]))
        corr(bb_flap, neck[0], 107.2, 107.9)
        # 108.0 the four-stage relationship together; end on the shaped flap
        golds = [tr["neck"], region, bb_flap, neck]
        self.at(108.0, 109.2, LaggedStart(*[Indicate(g, color=GOLD, scale_factor=1.06) for g in golds], lag_ratio=0.25))
        # 110.0 transition: the shaped flap carries into the outro
        self.s12_flap_axis = lerp_pts((-0.55, -2.45), (-0.55, 2.55), 4)
        self.s12_flap_w = [0.95, 0.63, 0.32, 0.0]
        final = make_limb(self.s12_flap_axis, self.s12_flap_w, **STYLE_GOLD)
        self.add(neck)  # detach from the temporary Indicate group so it survives the fade
        keep = [neck]
        self.at(109.4, 110.3, *self.stage_fadeout(keep=keep), Transform(neck, final))
        self.s12_flap = neck

    # ======================================================================
    # SCENE 12 - ENDING / NEXT EPISODE (110-115 s)
    # ======================================================================
    def scene12_outro(self):
        y0, y1, x = -2.45, 2.55, 0.75
        ext = VGroup(DashedLine(P(-0.05, y0), P(x + 0.25, y0), dash_length=0.08),
                     DashedLine(P(-0.5, y1), P(x + 0.25, y1), dash_length=0.08)).set_stroke(PAPER2, 1.6)
        meas = DoubleArrow(P(x, y0), P(x, y1), buff=0, stroke_width=3.5, color=CYAN, tip_length=0.22,
                           max_tip_length_to_length_ratio=0.1)
        q = txt("?", size=100, color=HI, weight=BOLD).move_to(P(x + 0.85, 0.05))
        nxt = VGroup(txt("NEXT:", size=26, color=CYAN, weight="SEMIBOLD"),
                     txt("FLAP LENGTHS", size=50, color=HI, weight=BOLD)).arrange(DOWN, buff=0.14).move_to(P(0, 4.25))
        brand = VGroup(txt("NARA ORIGAMI ORIGINALS", size=30, color=PAPER, weight="SEMIBOLD"),
                       txt("ORIGAMI DESIGN · EPISODE 03", size=20, color=PAPER2, weight="MEDIUM")).arrange(DOWN, buff=0.16).move_to(P(0, -3.75))
        # 110.0 isolated vertical flap (arrived from scene 11)
        # 111.0 measurement arrow draws
        self.at(111.0, 111.8, Create(ext), GrowFromCenter(meas))
        # 112.0 question mark
        self.at(112.0, 112.5, FadeIn(q, scale=0.8))
        # 113.0 next-episode title
        self.at(112.8, 113.4, FadeIn(nxt, shift=DOWN * 0.1))
        # 114.0 brand (brought forward slightly so it holds on screen)
        self.at(113.4, 113.9, FadeIn(brand, shift=UP * 0.1))
        # 115.0 clean fade to black
        black = Rectangle(width=20, height=30).set_fill("#000000", 1).set_stroke(width=0)
        black.z_index = 200
        black.set_opacity(0)
        self.add(black)
        self.at(114.4, 115.0, black.animate.set_fill(opacity=1))


TREE_PL = Pl(1.3, (0, 0.35))


# --------------------------------------------------------------------------
# Text exports: narration transcript and SRT generated from the same cues
# --------------------------------------------------------------------------
def _srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _mmss(t):
    return f"{int(t // 60):02d}:{t % 60:04.1f}"


def export_text(out_dir: Path):
    check_cues_match_voiceover()
    srt = []
    for i, (s, e, _sid, lines, _c) in enumerate(CUES, 1):
        srt.append(f"{i}\n{_srt_time(s)} --> {_srt_time(e)}\n" + "\n".join(lines) + "\n")
    (out_dir / "reel03_captions.srt").write_text("\n".join(srt), encoding="utf-8")
    nar = ["NARA ORIGAMI ORIGINALS - Origami Design, Episode 03: What Exactly Is a Flap?",
           "Voiceover transcript (exact lines). Times are the picture-locked scene windows.", ""]
    for sid, title, t0, t1, line in VOICEOVER:
        nar.append(f"SCENE {sid} - {title}  [{_mmss(t0)} - {_mmss(t1)}]")
        nar.append(line)
        nar.append("")
    nar.append("Full read:")
    nar.append(" ".join(v[4] for v in VOICEOVER))
    (out_dir / "reel03_narration.txt").write_text("\n".join(nar) + "\n", encoding="utf-8")
    print(f"Wrote {out_dir / 'reel03_captions.srt'} and {out_dir / 'reel03_narration.txt'}")
    print(f"Bird-base crease pattern: Kawasaki verified at {len(BIRD_CP_VERTICES)} interior vertices:")
    for v, d in BIRD_CP_VERTICES:
        print(f"   vertex {v}  degree {d}")


if __name__ == "__main__" and "--export-text" in sys.argv:
    export_text(HERE)
