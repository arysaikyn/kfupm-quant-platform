import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

"""
Wrap a raw 390x844 @2x capture in a phone body.

One rule makes the result correct: **everything is clipped by one silhouette.**
The first version pasted the screen onto the body with a *screen-shaped* mask, so
the screen's corners were less rounded than the frame's inner corners and four
square nubs poked out past the body. Now the body, the status bar and the screen
are all drawn as layers and then multiplied by the same rounded mask, so nothing
can sit outside the phone no matter how the numbers change.

Run after `screenshots.mjs`; reads `docs/screenshots/raw/*.png`.
"""

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs" / "screenshots" / "raw"

# Bump when the images change: GitHub serves repo images through a CDN keyed by
# path, and it kept handing out the previous bytes after a push. A new path is
# the only reliable cache-bust, and it keeps the filenames readable.
VERSION = "v2"
TARGET = ROOT / "docs" / "screenshots" / "phones" / VERSION

SCALE = 2  # captures are 2x

BEZEL = 9  # points of frame around the screen
BODY_RADIUS = 54  # outer corner radius, points
STATUS_H = 44  # device status bar, points
INDICATOR_H = 20  # strip under the screen for the home indicator
SHADOW = 26

BODY = (10, 10, 12, 255)
BODY_EDGE = (52, 52, 58, 255)
CHROME = (10, 10, 12, 255)
INK = (245, 245, 248, 255)


def font(size: int):
    for candidate in (
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ):
        if Path(candidate).exists():
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
    return ImageFont.load_default(size=size)


def rounded_mask(size, radius):
    layer = Image.new("L", size, 0)
    ImageDraw.Draw(layer).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=255)
    return layer


def draw_chrome(size, body_w, status_top, status_h):
    """Status bar: clock on the left, signal, wifi and battery on the right."""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rectangle([BEZEL * SCALE, status_top, body_w - BEZEL * SCALE, status_top + status_h], fill=CHROME)
    d.text(
        (BEZEL * SCALE + 22 * SCALE, status_top + status_h / 2),
        "9:41",
        font=font(17 * SCALE),
        fill=INK,
        anchor="lm",
    )
    right, mid = body_w - BEZEL * SCALE - 20 * SCALE, status_top + status_h / 2
    bar_w, gap = 3 * SCALE, 2 * SCALE
    for index, height in enumerate((4, 6, 8, 10)):
        x = right - 74 * SCALE + index * (bar_w + gap)
        d.rounded_rectangle(
            [x, mid + 5 * SCALE - height * SCALE, x + bar_w, mid + 5 * SCALE],
            bar_w / 2,
            fill=INK,
        )
    cx, cy = right - 42 * SCALE, mid + 5 * SCALE
    for span in (10, 6, 2):
        d.arc(
            [cx - span * SCALE, cy - span * SCALE, cx + span * SCALE, cy + span * SCALE],
            200,
            340,
            fill=INK,
            width=2 * SCALE,
        )
    battery = [right - 22 * SCALE, mid - 5 * SCALE, right, mid + 5 * SCALE]
    d.rounded_rectangle(battery, 2 * SCALE, outline=(230, 230, 236, 210), width=SCALE)
    d.rectangle(
        [battery[0] + SCALE, battery[1] + SCALE, battery[0] + 13 * SCALE, battery[3] - SCALE],
        fill=INK,
    )
    return layer


def wrap(screen: Image.Image) -> Image.Image:
    w, h = screen.size
    body_w = w + 2 * BEZEL * SCALE
    body_h = h + (STATUS_H + INDICATOR_H + 2 * BEZEL) * SCALE
    silhouette = rounded_mask((body_w, body_h), BODY_RADIUS * SCALE)

    body = Image.new("RGBA", (body_w, body_h), (0, 0, 0, 0))
    body.paste(Image.new("RGBA", (body_w, body_h), BODY), (0, 0), silhouette)

    status_top = BEZEL * SCALE
    status_h = STATUS_H * SCALE
    body = Image.alpha_composite(
        body, _clip(draw_chrome(body.size, body_w, status_top, status_h), silhouette)
    )

    # The screen is square-cornered and then clipped by the same silhouette, so
    # its corners can never be less round than the frame's.
    screen_top = status_top + status_h
    body.paste(screen, (BEZEL * SCALE, screen_top))

    # Home indicator, in the strip under the screen, over the frame colour.
    d = ImageDraw.Draw(body)
    ind_w, ind_h = 116 * SCALE, 5 * SCALE
    ind_y = screen_top + h + (INDICATOR_H * SCALE - ind_h) / 2
    d.rounded_rectangle(
        [(body_w - ind_w) / 2, ind_y, (body_w + ind_w) / 2, ind_y + ind_h],
        ind_h / 2,
        fill=(236, 236, 242, 110),
    )

    body.putalpha(Image.composite(body.getchannel("A"), Image.new("L", body.size, 0), silhouette))

    edge = Image.new("RGBA", body.size, (0, 0, 0, 0))
    ImageDraw.Draw(edge).rounded_rectangle(
        [0, 0, body_w - 1, body_h - 1], BODY_RADIUS * SCALE, outline=BODY_EDGE, width=2
    )
    edge.putalpha(Image.composite(edge.getchannel("A"), Image.new("L", body.size, 0), silhouette))
    body = Image.alpha_composite(body, edge)

    pad = SHADOW * SCALE
    canvas = Image.new("RGBA", (body_w + 2 * pad, body_h + 2 * pad), (0, 0, 0, 0))
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    blob = Image.new("RGBA", body.size, (0, 0, 0, 0))
    blob.paste(Image.new("RGBA", body.size, (0, 0, 0, 150)), (0, 0), silhouette)
    shadow.paste(blob, (pad, pad + 6 * SCALE), blob)
    blur = shadow.filter(ImageFilter.GaussianBlur(10 * SCALE))
    # Anything fainter than 8/255 is invisible but still changes the file's
    # bounding box after quantisation, which made the nine images differ by a few
    # pixels at the edges.
    blur.putalpha(blur.getchannel("A").point(lambda a: 0 if a < 8 else a))
    canvas = Image.alpha_composite(canvas, blur)
    canvas.paste(body, (pad, pad), body)
    return canvas


def _clip(layer: Image.Image, mask: Image.Image) -> Image.Image:
    layer.putalpha(Image.composite(layer.getchannel("A"), Image.new("L", layer.size, 0), mask))
    return layer


def main():
    raw = sorted(SOURCE.glob("*.png"))
    if not raw:
        raise SystemExit(f"no raw captures in {SOURCE}")
    TARGET.mkdir(parents=True, exist_ok=True)
    for path in raw:
        with Image.open(path) as screen:
            framed = wrap(screen.convert("RGBA"))
        out = TARGET / f"phone-{path.stem}.png"
        framed.save(out, optimize=True)
        subprocess.run(
            ["pngquant", "--quality=70-92", "--speed", "1", "--force", "--output", str(out), str(out)],
            check=False,
            capture_output=True,
        )
        print(f"{out.name} {framed.size[0]}x{framed.size[1]} {out.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
