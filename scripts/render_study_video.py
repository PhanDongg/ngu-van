from pathlib import Path
import math
import random
import numpy as np
import imageio.v2 as imageio
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path.cwd()
SRC = ROOT / 'assets' / 'images' / 'home' / 'tieng-viet-2-1735804486.jpg'
OUT_DIR = ROOT / 'assets' / 'videos'
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT = OUT_DIR / 'tieng-viet-2-ambient-10s.mp4'

WIDTH = 1280
HEIGHT = 720
FPS = 24
DURATION = 10
FRAMES = FPS * DURATION

base = Image.open(SRC).convert('RGB')
base_w, base_h = base.size

random.seed(7)
particles = []
for _ in range(28):
    particles.append({
        'x': random.uniform(0.05, 0.95),
        'y': random.uniform(0.08, 0.92),
        'r': random.uniform(3.0, 13.0),
        'alpha': random.uniform(20, 90),
        'drift': random.uniform(0.008, 0.03),
        'phase': random.uniform(0, math.tau),
        'speed': random.uniform(0.2, 0.7),
    })


def make_cover_frame(progress: float) -> Image.Image:
    zoom = 1.0 + 0.08 * progress
    target_ratio = WIDTH / HEIGHT
    crop_ratio = target_ratio / zoom

    src_ratio = base_w / base_h
    if src_ratio > crop_ratio:
        crop_h = base_h
        crop_w = crop_h * crop_ratio
    else:
        crop_w = base_w
        crop_h = crop_w / crop_ratio

    pan_x = (base_w - crop_w) * (0.46 + 0.08 * math.sin(progress * math.tau * 0.5))
    pan_y = (base_h - crop_h) * (0.5 + 0.03 * math.cos(progress * math.tau * 0.75))
    pan_x = max(0, min(base_w - crop_w, pan_x))
    pan_y = max(0, min(base_h - crop_h, pan_y))

    cropped = base.crop((int(pan_x), int(pan_y), int(pan_x + crop_w), int(pan_y + crop_h)))
    return cropped.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


def radial_glow(size, center, radius, color):
    overlay = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    max_r = int(radius)
    for r in range(max_r, 0, -6):
        alpha = int(color[3] * (r / max_r) ** 2)
        fill = (color[0], color[1], color[2], alpha)
        draw.ellipse((center[0] - r, center[1] - r, center[0] + r, center[1] + r), fill=fill)
    return overlay.filter(ImageFilter.GaussianBlur(28))


writer = imageio.get_writer(str(OUT), fps=FPS, codec='libx264', quality=8, pixelformat='yuv420p')

for frame_idx in range(FRAMES):
    t = frame_idx / FPS
    progress = frame_idx / (FRAMES - 1)

    frame = make_cover_frame(progress).convert('RGBA')

    glow_left = radial_glow((WIDTH, HEIGHT), (230, 240), 260 + 25 * math.sin(t * 0.8), (255, 236, 191, 95))
    glow_right = radial_glow((WIDTH, HEIGHT), (980, 360), 220 + 20 * math.cos(t * 0.65), (160, 220, 255, 48))
    frame = Image.alpha_composite(frame, glow_left)
    frame = Image.alpha_composite(frame, glow_right)

    beam = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    beam_draw = ImageDraw.Draw(beam)
    beam_offset = int(40 * math.sin(t * 0.35))
    beam_draw.polygon([
        (120 + beam_offset, 0),
        (370 + beam_offset, 0),
        (720 + beam_offset, HEIGHT),
        (490 + beam_offset, HEIGHT),
    ], fill=(255, 255, 255, 24))
    beam = beam.filter(ImageFilter.GaussianBlur(20))
    frame = Image.alpha_composite(frame, beam)

    particle_layer = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(particle_layer)
    for p in particles:
        px = p['x'] * WIDTH + math.sin(t * p['speed'] + p['phase']) * 20
        py = ((p['y'] - (t * p['drift'])) % 1.15) * HEIGHT - 40
        radius = p['r'] * (0.85 + 0.2 * math.sin(t * 1.2 + p['phase']))
        alpha = int(p['alpha'] * (0.75 + 0.25 * math.sin(t * 1.8 + p['phase'])))
        pdraw.ellipse((px - radius, py - radius, px + radius, py + radius), fill=(255, 248, 232, alpha))
    particle_layer = particle_layer.filter(ImageFilter.GaussianBlur(2))
    frame = Image.alpha_composite(frame, particle_layer)

    vignette = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for i in range(18):
        inset = i * 14
        alpha = int(3 + i * 0.7)
        vdraw.rounded_rectangle((inset, inset, WIDTH - inset, HEIGHT - inset), radius=48, outline=(8, 24, 56, alpha), width=22)
    vignette = vignette.filter(ImageFilter.GaussianBlur(16))
    frame = Image.alpha_composite(frame, vignette)

    writer.append_data(np.asarray(frame.convert('RGB')))

writer.close()
print(OUT)