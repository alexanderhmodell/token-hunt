"""Original pixel art for Fowl Weather. Single source of truth: also emitted to JS.

Legend (shared by every sprite):
  .  transparent
  K  outline / black
  G  bird head green   g  head highlight
  W  white (neck ring, eye)
  B  bird body brown   b  tan (wing, belly)   T  dark brown (tail)
  O  beak / feet orange
  Y  gold (bonus bird) y  gold highlight
  F  fox orange        f  fox cream (cheeks, chest)   N  fox nose / ear tips
  D  fox eye           R  mouth red
"""

PALETTE = {
    "K": "#1a1416",
    "G": "#1e7a3a", "g": "#4cc25e",
    "W": "#f7f4e9",
    "B": "#8c4b2a", "b": "#caa05f", "T": "#5a2e18",
    "O": "#f0b22e",
    "Y": "#f2c438", "y": "#fff0a0",
    "F": "#e8782a", "f": "#ffd9a8", "N": "#2a1e22",
    "D": "#2a1e22", "R": "#c8312e",
}

# ---------------------------------------------------------------- bird (24x20)
BIRD_BASE = [
    "........................",
    ".............KKKKK......",
    "............KGGGGGK.....",
    "...........KGgGGGGGK....",
    "...........KGGGGKGGKKK..",
    "...........KGGGGGGGKOOOK",
    "...........KGGGGGGGKOOK.",
    "............KGGGGGGKK...",
    ".............KWWWWK.....",
    "..........KKKKBBBBK.....",
    ".......KKKBBBBBBBBBKK...",
    "....KKKTBBBBBBBBBBBBBK..",
    "..KKTTTTBBBBBBBBBBBBBbK.",
    ".KTTTTBBBBBBBBBBBBBBbbK.",
    "..KKTTBBBBBBBBBBBBBbbbK.",
    "....KKBBBBBBBBBBBBbbbK..",
    "......KKBBBBBBBBbbbbK...",
    "........KKKbbbbbbKK.....",
    "...........KKKKKK.......",
    "........................",
]

# wing overlays (same 24x20 grid, '.' leaves base pixel)
WING_UP = [
    "....KK..................",
    "...KbbK.................",
    "...KbbbK................",
    "....KbbbK...............",
    "....KbbbbK..............",
    ".....KbbbbK.............",
    ".....KbbbbbK............",
    "......KbbbbbK...........",
    "......KbbbbbbK..........",
    ".......KbbbbbbK.........",
    "........KbbbbbK.........",
    ".........KKKKK..........",
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
    "........................",
    "..KKKKKKKKK.............",
    ".KbbbbbbbbbKK...........",
    ".KbbbbbbbbbbbK..........",
    "..KKKbbbbbbbbK..........",
    ".....KKKKKKKK...........",
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
    ".........KKKKK..........",
    "........KbbbbbK.........",
    ".......KbbbbbbK.........",
    "......KbbbbbbK..........",
    ".....KbbbbbK............",
    "....KbbbbK..............",
    "...KbbbK................",
    "...KbbK.................",
    "....KK..................",
]

# ------------------------------------------------------------ falling bird (16x23)
BIRD_FALL = [
    "...KK......KK...",
    "..KbbK....KbbK..",
    "..KbbbK..KbbbK..",
    "...KbbbKKbbbK...",
    "...KbbbTTbbbK...",
    "....KTBBBBTK....",
    "....KBBBBBBK....",
    "...KBBBBBBBBK...",
    "...KBBBBBBBBK...",
    "...KBBBBBBBBK...",
    "...KBBBBBBBBK...",
    "....KBBBBBBK....",
    "....KBBBBBBK....",
    ".....KWWWWK.....",
    "....KGGGGGGK....",
    "...KGGGGGGGGK...",
    "...KGGKGGKGGK...",
    "...KGGGGGGGGK...",
    "....KGGGGGGK....",
    ".....KGGGGK.....",
    ".....KOOOOK.....",
    "......KOOK......",
    ".......KK.......",
]

# ---------------------------------------------------------------- fox (32x30)
FOX_HEAD = [
    "...KK....................KK.....",
    "..KNNK..................KNNK....",
    "..KNFFK................KFFNK....",
    "..KFFFFK..............KFFFFK....",
    "..KFFFFFK............KFFFFFK....",
    "..KFFFFFFKKKKKKKKKKKKKFFFFFFK...",
    "..KFFFFFFFFFFFFFFFFFFFFFFFFFK...",
    ".KFFFFFFFFFFFFFFFFFFFFFFFFFFFK..",
    ".KFFFFFKKFFFFFFFFFFFFFKKFFFFFK..",
    ".KFFFFKDDKFFFFFFFFFFFKDDKFFFFK..",
    ".KFFFFKDWKFFFFFFFFFFFKDWKFFFFK..",
    ".KFFFFFKKFFFFFFFFFFFFFKKFFFFFK..",
    ".KFFFffffFFFFFFFFFFFFffffFFFFK..",
    ".KFfffffffFFFFFFFFFFfffffffFFK..",
    ".KfffffffffFFFFFFFFfffffffffFK..",
    ".KfffffffffffKNNKfffffffffffK...",
    "..KffffffffffKNNKffffffffffK....",
    "..KfffffffffffKKfffffffffffK....",
    "...KffffffKffffffffKffffffK.....",
    "....KffffffKKKKKKKKffffffK......",
    ".....KKffffffffffffffffKK.......",
    ".......KKKKffffffffKKKK.........",
    "....KKKKFFFKKKKKKKKKFFFKKKK.....",
    "..KKFFFFFFFFKffffffKFFFFFFFFKK..",
    ".KFFFFFFFFFFKffffffKFFFFFFFFFFK.",
    ".KFFFFFFFFFFKffffffKFFFFFFFFFFK.",
    ".KFFFFFFFFFFKffffffKFFFFFFFFFFK.",
    ".KFFFFFFFFFFKffffffKFFFFFFFFFFK.",
    ".KFFFFFFFFFFKffffffKFFFFFFFFFFK.",
    ".KFFFFFFFFFFKffffffKFFFFFFFFFFK.",
]

