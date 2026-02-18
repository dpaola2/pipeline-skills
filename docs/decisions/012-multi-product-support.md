# ADR-012: Multi-Product Pipeline Support

**Date:** 2026-02-07
**Status:** Superseded by ROAD-24 (skills now run from target repo; `pipeline.md` and `pipelines/` eliminated)
**Related:** ROAD-12, ROAD-05

---

## Context

The pipeline was originally built for OrangeQC (one product, four repos). Adding Show Notes (a separate Rails 8.1 web app at `~/projects/show-notes/`) as a second product required deciding how `pipeline.md` — which every skill reads — should handle multiple products.

All 8 existing skills reference `pipeline.md` by literal filename (37 occurrences). Any solution that changes the filename or adds parameters to skill invocations would require modifying every skill.

---

## Decision

**Active pointer pattern:** `pipeline.md` stays at the repo root as the file all skills read. A `pipelines/` directory holds named configs per product. Switching products is an explicit `cp pipelines/<product>.md pipeline.md` operation.

---

## Alternatives Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Active pointer** (chosen) | Zero skill changes, simple mental model, explicit switching | Manual copy to switch, can't interleave products in one session | Best for current scale |
| **Per-command product argument** (`/stage1 orangeqc/my-project`) | Explicit per-command, no switching | Changes all 8 skills, verbose invocations | Too much churn |
| **Symlink** (`pipeline.md → pipelines/show-notes.md`) | Single source of truth, no copy | Symlinks confuse git, editors, and Windows | Fragile |
| **Environment variable** (`PIPELINE_PRODUCT=show-notes`) | Shell-native, no file to manage | Invisible state, all 8 skills need env var reading | Invisible state is dangerous |
| **Per-project product resolution** (project declares its product, skills auto-resolve) | No switching, prevents cross-product mistakes | All 8 skills need resolution logic | Right long-term, wrong for now |

---

## Key Insights

### Why "active pointer" over "per-project resolution"

Per-project resolution is the architecturally correct long-term answer — each project should know which product it targets, and skills should resolve the pipeline config automatically. But it requires modifying every skill's "Before You Start" section to add resolution logic. The active pointer works today with zero skill changes and can evolve to per-project resolution later when the skill count or product count warrants it.

This is the same tradeoff as `git HEAD` — git could require you to specify the branch on every command, but instead it has a HEAD pointer that you explicitly switch with `checkout`/`switch`. The explicit switching act matches how developers actually work: you sit down to work on one product for a session, not interleaving commands between products.

### Why OPTIONAL sections matter for simpler products

OrangeQC's `PIPELINE.md` has 10 sections including API Conventions, Multi-Tenant Security, Backwards Compatibility, and Feature Flags. Show Notes' `PIPELINE.md` has 7 sections — three OPTIONAL sections don't apply (no API versioning, no multi-tenancy, no old clients). Skills already check for section existence before acting on them, so omitting sections is safe and keeps simple products simple.

### The detect → confirm → generate pattern in setup-pipeline-repo

Auto-detection of framework details is valuable (nobody wants to hand-type every Gemfile dependency), but silent misdetection is dangerous — a wrong test command in `PIPELINE.md` would cascade through Stages 4, 5, and create-pr. The `/setup-pipeline-repo` skill detects everything it can, then presents findings via `AskUserQuestion` for human confirmation before generating any files. This catches cases like a Gemfile with both `pg` and `sqlite3` (different environments use different adapters).

### The pipeline config is tiny by design

A pipeline config (`pipelines/<product>.md`) is ~15 lines — just a repo path table and a project tracker table. All the real configuration lives in the target repo's `PIPELINE.md`. This means adding a new product is lightweight (small pointer file), and framework details stay with the code they describe (Single Responsibility). The two-file split from ROAD-05 enables the multi-product split in ROAD-12.

---

## Consequences

- **Zero skill changes required** for this feature
- Switching products requires a manual copy command (low friction for 2 products, may not scale to 10)
- Projects don't yet declare which product they target — running a stage for the wrong product is possible if `pipeline.md` points to the wrong config (mitigated by the `Active product:` header note)
- Future evolution path: per-project product declaration + auto-resolution (when needed)
