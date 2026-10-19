#!/usr/bin/env python3
"""Create Chrome icon sizes from the supplied public logo using macOS sips."""

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "ext" / "public" / "icon.png"
OUT_DIR = ROOT / "ext" / "icons"
SIZES = (16, 32, 48, 128)


def main():
    sips = shutil.which("sips")
    if not sips:
        raise SystemExit("sips is required to resize the public logo into Chrome icon sizes")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = OUT_DIR / f"icon{size}.png"
        subprocess.run(
            [sips, "-z", str(size), str(size), str(SOURCE), "--out", str(path)],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        print(f"wrote {path.relative_to(ROOT)} ({size}x{size})")


if __name__ == "__main__":
    main()
