# ADR-0003 — Autonomous operation with human-gated exceptions

- **Status:** Accepted (2026-06-11)
- **Context:** CLAUDE.md Section 0.1 sets AUTONOMOUS mode: build without pausing for routine confirmation; supervise asynchronously through the three living files.
- **Decision:** Decide → record an ADR → update the living files → continue. Resolve ambiguity with the simplest robust option and log it. A small set of actions remain **human-gated**: pushing to protected branches / `main`, force-push, deleting branches/tags/history, deploys, destructive data ops, secret handling, and anything that spends money or changes org/repo settings.
- **Consequences:** Fast progress with an auditable trail. Branch deletion (the stale placeholder cleanup) required explicit human approval and was granted before acting.
