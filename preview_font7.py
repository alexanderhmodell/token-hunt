"""Render every FONT7 glyph (6x, 1px letter spacing) and three sample lines (3x) to font7_preview.png so I can eyeball the face."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sprites as S

S.check()
GW, GH, GAP = 5, 7, 1                  # glyph size and the 1px letter spacing (6px advance, as bigText uses)
GLYPH_SCALE, LINE_SCALE = 6, 3
COLS = 21                              # glyphs per grid row
PAD = 16
BG, INK, CELL, DIM = "#14101c", "#f7f4e9", "#332b4d", "#c9d0e4"
SAMPLES = [
    "AS AN AI, I CAN'T HELP WITH THAT.",
    "TWO FRONTIER IN A ROW. SHOW-OFF.",
    "429 RATE LIMITED · 82% · (X3) -500 +1,000",
]
missing = sorted({c for s in SAMPLES for c in s} - set(S.FONT7))
assert not missing, f"sample lines use chars FONT7 lacks: {missing}"


def glyph(d, ch, x, y, sc, col):
    for r, row in enumerate(S.FONT7[ch].split()):
        for c, bit in enumerate(row):
            if bit == "1":
                d.rectangle([x + c * sc, y + r * sc, x + (c + 1) * sc - 1, y + (r + 1) * sc - 1], fill=col)


def line(d, s, x, y, sc, col):
    for ch in s:
        glyph(d, ch, x, y, sc, col)
        x += (GW + GAP) * sc


def line_w(s, sc):
    return len(s) * (GW + GAP) * sc - GAP * sc


try:
    label_font = ImageFont.load_default(size=13)
except TypeError:                      # very old Pillow: no sized default font
    label_font = ImageFont.load_default()

keys = list(S.FONT7)
rows_n = -(-len(keys) // COLS)
adv = (GW + GAP) * GLYPH_SCALE
label_h = 20
row_h = GH * GLYPH_SCALE + label_h + GAP * GLYPH_SCALE * 2
grid_w = COLS * adv - GAP * GLYPH_SCALE
line_h = GH * LINE_SCALE
sample_w = max(line_w(s, LINE_SCALE) for s in SAMPLES)
W = PAD * 2 + max(grid_w, sample_w)
H = PAD * 3 + rows_n * row_h + len(SAMPLES) * (line_h + 14)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
for i, ch in enumerate(keys):
    x = PAD + (i % COLS) * adv
    y = PAD + (i // COLS) * row_h
    d.rectangle([x, y, x + GW * GLYPH_SCALE - 1, y + GH * GLYPH_SCALE - 1], fill=CELL)   # faint 5x7 cell
    glyph(d, ch, x, y, GLYPH_SCALE, INK)
    lab = "SP" if ch == " " else ch
    d.text((x + GW * GLYPH_SCALE / 2, y + GH * GLYPH_SCALE + 3), lab, fill=DIM, font=label_font, anchor="mt")

y = PAD * 2 + rows_n * row_h
for s in SAMPLES:
    line(d, s, PAD, y, LINE_SCALE, INK)
    y += line_h + 14

out = os.path.join(HERE, "font7_preview.png")
img.save(out)
print(out, img.size, f"{len(keys)} glyphs:", "".join(keys))
