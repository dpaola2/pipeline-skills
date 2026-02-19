# Skill Interface Reference

This is the API surface of every pipeline skill — what you configure, what you pass, what must exist, and what gets produced.

## How Skills Work

Skills are invoked as slash commands in a Claude Code session running **inside the target repo**. There is no persistent "current project" state — the **WCP callsign is passed as an argument** on every invocation. Each skill reads the conventions file in the repo root for all configuration, then reads project artifacts from WCP (`wcp_get_artifact`).

```
/discovery SN-3          ← callsign is an argument, not stored state
/implementation SN-3 M2  ← milestone is also an argument
```

This means you can work on multiple projects in the same repo without switching contexts — just change the callsign.

### Human Checkpoints

Two skills gate the pipeline on human approval:

1. **After Stage 2 (Architecture):** Read the `architecture-proposal.md` artifact, modify the Approval Checklist at the bottom to set Status to "Approved", and reattach the updated artifact. Stage 3 checks this before running.
2. **After Stage 3 (Gameplan):** Read the `gameplan.md` artifact, modify the Approval Checklist near the bottom to set Status to "Approved", and reattach the updated artifact. Stage 4 checks this before running.

### Branch Model

Stages 0-3 are branch-agnostic — they only write artifacts to WCP and don't touch target repo branches. Stage 4 is the transition point: it creates a project branch (`<branch-prefix><callsign>`) from the **local** default branch (configured in Repository Details). Stages 5-7 and create-pr all operate on that branch.

## Configuration Reference

