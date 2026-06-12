#!/usr/bin/env python3
"""Render the draw.io diagram sources to SVG (and PNG, if rsvg-convert is present).

Source of truth: docs/diagrams/drawio/*.drawio  (edit these in draw.io / diagrams.net)
Outputs:         docs/diagrams/svg/*.svg, docs/diagrams/png/*.png

Pure-stdlib SVG renderer for the mxGraph subset we use (rounded rects, pills,
rhombus decisions, process boxes, cylinders, straight orthogonal-ish edges).
Run from the repo root:  python3 scripts/render-diagrams.py
"""
import html
import os
import shutil
import subprocess
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs/diagrams/drawio")
SVG = os.path.join(ROOT, "docs/diagrams/svg")
PNG = os.path.join(ROOT, "docs/diagrams/png")
FONT = "Inter, system-ui, -apple-system, sans-serif"


def style_dict(style):
    d = {}
    for part in (style or "").split(";"):
        if not part:
            continue
        if "=" in part:
            k, v = part.split("=", 1)
            d[k] = v
        else:
            d[part] = True
    return d


def esc(t):
    return html.escape(t, quote=False)


def parse(path):
    root = ET.parse(path).getroot()
    rootcell = root.find(".//mxGraphModel").find("root")
    verts, vlist, edges = {}, [], []
    for cell in rootcell.findall("mxCell"):
        if cell.get("vertex") == "1":
            geo = cell.find("mxGeometry")
            v = dict(
                id=cell.get("id"), value=cell.get("value") or "", style=cell.get("style") or "",
                x=float(geo.get("x", "0")), y=float(geo.get("y", "0")),
                w=float(geo.get("width", "0")), h=float(geo.get("height", "0")),
            )
            verts[v["id"]] = v
            vlist.append(v)
        elif cell.get("edge") == "1":
            edges.append(dict(
                id=cell.get("id"), value=cell.get("value") or "", style=cell.get("style") or "",
                source=cell.get("source"), target=cell.get("target"),
            ))
    return vlist, verts, edges


def center(v):
    return (v["x"] + v["w"] / 2, v["y"] + v["h"] / 2)


def border_point(v, toward):
    cx, cy = center(v)
    dx, dy = toward[0] - cx, toward[1] - cy
    if dx == 0 and dy == 0:
        return (cx, cy)
    hw, hh = v["w"] / 2, v["h"] / 2
    sx = hw / abs(dx) if dx else 1e9
    sy = hh / abs(dy) if dy else 1e9
    s = min(sx, sy)
    return (cx + dx * s, cy + dy * s)


def wrap(line, maxchars):
    if len(line) <= maxchars:
        return [line]
    out, cur = [], ""
    for word in line.split(" "):
        if cur and len(cur) + 1 + len(word) > maxchars:
            out.append(cur)
            cur = word
        else:
            cur = (cur + " " + word).strip()
    if cur:
        out.append(cur)
    return out


