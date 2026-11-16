"""Generate the 1584x396 LinkedIn banner in the harbor night-chart style.

Usage:
    python3 tools/linkedin_banner.py     # writes tools/linkedin-banner.png

Same palette and fonts as og_cards.py (run that once first to cache the fonts).
All text starts at x=700 (44%): LinkedIn's profile photo covers the left 4-29%
of the banner on desktop and the left 4-40% on mobile.
"""
from PIL import Image, ImageDraw, ImageFont
import os

TOOLS = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(TOOLS, "fonts")

W, H = 1584, 396
TEXT_X = 700
INK = (5, 13, 20)
FOAM = (237, 243, 248)
MIST = (135, 164, 191)
MIST_DIM = (74, 100, 131)
SIGNAL = (255, 107, 53)
LINE = (96, 148, 192, 46)

EYEBROW = "LEAD SOFTWARE ENGINEER · TECH LEAD"
TITLE = ["FULL-STACK PLATFORMS.", "AI AGENTS AT SEA."]
STACK = "JAVA · SPRING BOOT · ANGULAR · REACT · KAFKA · LANGGRAPH"
ROUTE = [(70, 150), (210, 96), (350, 132), (480, 70)]  # upper-left, clear of the photo


def display_font(size, weight=800):
    f = ImageFont.truetype(os.path.join(FONTS, "bigshoulders.ttf"), size)
    f.set_variation_by_axes([weight, 72])  # axes order: wght, opsz
    return f


def mono_font(size):
    return ImageFont.truetype(os.path.join(FONTS, "plexmono.ttf"), size)


img = Image.new("RGB", (W, H), INK)
ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(ov)

for x in range(0, W + 1, 99):
    d.line([(x, 0), (x, H)], fill=LINE, width=1)
for y in range(0, H + 1, 99):
    d.line([(0, y), (W, y)], fill=LINE, width=1)

for (x1, y1), (x2, y2) in zip(ROUTE, ROUTE[1:]):
    steps = int(((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5 // 14)
    for i in range(0, steps, 2):
        a, b = i / steps, min(1, (i + 0.55) / steps)
        d.line([(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a),
                (x1 + (x2 - x1) * b, y1 + (y2 - y1) * b)], fill=SIGNAL + (200,), width=3)
for px, py in ROUTE:
    d.ellipse([px - 7, py - 7, px + 7, py + 7], outline=SIGNAL + (230,), width=3)

img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
d = ImageDraw.Draw(img)

brand_f = display_font(34)
bx = W - 72 - d.textlength("DONTHI.DEV", font=brand_f)
d.text((bx, 40), "DONTHI", font=brand_f, fill=FOAM)
bx += d.textlength("DONTHI", font=brand_f)
d.text((bx, 40), ".", font=brand_f, fill=SIGNAL)
d.text((bx + d.textlength(".", font=brand_f), 40), "DEV", font=brand_f, fill=FOAM)

d.line([(TEXT_X, 106), (TEXT_X + 44, 106)], fill=SIGNAL, width=3)
d.text((TEXT_X + 60, 93), EYEBROW, font=mono_font(22), fill=MIST)

title_f = display_font(88)
for i, line in enumerate(TITLE):
    d.text((TEXT_X, 128 + i * 90), line, font=title_f, fill=SIGNAL if i == 1 else FOAM)

d.text((TEXT_X, 330), STACK, font=mono_font(21), fill=MIST)

# Fail loudly if any text line runs off the right edge.
for x, text, font in [(TEXT_X + 60, EYEBROW, mono_font(22)), (TEXT_X, STACK, mono_font(21))] + [(TEXT_X, t, title_f) for t in TITLE]:
    assert x + d.textlength(text, font=font) < W - 40, f"too wide: {text}"

out = os.path.join(TOOLS, "linkedin-banner.png")
img.save(out, "PNG", optimize=True)
print(out, img.size, os.path.getsize(out) // 1024, "KB")
