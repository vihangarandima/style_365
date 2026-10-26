"""
Crop + AI-enhance TikTok cover frames for the STYLE 365 site.

Photos:   crop away caption overlays -> Real-ESRGAN x4 upscale (blended with
          a Lanczos pass so skin keeps natural texture) -> luminance levels ->
          clarity -> vibrance -> soft brand-violet shadow grade -> WebP.
Cutouts:  same enhancement, then rembg (AI background removal) -> soft fade
          along the bottom crop edge -> trimmed transparent WebP for the hero.

Requirements:
  pip install "rembg[cpu]" opencv-python-headless
  Real-ESRGAN ncnn build (https://github.com/xinntao/Real-ESRGAN/releases),
  path set with REALESRGAN_EXE or installed to %LOCALAPPDATA%/style365-tools/realesrgan.

Run from the project root:  python assets/tiktok/enhance.py
"""
import os
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).parent
RAW = ROOT / 'raw'
OUT = ROOT

REALESRGAN_EXE = Path(os.environ.get(
    'REALESRGAN_EXE',
    Path(os.environ.get('LOCALAPPDATA', '')) / 'style365-tools' / 'realesrgan' / 'realesrgan-ncnn-vulkan.exe',
))

PHOTO_W = 1080
CUTOUT_H = 1500

# name: (video id, crop box as fractions of width/height: left, top, right, bottom)
SHOTS = {
    'umbrella-maxi':    ('7700093661178088724', (0.115, 0.000, 0.995, 0.661)),
    'rose-bloom-top':   ('7700167468907580692', (0.000, 0.219, 0.750, 0.781)),
    'midnight-maxi':    ('7700219232293850389', (0.000, 0.000, 1.000, 0.750)),
    'blue-blossom-set': ('7700432457774026005', (0.056, 0.156, 0.847, 0.750)),
    'magenta-maxi':     ('7700477870853852436', (0.150, 0.219, 0.791, 0.700)),
    'mocha-smock':      ('7700556295144869141', (0.134, 0.141, 0.866, 0.690)),
}

# Hero cutouts: the bottom edge stops just above each video's caption overlay.
CUTOUTS = {
    'hero-mocha':   ('7700556295144869141', (0.000, 0.080, 1.000, 0.690)),
    'hero-blossom': ('7700432457774026005', (0.000, 0.100, 1.000, 0.752)),
    'hero-magenta': ('7700477870853852436', (0.120, 0.300, 1.000, 0.722)),
}


# Burned-in "Style 365" captions sitting on the clothes: video id -> pixel box in the raw frame
WATERMARKS = {
    '7700432457774026005': (468, 928, 614, 988),
}


def load_raw(vid):
    """Open a raw cover, inpainting any burned-in watermark text (OpenCV Telea)."""
    src = Image.open(RAW / f'cover_{vid}.jpg').convert('RGB')
    if vid not in WATERMARKS:
        return src

    import cv2

    x0, y0, x1, y1 = WATERMARKS[vid]
    bgr = cv2.cvtColor(np.asarray(src), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    strokes = cv2.dilate((gray < 120).astype(np.uint8) * 255, np.ones((5, 5), np.uint8), iterations=2)
    mask = np.zeros(bgr.shape[:2], np.uint8)
    mask[y0:y1, x0:x1] = strokes
    clean = cv2.inpaint(bgr, mask, 7, cv2.INPAINT_TELEA)
    return Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB))


def to_ratio(box, size, ratio=3 / 4):
    """Shrink the crop box around its centre so it is exactly ratio (w/h)."""
    w, h = size
    l, t, r, b = box[0] * w, box[1] * h, box[2] * w, box[3] * h
    cw, ch = r - l, b - t
    if cw / ch > ratio:
        nw = ch * ratio
        l += (cw - nw) / 2
        r = l + nw
    else:
        nh = cw / ratio
        t += (ch - nh) / 2
        b = t + nh
    return tuple(int(round(v)) for v in (l, t, r, b))


def frac_box(box, size):
    w, h = size
    return tuple(int(round(v)) for v in (box[0] * w, box[1] * h, box[2] * w, box[3] * h))


