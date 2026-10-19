#!/bin/bash
# Builds a clean copy of the extension in dist/, plus a zip archive.
#
# Chrome cannot install from a .zip — only from a folder ("Load unpacked")
# or from a signed .crx. The zip here is for sharing or backup: unzip it and
# point "Load unpacked" at the extracted folder.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$ROOT/ext"
VERSION="$(python3 -c "import json; print(json.load(open('$EXT/manifest.json'))['version'])")"

OUT="$ROOT/dist"
STAGE="$OUT/youtube-refined"

rm -rf "$OUT"
mkdir -p "$STAGE"

# Only what Chrome actually loads — tests, tools and docs stay out.
cp "$EXT/manifest.json" "$STAGE/"
cp -R "$EXT/src" "$EXT/icons" "$EXT/public" "$STAGE/"
cp "$ROOT/README.md" "$STAGE/"

# The zip is built from inside the staged folder so manifest.json sits at the
# archive root: Chrome's drop-to-install handler looks for it there, and a
# wrapping folder is what made it report "Could not unzip extension for
# install". -X skips macOS extended attributes, which would otherwise add
# __MACOSX entries that some extractors choke on.
cd "$STAGE"
zip -qrX "$OUT/youtube-refined-${VERSION}.zip" .

echo "built $STAGE"
echo "built $OUT/youtube-refined-${VERSION}.zip  (manifest.json at archive root)"
echo
echo "To install: chrome://extensions -> Developer mode -> Load unpacked ->"
echo "select: $STAGE"
