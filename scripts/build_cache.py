"""Render all Manim scenes and copy outputs into cache/videos/.

Usage (from repo root):
    python scripts/build_cache.py

What it does:
- Adds MiKTeX (for latex + dvisvgm) and the imageio-ffmpeg bundled binary to
  PATH so Manim can find its external tools without a system-wide config.
- Invokes `uv run manim ...` inside manim_scenes/ for each scene listed in
  SCENES below. Quality flag is configurable via --quality.
- Copies the resulting MP4 into cache/videos/ with the name the frontend
  expects.
- Optionally regenerates English narration MP3s in cache/audio/ when
  AZURE_SPEECH_KEY is present in the environment.

Idempotent: if the output MP4 is already newer than the source .py, the scene
is skipped. Pass --force to re-render everything.

Prereqs:
- uv installed and on PATH (or accessible via `python -m uv`)
- MiKTeX or TeX Live installed (Manim's MathTex requires it)
- A `manim_scenes/.venv` produced by `uv add manim imageio-ffmpeg`
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCENES_DIR = ROOT / "manim_scenes"
CACHE_VIDEOS = ROOT / "cache" / "videos"
CACHE_AUDIO = ROOT / "cache" / "audio"

# (script_path, scene_class, output_basename)
SCENES: list[tuple[str, str, str]] = [
    ("01_limit.py", "EpsilonDelta", "01_limit"),
    ("02_derivative.py", "SecantToTangent", "02_derivative"),
    ("03_chain_rule.py", "ChainRule", "03_chain_rule"),
    ("04_de_moivre.py", "DeMoivre", "04_de_moivre"),
    ("05_double_integral.py", "DoubleIntegral", "05_double_integral"),
    ("06_determinant.py", "Determinant", "06_determinant"),
    ("07_saddle.py", "Saddle", "07_saddle"),
    ("08_gaussian.py", "GaussianIntegral", "08_gaussian"),
    ("09_normal.py", "NormalDistribution", "09_normal"),
    ("10_roots_of_unity.py", "RootsOfUnity", "10_roots_of_unity"),
    ("11_euler.py", "EulerIdentity", "11_euler"),
    ("12_poisson_exp_gamma.py", "PoissonExpGamma", "12_poisson_exp_gamma"),
]

QUALITY_DIR = {
    "l": "480p15",
    "m": "720p30",
    "h": "1080p60",
    "p": "1440p60",
    "k": "2160p60",
}

# Common MiKTeX install locations on Windows. The first that exists wins.
MIKTEX_CANDIDATES = [
    Path.home() / "AppData/Local/Programs/MiKTeX/miktex/bin/x64",
    Path("C:/Program Files/MiKTeX/miktex/bin/x64"),
    Path("C:/Program Files (x86)/MiKTeX/miktex/bin/x64"),
]


def ensure_path() -> None:
    """Inject MiKTeX (latex/dvisvgm) and imageio-ffmpeg's binary onto PATH."""
    extra: list[str] = []

    # MiKTeX
    if shutil.which("latex") is None:
        for cand in MIKTEX_CANDIDATES:
            if (cand / "latex.exe").exists():
                extra.append(str(cand))
                print(f"[path] adding MiKTeX: {cand}")
                break
        else:
            print("[warn] latex not on PATH and MiKTeX install not found in standard locations")

    # FFmpeg via imageio-ffmpeg (managed by uv inside manim_scenes/.venv)
    if shutil.which("ffmpeg") is None:
        try:
            res = subprocess.run(
                ["uv", "run", "--directory", str(SCENES_DIR), "python", "-c",
                 "import imageio_ffmpeg, os; print(os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe()))"],
                capture_output=True, text=True, check=True,
            )
            ff_dir = Path(res.stdout.strip())
            # Manim spawns `ffmpeg`; on Windows imageio-ffmpeg ships ffmpeg-win-*.exe
            # — copy/symlink it as ffmpeg.exe so the spawn finds it.
            src = next((p for p in ff_dir.iterdir() if p.suffix == ".exe"), None)
            if src and src.name != "ffmpeg.exe":
                target = ff_dir / "ffmpeg.exe"
                if not target.exists():
                    shutil.copy2(src, target)
            extra.append(str(ff_dir))
            print(f"[path] adding imageio-ffmpeg: {ff_dir}")
        except Exception as e:  # noqa: BLE001
            print(f"[warn] imageio-ffmpeg not available: {e}")

    if extra:
        os.environ["PATH"] = os.pathsep.join(extra) + os.pathsep + os.environ.get("PATH", "")