# laugh: closed happy eyes + open mouth (rows 8-11 and 17-20 differ)
FOX_LAUGH = list(FOX_HEAD)
FOX_LAUGH[8]  = ".KFFFFFFFFFFFFFFFFFFFFFFFFFFFK.."
FOX_LAUGH[9]  = ".KFFFFKFFKFFFFFFFFFFFKFFKFFFFK.."
FOX_LAUGH[10] = ".KFFFFFKKFFFFFFFFFFFFFKKFFFFFK.."
FOX_LAUGH[11] = ".KFFFFFFFFFFFFFFFFFFFFFFFFFFFK.."
FOX_LAUGH[17] = "..KffffffffKKKKKKKKffffffffK...."
FOX_LAUGH[18] = "...KfffffffKRRRRRRKfffffffK....."
FOX_LAUGH[19] = "....KffffffKKRRRRKKffffffK......"
FOX_LAUGH[20] = ".....KKffffffKKKKffffffKK......."

# paw (8x7) raised, holding the bird by the feet
FOX_PAW = [
    "..KKKK..",
    ".KFFFFK.",
    "KFFfFfFK",
    "KFFFFFFK",
    "KFFFFFFK",
    ".KFFFFK.",
    "..KKKK..",
]

# ---------------------------------------------------------------- HUD icons
TALLY_BIRD = [   # 8x6, X = ink
    ".....XX.",
    "....XXXX",
    "XXXXXXX.",
    ".XXXXXX.",
    "..XXXX..",
    "...XX...",
]
SHELL = [        # 3x6
    ".X.",
    "XXX",
    "XXX",
    "XXX",
    "XXX",
    "XXX",
]

# ---------------------------------------------------------------- 3x5 font
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
    "(": "010 100 100 100 010", ")": "010 001 001 001 010",
}


# 5x7 display face, only the letters the title needs
BIG = {
    "F": "11111 10000 10000 11110 10000 10000 10000",
    "O": "01110 10001 10001 10001 10001 10001 01110",
    "W": "10001 10001 10001 10101 10101 11011 10001",
    "L": "10000 10000 10000 10000 10000 10000 11111",
    "E": "11111 10000 10000 11110 10000 10000 11111",
    "A": "01110 10001 10001 11111 10001 10001 10001",
    "T": "11111 00100 00100 00100 00100 00100 00100",
    "H": "10001 10001 10001 11111 10001 10001 10001",
    "R": "11110 10001 10001 11110 10100 10010 10001",
}


def overlay(base, *layers):
    rows = [list(r) for r in base]
    for layer in layers:
        for y, r in enumerate(layer):
            for x, c in enumerate(r):
                if c != ".":
                    rows[y][x] = c
    return ["".join(r) for r in rows]


def mirror(sprite):
    return [r[::-1] for r in sprite]


def recolor(sprite, mapping):
    return ["".join(mapping.get(c, c) for c in r) for r in sprite]


GOLD = {"G": "Y", "g": "y", "B": "Y", "b": "y", "T": "O", "W": "W"}

SPRITES = {
    "bird0": overlay(BIRD_BASE, WING_UP),
    "bird1": overlay(BIRD_BASE, WING_MID),
    "bird2": overlay(BIRD_BASE, WING_DOWN),
    "fall": BIRD_FALL,
    "fox": FOX_HEAD,
    "foxLaugh": FOX_LAUGH,
    "paw": FOX_PAW,
}
SPRITES["gold0"] = recolor(SPRITES["bird0"], GOLD)
SPRITES["gold1"] = recolor(SPRITES["bird1"], GOLD)
SPRITES["gold2"] = recolor(SPRITES["bird2"], GOLD)
SPRITES["goldFall"] = recolor(BIRD_FALL, GOLD)

ICONS = {"tally": TALLY_BIRD, "shell": SHELL}


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
    out = ["const PAL=" + json.dumps(PALETTE) + ";"]
    out.append("const SPR=" + json.dumps(SPRITES, separators=(",", ":")) + ";")
    out.append("const ICON=" + json.dumps(ICONS, separators=(",", ":")) + ";")
    out.append("const FONT=" + json.dumps(FONT, separators=(",", ":")) + ";")
    out.append("const BIG=" + json.dumps(BIG, separators=(",", ":")) + ";")
    return "\n".join(out)


if __name__ == "__main__":
    check()
    print(to_js())
