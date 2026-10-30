"""Renders the trailer's closing card (1024x960 PNG) in the game's own 5x7 and title faces: the secret codes.
Usage: python3 endcard.py out.png   (reads the fonts from dist/index.html; run build.py first)"""
import json, re, sys
from PIL import Image, ImageDraw
src = open('dist/index.html', encoding='utf-8').read()
F7 = {k: v.split(' ') for k, v in json.loads(re.search(r'const FONT7=(\{.*?\});', src).group(1)).items()}
BIG = {k: v.split(' ') for k, v in json.loads(re.search(r'const BIG=(\{.*?\});', src).group(1)).items()}
W, H = 1024, 960
img = Image.new('RGB', (W, H), '#0a0a12'); d = ImageDraw.Draw(img)
def glyphs(font, s, sc, adv):
    return len(s) * adv * sc - sc
def draw(font, s, x, y, sc, col, adv, rows, cols, shadow=None):
    for pass_ in ([shadow, col] if shadow else [col]):
        off = sc if (shadow and pass_ is shadow) else 0; cx = x
        for ch in s:
            g = font.get(ch) or font.get(' ')
            if g:
                for r in range(rows):
                    for c in range(cols):
                        if g[r][c] == '1': d.rectangle([cx + c * sc + off, y + r * sc + off, cx + c * sc + off + sc - 1, y + r * sc + off + sc - 1], fill=pass_)
            cx += adv * sc
def t7(s, y, sc, col, x=None, shadow='#1a1420'):
    w = glyphs(F7, s, sc, 6); x = (W - w) // 2 if x is None else x; draw(F7, s, x, y, sc, col, 6, 7, 5, shadow); return w
def big(s, y, sc, col):
    w = glyphs(BIG, s, sc, 6); draw(BIG, s, (W - w) // 2, y, sc, col, 6, 7, 5, '#1a1420')
# frame
d.rectangle([24, 24, W - 25, H - 25], outline='#262238', width=6)
big('TOKEN', 70, 12, '#f7f4e9'); big('HUNT', 170, 12, '#3cd0ff')
t7('SECRET CODES', 290, 6, '#ffe98a')
t7('TYPE ON THE TITLE SCREEN', 352, 3, '#8a8494'); t7('PHONE: TAP THE LOGO 7 TIMES', 382, 3, '#8a8494')
rows = [('DUCK', 'FOWL WEATHER SKIN', '#ffe98a'), ('', 'AGAIN TO SWITCH BACK', None),
        ('FINN', 'FINN FAM MODE: 3X POINTS,', '#c4a9ff'), ('', '5 VRAM, SLOWER REQUESTS', None),
        ('THUMB', 'ONE-HAND MODE: AUTO-AIM,', '#c4a9ff'), ('', 'TAP THE HUD TO FIRE', None),
        ('TOKEN', 'BACK TO TOKEN HUNT', '#c4a9ff')]
y = 448
for code, desc, col in rows:
    if code: t7(code, y, 5, col, x=120)
    t7(desc, y + (8 if code else 2), 3, '#f7f4e9' if code else '#cfc9dc', x=330)
    y += 54 if code else 44
t7('TOKENHUNT-GAME.VERCEL.APP', H - 110, 4, '#3cd0ff')
img.save(sys.argv[1] if len(sys.argv) > 1 else 'endcard.png'); print('end card', img.size)