def render_scene(script: str, klass: str, basename: str, quality: str, force: bool) -> Path | None:
    src = SCENES_DIR / script
    if not src.exists():
        print(f"[skip] {script} — source not found")
        return None

    out_path = CACHE_VIDEOS / f"{basename}.mp4"
    if (
        not force
        and out_path.exists()
        and out_path.stat().st_mtime >= src.stat().st_mtime
    ):
        print(f"[cache] {basename}.mp4 up to date")
        return out_path

    print(f"[render] {script} :: {klass} (quality={quality})")
    cmd = [
        "uv", "run", "manim",
        f"-q{quality}",
        "--media_dir", str(SCENES_DIR / "media"),
        script,
        klass,
    ]
    proc = subprocess.run(cmd, cwd=SCENES_DIR, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"[error] {script} failed:\n{proc.stdout}\n{proc.stderr}")
        return None

    rendered = SCENES_DIR / "media" / "videos" / src.stem / QUALITY_DIR[quality] / f"{klass}.mp4"
    if not rendered.exists():
        print(f"[error] expected output missing: {rendered}")
        return None

    CACHE_VIDEOS.mkdir(parents=True, exist_ok=True)
    # Windows holds the cache MP4 open while the browser has it in a <video>
    # element, so a direct copy fails with PermissionError. Strategy:
    # 1) write to a sibling .new file (always succeeds)
    # 2) try to atomically replace the locked target
    # 3) if that also fails, leave the .new file in place and tell the user
    new_path = out_path.with_suffix(out_path.suffix + ".new")
    shutil.copy2(rendered, new_path)
    try:
        os.replace(new_path, out_path)
        print(f"[ok] {out_path.relative_to(ROOT)} ({out_path.stat().st_size // 1024} KB)")
    except PermissionError:
        print(
            f"[ok] {new_path.relative_to(ROOT)} ({new_path.stat().st_size // 1024} KB) — "
            f"target was locked (browser holding the video?). Refresh your browser, then run:\n"
            f"      mv {new_path.relative_to(ROOT)} {out_path.relative_to(ROOT)}"
        )
    return out_path


# Optional narration. Frontend already has multilingual transcripts; we mirror
# them here so the build script can pre-cache Azure TTS for offline demo.
NARRATION_EN = {
    "01_limit": "Imagine a tiny window of height epsilon around the limit L. No matter how small you make that window, we can always find a corresponding narrow strip of width delta around a such that every x inside that strip lands inside the epsilon window. That is what it means for the function to approach L.",
    "02_derivative": "The derivative is the slope of the tangent line, which is the limit of slopes of secant lines. As h shrinks to zero, the secant pivots into the tangent. This single number — the derivative at a — is the instantaneous rate at which the function is changing.",
    "03_chain_rule": "Think of two number lines being stretched. The inner function stretches the input by its derivative. Then the outer function stretches that output again. The total stretch is the product — that is the chain rule.",
}


def render_audio(basename: str) -> None:
    if not os.environ.get("AZURE_SPEECH_KEY"):
        return
    text = NARRATION_EN.get(basename)
    if not text:
        return
    out = CACHE_AUDIO / f"{basename}.en.mp3"
    if out.exists() and out.stat().st_size > 0:
        print(f"[cache] {out.name} present")
        return
    sys.path.insert(0, str(ROOT / "backend"))
    try:
        from clients import tts  # type: ignore
        tts.synthesize(text, "en", out)
        print(f"[ok] {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")
    except Exception as e:  # noqa: BLE001
        print(f"[warn] TTS failed for {basename}: {e}")


def resolve_uv() -> None:
    """Make sure `uv` is callable; if only `python -m uv` works, expose a shim."""
    if shutil.which("uv") is not None:
        return
    # python -m uv works — write a tiny wrapper to a dir we add to PATH
    try:
        subprocess.run([sys.executable, "-m", "uv", "--version"], capture_output=True, check=True)
    except Exception:
        print("[error] uv is not installed. Install it with: pip install uv")
        sys.exit(2)
    shim_dir = ROOT / ".uv-shim"
    shim_dir.mkdir(exist_ok=True)
    shim = shim_dir / "uv.cmd"
    shim.write_text(f'@echo off\r\n"{sys.executable}" -m uv %*\r\n')
    os.environ["PATH"] = f"{shim_dir}{os.pathsep}{os.environ.get('PATH', '')}"
    print(f"[shim] using `python -m uv` via {shim}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--quality",
        choices=list(QUALITY_DIR),
        default="l",
        help="manim quality flag: l=480p15 (fast), m=720p30, h=1080p60, p=1440p60, k=2160p60",
    )
    ap.add_argument("--force", action="store_true", help="re-render even if cached output is fresh")
    ap.add_argument("--no-audio", action="store_true", help="skip the optional Azure TTS step")
    ap.add_argument(
        "--scenes",
        help="comma-separated basenames to render (e.g. 05_double_integral). default: all",
    )
    args = ap.parse_args()

    # Filter scenes if --scenes given
    selected = SCENES
    if args.scenes:
        wanted = {s.strip() for s in args.scenes.split(",")}
        selected = [s for s in SCENES if s[2] in wanted]
        if not selected:
            print(f"[error] no scenes matched: {wanted}")
            return 2

    resolve_uv()
    ensure_path()

    failed = 0
    for script, klass, basename in selected:
        out = render_scene(script, klass, basename, args.quality, args.force)
        if out is None:
            failed += 1
            continue
        if not args.no_audio:
            render_audio(basename)

    if failed:
        print(f"\n[summary] {failed}/{len(selected)} scenes failed")
        return 1
    print(f"\n[summary] {len(selected)} scenes rendered into {CACHE_VIDEOS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