Skills read from the `## Pipeline Configuration` section of the conventions file (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md` in the target repo root). The table below lists each subsection, whether it's required, and which skills read it.

| Config Section | Required? | Read By |
|----------------|-----------|---------|
| **Repository Details** (default branch, test command, branch prefix, PR base branch) | REQUIRED | prd, stage1, stage2, stage3, stage4, stage5, stage6, stage7, create-pr, metrics, quality |
| **Platforms** | REQUIRED | prd, stage1, stage2, stage3, stage4, stage5, stage6, stage7 |
| **Framework & Stack** (language, test framework, test data pattern, seed command, syntax check, debug patterns) | REQUIRED | prd, stage1, stage2, stage3, stage4, stage5, stage6, stage7 |
| **Directory Structure** (models, controllers, views, tests, migrations, etc.) | REQUIRED | stage1, stage2, stage4, stage5, stage6 |
| **Implementation Order** | REQUIRED | stage5 |
| **Related Repositories** | OPTIONAL | stage1 (API docs search), stage4 (Level 3 cross-platform tests) |
| **API Conventions** (response envelope, error format, pagination) | OPTIONAL | stage2, stage6 |
| **Multi-Tenant Security** (scoping rules, authorization model) | OPTIONAL | stage2, stage4, stage5, stage6 |
| **Backwards Compatibility** | OPTIONAL | stage2 |
| **Post-Flight Checks** (auto-fix and report-only checks) | OPTIONAL | create-pr |
| **Complexity Analysis** (tool, commands, threshold, file glob) | OPTIONAL | stage5 (per-milestone), create-pr (project-level), quality |
| **Project Tracker → Tool** | OPTIONAL | release-notes (must be "Linear") |

---

## Skill Reference

### `/pipeline-setup [repo-path]`

Auto-detect framework, stack, and directory structure, then write the Pipeline Configuration section into the conventions file.

| | |
|---|---|
| **Invocation** | `/pipeline-setup` or `/pipeline-setup <repo-path>` |
| **Arguments** | Optional `repo-path` — defaults to current working directory |
| **Prerequisites** | Target directory is a git repository with a dependency file (Gemfile, package.json, mix.exs, etc.) |
| **Reads** | Dependency files, CI config, directory structure, git config |
| **Produces** | `## Pipeline Configuration` section in the conventions file |
| **Side Effects** | Creates or modifies conventions file |
| **Human Action** | Review the generated Pipeline Configuration and adjust any values before running pipeline stages. |

---

### `/prd`

Generate a structured PRD from a WCP work item.

| | |
|---|---|
| **Invocation** | `/prd` |
| **Arguments** | None — the skill prompts interactively for callsign selection via `AskUserQuestion` |
| **Prerequisites** | WCP work item with body text describing the feature |
| **Reads** | Conventions file (full Pipeline Configuration); WCP work item body via `wcp_get` |
| **Produces** | `wcp_attach(callsign, ...)` → `prd.md` |
| **Side Effects** | None |
| **Human Action** | Review the PRD — resolve all `[CONFIRM]`, `[NEEDS INPUT]`, `[NEEDS REVIEW]`, `[INFERRED]`, and `[DEFINE]` markers. Set Status to "Ready for Engineering" when satisfied. |

---

### `/discovery <callsign>`

Explore the codebase to understand current state before designing changes.

| | |
|---|---|
| **Invocation** | `/discovery <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | `wcp_get_artifact(callsign, "prd.md")` exists |
| **Reads** | Conventions file (full Pipeline Configuration); PRD via `wcp_get_artifact(callsign, "prd.md")`; target repo codebase (read-only); API docs repo (if Related Repositories configured) |
| **Produces** | `wcp_attach(callsign, ...)` → `discovery-report.md` |
| **Side Effects** | None — read-only exploration of target repo |
| **Human Action** | Optional review of discovery report before proceeding |

---

### `/architecture <callsign>`

Design data model, API endpoints, migrations, and security scoping.

| | |
|---|---|
| **Invocation** | `/architecture <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | `wcp_get_artifact(callsign, "prd.md")` and `wcp_get_artifact(callsign, "discovery-report.md")` exist |
| **Reads** | Conventions file (full Pipeline Configuration); PRD; discovery report; target repo codebase (read-only) — all artifacts via `wcp_get_artifact` |
| **Produces** | `wcp_attach(callsign, ...)` → `architecture-proposal.md`; optionally `wcp_attach(callsign, ...)` → `decisions/ADR-*.md` |
| **Side Effects** | None — read-only exploration of target repo |
| **Human Action** | **REQUIRED.** Review and approve the architecture proposal. Read the `architecture-proposal.md` artifact, modify the Approval Checklist at the bottom to set Status to "Approved" (or "Approved with Modifications"), fill in the reviewer checklist, and reattach the updated artifact. |

---

### `/gameplan <callsign>`

Produce the engineering gameplan from PRD + discovery + approved architecture.

| | |
|---|---|
| **Invocation** | `/gameplan <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | Architecture proposal must be **approved** (Approval Checklist Status = "Approved" or "Approved with Modifications") |
| **Reads** | Conventions file (full Pipeline Configuration); PRD; discovery report; architecture proposal — all artifacts via `wcp_get_artifact` |
| **Produces** | `wcp_attach(callsign, ...)` → `gameplan.md`; backfills `pipeline_approved_at` in architecture-proposal.md artifact |
| **Side Effects** | None |
| **Human Action** | **REQUIRED.** Review and approve the gameplan. Read the `gameplan.md` artifact, modify the Approval Checklist near the bottom to set Status to "Approved", and reattach the updated artifact. |

---

### `/test-generation <callsign>`

Write failing TDD test suites before any implementation code exists.

| | |
|---|---|
| **Invocation** | `/test-generation <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | Gameplan must be **approved**; clean working tree in target repo |
| **Reads** | Conventions file (full Pipeline Configuration); gameplan; architecture proposal; PRD; discovery report — all artifacts via `wcp_get_artifact`; existing test patterns in target repo |
| **Produces** | Test files and test data files (factories/fixtures) in the target repo; `wcp_attach(callsign, ...)` → `test-coverage-matrix.md`; backfills `pipeline_approved_at` in gameplan.md artifact |
| **Side Effects** | Creates branch `<branch-prefix><callsign>` in the target repo; commits test files to that branch |
| **Human Action** | Optional review of tests before implementation |

---

### `/implementation <callsign> <milestone>`

Implement one milestone — write code to make Stage 4's failing tests pass.

| | |
|---|---|
| **Invocation** | `/implementation <callsign> <milestone>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`); `milestone` — positional, required (e.g., `M1`, `M2`, case-insensitive) |
| **Prerequisites** | Gameplan approved; project branch `<branch-prefix><callsign>` exists (created by Stage 4); clean working tree; for M2+, prior milestone tests must pass |
| **Reads** | Conventions file (full Pipeline Configuration); gameplan; architecture proposal; test-coverage-matrix; discovery report; PRD — all artifacts via `wcp_get_artifact`; test files for this milestone; existing codebase patterns |
| **Produces** | Implementation code in target repo (on project branch); `wcp_attach(callsign, ...)` → `progress.md` (created or updated); optionally `wcp_attach(callsign, ...)` → `decisions/ADR-*.md` |
| **Side Effects** | Commits implementation to project branch; may update conventions file with codebase insights; captures quality metrics if Complexity Analysis configured |
| **Human Action** | None between milestones (run next milestone when ready) |

