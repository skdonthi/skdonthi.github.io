"""Generate 1200x630 og:image social cards in the harbor night-chart style.

Usage:
    python3 tools/og_cards.py            # regenerates every card into assets/og/

New post: add a card(...) call at the bottom, run, commit the PNG, and add the
og:meta block to the post's <head> (copy from any existing post).

Fonts (Big Shoulders variable + IBM Plex Mono Medium, both OFL) are downloaded
to tools/fonts/ on first run and cached there (gitignored).

Requires: Pillow >= 8.4 (variable-font axes).
"""
from PIL import Image, ImageDraw, ImageFont
import os
import random
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(REPO, "tools", "fonts")
OUT = os.path.join(REPO, "assets", "og")
os.makedirs(FONTS, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

FONT_URLS = {
    "bigshoulders.ttf": "https://github.com/google/fonts/raw/main/ofl/bigshoulders/BigShoulders%5Bopsz%2Cwght%5D.ttf",
    "plexmono.ttf": "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf",
}
for name, url in FONT_URLS.items():
    path = os.path.join(FONTS, name)
    if not os.path.exists(path):
        print(f"downloading {name} ...")
        urllib.request.urlretrieve(url, path)

W, H = 1200, 630
INK = (7, 18, 25)
FOAM = (233, 241, 239)
MIST = (127, 163, 173)
MIST_DIM = (76, 107, 117)
SIGNAL = (255, 92, 56)
LINE = (94, 156, 171, 46)


def display_font(size, weight=800):
    f = ImageFont.truetype(os.path.join(FONTS, "bigshoulders.ttf"), size)
    f.set_variation_by_axes([weight, 72])  # axes order: wght, opsz
    return f


def mono_font(size):
    return ImageFont.truetype(os.path.join(FONTS, "plexmono.ttf"), size)


def card(slug, eyebrow, title_lines, accent_line_idx=None):
    img = Image.new("RGB", (W, H), INK)
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)

    # chart grid
    for x in range(0, W + 1, 100):
        d.line([(x, 0), (x, H)], fill=LINE, width=1)
    for y in range(0, H + 1, 100):
        d.line([(0, y), (W, y)], fill=LINE, width=1)

    # dotted voyage route with waypoints (deterministic per slug)
    rnd = random.Random(slug)
    pts = []
    x = 640
    y = rnd.randint(360, 470)
    while x < W + 40:
        pts.append((x, y))
        x += rnd.randint(110, 180)
        y = max(140, min(520, y + rnd.randint(-130, 90)))
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        steps = max(1, int(((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5 // 14))
        for i in range(steps):
            if i % 2:
                continue
            fx = x1 + (x2 - x1) * i / steps
            fy = y1 + (y2 - y1) * i / steps
            gx = x1 + (x2 - x1) * min(1, (i + 0.55) / steps)
            gy = y1 + (y2 - y1) * min(1, (i + 0.55) / steps)
            d.line([(fx, fy), (gx, gy)], fill=SIGNAL + (200,), width=3)
    for px, py in pts[:-1]:
        d.ellipse([px - 7, py - 7, px + 7, py + 7], outline=SIGNAL + (230,), width=3)

    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    d = ImageDraw.Draw(img)

    # brand
    brand_f = display_font(44, 800)
    d.text((72, 56), "SK", font=brand_f, fill=FOAM)
    sk_w = d.textlength("SK", font=brand_f)
    d.text((72 + sk_w + 4, 56), "/", font=brand_f, fill=SIGNAL)
    sl_w = d.textlength("/", font=brand_f)
    d.text((72 + sk_w + 8 + sl_w, 56), "DONTHI", font=brand_f, fill=FOAM)

    # eyebrow with signal tick
    ey_f = mono_font(26)
    d.line([(72, 208), (116, 208)], fill=SIGNAL, width=3)
    d.text((132, 194), eyebrow.upper(), font=ey_f, fill=MIST)

    # title
    t_f = display_font(96, 800)
    ty = 248
    for i, line in enumerate(title_lines):
        color = SIGNAL if i == accent_line_idx else FOAM
        d.text((72, ty), line.upper(), font=t_f, fill=color)
        ty += 104

    # footer
    f_f = mono_font(24)
    d.text((72, H - 74), "SKDONTHI.GITHUB.IO", font=f_f, fill=MIST_DIM)
    d.text((W - 72 - d.textlength("53.55°N 9.99°E · HAM", font=f_f), H - 74),
           "53.55°N 9.99°E · HAM", font=f_f, fill=MIST_DIM)

    path = os.path.join(OUT, f"{slug}.png")
    img.save(path, "PNG", optimize=True)
    print(path, os.path.getsize(path) // 1024, "KB")


card("default", "Applied AI Engineer · Hamburg",
     ["Discover. Design.", "Build. Ship."], accent_line_idx=1)
card("building-tv-mcp", "Dispatch · Developer Tools",
     ["Teaching an AI agent", "to hold the remote"])
card("at-sea", "Dispatch · Maritime AI",
     ["AI systems that", "run at sea"])
card("cabin-baby-monitor", "Dispatch · System Design",
     ["A baby monitor", "for cruise cabins"])
card("customer-discovery", "Dispatch · Product Engineering",
     ["Why AI engineers must", "talk to customers"])
card("journey", "Dispatch · Career",
     ["From full-stack", "to agentic AI"])
card("recommendations", "Dispatch · Recommendations",
     ["What colleagues", "say"])