def node_svg(v):
    d = style_dict(v["style"])
    fill = d.get("fillColor", "#ffffff")
    stroke = d.get("strokeColor", "#475569")
    x, y, w, h = v["x"], v["y"], v["w"], v["h"]
    out = []
    if "rhombus" in d:
        cx, cy = x + w / 2, y + h / 2
        out.append(f'<polygon points="{cx},{y} {x+w},{cy} {cx},{y+h} {x},{cy}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
    elif d.get("shape") == "cylinder3":
        ry = 9
        body = (f"M {x} {y+ry} L {x} {y+h-ry} A {w/2} {ry} 0 0 0 {x+w} {y+h-ry} "
                f"L {x+w} {y+ry} A {w/2} {ry} 0 0 1 {x} {y+ry} Z")
        out.append(f'<path d="{body}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
        out.append(f'<path d="M {x} {y+ry} A {w/2} {ry} 0 0 0 {x+w} {y+ry}" fill="none" stroke="{stroke}" stroke-width="1.5"/>')
    elif d.get("shape") == "process":
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
        out.append(f'<line x1="{x+8}" y1="{y}" x2="{x+8}" y2="{y+h}" stroke="{stroke}" stroke-width="1"/>')
        out.append(f'<line x1="{x+w-8}" y1="{y}" x2="{x+w-8}" y2="{y+h}" stroke="{stroke}" stroke-width="1"/>')
    else:
        rx = h / 2 if d.get("arcSize") == "50" else (10 if "rounded" in d else 0)
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
    # text (wrapped to the box width)
    maxchars = max(6, int((w - 14) / 6.4))
    lines = []
    for logical in (v["value"].split("\n") if v["value"] else []):
        lines.extend(wrap(logical, maxchars))
    cx, cy = x + w / 2, y + h / 2
    lh = 14.5
    y0 = cy - (len(lines) * lh) / 2 + 11
    for i, ln in enumerate(lines):
        out.append(f'<text x="{cx}" y="{y0 + i*lh:.1f}" font-size="12" fill="#0f172a" text-anchor="middle">{esc(ln)}</text>')
    return "\n".join(out)


def edge_svg(e, verts):
    s, t = verts.get(e["source"]), verts.get(e["target"])
    if not s or not t:
        return ""
    d = style_dict(e["style"])
    dash = ' stroke-dasharray="5,4"' if "dashed" in d else ""
    p1 = border_point(s, center(t))
    p2 = border_point(t, center(s))
    out = [f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" '
           f'stroke="#64748b" stroke-width="1.5"{dash} marker-end="url(#arrow)"/>']
    if e["value"]:
        mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        wpx = max(len(e["value"]) * 6.0 + 10, 16)
        out.append(f'<rect x="{mx-wpx/2:.1f}" y="{my-9:.1f}" width="{wpx:.1f}" height="16" rx="3" fill="#ffffff" opacity="0.92"/>')
        out.append(f'<text x="{mx:.1f}" y="{my+3:.1f}" font-size="10.5" fill="#475569" text-anchor="middle">{esc(e["value"])}</text>')
    return "\n".join(out)


def render(path):
    vlist, verts, edges = parse(path)
    minx = min(v["x"] for v in vlist)
    miny = min(v["y"] for v in vlist)
    maxx = max(v["x"] + v["w"] for v in vlist)
    maxy = max(v["y"] + v["h"] for v in vlist)
    pad = 24
    W, H = maxx - minx + 2 * pad, maxy - miny + 2 * pad
    tx, ty = pad - minx, pad - miny
    parts = [f'<g transform="translate({tx:.0f},{ty:.0f})">']
    parts += [edge_svg(e, verts) for e in edges]
    parts += [node_svg(v) for v in vlist]
    parts.append("</g>")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}" '
        f'viewBox="0 0 {W:.0f} {H:.0f}" font-family="{FONT}">\n'
        '<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" '
        'orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,3 L0,6 Z" fill="#64748b"/></marker></defs>\n'
        '<rect width="100%" height="100%" fill="#ffffff"/>\n'
        + "\n".join(parts) + "\n</svg>\n"
    )


def main():
    os.makedirs(SVG, exist_ok=True)
    os.makedirs(PNG, exist_ok=True)
    rsvg = shutil.which("rsvg-convert")
    for fn in sorted(os.listdir(SRC)):
        if not fn.endswith(".drawio"):
            continue
        name = fn[:-7]
        svg_path = os.path.join(SVG, name + ".svg")
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(render(os.path.join(SRC, fn)))
        print("svg:", name)
        if rsvg:
            subprocess.run([rsvg, "-z", "2", "-o", os.path.join(PNG, name + ".png"), svg_path], check=True)
            print("png:", name)
    if not rsvg:
        print("note: rsvg-convert not found — skipped PNG (install librsvg, or export PNG from draw.io).")


if __name__ == "__main__":
    main()
