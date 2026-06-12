# Diagrams

Flowchart designs for cost-reaper (FE-47, NFR-12), authored in **draw.io / diagrams.net** and
exported to multiple formats — **each format in its own folder**.

| Folder | Format | Notes |
|---|---|---|
| `drawio/` | `.drawio` (mxGraph XML) | **Source of truth** — edit in draw.io or the VS Code draw.io extension |
| `svg/` | `.svg` | Vector; opens in any browser/editor (the primary deliverable) |
| `png/` | `.png` | Raster (2×) for docs/slides |
| `html/` | `.html` | Self-contained page with the SVG embedded inline |
| `visio/` | `.vsdx` | Exported from draw.io — see `visio/README.md` |

Diagrams: `architecture` · `workflow` · `calculation` · `checklist` · `request-lifecycle`.

**Regenerate** SVG + PNG from the `.drawio` sources (needs Python 3; PNG needs `rsvg-convert`):

```bash
python3 scripts/render-diagrams.py
```

The docs site renders these at [`../html/flowcharts.html`](../html/flowcharts.html).
