"""Build two outputs from one body:
  dist/artifact.html  — body only (the Artifact tool wraps it in a skeleton)
  dist/index.html     — standalone page for itch.io / Vercel / any static host
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
import sprites as S

S.check()
root = os.path.dirname(os.path.abspath(__file__))
body = open(os.path.join(root, "game_body.html"), encoding="utf-8").read()
assert "/*__SPRITES__*/" in body
body = body.replace("/*__SPRITES__*/", S.to_js())
# the artifact skeleton supplies this meta; standalone needs its own head
artifact = body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '<meta name="claude:viewport-fit-sides" content="cover">\n')

OG = "https://raw.githubusercontent.com/alexanderhmodell/token-hunt/main/dist/og.png"
standalone = (
    "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no\">\n"
    "<meta name=\"description\" content=\"Token Hunt: an original 8-bit arcade game. You are a GPU cluster. Serve the requests, let the fakes go. The hallucinations train on how you play.\">\n"
    "<meta property=\"og:title\" content=\"Token Hunt\">\n"
    "<meta property=\"og:description\" content=\"You are a GPU cluster. Serve the requests, let the fakes go. The hallucinations train on how you play. 8-bit, one file, zero assets.\">\n"
    "<meta property=\"og:type\" content=\"website\">\n"
    # link previews need an absolute image URL; the repo's raw file is stable whatever domain the page is served from
    f"<meta property=\"og:image\" content=\"{OG}\">\n"
    "<meta property=\"og:image:width\" content=\"1200\">\n<meta property=\"og:image:height\" content=\"630\">\n"
    "<meta property=\"og:image:alt\" content=\"Token Hunt: requests fly over GPU racks, a grey ghost tagged FAKE, the chatbot critic heckling.\">\n"
    "<meta name=\"twitter:card\" content=\"summary_large_image\">\n"
    f"<meta name=\"twitter:image\" content=\"{OG}\">\n"
    "<meta name=\"theme-color\" content=\"#0a0a12\">\n"
    # an inline icon: without one the browser asks the server for /favicon.ico, the page's only network request
    "<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' shape-rendering='crispEdges'%3E%3Crect x='1' y='2' width='14' height='10' fill='%238a5cf5'/%3E%3Crect x='3' y='12' width='3' height='2' fill='%238a5cf5'/%3E%3Crect x='4' y='5' width='2' height='3' fill='%23fff'/%3E%3Crect x='10' y='5' width='2' height='3' fill='%23fff'/%3E%3Crect x='5' y='9' width='6' height='1' fill='%231a1420'/%3E%3C/svg%3E\">\n"
    + body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
      .replace("</style>\n", "</style>\n</head>\n<body>\n", 1)
    + "\n</body>\n</html>\n"
)

# IP guard: these strings must never appear in anything we ship
import re
FORBIDDEN = [r"duck\s*hunt", r"nintendo", r"\bnes\b", r"fly\s*away", r"zapper", r"famicom",
             r"nvidia", r"\bdgx\b", r"\bh100\b", r"geforce", r"\brtx\b"]
for pat in FORBIDDEN:
    assert not re.search(pat, standalone, re.I), f"forbidden string matches /{pat}/"
os.makedirs(os.path.join(root, "dist"), exist_ok=True)
open(os.path.join(root, "dist", "artifact.html"), "w", encoding="utf-8").write(artifact)
open(os.path.join(root, "dist", "index.html"), "w", encoding="utf-8").write(standalone)
print("artifact.html", len(artifact), "bytes; index.html", len(standalone), "bytes")
