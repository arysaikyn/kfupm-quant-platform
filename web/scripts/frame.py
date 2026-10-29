import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

"""
Wrap a raw 390x844 @2x capture in a phone body.

The README shows a mobile app, so the images should read as phones: rounded
screen, a bezel, a status bar with the clock and the battery, a home indicator
and a shadow. Everything here is drawn, not photographed, so the same script
reproduces the set on any machine.

Run after `screenshots.mjs`; it reads `docs/screenshots/raw/*.png`.
"""

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "docs" / "screenshots" / "raw"
TARGET = ROOT / "docs" / "screenshots"

SCALE = 2  # the captures are 2x

# Geometry in points, multiplied by SCALE when drawn.
BEZEL = 10
SCREEN_RADIUS = 58
STATUS_H = 44
INDICATOR_H = 22
SHADOW = 26

BODY = (10, 10, 12, 255)
BODY_EDGE = (46, 46, 52, 255)
STATUS_BG = (10, 10, 12, 255)
FS = None


def dims(screen: Image.Image):
    w, h = screen.size
    inner_w = w + 2 * BEZEL * SCALE
    inner_h = h + (STATUS_H + INDICATOR_H + 2 * BEZEL) * SCALE
    return inner_w, inner_h


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


def rounded(size, radius, fill):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=fill)
    return layer


def wrap(screen: Image.Image) -> Image.Image:
    w, h = screen.size
    body_w, body_h = dims(screen)
    radius = (SCREEN_RADIUS + BEZEL) * SCALE

    body = rounded((body_w, body_h), radius, BODY)
    edge = rounded((body_w, body_h), radius, None)
    ImageDraw.Draw(edge).rounded_rectangle(
        [0, 0, body_w - 1, body_h - 1], radius, outline=BODY_EDGE, width=2
    )
    body = Image.alpha_composite(body, edge)

    # The status bar is device chrome, so it is drawn, not captured.
    status_top = BEZEL * SCALE
    draw = ImageDraw.Draw(body)
    draw.rounded_rectangle(
        [0, 0, body_w - 1, body_h - 1], radius, outline=None
    )
    status_h = STATUS_H * SCALE
    draw.rectangle(
        [BEZEL * SCALE, status_top, body_w - BEZEL * SCALE, status_top + status_h],
        fill=STATUS_BG,
    )

    clock = font(17 * SCALE)
    draw.text(
        (BEZEL * SCALE + 22 * SCALE, status_top + status_h / 2),
        "9:41",
        font=clock,
        fill=(245, 245, 248, 255),
        anchor="lm",
    )

    # Signal, wifi, battery: three shapes, no font dependency.
    right = body_w - BEZEL * SCALE - 20 * SCALE
    mid = status_top + status_h / 2
    bar_w, gap = 3 * SCALE, 2 * SCALE
    for index, height in enumerate((4, 6, 8, 10)):
        x = right - 78 * SCALE + index * (bar_w + gap)
        draw.rounded_rectangle(
            [x, mid + 5 * SCALE - height * SCALE, x + bar_w, mid + 5 * SCALE],
            bar_w / 2,
            fill=(240, 240, 245, 255),
        )
    wifi_cx, wifi_cy = right - 44 * SCALE, mid + 4 * SCALE
    for span in (10, 6, 2):
        draw.arc(
            [wifi_cx - span * SCALE, wifi_cy - span * SCALE, wifi_cx + span * SCALE, wifi_cy + span * SCALE],
            200,
            340,
            fill=(240, 240, 245, 255),
            width=2 * SCALE,
        )
    battery = [right - 24 * SCALE, mid - 5 * SCALE, right, mid + 5 * SCALE]
    draw.rounded_rectangle(battery, 2 * SCALE, outline=(240, 240, 245, 200), width=1 * SCALE)
    draw.rectangle([battery[0] + SCALE, battery[1] + SCALE, battery[0] + 14 * SCALE, battery[3] - SCALE], fill=(240, 240, 245, 255))

    screen_top = status_top + status_h
    mask = rounded((w, h), SCREEN_RADIUS * SCALE, (255, 255, 255, 255))
    body.paste(screen, (BEZEL * SCALE, screen_top), mask)

    # Home indicator, over the 12pt gap under the floating tab bar.
    draw = ImageDraw.Draw(body)
    ind_w, ind_h = 120 * SCALE, 5 * SCALE
    ind_y = body_h - BEZEL * SCALE - 8 * SCALE
    draw.rounded_rectangle(
        [(body_w - ind_w) / 2, ind_y, (body_w + ind_w) / 2, ind_y + ind_h],
        ind_h / 2,
        fill=(235, 235, 240, 120),
    )

    canvas = Image.new("RGBA", (body_w + 2 * SHADOW * SCALE, body_h + 2 * SHADOW * SCALE), (0, 0, 0, 0))
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow.paste(
        rounded((body_w, body_h), radius, (0, 0, 0, 140)),
        (SHADOW * SCALE, SHADOW * SCALE + 6 * SCALE),
        rounded((body_w, body_h), radius, (0, 0, 0, 140)),
    )
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(10 * SCALE)))
    canvas.paste(body, (SHADOW * SCALE, SHADOW * SCALE), body)
    return canvas


def main():
    raw = sorted(SOURCE.glob("*.png"))
    if not raw:
        raise SystemExit(f"no raw captures in {SOURCE}")
    for path in raw:
        with Image.open(path) as screen:
            framed = wrap(screen.convert("RGBA"))
        out = TARGET / f"phone-{path.stem}.png"
        framed.save(out, optimize=True)
        # Quantise in place; alpha edges survive at 70-90 quality.
        subprocess.run(
            ["pngquant", "--quality=70-92", "--speed", "1", "--force", "--output", str(out), str(out)],
            check=False,
            capture_output=True,
        )
        print(f"{out.name} {framed.size[0]}x{framed.size[1]} {out.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
