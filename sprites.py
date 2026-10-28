"""Original pixel art for Token Hunt. Single source of truth, emitted to JS.

Legend:
  .  transparent
  K  outline            W  paper white        L  paper shade
  C  cyan (stamp/wing)  c  cyan light
  Y  gold (enterprise)  y  gold light
  P  bot purple         p  bot light purple   D  bot eye / mouth
  E  green OK           R  red
"""

PALETTE = {
    "K": "#1a1420", "W": "#f7f4e9", "L": "#cfc9dc",
    "C": "#3cd0ff", "c": "#bdeeff",
    "Y": "#f2c438", "y": "#fff0a0",
    "P": "#8a5cf5", "p": "#c4a9ff", "D": "#1a1420",
    "E": "#39d353", "e": "#a9f0b5", "R": "#ff4d4d",
}

# ------------------------------------------------------------ request packet (24x20)
# winged envelope; wings are overlays so the body stays identical across frames
BODY = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    ".....KKKKKKKKKKKKKK.....",
    ".....KWWWWWWWWWWCCK.....",
    ".....KWLWWWWWWWLCCK.....",
    ".....KWWLWWWWWLWWWK.....",
    ".....KWWWLWWWLWWWWK.....",
    ".....KWWWWLWLWWWWWK.....",
    ".....KWWWWWLWWWWWWK.....",
    ".....KWWWWWWWWWWWWK.....",
    ".....KWWWWWWWWWWWWK.....",
    ".....KKKKKKKKKKKKKK.....",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
]
WING_UP = [
    "...KK..............KK...",
    "..KccK............KccK..",
    "..KcccK..........KcccK..",
    "...KcccK........KcccK...",
    "...KccccK......KccccK...",
    "....KccccK....KccccK....",
    "....KccccK....KccccK....",
    ".....KKKK......KKKK.....",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
]
WING_MID = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "KKKKK..............KKKKK",
    "KcccccK..........KcccccK",
    "KccccccK........KccccccK",
    ".KKKcccK........KcccKKK.",
    "....KKK..........KKK....",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
]
WING_DOWN = [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "....KKKK......KKKK......",
    "....KccccK....KccccK....",
    "...KccccK......KccccK...",
    "...KcccK........KcccK...",
    "..KcccK..........KcccK..",
    "..KccK............KccK..",
    "...KK..............KK...",
    "........................",
    "........................",
]

# served packet (16x23): envelope stamped OK, wings folded, drifting down
FALL = [
    "....KK....KK....",
    "...KccK..KccK...",
    "...KcccKKcccK...",
    "....KKKKKKKK....",
    "...KWWWWWWWWK...",
    "...KWWWWWWWWK...",
    "...KWWWWWWEWK...",
    "...KWWWWWEEWK...",
    "...KWEWWEEWWK...",
    "...KWEEEEWWWK...",
    "...KWWEEWWWWK...",
    "...KWWWWWWWWK...",
    "...KKKKKKKKKK...",
    "....KccK..KcK...",
    "....KcK...KcK...",
    "....KK....KK....",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]

# ------------------------------------------------------------ bot bubble (32x30)
# a chat bubble with a face; tail at bottom-left; rises out of the rack row
BOT = [
    "....KKKKKKKKKKKKKKKKKKKKKKKK....",
    "..KKPPPPPPPPPPPPPPPPPPPPPPPPKK..",
    ".KPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
    ".KPPpppPPPPPPPPPPPPPPPPPPPPPPPK.",
    "KPPpPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
    "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
    "KPPPPPPKKKPPPPPPPPPPPKKKPPPPPPPK",
    "KPPPPPKDDDKPPPPPPPPPKDDDKPPPPPPK",
    "KPPPPPKDWDKPPPPPPPPPKDWDKPPPPPPK",
    "KPPPPPKDDDKPPPPPPPPPKDDDKPPPPPPK",
    "KPPPPPPKKKPPPPPPPPPPPKKKPPPPPPPK",
    "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
    "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
    "KPPPPPPPPPKPPPPPPPPPPKPPPPPPPPPK",
    "KPPPPPPPPPPKKPPPPPPKKPPPPPPPPPPK",
    "KPPPPPPPPPPPPKKKKKKPPPPPPPPPPPPK",
    "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK",
    ".KPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
    ".KPPPPPPPPPPPPPPPPPPPPPPPPPPPPK.",
    "..KKPPPPPPPPPPPPPPPPPPPPPPPPKK..",
    "....KKKKPPPKKKKKKKKKKKKKKKKK....",
    "......KPPPK.....................",
    ".....KPPPK......................",
    "....KPPK........................",
    "....KKK.........................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
]
# happy: eyes become ^ ^, mouth is a wide smile (rows 6-10 and 13-15)
BOT_HAPPY = list(BOT)
BOT_HAPPY[6]  = "KPPPPPPPKPPPPPPPPPPPPPKPPPPPPPPK"
BOT_HAPPY[7]  = "KPPPPPPKDKPPPPPPPPPPPKDKPPPPPPPK"
BOT_HAPPY[8]  = "KPPPPPKDPDKPPPPPPPPPKDPDKPPPPPPK"
BOT_HAPPY[9]  = "KPPPPKDPPPDKPPPPPPPKDPPPDKPPPPPK"
BOT_HAPPY[10] = "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK"
BOT_HAPPY[13] = "KPPPPPPPKPPPPPPPPPPPPPKPPPPPPPPK"
BOT_HAPPY[14] = "KPPPPPPPPKKPPPPPPPPPKKPPPPPPPPPK"
BOT_HAPPY[15] = "KPPPPPPPPPPKKKKKKKKKPPPPPPPPPPPK"
# flat: half-closed eyes, flat mouth
BOT_FLAT = list(BOT)
BOT_FLAT[6]  = "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK"
BOT_FLAT[7]  = "KPPPPPPKKKKPPPPPPPPPKKKKPPPPPPPK"
BOT_FLAT[8]  = "KPPPPPKDDDDKPPPPPPPKDDDDKPPPPPPK"
BOT_FLAT[9]  = "KPPPPPPKKKKPPPPPPPPPKKKKPPPPPPPK"
BOT_FLAT[10] = "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK"
BOT_FLAT[13] = "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK"
BOT_FLAT[14] = "KPPPPPPPPPKKKKKKKKKKKKPPPPPPPPPK"
BOT_FLAT[15] = "KPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPK"

