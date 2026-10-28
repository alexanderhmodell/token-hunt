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

standalone = (
    "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no\">\n"
    "<meta name=\"description\" content=\"Token Hunt: an original 8-bit arcade game. You are a GPU cluster. Serve the requests, survive the load, ignore the chatbot.\">\n"
    "<meta property=\"og:title\" content=\"Token Hunt\">\n"
    "<meta property=\"og:description\" content=\"You are a GPU cluster. Serve the requests, survive the load, ignore the chatbot. 8-bit, one file, zero assets.\">\n"
    "<meta property=\"og:type\" content=\"website\">\n"
    "<meta property=\"og:image\" content=\"og.png\">\n"
    "<meta name=\"twitter:card\" content=\"summary_large_image\">\n"
    "<meta name=\"theme-color\" content=\"#0a0a12\">\n"
    + body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
      .replace("</style>\n", "</style>\n</head>\n<body>\n", 1)
    + "\n</body>\n</html>\n"
)

# IP guard: these strings must never appear in anything we ship
import re
FORBIDDEN = [r"duck\s*hunt", r"nintendo", r"\bnes\b", r"fly\s*away", r"zapper", r"famicom"]
for pat in FORBIDDEN:
    assert not re.search(pat, standalone, re.I), f"forbidden string matches /{pat}/"
os.makedirs(os.path.join(root, "dist"), exist_ok=True)
open(os.path.join(root, "dist", "artifact.html"), "w", encoding="utf-8").write(artifact)
open(os.path.join(root, "dist", "index.html"), "w", encoding="utf-8").write(standalone)
print("artifact.html", len(artifact), "bytes; index.html", len(standalone), "bytes")
