# Pipeline Observations

> **Purpose:** Empirical learnings from running the pipeline on real projects. These are not design decisions (see `decisions/`) or principles (see `design-priorities.md`) — they're patterns observed in practice that inform how we think about pipeline cost, quality, and process.

---

## Self-Describing Documents (DORA Frontmatter)

**Observed:** 2026-02-09
**Context:** ROAD-19 backfill across 4 completed OrangeQC projects (28 documents)

Each pipeline output document carries its own timing metadata in YAML frontmatter (`pipeline_stage`, `pipeline_completed_at`, etc.). This makes every document self-describing — the `/metrics` skill can compute timing reports by scanning frontmatter across all files in a project directory, rather than requiring a separate data store or manual timestamp tracking.

**Key tradeoff:** Backfilled data has lower precision than live-captured data. Document header dates give day-level accuracy; git commit timestamps give second-level accuracy. Only `completed_at` can be recovered retroactively — `started_at` is unrecoverable, so backfilled documents omit it. All backfilled documents are tagged (`pipeline_backfilled: true` + source attribution) so consumers can distinguish live from inferred timestamps.

**Implication:** Every new stage skill should capture timestamps in frontmatter at execution time. Retrofitting is possible but lossy.

---

## The Cost of a Superseded Pipeline Run

**Observed:** 2026-02-09
**Context:** `rename-landing-pages-to-public-pages` project (OrangeQC)

This project ran the full pipeline (Stages 0–7, PR #2268 created), but its PR was closed and superseded by `public-pages-codebase-rename` (PR #2269), which took a different approach — a codebase-wide rename rather than a UI-only string change.

**What this reveals about pipeline cost:**

- The pipeline identified a valid approach in 26 minutes of agent time (Stage 4 through 2 milestones). The total wall-clock from PRD to PR creation was ~2 hours (including Stages 0–3 and human approvals).
- The "wrong" approach was cheap enough to discard. The human recognized during PR review that a deeper rename was preferable, closed the PR, and pursued the alternative — which itself was also built quickly.
- This is evidence that the pipeline's cost model works: generating a complete, tested implementation is cheap enough that "try it and discard" is a viable strategy. The pipeline doesn't need to pick the optimal approach on the first try — it needs to make each attempt cheap.

**Implication:** Pipeline efficiency should be measured not just by "did the PR merge?" but by "was the total cost of exploration reasonable?" A closed PR with 26 minutes of agent time is a successful experiment, not a failure.

---

## Human Review Is the Bottleneck (Confirmed)

**Observed:** 2026-02-09
**Context:** DORA metrics across 4 completed OrangeQC projects

Aggregate data from all 4 completed projects:

| Metric | Value |
|--------|-------|
| Median milestone implementation time | 10 minutes |
| Fastest milestone | 4 minutes (inspection-schedule-limit M1) |
| 3 small projects (6 milestones total) | 53 minutes combined agent time |
| PR review time (2 merged PRs) | 2d 17h and 3d 1h |

Agent execution time is measured in minutes. Human review time is measured in days. This confirms Design Priority #5 ("Optimize the Bottleneck") — improvements that reduce human review friction (notifications, better PR descriptions, automated checks) will deliver more wall-clock speedup than making agents faster.

**Implication:** ROAD-02 (Notifications) and ROAD-09 (Code Review) likely have higher ROI than ROAD-11 (Ludicrous Speed) for reducing total lead time.