# ------------------------------------------------------------ icons
VRAM = [       # 5x6 memory stick
    "XXXXX",
    "X.X.X",
    "XXXXX",
    "X.X.X",
    "XXXXX",
    ".X.X.",
]

FONT = {
    "A": "010 101 111 101 101", "B": "110 101 110 101 110", "C": "011 100 100 100 011",
    "D": "110 101 101 101 110", "E": "111 100 110 100 111", "F": "111 100 110 100 100",
    "G": "011 100 101 101 011", "H": "101 101 111 101 101", "I": "111 010 010 010 111",
    "J": "001 001 001 101 010", "K": "101 101 110 101 101", "L": "100 100 100 100 111",
    "M": "101 111 111 101 101", "N": "110 101 101 101 101", "O": "010 101 101 101 010",
    "P": "110 101 110 100 100", "Q": "010 101 101 110 011", "R": "110 101 110 101 101",
    "S": "011 100 010 001 110", "T": "111 010 010 010 010", "U": "101 101 101 101 111",
    "V": "101 101 101 101 010", "W": "101 101 111 111 101", "X": "101 101 010 101 101",
    "Y": "101 101 010 010 010", "Z": "111 001 010 100 111",
    "0": "111 101 101 101 111", "1": "010 110 010 010 111", "2": "111 001 111 100 111",
    "3": "111 001 111 001 111", "4": "101 101 111 001 001", "5": "111 100 111 001 111",
    "6": "111 100 111 101 111", "7": "111 001 001 001 001", "8": "111 101 111 101 111",
    "9": "111 101 111 001 111",
    "-": "000 000 111 000 000", ".": "000 000 000 000 010", "!": "010 010 010 000 010",
    ":": "000 010 000 010 000", "/": "001 001 010 100 100", " ": "000 000 000 000 000",
    "'": "010 010 000 000 000", ",": "000 000 000 010 100", "+": "000 010 111 010 000",
    "(": "010 100 100 100 010", ")": "010 001 001 001 010", "%": "101 001 010 100 101",
    "?": "111 001 011 000 010", "#": "101 111 101 111 101", ">": "100 010 001 010 100", "<": "001 010 100 010 001", "=": "000 111 000 111 000",
    "_": "000 000 000 000 111",
}

BIG = {
    "T": "11111 00100 00100 00100 00100 00100 00100",
    "O": "01110 10001 10001 10001 10001 10001 01110",
    "K": "10001 10010 10100 11000 10100 10010 10001",
    "E": "11111 10000 10000 11110 10000 10000 11111",
    "N": "10001 11001 10101 10011 10001 10001 10001",
    "H": "10001 10001 10001 11111 10001 10001 10001",
    "U": "10001 10001 10001 10001 10001 10001 01110",
}


def overlay(base, *layers):
    rows = [list(r) for r in base]
    for layer in layers:
        for y, r in enumerate(layer):
            for x, c in enumerate(r):
                if c != ".":
                    rows[y][x] = c
    return ["".join(r) for r in rows]


def recolor(sprite, mapping):
    return ["".join(mapping.get(c, c) for c in r) for r in sprite]


LO = {"C": "E", "c": "e"}          # open-weight: green stamp, mint wings
HI = {"C": "P", "c": "p"}          # frontier: purple stamp and wings
BAD = {"E": "R"}                   # served hallucination: red mark instead of OK

SPRITES = {
    "req0": overlay(BODY, WING_UP),
    "req1": overlay(BODY, WING_MID),
    "req2": overlay(BODY, WING_DOWN),
    "bot": BOT, "botHappy": BOT_HAPPY, "botFlat": BOT_FLAT,
}
for i in range(3):
    SPRITES[f"lo{i}"] = recolor(SPRITES[f"req{i}"], LO)
    SPRITES[f"hi{i}"] = recolor(SPRITES[f"req{i}"], HI)
SPRITES["loFall"] = recolor(FALL, LO)
SPRITES["hiFall"] = recolor(FALL, HI)
SPRITES["badFall"] = recolor(SPRITES["loFall"], BAD)
ICONS = {"vram": VRAM}


def check():
    for name, s in SPRITES.items():
        w = len(s[0])
        assert all(len(r) == w for r in s), f"{name}: ragged rows"
        bad = {c for r in s for c in r} - set(PALETTE) - {"."}
        assert not bad, f"{name}: unknown chars {bad}"
    for k, v in FONT.items():
        assert len(v.split()) == 5 and all(len(p) == 3 for p in v.split()), k


def to_js():
    import json
    return "\n".join([
        "const PAL=" + json.dumps(PALETTE) + ";",
        "const SPR=" + json.dumps(SPRITES, separators=(",", ":")) + ";",
        "const ICON=" + json.dumps(ICONS, separators=(",", ":")) + ";",
        "const FONT=" + json.dumps(FONT, separators=(",", ":")) + ";",
        "const BIG=" + json.dumps(BIG, separators=(",", ":")) + ";",
    ])


if __name__ == "__main__":
    check()
    print(to_js())
