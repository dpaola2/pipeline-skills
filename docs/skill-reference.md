# Skill Interface Reference

This is the API surface of every pipeline skill — what you configure, what you pass, what must exist, and what gets produced.

## How Skills Work

Skills are invoked as slash commands in a Claude Code session running **inside the target repo**. There is no persistent "current project" state — the **project slug is passed as an argument** on every invocation. Each skill reads the conventions file in the repo root for all configuration, then reads project artifacts from the external projects directory.

```
/discovery my-feature          ← slug is an argument, not stored state
/implementation my-feature M2  ← milestone is also an argument
```

This means you can work on multiple projects in the same repo without switching contexts — just change the slug.

### Human Checkpoints

Two skills gate the pipeline on human approval:

1. **After Stage 2 (Architecture):** Edit `architecture-proposal.md`, find the Approval Checklist at the bottom, set Status to "Approved". Stage 3 checks this before running.
2. **After Stage 3 (Gameplan):** Edit `gameplan.md`, find the Approval Checklist near the bottom, set Status to "Approved". Stage 4 checks this before running.

### Artifact Commits

Every skill that produces project artifacts (files in `<projects-path>/<slug>/`) commits them to git if the projects directory is inside a git repo. These are separate from target repo commits — project artifacts live outside the target repo.

---

## Configuration Reference

