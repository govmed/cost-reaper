#!/usr/bin/env python3
"""Regenerate docs/TEST_CASES.md — a readable catalog of every automated test
case, parsed from the test suites (*.spec.ts / *.test.ts). Run from the repo root:

    python3 scripts/gen-test-catalog.py

Then prettier-format and render the .docx (see docs/TEST_CASES.md header)."""
import re
import os
import subprocess

files = subprocess.check_output(
    "find apps packages -name '*.spec.ts' -o -name '*.test.ts' | grep -v node_modules | sort",
    shell=True,
    text=True,
).split()

NAMES = {
    "labor-card": "Labor card",
    "engine-totals-card": "Totals / Cost-by-category / SDLC-phase card",
    "estimate-settings-card": "Settings card",
    "nonlabor-card": "Non-labor card",
    "cloud-card": "Cloud compute card",
    "assumptions-comments-reference-card": "Assumptions / Comments / Reference / FX",
    "rate-card": "Rate cards card",
    "users-rbac-card": "Users & Roles (RBAC)",
    "workflow-card": "Approval workflow card",
    "checklist-rule-sets": "Checklist rule sets card",
    "checklist-rules": "Smart-checklist engine",
    "roles-permissions": "Roles & permissions (FR-30)",
    "dashboard-card": "Dashboard card",
    "dashboard-summary": "Dashboard summariser",
    "sow-milestones": "SOW milestone schedule",
    "sow-flavor": "SOW template flavors (BR-7)",
    "settings-card": "Settings — upload limit (FR-26)",
    "documents": "Supporting documents",
    "audit": "Audit log",
    "volume": "Volume / performance",
    "estimation-engine": "Estimation engine",
    "resource-capacity": "Resource capacity (FR-27)",
    "engine-mapping": "Engine mapping",
    "estimate-csv": "CSV export",
    "xlsx": "Excel export",
    "price-mappers": "Cloud price mappers",
    "fx-rates.mapper": "FX rate mapper",
    "sso-config": "SSO config",
    "auth.service": "Auth service",
    "gm-scope": "GM visibility scope (FR-2)",
    "pagination": "Pagination (FR-9)",
    "reference-tree": "Reference tree",
    "problem-details": "RFC7807 problem+json",
    "zod-validation.pipe": "Zod validation pipe",
}


def area(f):
    base = os.path.basename(f).replace(".spec.ts", "").replace(".test.ts", "")
    return NAMES.get(base, base)


rx = re.compile(r"""\b(describe|it|test)\(\s*(['"])(.*?)\2\s*[,)]""")
sections, summary, total = [], [], 0
for f in files:
    items = rx.findall(open(f).read())
    cases = sum(1 for k, _, _ in items if k in ("it", "test"))
    total += cases
    summary.append((area(f), f, cases))
    lines = [f"## {area(f)}", "", f"_Source: `{f}` — {cases} cases_", ""]
    for kind, _, title in items:
        title = title.replace("|", "\\|")
        if kind == "describe":
            lines += ["", f"**{title}**", ""]
        else:
            lines.append(f"- {title}")
    sections.append("\n".join(lines).replace("\n\n\n", "\n\n"))

out = [
    "# Test Case Catalog — Kerdos (cost-reaper)",
    "",
    "A human-readable catalog of **every automated test case** in the project, derived",
    "directly from the test suites (`*.spec.ts` / `*.test.ts`). Each case is one `it()`",
    "assertion; suites are grouped by the card / area they exercise.",
    "",
    f"**Total: {total} test cases across {len(files)} suites.** All run in CI",
    "(build → format → lint → typecheck → **test** → build) and must pass before merge;",
    "the Playwright suite additionally runs the full stack end-to-end.",
    "",
    "> Regenerate after adding tests: `python3 scripts/gen-test-catalog.py`, then prettier",
    "> the file and re-render the .docx with the `pandoc/core` container.",
    "",
    "## Summary",
    "",
    "| Area | Source file | Cases |",
    "|---|---|--:|",
]
for a, f, c in summary:
    out.append(f"| {a} | `{f}` | {c} |")
out.append(f"| **Total** | | **{total}** |")
out += ["", "---", "", "\n\n".join(sections)]
open("docs/TEST_CASES.md", "w").write("\n".join(out) + "\n")
print(f"Wrote docs/TEST_CASES.md — {total} cases across {len(files)} suites")
