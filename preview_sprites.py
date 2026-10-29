"""Render every sprite to one PNG (scaled) on a sky-blue ground so I can eyeball them."""
import os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sprites as S

S.check()
SCALE = 6
GAP = 4
items = list(S.SPRITES.items())
w = sum(len(s[0]) + GAP for _, s in items) + GAP
h = max(len(s) for _, s in items) + GAP * 2
img = Image.new("RGB", (w * SCALE, h * SCALE), "#2a2f4a")
d = ImageDraw.Draw(img)
x = GAP
for name, s in items:
    for y, row in enumerate(s):
        for i, c in enumerate(row):
            if c == ".":
                continue
            col = S.PALETTE[c]
            d.rectangle([(x + i) * SCALE, (GAP + y) * SCALE, (x + i + 1) * SCALE - 1, (GAP + y + 1) * SCALE - 1], fill=col)
    x += len(s[0]) + GAP
out = os.path.join(HERE, "sprites_preview.png")
img.save(out)
print(out, img.size)