Skills read from the `## Pipeline Configuration` section of the conventions file (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md` in the target repo root). The table below lists each subsection, whether it's required, and which skills read it.

| Config Section | Required? | Read By |
|----------------|-----------|---------|
| **Work Directory → Projects** | REQUIRED | All skills except release-notes (which also reads it) |
| **Work Directory → Inbox** | REQUIRED | prd |
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
| **Produces** | `## Pipeline Configuration` section in the conventions file; creates projects directory |
| **Side Effects** | Creates or modifies conventions file; creates projects/inbox directories |
| **Human Action** | Review the generated Pipeline Configuration and adjust any values before running pipeline stages. |

---

### `/prd`

Generate a structured PRD from raw inbox notes.

| | |
|---|---|
| **Invocation** | `/prd` |
| **Arguments** | None — the skill prompts interactively for file selection and project slug via `AskUserQuestion` |
| **Prerequisites** | At least one file in the inbox directory (from Work Directory → Inbox) |
| **Reads** | Conventions file (full Pipeline Configuration); inbox files |
| **Produces** | `<projects-path>/<slug>/prd.md`; commits to projects repo |
| **Side Effects** | Creates project directory if it doesn't exist |
| **Human Action** | Review the PRD — resolve all `[CONFIRM]`, `[NEEDS INPUT]`, `[NEEDS REVIEW]`, `[INFERRED]`, and `[DEFINE]` markers. Set Status to "Ready for Engineering" when satisfied. |

---

### `/discovery <project-slug>`

Explore the codebase to understand current state before designing changes.

| | |
|---|---|
| **Invocation** | `/discovery <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | `<projects-path>/<slug>/prd.md` exists |
| **Reads** | Conventions file (full Pipeline Configuration); PRD; target repo codebase (read-only); API docs repo (if Related Repositories configured) |
| **Produces** | `<projects-path>/<slug>/discovery-report.md`; commits to projects repo |
| **Side Effects** | None — read-only exploration of target repo |
| **Human Action** | Optional review of discovery report before proceeding |

---

### `/architecture <project-slug>`

Design data model, API endpoints, migrations, and security scoping.

| | |
|---|---|
| **Invocation** | `/architecture <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | `<projects-path>/<slug>/prd.md` and `discovery-report.md` exist |
| **Reads** | Conventions file (full Pipeline Configuration); PRD; discovery report; target repo codebase (read-only) |
| **Produces** | `<projects-path>/<slug>/architecture-proposal.md`; optionally `<projects-path>/<slug>/decisions/ADR-*.md`; commits to projects repo |
| **Side Effects** | None — read-only exploration of target repo |
| **Human Action** | **REQUIRED.** Review and approve the architecture proposal. Edit `architecture-proposal.md`, find the Approval Checklist at the bottom, set Status to "Approved" (or "Approved with Modifications"), and fill in the reviewer checklist. |

---

### `/gameplan <project-slug>`

Produce the engineering gameplan from PRD + discovery + approved architecture.

| | |
|---|---|
| **Invocation** | `/gameplan <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | Architecture proposal must be **approved** (Approval Checklist Status = "Approved" or "Approved with Modifications") |
| **Reads** | Conventions file (full Pipeline Configuration); PRD; discovery report; architecture proposal |
| **Produces** | `<projects-path>/<slug>/gameplan.md`; backfills `pipeline_approved_at` in architecture-proposal.md frontmatter; commits to projects repo |
| **Side Effects** | Commits any pending human edits in the projects directory (e.g., approval edits) |
| **Human Action** | **REQUIRED.** Review and approve the gameplan. Edit `gameplan.md`, find the Approval Checklist near the bottom, set Status to "Approved". |

---

### `/test-generation <project-slug>`

Write failing TDD test suites before any implementation code exists.

| | |
|---|---|
| **Invocation** | `/test-generation <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | Gameplan must be **approved**; clean working tree in target repo |
| **Reads** | Conventions file (full Pipeline Configuration); gameplan; architecture proposal; PRD; discovery report; existing test patterns in target repo |
| **Produces** | Test files and test data files (factories/fixtures) in the target repo; `<projects-path>/<slug>/test-coverage-matrix.md`; backfills `pipeline_approved_at` in gameplan.md frontmatter |
| **Side Effects** | Creates branch `<branch-prefix><slug>` in the target repo; commits test files to that branch; commits artifacts to projects repo |
| **Human Action** | Optional review of tests before implementation |

---

### `/implementation <project-slug> <milestone>`

Implement one milestone — write code to make Stage 4's failing tests pass.

| | |
|---|---|
| **Invocation** | `/implementation <project-slug> <milestone>` |
| **Arguments** | `project-slug` — positional, required; `milestone` — positional, required (e.g., `M1`, `M2`, case-insensitive) |
| **Prerequisites** | Gameplan approved; project branch `<branch-prefix><slug>` exists (created by Stage 4); clean working tree; for M2+, prior milestone tests must pass |
| **Reads** | Conventions file (full Pipeline Configuration); gameplan; architecture proposal; test-coverage-matrix; discovery report; PRD; test files for this milestone; existing codebase patterns |
| **Produces** | Implementation code in target repo (on project branch); `<projects-path>/<slug>/progress.md` (created or updated); optionally `<projects-path>/<slug>/decisions/ADR-*.md` |
| **Side Effects** | Commits implementation to project branch; may update conventions file with codebase insights; commits artifacts to projects repo; captures quality metrics if Complexity Analysis configured |
| **Human Action** | None between milestones (run next milestone when ready) |

**Note:** Run once per milestone. The skill refuses to implement multiple milestones in a single invocation.

---

### `/review <project-slug>`

Review the full branch diff against conventions, security, spec, and code quality.

| | |
|---|---|
| **Invocation** | `/review <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | All milestones marked Complete in progress.md; project branch exists; clean working tree |
| **Reads** | Conventions file (full Pipeline Configuration); architecture proposal; gameplan; progress.md; test-coverage-matrix; all changed files on the project branch |
| **Produces** | `<projects-path>/<slug>/review-report.md`; commits to projects repo |
| **Side Effects** | None — report-only, does not modify target repo |
| **Human Action** | If verdict is CHANGES REQUESTED, fix blocker/major findings and re-run. If APPROVED, proceed to Stage 7. |

---

### `/qa-plan <project-slug>`

Generate a comprehensive QA plan for manual testing handoff.

| | |
|---|---|
| **Invocation** | `/qa-plan <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | All milestones marked Complete in progress.md |
| **Reads** | Conventions file (Work Directory, Repository Details, Framework & Stack, Platforms); PRD; gameplan; architecture proposal; test-coverage-matrix; progress.md |
| **Produces** | `<projects-path>/<slug>/qa-plan.md`; commits to projects repo |
| **Side Effects** | None |
| **Human Action** | Hand off the QA plan to a tester. |

---

### `/create-pr <project-slug>`

Push the implementation branch and create a GitHub PR.

| | |
|---|---|
| **Invocation** | `/create-pr <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | All milestones Complete; QA plan exists; project branch exists; clean working tree; no existing open PR for this branch |
| **Reads** | Conventions file (Work Directory, Repository Details, Post-Flight Checks, Complexity Analysis); progress.md; qa-plan.md; gameplan.md; prd.md; all project progress.md files (for aggregate metrics) |
| **Produces** | GitHub PR; updates `progress.md` frontmatter with PR timing/URL and quality data; `<projects-path>/<slug>/metrics.md`; `<projects-path>/metrics.md` (aggregate); commits to projects repo |
| **Side Effects** | Pushes branch to remote; creates GitHub PR; runs post-flight checks (auto-fix + report); runs complexity analysis |
| **Human Action** | Review and merge the PR. Share the QA plan with the tester. |

---

### `/metrics <project-slug>`

Compute pipeline timing metrics from document frontmatter.

| | |
|---|---|
| **Invocation** | `/metrics <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | Project directory exists with pipeline documents that have YAML frontmatter |
| **Reads** | Conventions file (Work Directory, Repository Details); all `.md` files in the project directory (frontmatter); GitHub PR data via `gh` CLI |
| **Produces** | `<projects-path>/<slug>/metrics.md`; commits to projects repo |
| **Side Effects** | None |
| **Human Action** | None |

---

### `/quality <project-slug>`

Generate a code quality report from quality frontmatter and optional fresh analysis.

| | |
|---|---|
| **Invocation** | `/quality <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | `progress.md` exists with `pipeline_quality_*` frontmatter fields (captured during Stage 5 when Complexity Analysis is configured) |
| **Reads** | Conventions file (Work Directory, Repository Details, Complexity Analysis); progress.md frontmatter; optionally the project branch (for fresh analysis) |
| **Produces** | `<projects-path>/<slug>/quality.md`; commits to projects repo |
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
| **Reads** | Conventions file (Work Directory, Project Tracker); previous release notes in `<projects-path>/release-notes/`; Linear API (teams, cycles, issues, statuses) |
| **Produces** | `<projects-path>/release-notes/<end-date>-cycle-<N>.md` |
| **Side Effects** | Prompts interactively for iOS and Android build numbers via `AskUserQuestion` |
| **Human Action** | Review and wordsmith the draft. Remove `[INTERNAL?]` flags. Post to the appropriate channel. |

---

### `/backfill-timing <project-slug>`

Retrofit YAML frontmatter onto existing project documents created before timing was implemented.

| | |
|---|---|
| **Invocation** | `/backfill-timing <project-slug>` |
| **Arguments** | `project-slug` — positional, required |
| **Prerequisites** | Project directory exists with pipeline documents |
| **Reads** | Conventions file (Work Directory); all `.md` files in the project directory; git commit timestamps; document header dates; approval checklist dates; file modification times |
| **Produces** | Modifies existing documents in-place — prepends YAML frontmatter with `pipeline_backfilled: true` |
| **Side Effects** | Modifies project documents (frontmatter only, not content) |
| **Human Action** | None. Run `/metrics <slug>` afterward to see the computed timing data. |

---

## Pipeline Flow Cheat Sheet

Quick-reference sequence showing the full pipeline with arguments and key gates.

| Step | Command | Arguments | Gate Before | Key Output |
|------|---------|-----------|-------------|------------|
| — | `/pipeline-setup` | `[repo-path]` | Git repo exists | `## Pipeline Configuration` in conventions file |
| 0 | `/prd` | _(interactive)_ | Inbox has files | `prd.md` |
| — | _Human reviews PRD_ | | | |
| 1 | `/discovery` | `<slug>` | `prd.md` exists | `discovery-report.md` |
| 2 | `/architecture` | `<slug>` | `discovery-report.md` exists | `architecture-proposal.md` |
| — | **Human approves architecture** | | | |
| 3 | `/gameplan` | `<slug>` | Architecture approved | `gameplan.md` |
| — | **Human approves gameplan** | | | |
| 4 | `/test-generation` | `<slug>` | Gameplan approved; clean tree | Test files + branch + `test-coverage-matrix.md` |
| 5 | `/implementation` | `<slug> M1` | Branch exists; clean tree | Implementation code + `progress.md` |
| 5 | `/implementation` | `<slug> M2` | M1 tests pass | Implementation code + `progress.md` updated |
| 5 | _(repeat for each milestone)_ | `<slug> MN` | Prior tests pass | |
| 6 | `/review` | `<slug>` | All milestones complete; clean tree | `review-report.md` |
| 7 | `/qa-plan` | `<slug>` | All milestones complete | `qa-plan.md` |
| PR | `/create-pr` | `<slug>` | All complete; QA plan exists; no open PR | GitHub PR + `metrics.md` |

### Setup & Utility Skills (run anytime)

| Command | Arguments | Purpose |
|---------|-----------|---------|
| `/pipeline-setup` | `[repo-path]` | Auto-detect stack, write Pipeline Configuration |
| `/metrics` | `<slug>` | Compute timing metrics from frontmatter |
| `/quality` | `<slug>` | Generate code quality report |
| `/release-notes` | `<cycle_number>` | Generate release notes from Linear cycle |
| `/backfill-timing` | `<slug>` | Retrofit frontmatter onto older documents |
