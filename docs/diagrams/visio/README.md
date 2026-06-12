# Visio (`.vsdx`) exports

Visio's `.vsdx` is a binary OOXML package that must be produced by a diagramming tool — it
can't be hand-authored or emitted by the SVG renderer in this repo. So this folder holds a
how-to rather than generated binaries.

To produce `<name>.vsdx` from the editable source:

1. Open `../drawio/<name>.drawio` in **draw.io / diagrams.net** (the desktop app, the VS Code
   "Draw.io Integration" extension, or <https://app.diagrams.net>).
2. **File → Export as → VSDX…**, and save the result into this folder as `<name>.vsdx`.

Microsoft Visio can also **import** the vector files in `../svg/` directly.

Source of truth: `../drawio/`. Regenerate SVG + PNG with `python3 scripts/render-diagrams.py`.
