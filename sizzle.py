"""Cuts the 40 s sizzle from an SFX-only take of trailer.js (MUSIC=0) plus a music bed from musicbed.js.
Usage: python3 sizzle.py SRC.mp4 BED.wav OUT.mp4 cuts.json
Frame: 1920x1080, the game (1024x960 source) centred at 1152x1080 on the cabinet colour; supers in the game's own 5x7 face.
Every cut lands on the music's beat grid (0.6 s beats from the bed's first bar)."""
import json, re, subprocess, sys, os
from PIL import Image, ImageDraw
SRC, BED, OUT, CUTS = sys.argv[1:5]
TMP = os.path.join(os.path.dirname(OUT) or '.', 'sizzle_tmp'); os.makedirs(TMP, exist_ok=True)
src = open('dist/index.html', encoding='utf-8').read()
F7 = {k: v.split(' ') for k, v in json.loads(re.search(r'const FONT7=(\{.*?\});', src).group(1)).items()}
W, H, GW, GX = 1920, 1080, 1152, 384
CAB = '#0a0a12'
def tw(s, sc): return len(s) * 6 * sc - sc
def t7(d, s, x, y, sc, col, shadow='#000000'):
    for c, off in ((shadow, sc), (col, 0)):
        if c is None: continue
        cx = x
        for ch in s:
            g = F7.get(ch) or F7[' ']
            for r in range(7):
                for k in range(5):
                    if g[r][k] == '1': d.rectangle([cx + k * sc + off, y + r * sc + off, cx + k * sc + off + sc - 1, y + r * sc + off + sc - 1], fill=c)
            cx += 6 * sc
def card(path, lines):  # full-frame card: [(text, scale, colour, y)]
    im = Image.new('RGB', (W, H), CAB); d = ImageDraw.Draw(im); d.rectangle([30, 30, W - 31, H - 31], outline='#262238', width=6)
    for s, sc, col, y in lines: t7(d, s, (W - tw(s, sc)) // 2, y, sc, col)
    im.save(path)
def super_(path, text, col='#ffe98a', sc=7, y=930):  # lower-third super over the footage
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    w = tw(text, sc); x = (W - w) // 2
    d.rectangle([x - 28, y - 22, x + w + 28, y + 7 * sc + 22], fill=(10, 10, 18, 225)); d.rectangle([x - 28, y - 22, x + w + 28, y - 18], fill=col)
    t7(d, text, x, y, sc, col); im.save(path)
def ff(args): subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y'] + args, check=True)
cuts = json.load(open(CUTS))
parts = []
for i, c in enumerate(cuts):
    p = os.path.join(TMP, f'c{i:02d}.mp4'); dur = c['dur']
    if c.get('card'):
        img = os.path.join(TMP, f'card{i:02d}.png'); card(img, c['card'])
        ff(['-loop', '1', '-framerate', '30', '-t', f'{dur:.3f}', '-i', img, '-f', 'lavfi', '-t', f'{dur:.3f}', '-i', 'anullsrc=r=48000:cl=stereo',
            '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-shortest', p])
    else:
        sp = c.get('speed', 1.0); sdur = dur * sp
        x, y, w, h = c.get('crop', [0, 0, 1024, 960])
        fit = f"scale={W}:{H}:flags=neighbor" if c.get('wide') else f"scale={GW}:1080:flags=neighbor,pad={W}:{H}:{GX}:0:color={CAB}"  # wide: a 16:9 crop fills the frame (a punch-in)
        vf = f"crop={w}:{h}:{x}:{y},{fit},setpts=(PTS-STARTPTS)/{sp}"
        inputs = ['-ss', f"{c['at']:.3f}", '-t', f'{sdur:.3f}', '-i', SRC]
        fc = '[0:v]' + vf + '[v0]'
        if c.get('super'):
            sp_img = os.path.join(TMP, f'sup{i:02d}.png'); super_(sp_img, c['super'], c.get('col', '#ffe98a')); inputs += ['-loop', '1', '-i', sp_img]
            fc += ';[v0][1:v]overlay=0:0:shortest=1[v]'
        else: fc += ';[v0]null[v]'
        af = f"atrim=0:{sdur:.3f},asetpts=PTS-STARTPTS" + (f",atempo={sp:.4f}" if abs(sp - 1) > 1e-3 and sp >= 0.5 else '') + f",apad,atrim=0:{dur:.3f}"
        ff(inputs + ['-filter_complex', fc + f';[0:a]{af}[a]', '-map', '[v]', '-map', '[a]', '-t', f'{dur:.3f}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-r', '30', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', p])
    parts.append(p)
lst = os.path.join(TMP, 'list.txt'); open(lst, 'w').write(''.join(f"file '{os.path.abspath(p)}'\n" for p in parts))
cat = os.path.join(TMP, 'cat.mp4'); ff(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', cat])
total = sum(c['dur'] for c in cuts); b0 = float(os.environ.get('BED_START', '4.85'))
ff(['-i', cat, '-ss', f'{b0:.3f}', '-t', f'{total:.3f}', '-i', BED, '-filter_complex',
    f"[1:a]volume=1.0,afade=t=in:st=0:d=0.15,afade=t=out:st={total - 1.6:.3f}:d=1.6[m];[0:a]volume=0.85[s];[m][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89[a]",
    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT])
print('sizzle', OUT, f'{total:.2f} s', len(cuts), 'cuts')