**Note:** Run once per milestone. The skill refuses to implement multiple milestones in a single invocation.

---

### `/review <callsign>`

Review the full branch diff against conventions, security, spec, and code quality.

| | |
|---|---|
| **Invocation** | `/review <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | All milestones marked Complete in progress.md; project branch exists; clean working tree |
| **Reads** | Conventions file (full Pipeline Configuration); architecture proposal; gameplan; progress.md; test-coverage-matrix — all artifacts via `wcp_get_artifact`; all changed files on the project branch |
| **Produces** | `wcp_attach(callsign, ...)` → `review-report.md` |
| **Side Effects** | None — report-only, does not modify target repo |
| **Human Action** | If verdict is CHANGES REQUESTED, fix blocker/major findings and re-run. If APPROVED, proceed to Stage 7. |

---

### `/qa-plan <callsign>`

Generate a comprehensive QA plan for manual testing handoff.

| | |
|---|---|
| **Invocation** | `/qa-plan <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | All milestones marked Complete in progress.md |
| **Reads** | Conventions file (Repository Details, Framework & Stack, Platforms); PRD; gameplan; architecture proposal; test-coverage-matrix; progress.md — all artifacts via `wcp_get_artifact` |
| **Produces** | `wcp_attach(callsign, ...)` → `qa-plan.md` |
| **Side Effects** | None |
| **Human Action** | Hand off the QA plan to a tester. |

---

### `/create-pr <callsign>`

Push the implementation branch and create a GitHub PR.

| | |
|---|---|
| **Invocation** | `/create-pr <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | All milestones Complete; QA plan exists; project branch exists; clean working tree; no existing open PR for this branch |
| **Reads** | Conventions file (Repository Details, Post-Flight Checks, Complexity Analysis); progress.md; qa-plan.md; gameplan.md; prd.md — all artifacts via `wcp_get_artifact` |
| **Produces** | GitHub PR; updates `progress.md` artifact with PR timing/URL and quality data; `wcp_attach(callsign, ...)` → `metrics.md` |
| **Side Effects** | Pushes branch to remote; creates GitHub PR; runs post-flight checks (auto-fix + report); runs complexity analysis |
| **Human Action** | Review and merge the PR. Share the QA plan with the tester. |

---

### `/metrics <callsign>`

Compute pipeline timing metrics from document frontmatter.

| | |
|---|---|
| **Invocation** | `/metrics <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | WCP work item has pipeline artifacts with YAML frontmatter |
| **Reads** | Conventions file (Repository Details); all artifact `.md` files via `wcp_get_artifact` (frontmatter); GitHub PR data via `gh` CLI |
| **Produces** | `wcp_attach(callsign, ...)` → `metrics.md` |
| **Side Effects** | None |
| **Human Action** | None |

---

### `/quality <callsign>`

Generate a code quality report from quality frontmatter and optional fresh analysis.