def ai_upscale(img, natural_mix=0.25):
    """Real-ESRGAN x4, blended with a plain Lanczos upscale to avoid a waxy look."""
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = Path(tmp) / 'in.png', Path(tmp) / 'out.png'
        img.save(src)
        subprocess.run(
            [str(REALESRGAN_EXE), '-i', str(src), '-o', str(dst), '-n', 'realesrgan-x4plus'],
            cwd=REALESRGAN_EXE.parent, check=True, capture_output=True,
        )
        ai = Image.open(dst).convert('RGB')
    plain = img.resize(ai.size, Image.LANCZOS)
    return Image.blend(ai, plain, natural_mix)


def auto_levels(img, clip=0.6):
    """Stretch luminance only, so skin tones and fabric colours do not shift."""
    y, cb, cr = img.convert('YCbCr').split()
    y = ImageOps.autocontrast(y, cutoff=clip)
    return Image.merge('YCbCr', (y, cb, cr)).convert('RGB')


def vibrance(img, amount=0.2):
    """Boost saturation of muted pixels more than already-saturated ones."""
    hsv = np.asarray(img.convert('HSV')).astype(np.float32)
    s = hsv[..., 1] / 255.0
    s = s + amount * (1.0 - s) * s * 2.2
    hsv[..., 1] = np.clip(s * 255.0, 0, 255)
    return Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB')


def brand_grade(img, strength=0.05):
    """Lift shadows towards STYLE 365 violet for a cohesive look."""
    a = np.asarray(img).astype(np.float32) / 255.0
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])[..., None]
    shadow = np.clip(1.0 - lum * 1.6, 0, 1)
    violet = np.array([0.42, 0.28, 0.62])
    a = a * (1 - strength * shadow) + violet * strength * shadow
    a = 0.015 + a * 0.985
    return Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))


def tone(img):
    img = auto_levels(img)
    img = img.filter(ImageFilter.UnsharpMask(radius=24, percent=18, threshold=2))  # clarity
    img = vibrance(img)
    img = ImageEnhance.Contrast(img).enhance(1.03)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=35, threshold=2))  # micro detail
    return brand_grade(img)


def fit_width(img, w):
    return img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)


def fit_height(img, h):
    return img.resize((round(img.width * h / img.height), h), Image.LANCZOS)


def cutout(img, session):
    """AI background removal, then fade the hard bottom crop into transparency."""
    from rembg import remove

    rgba = remove(img, session=session, post_process_mask=True)
    a = np.asarray(rgba).copy()
    h = a.shape[0]
    fade = int(h * 0.14)
    ramp = np.linspace(1.0, 0.0, fade) ** 1.6
    a[h - fade:, :, 3] = (a[h - fade:, :, 3] * ramp[:, None]).astype(np.uint8)
    out = Image.fromarray(a, 'RGBA')
    return out.crop(out.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())


def main():
    if not REALESRGAN_EXE.exists():
        raise SystemExit(f'Real-ESRGAN not found at {REALESRGAN_EXE} (set REALESRGAN_EXE)')

    for name, (vid, frac) in SHOTS.items():
        src = load_raw(vid)
        crop = src.crop(to_ratio(frac, src.size))
        out = tone(fit_width(ai_upscale(crop), PHOTO_W))
        out.save(OUT / f'{name}.webp', 'WEBP', quality=86, method=6)
        out.resize((540, 720), Image.LANCZOS).save(OUT / f'{name}-sm.webp', 'WEBP', quality=82, method=6)
        print(f'{name}: {crop.size} -> {out.size}')

    from rembg import new_session

    session = new_session('isnet-general-use')
    for name, (vid, frac) in CUTOUTS.items():
        src = load_raw(vid)
        crop = src.crop(frac_box(frac, src.size))
        big = tone(fit_height(ai_upscale(crop), CUTOUT_H + 300))
        out = fit_height(cutout(big, session), CUTOUT_H)
        out.save(OUT / f'{name}.webp', 'WEBP', quality=88, method=6)
        fit_height(out, 720).save(OUT / f'{name}-sm.webp', 'WEBP', quality=85, method=6)
        print(f'{name}: {crop.size} -> {out.size}')


if __name__ == '__main__':
    main()
