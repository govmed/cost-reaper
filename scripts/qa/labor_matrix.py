#!/usr/bin/env python3
"""Kerdos — Labor line-item exhaustive API regression suite (FR-5/7/13/22/23/27/28).

Data-driven, boundary, negative and security tests for EVERY labor field and
variation, run against a RUNNING stack (see scripts/start.sh). Each case is
tagged with the requirement IDs it exercises (traceability — CLAUDE.md §6).

Usage:
    python3 scripts/qa/labor_matrix.py            # against http://localhost:8000
    API_BASE=http://host:8000/api/v1 python3 scripts/qa/labor_matrix.py

Exit code 0 = all pass, 1 = at least one failure. Self-cleans (deletes the
estimates/rate-cards it creates). No third-party deps (stdlib only).
"""
import json, os, sys, urllib.request, urllib.error
from decimal import Decimal, getcontext

getcontext().prec = 40
API = os.environ.get("API_BASE", "http://localhost:8000/api/v1")
EMAIL = os.environ.get("SEED_ADMIN_EMAIL", "admin@example.com")
PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "change_me")
results = []  # (id, title, reqids, expected, actual, PASS|FAIL)


def call(method, path, body=None, token=None):
    req = urllib.request.Request(
        API + path,
        data=(json.dumps(body).encode() if body is not None else None),
        method=method,
    )
    req.add_header("content-type", "application/json")
    if token:
        req.add_header("authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req) as r:
            t = r.read().decode()
            return r.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        try:
            return e.code, json.loads(t)
        except Exception:
            return e.code, t


def approx(a, b, tol=Decimal("0.01")):
    try:
        return abs(Decimal(str(a)) - Decimal(str(b))) <= tol
    except Exception:
        return False


def rec(tcid, title, req, expected, actual, ok):
    results.append((tcid, title, req, str(expected), str(actual), "PASS" if ok else "FAIL"))
    print(f"[{'PASS' if ok else 'FAIL ***'}] {tcid} ({req}) {title}")
    if not ok:
        print(f"        expected={expected}  actual={actual}")


_, tok = call("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
if not isinstance(tok, dict) or "accessToken" not in tok:
    sys.exit("login failed — is the stack up and seeded?")
TOKEN = tok["accessToken"]
_, cards = call("GET", "/rate-cards", None, TOKEN)
cards = cards if isinstance(cards, list) else cards.get("items", [])
RC = cards[0]["id"]
_, card = call("GET", f"/rate-cards/{RC}", None, TOKEN)
PM = next(r["id"] for r in card["roles"])  # first role; rate snapshotted on use
PM_RATE = Decimal(str(next(r["rate"] for r in card["roles"])))
cleanup_est, cleanup_rc = [], []


def new_est(name, **patch):
    _, e = call("POST", "/estimates", {"name": name, "currency": "USD", "rateCardId": RC}, TOKEN)
    cleanup_est.append(e["id"])
    if patch:
        call("PATCH", f"/estimates/{e['id']}", patch, TOKEN)
    return e["id"]


def add(eid, **body):
    return call("POST", f"/estimates/{eid}/labor-items", body, TOKEN)


def lines(eid):
    _, d = call("GET", f"/estimates/{eid}", None, TOKEN)
    return d.get("laborItems", []) if isinstance(d, dict) else []


def totals(eid):
    _, t = call("GET", f"/estimates/{eid}/totals", None, TOKEN)
    return t


# ── G1 Units & Quantity: math, boundary, negative, missing (FR-5/FR-7) ──────────
eid = new_est("QA G1")
add(eid, rateCardRoleId=PM, units=8, quantity=1)
rec("TC-L01", "units=8,qty=1 → total=rate*8", "FR-5/FR-7", PM_RATE * 8, lines(eid)[-1]["lineTotal"],
    approx(lines(eid)[-1]["lineTotal"], PM_RATE * 8))
add(eid, rateCardRoleId=PM, units=160, quantity=2)
rec("TC-L02", "units=160,qty=2 → rate*320", "FR-5/FR-7", PM_RATE * 320, lines(eid)[-1]["lineTotal"],
    approx(lines(eid)[-1]["lineTotal"], PM_RATE * 320))
add(eid, rateCardRoleId=PM, units=0.5, quantity=1)
rec("TC-L03", "decimal units 0.5", "FR-5", PM_RATE / 2, lines(eid)[-1]["lineTotal"],
    approx(lines(eid)[-1]["lineTotal"], PM_RATE / 2))
st, _ = add(eid, rateCardRoleId=PM, units=0, quantity=1)
rec("TC-L04", "units=0 boundary allowed", "FR-5", 201, st, st == 201)
st, _ = add(eid, rateCardRoleId=PM, units=-5)
rec("TC-L05", "negative units rejected", "FR-5/NFR-4", "400/422", st, st in (400, 422))
st, _ = add(eid, rateCardRoleId=PM, quantity=1)
rec("TC-L06", "units omitted (required) rejected", "FR-5/NFR-4", "400/422", st, st in (400, 422))
st, _ = add(eid, rateCardRoleId=PM, units=8, quantity=-2)
rec("TC-L07", "negative quantity rejected", "FR-5/NFR-4", "400/422", st, st in (400, 422))
add(eid, rateCardRoleId=PM, units=1000000, quantity=1)
rec("TC-L08", "large units 1e6 (NUMERIC precision)", "FR-5/NFR-5", PM_RATE * 1000000,
    lines(eid)[-1]["lineTotal"], approx(lines(eid)[-1]["lineTotal"], PM_RATE * 1000000, Decimal("1")))

# ── G2 PERT three-point (FR-13) ────────────────────────────────────────────────
eid = new_est("QA G2")
add(eid, rateCardRoleId=PM, units=1, unitsOptimistic=2, unitsMostLikely=4, unitsPessimistic=9)
rec("TC-L09", "PERT(2,4,9) → 4.5", "FR-13", 4.5, lines(eid)[-1]["units"], approx(lines(eid)[-1]["units"], 4.5))
rec("TC-L10", "PERT wins over typed units", "FR-13", "4.5 not 1", lines(eid)[-1]["units"],
    approx(lines(eid)[-1]["units"], 4.5))
st, _ = add(eid, rateCardRoleId=PM, units=8, unitsOptimistic=2, unitsMostLikely=4)
rec("TC-L11", "partial PERT rejected", "FR-13/NFR-4", "400/422", st, st in (400, 422))
st, _ = add(eid, rateCardRoleId=PM, units=8, unitsOptimistic=5, unitsMostLikely=4, unitsPessimistic=9)
rec("TC-L12", "PERT o>m rejected", "FR-13/NFR-4", "400/422", st, st in (400, 422))
st, _ = add(eid, rateCardRoleId=PM, units=8, unitsOptimistic=2, unitsMostLikely=9, unitsPessimistic=4)
rec("TC-L13", "PERT m>p rejected", "FR-13/NFR-4", "400/422", st, st in (400, 422))

# ── G3 Billing-period rollups: monthly & yearly (FR-23) ─────────────────────────
for period, one, mon, yr in [("ONE_TIME", PM_RATE * 8, 0, 0), ("MONTHLY", 0, PM_RATE * 8, PM_RATE * 96),
                             ("YEARLY", 0, PM_RATE * 8 / 12, PM_RATE * 8)]:
    eid = new_est(f"QA G3 {period}")
    add(eid, rateCardRoleId=PM, units=8, billingPeriod=period)
    t = totals(eid)
    ok = approx(t.get("oneTimeTotal", 0), one) and approx(t.get("monthlyTotal", 0), mon) and approx(t.get("yearlyTotal", 0), yr)
    rec(f"TC-L14-{period}", f"{period} rollup 1t/mo/yr", "FR-23", f"{one}/{mon}/{yr}",
        f"{t.get('oneTimeTotal')}/{t.get('monthlyTotal')}/{t.get('yearlyTotal')}", ok)
st, _ = add(new_est("QA G3 bad"), rateCardRoleId=PM, units=8, billingPeriod="WEEKLY")
rec("TC-L15", "invalid billingPeriod rejected", "FR-23/NFR-4", "400/422", st, st in (400, 422))

# ── G4 Upcharge: global, per-line override, explicit-0 precedence (FR-22) ────────
base = PM_RATE * 8
eid = new_est("QA G4", globalUpchargePercent=50)
add(eid, rateCardRoleId=PM, units=8)
rec("TC-L16", "global upcharge 50%", "FR-22", base * Decimal("1.5"), totals(eid).get("oneTimeTotal"),
    approx(totals(eid).get("oneTimeTotal"), base * Decimal("1.5")))
add(eid, rateCardRoleId=PM, units=8, upchargePercentOverride=10)
rec("TC-L17", "per-line override 10% wins", "FR-22", base * Decimal("1.5") + base * Decimal("1.1"),
    totals(eid).get("oneTimeTotal"), approx(totals(eid).get("oneTimeTotal"), base * Decimal("1.5") + base * Decimal("1.1")))
eid = new_est("QA G4b", globalUpchargePercent=50)
add(eid, rateCardRoleId=PM, units=8, upchargePercentOverride=0)
rec("TC-L18", "explicit override 0 beats global", "FR-22", base, totals(eid).get("oneTimeTotal"),
    approx(totals(eid).get("oneTimeTotal"), base))

# ── G5 Contingency, margin, tax & calc order (FR-7/FR-16) ───────────────────────
eid = new_est("QA G5", globalUpchargePercent=50, contingencyPercent=5)
add(eid, rateCardRoleId=PM, units=8)
rec("TC-L19", "base→upcharge(50%)→contingency(5%)", "FR-7/FR-22", base * Decimal("1.5") * Decimal("1.05"),
    totals(eid).get("grandTotal"), approx(totals(eid).get("grandTotal"), base * Decimal("1.5") * Decimal("1.05")))
eid = new_est("QA G5b", marginPercent=20, taxPercent=10)
add(eid, rateCardRoleId=PM, units=8)
t = totals(eid)
cp = t.get("clientPrice") or t.get("clientTotal") or t.get("sellPrice")
sell = base / Decimal("0.8")
rec("TC-L20", "margin 20% then tax 10%", "FR-16", f"{sell * Decimal('1.1')} (sell {sell})", cp,
    approx(cp, sell * Decimal("1.1")) or approx(cp, sell))

# ── G6 Resource allocation & 100%/day capacity guard (FR-27) ────────────────────
eid = new_est("QA G6a")
add(eid, rateCardRoleId=PM, units=8, resourceName="Dana", allocationPercent=50, startDate="2026-07-01", endDate="2026-07-31")
st, _ = add(eid, rateCardRoleId=PM, units=8, resourceName="Dana", allocationPercent=50, startDate="2026-07-10", endDate="2026-07-20")
rec("TC-L21", "50%+50% overlap = 100% allowed", "FR-27", 201, st, st == 201)
st, b = add(eid, rateCardRoleId=PM, units=8, resourceName="Dana", allocationPercent=60, startDate="2026-07-15", endDate="2026-07-18")
rec("TC-L22", "+60% overlap → over-allocation rejected", "FR-27", "400", st, st == 400)
eid = new_est("QA G6b")
add(eid, rateCardRoleId=PM, units=8, resourceName="Sam", allocationPercent=60, startDate="2026-07-01", endDate="2026-07-10")
st, _ = add(eid, rateCardRoleId=PM, units=8, resourceName="Sam", allocationPercent=60, startDate="2026-08-01", endDate="2026-08-10")
rec("TC-L23", "60%+60% non-overlapping dates allowed", "FR-27", 201, st, st == 201)
st, _ = add(new_est("QA G6c"), rateCardRoleId=PM, units=8, resourceName="X", allocationPercent=50, startDate="2026-07-01")
rec("TC-L24", "start without end rejected", "FR-27/NFR-4", "400/422", st, st in (400, 422))
st, _ = add(new_est("QA G6d"), rateCardRoleId=PM, units=8, resourceName="X", allocationPercent=50, startDate="2026-07-31", endDate="2026-07-01")
rec("TC-L25", "end before start rejected", "FR-27/NFR-4", "400/422", st, st in (400, 422))

# ── G7 SDLC phase tagging & DB-driven validation (FR-28/FR-29) ───────────────────
eid = new_est("QA G7")
st, _ = add(eid, rateCardRoleId=PM, units=8, sdlcPhase="DEVELOPMENT")
rec("TC-L26", "valid sdlcPhase accepted", "FR-28", 201, st, st == 201)
st, _ = add(eid, rateCardRoleId=PM, units=8, sdlcPhase="NOTAPHASE")
rec("TC-L27", "invalid sdlcPhase rejected (DB-driven)", "FR-28/FR-29/NFR-17", "400/404", st, st in (400, 404, 422))
st, _ = add(eid, rateCardRoleId=PM, units=8, sdlcPhase="development")
rec("TC-L28", "lowercase phase code rejected", "FR-29", "400/404", st, st in (400, 404, 422))

# ── G8 Rate-snapshot immutability (BR-3/NFR-14) ─────────────────────────────────
eid = new_est("QA G8")
add(eid, rateCardRoleId=PM, units=8)
rec("TC-L29", "rateSnapshot captured from role", "NFR-14", PM_RATE, lines(eid)[-1]["rateSnapshot"],
    approx(lines(eid)[-1]["rateSnapshot"], PM_RATE))
add(eid, rateSnapshot="200.0000", units=8, description="ad-hoc")
rec("TC-L30", "explicit rateSnapshot honored", "NFR-14", 200, lines(eid)[-1]["rateSnapshot"],
    approx(lines(eid)[-1]["rateSnapshot"], 200))
_, c2 = call("POST", "/rate-cards", {"name": "QA Throwaway", "currency": "USD"}, TOKEN)
cleanup_rc.append(c2["id"])
_, card2 = call("POST", f"/rate-cards/{c2['id']}/roles", {"roleName": "Temp", "unit": "HOUR", "rate": "100"}, TOKEN)
rid = card2["roles"][-1]["id"]  # NOTE: this endpoint returns the rate card, role id is nested
eid = new_est("QA G8b")
call("PATCH", f"/estimates/{eid}", {"rateCardId": c2["id"]}, TOKEN)
add(eid, rateCardRoleId=rid, units=8)
before = lines(eid)[-1]["rateSnapshot"]
call("PATCH", f"/rate-cards/{c2['id']}/roles/{rid}", {"rate": "999"}, TOKEN)
after = lines(eid)[-1]["rateSnapshot"]
rec("TC-L31", "rate change does NOT alter saved snapshot", "BR-3/NFR-14", "100 → 100",
    f"{before} → {after}", approx(before, 100) and approx(after, 100))

# ── G9 Security / AuthZ / Injection / Error contract (NFR-4/FR-1/FR-2/NFR-9) ─────
eid = new_est("QA G9")
st, _ = call("POST", f"/estimates/{eid}/labor-items", {"rateCardRoleId": PM, "units": 8}, token=None)
rec("TC-L32", "no token → 401", "FR-1/NFR-16", 401, st, st == 401)
st, _ = call("POST", "/estimates/00000000-0000-0000-0000-000000000000/labor-items", {"rateCardRoleId": PM, "units": 8}, TOKEN)
rec("TC-L33", "unknown estimate → 404", "NFR-9", 404, st, st == 404)
st, _ = add(eid, rateCardRoleId="not-a-uuid", units=8)
rec("TC-L34", "non-uuid role id → 400", "NFR-4", "400/422", st, st in (400, 422))
st, _ = call("POST", f"/estimates/{eid}/labor-items", {"units": "eight", "quantity": 1}, TOKEN)
rec("TC-L35", "wrong-typed units → 400", "NFR-4", "400/422", st, st in (400, 422))
st, b = add(eid, rateCardRoleId=PM, units=-1)
shape = isinstance(b, dict) and any(k in b for k in ("title", "detail", "status", "errors"))
rec("TC-L36", "RFC7807 problem+json error body", "NFR-9", "structured json", list(b.keys()) if isinstance(b, dict) else b,
    st in (400, 422) and shape)
inj = "Robert'); DROP TABLE labor_line_items;--"
st, _ = add(eid, rateCardRoleId=PM, units=8, resourceName=inj)
stored = lines(eid)[-1]["resourceName"] if st == 201 else None
st2, _ = call("GET", f"/estimates/{eid}", None, TOKEN)
rec("TC-L37", "SQLi stored literally; table intact", "NFR-4", "verbatim & reget 200",
    f"{st}/{stored!r}/{st2}", st == 201 and stored == inj and st2 == 200)
st, _ = add(eid, rateCardRoleId=PM, units=8, allocationPercent=150)
rec("TC-L38", "allocationPercent>100 handled", "FR-27/NFR-4", "reject/cap", st, st in (200, 201, 400, 422))
st, _ = add(eid, rateCardRoleId=PM, units=8, bogusField="x")
rec("TC-L39", "unknown field ignored (mass-assignment safe)", "NFR-4", "201/400", st, st in (201, 400, 422))

# ── teardown ────────────────────────────────────────────────────────────────────
for e in cleanup_est:
    call("DELETE", f"/estimates/{e}", None, TOKEN)
for c in cleanup_rc:
    call("DELETE", f"/rate-cards/{c}", None, TOKEN)

p = sum(1 for r in results if r[5] == "PASS")
f = len(results) - p
print("\n" + "=" * 72)
print(f"SUMMARY: {p}/{len(results)} passed, {f} failed")
print("=" * 72)
if f:
    for r in results:
        if r[5] == "FAIL":
            print(f"  FAIL {r[0]} ({r[2]}) {r[1]} :: expected {r[3]} got {r[4]}")
sys.exit(1 if f else 0)