| | |
|---|---|
| **Invocation** | `/quality <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | `progress.md` artifact exists with `pipeline_quality_*` frontmatter fields (captured during Stage 5 when Complexity Analysis is configured) |
| **Reads** | Conventions file (Repository Details, Complexity Analysis); progress.md frontmatter via `wcp_get_artifact`; optionally the project branch (for fresh analysis) |
| **Produces** | `wcp_attach(callsign, ...)` → `quality.md` |
| **Side Effects** | May temporarily check out the project branch for fresh analysis (switches back when done) |
| **Human Action** | None |

---

### `/release-notes <cycle_number>`

Generate release notes from a Linear cycle. Standalone utility — not a pipeline stage.

| | |
|---|---|
| **Invocation** | `/release-notes <cycle_number>` |
| **Arguments** | `cycle_number` — positional, required (integer, e.g., `47`) |
| **Prerequisites** | Pipeline Configuration → Project Tracker must be "Linear"; the target cycle must exist on the Engineering team |
| **Reads** | Conventions file (Project Tracker); previous release notes via WCP; Linear API (teams, cycles, issues, statuses) |
| **Produces** | Release notes document (output location configured per invocation) |
| **Side Effects** | Prompts interactively for iOS and Android build numbers via `AskUserQuestion` |
| **Human Action** | Review and wordsmith the draft. Remove `[INTERNAL?]` flags. Post to the appropriate channel. |

---

### `/backfill-timing <callsign>`

Retrofit YAML frontmatter onto existing project artifacts created before timing was implemented.

| | |
|---|---|
| **Invocation** | `/backfill-timing <callsign>` |
| **Arguments** | `callsign` — WCP work item identifier (e.g., `SN-3`) |
| **Prerequisites** | WCP work item has pipeline artifacts |
| **Reads** | All artifact `.md` files via `wcp_get_artifact`; git commit timestamps; document header dates; approval checklist dates |
| **Produces** | Reattaches modified artifacts with YAML frontmatter prepended (`pipeline_backfilled: true`) |
| **Side Effects** | Modifies artifact frontmatter only, not content |
| **Human Action** | None. Run `/metrics <callsign>` afterward to see the computed timing data. |

---

## Pipeline Flow Cheat Sheet

Quick-reference sequence showing the full pipeline with arguments and key gates.

| Step | Command | Arguments | Gate Before | Key Output |
|------|---------|-----------|-------------|------------|
| — | `/pipeline-setup` | `[repo-path]` | Git repo exists | `## Pipeline Configuration` in conventions file |
| 0 | `/prd` | _(interactive)_ | WCP work item with body text | `prd.md` |
| — | _Human reviews PRD_ | | | |
| 1 | `/discovery` | `<callsign>` | `prd.md` exists | `discovery-report.md` |
| 2 | `/architecture` | `<callsign>` | `discovery-report.md` exists | `architecture-proposal.md` |
| — | **Human approves architecture** | | | |
| 3 | `/gameplan` | `<callsign>` | Architecture approved | `gameplan.md` |
| — | **Human approves gameplan** | | | |
| 4 | `/test-generation` | `<callsign>` | Gameplan approved; clean tree | Test files + branch + `test-coverage-matrix.md` |
| 5 | `/implementation` | `<callsign> M1` | Branch exists; clean tree | Implementation code + `progress.md` |
| 5 | `/implementation` | `<callsign> M2` | M1 tests pass | Implementation code + `progress.md` updated |
| 5 | _(repeat for each milestone)_ | `<callsign> MN` | Prior tests pass | |
| 6 | `/review` | `<callsign>` | All milestones complete; clean tree | `review-report.md` |
| 7 | `/qa-plan` | `<callsign>` | All milestones complete | `qa-plan.md` |
| PR | `/create-pr` | `<callsign>` | All complete; QA plan exists; no open PR | GitHub PR + `metrics.md` |

### Setup & Utility Skills (run anytime)

| Command | Arguments | Purpose |
|---------|-----------|---------|
| `/pipeline-setup` | `[repo-path]` | Auto-detect stack, write Pipeline Configuration |
| `/metrics` | `<callsign>` | Compute timing metrics from frontmatter |
| `/quality` | `<callsign>` | Generate code quality report |
| `/release-notes` | `<cycle_number>` | Generate release notes from Linear cycle |
| `/backfill-timing` | `<callsign>` | Retrofit frontmatter onto older artifacts |
