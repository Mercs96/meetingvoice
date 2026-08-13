"""
Generate Android-compatible icons for the MeetingVoice PWA.
Android requires PNG icons at 192x192 and 512x512 (plus maskable variants).
"""
from PIL import Image, ImageDraw, ImageFont
import os
import math

OUT_DIR = "/home/z/my-project/public"
os.makedirs(OUT_DIR, exist_ok=True)

# Color palette (matches brand)
INDIGO = (99, 102, 241)      # #6366F1
VIOLET = (139, 92, 246)      # #8B5CF6
WHITE = (255, 255, 255)


def gradient_bg(size: tuple[int, int]) -> Image.Image:
    """Diagonal gradient from indigo to violet."""
    w, h = size
    img = Image.new("RGB", size, INDIGO)
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = (x + y) / (w + h)
            r = int(INDIGO[0] + (VIOLET[0] - INDIGO[0]) * t)
            g = int(INDIGO[1] + (VIOLET[1] - INDIGO[1]) * t)
            b = int(INDIGO[2] + (VIOLET[2] - INDIGO[2]) * t)
            px[x, y] = (r, g, b)
    return img


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([(0, 0), size], radius=radius, fill=255)
    return mask


def draw_mic_icon(img: Image.Image, scale: float):
    """Draw a stylized microphone + waveform on the image."""
    w, h = img.size
    cx, cy = w // 2, h // 2
    # Mic body (rounded rect)
    mw = int(w * 0.30 * scale)
    mh = int(h * 0.36 * scale)
    d = ImageDraw.Draw(img)
    mic_x0 = cx - mw // 2
    mic_y0 = cy - mh // 2 - int(h * 0.04)
    mic_x1 = mic_x0 + mw
    mic_y1 = mic_y0 + mh
    d.rounded_rectangle(
        [(mic_x0, mic_y0), (mic_x1, mic_y1)],
        radius=mw // 2,
        fill=WHITE,
    )
    # Mic stand
    stand_w = max(2, int(w * 0.04 * scale))
    d.line(
        [(cx, mic_y1), (cx, mic_y1 + int(h * 0.12))],
        fill=WHITE,
        width=stand_w,
    )
    # Mic base
    base_y = mic_y1 + int(h * 0.14)
    base_w = int(w * 0.22 * scale)
    d.line(
        [(cx - base_w // 2, base_y), (cx + base_w // 2, base_y)],
        fill=WHITE,
        width=stand_w,
    )
    # Waveform bars inside mic
    bars = 4
    bar_w = max(2, int(mw * 0.10))
    gap = (mw - bars * bar_w) // (bars + 1)
    bar_heights = [0.45, 0.70, 0.55, 0.35]
    for i in range(bars):
        bh = int(mh * 0.55 * bar_heights[i])
        bx = mic_x0 + gap + i * (bar_w + gap)
        by = cy - bh // 2 - int(h * 0.04)
        d.rectangle([(bx, by), (bx + bar_w, by + bh)], fill=INDIGO)


def make_icon(size: int, maskable: bool = False, filename: str = ""):
    """Render an icon at the given size."""
    padding = int(size * 0.10) if maskable else 0
    canvas_size = (size, size)
    # Background: solid color for maskable (so safe area fills), gradient for regular
    if maskable:
        bg = Image.new("RGB", canvas_size, INDIGO)
    else:
        bg = gradient_bg(canvas_size)

    # Rounded corners for regular icons (Android adaptive icons use rounded square)
    if not maskable:
        radius = int(size * 0.18)
        mask = rounded_mask(canvas_size, radius)
        rounded = Image.new("RGB", canvas_size, (255, 255, 255))
        rounded.paste(bg, (0, 0), mask)
        bg = rounded

    # Draw icon
    draw_mic_icon(bg, scale=0.85 if not maskable else 0.65)
    bg.save(os.path.join(OUT_DIR, filename), "PNG", optimize=True)
    print(f"Generated {filename} ({size}x{size}, maskable={maskable})")


def make_apple_icon(size: int = 180):
    """Apple touch icon — square solid color with mic."""
    img = Image.new("RGB", (size, size), INDIGO)
    draw_mic_icon(img, scale=0.7)
    img.save(os.path.join(OUT_DIR, "apple-touch-icon.png"), "PNG", optimize=True)
    print(f"Generated apple-touch-icon.png ({size}x{size})")


def make_favicon(size: int = 32):
    img = Image.new("RGB", (size, size), INDIGO)
    draw_mic_icon(img, scale=0.75)
    img.save(os.path.join(OUT_DIR, "favicon.png"), "PNG", optimize=True)
    print(f"Generated favicon.png ({size}x{size})")


if __name__ == "__main__":
    # Standard PWA icons
    make_icon(192, maskable=False, filename="icon-192.png")
    make_icon(512, maskable=False, filename="icon-512.png")
    # Maskable icons (Android adaptive)
    make_icon(192, maskable=True, filename="icon-192-maskable.png")
    make_icon(512, maskable=True, filename="icon-512-maskable.png")
    # Apple touch icon
    make_apple_icon(180)
    # Favicon
    make_favicon(32)
    print("\n✓ Todos los iconos generados en /home/z/my-project/public/")
