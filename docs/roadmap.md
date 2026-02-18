# Pipeline Roadmap

> **Purpose:** Future improvements to the agent pipeline, organized by theme. Each item has an ID for easy reference (e.g., "see ROAD-03").

---

## Item Index

| ID | Title | Theme | Status |
|----|-------|-------|--------|
| ROAD-01 | Stage 0 — PRD Generation | Pipeline intake | **Done** |
| ROAD-02 | Post-Stage Notifications | Orchestration | Planned |
| ROAD-03 | Per-Milestone Gameplans | Pipeline architecture | Planned |
| ROAD-04 | Post-Flight Checks | Quality assurance | **Done** |
| ROAD-05 | Externalize Platform Config (two-file) | Portability | **Done** |
| ROAD-06 | Project Document Linking | Developer experience | Planned |
| ROAD-07 | ADR Integration | Knowledge capture | **Done** |
| ROAD-08 | Linear Automation | Orchestration | Planned |
| ROAD-09 | Stage 6 — Code Review | Quality assurance | **Done** |
| ROAD-10 | Post-QA Iteration / Re-entry | Pipeline lifecycle | Planned |
| ROAD-11 | Ludicrous Speed Mode | Orchestration | Planned |
| ROAD-12 | Multi-Product Support + Setup Repo | Portability | **Done** |
| ROAD-13 | Configurable Base Branch | Pipeline lifecycle | Planned |
| ROAD-14 | Externalize Project Work Dirs | Portability | **Done** |
| ROAD-15 | Continuous Knowledge Extraction | Knowledge capture | **Done** (v1) |
| ROAD-16 | T-Shirt Size Estimates | Developer experience | **Done** |
| ROAD-17 | CI Failure Detection + Auto-Fix | Quality assurance | Planned |
| ROAD-18 | Gameplan Coherence Checklist | Quality assurance | **Done** |
| ROAD-19 | DORA Metrics (Before/After) | Measurement | **Done** (v1) |
| ROAD-20 | Code Quality Analysis (Before/After) | Measurement | Planned |
| ROAD-21 | Pipeline Dashboard (Factorio Theme) | Visibility | Planned |
| ROAD-22 | Pipeline Status MCP Server | Visibility | Planned |
| ROAD-23 | Stage 4 Test Quality Heuristics | Quality assurance | **Done** |
| ROAD-24 | Merge PIPELINE.md into Conventions Files | Portability | **Done** |
| ROAD-25 | Multi-Runtime Support (Claude Code + Codex) | Portability | Planned |
| ROAD-26 | Release Notes Skill | Developer experience | **Done** |
| ROAD-27 | Weekly Pipeline Digest | Visibility | Planned |
| ROAD-28 | Extract Metrics & Quality into In-Project Prompts | Portability | Planned |

---

## Pipeline Capabilities

### ROAD-01: Stage 0 — PRD Generation Skill

**Status:** Done
**Theme:** Pipeline intake

Built a Stage 0 skill (`/stage0-prd`) that generates structured PRDs from raw input notes.

**What was built:**
- **Inbox pattern** — user drops raw notes (feature descriptions, Slack threads, meeting notes, Google Doc exports) into `inbox/` directory
- **Interactive file selection** — skill lists inbox contents, asks user to pick a file and provide a project slug
- **Full PRD generation** — produces a complete PRD conforming to the embedded intake template with all 13 sections
- **Placeholder markers** — `[CONFIRM]`, `[NEEDS INPUT]`, `[NEEDS REVIEW]`, `[INFERRED]`, `[DEFINE]` flag areas needing human attention
- **Level suggestion** — suggests Level 1/2/3 based on scope, marked `[CONFIRM]` for human verification
- **Project directory creation** — creates `projects/<slug>/` and writes `prd.md`
- **Draft status** — PRD starts as "Draft — Review Required", human promotes to "Ready for Engineering"

**Design decisions:**
- Inbox files are gitignored (ephemeral working material)
- Skill never deletes inbox files — user manages their own inbox
- Every template section is included, even if raw input is sparse (placeholders instead of omissions)
- Requirements are extracted from raw input and assigned IDs; edge cases are inferred and marked `[INFERRED]`
- No auto-advance to Stage 1 — human reviews the draft PRD first

---

### ROAD-02: Post-Stage-Completion Notifications

**Status:** Planned
**Theme:** Orchestration

Send a webhook POST when a pipeline stage completes, enabling external integrations (Zapier, Slack, Linear, email).

**Why:** The pipeline currently requires the operator to know when a stage finishes and manually kick off the next one. Notifications close this loop — especially important at human checkpoints (Stage 2, Stage 3) where the reviewer needs to know the ball is in their court.

**Payload shape (strawman):**
```json
{
  "event": "stage_completed",
  "project": "deficient-line-items-report",
  "stage": "stage2-architecture",
  "status": "awaiting_review",
  "timestamp": "2026-02-07T12:00:00Z",
  "artifacts": ["architecture-proposal.md"],
  "next_action": "Human review required"
}
```

**Considerations:**
- Keep the payload minimal and generic — let the receiver (Zapier, etc.) decide what to do
- Webhook URL configured per-project or globally in a pipeline config file
- Should also fire on failures/errors so the operator knows something stalled
- Could be a simple `curl` call at the end of each skill, or part of a future orchestration layer

---

### ROAD-03: Per-Milestone Gameplans

**Status:** Planned
**Theme:** Pipeline architecture

Break the monolithic gameplan into per-milestone subfolders, each with its own detailed gameplan that practices TDD (write tests → implement → verify).

**Why:** The current flow is: one big gameplan → one big batch of tests (Stage 4) → per-milestone implementation (Stage 5). This front-loads all test generation before any implementation starts. Per-milestone gameplans would let each milestone define its own tests, implement against them, and verify — a tighter TDD loop.

**Proposed structure:**
```
projects/<slug>/
  prd.md
  discovery-report.md
  architecture-proposal.md
  gameplan.md                    # High-level milestone overview (still exists)
  milestones/
    M1-data-model/
      gameplan.md                # Detailed M1 plan with acceptance criteria
      test-coverage-matrix.md    # M1-specific test mapping
    M2-controller/
      gameplan.md
      test-coverage-matrix.md
    ...
```

**Considerations:**
- The top-level `gameplan.md` still serves as the sequencing and dependency overview
- Per-milestone gameplans contain the detailed acceptance criteria, test strategy, and implementation notes
- Stage 4 becomes per-milestone (generate tests for M1, then M1 implements and passes them, then generate tests for M2, etc.)
- This is a significant architectural change to the pipeline — needs careful design
- Tradeoff: tighter TDD loop vs. more overhead per milestone vs. current approach that works

---

### ROAD-04: Post-Flight Checks (Pre-PR Quality Gate)

**Status:** Done
**Theme:** Quality assurance

Integrated post-flight checks into the `/create-pr` skill, driven by each target repo's `PIPELINE.md` configuration.

**What was built:**
- **`PIPELINE.md` Post-Flight Checks section** (OPTIONAL) — each target repo declares its own checks in a table with columns: Check name, Command, Auto-fix?, Blocking?
- **`/create-pr` skill Step 1** — reads the Post-Flight Checks table from `PIPELINE.md` and runs checks in three phases:
  - Phase A: Auto-fix checks (e.g., StandardRB `--fix`) — commit fixes, re-run to confirm clean
  - Phase B: Report-only checks (e.g., Brakeman, ripsecrets) — block if blocking, record if non-blocking
  - Phase C: Record results for the PR body
- **PR body includes post-flight results** — table showing which checks ran and their outcomes
- **OrangeQC's `PIPELINE.md`** configured with: StandardRB (auto-fix, blocking), Brakeman (report-only, blocking), ripsecrets (report-only, blocking)

**Design decision:** Checks live in the target repo's `PIPELINE.md`, not hardcoded in the pipeline. A Django project would list `flake8` and `bandit`; a Node project would list `eslint` and `npm audit`. The pipeline just reads and executes whatever the repo declares. If `PIPELINE.md` has no Post-Flight Checks section, the step is skipped entirely.

---

## Pipeline Architecture

### ROAD-05: Externalize Platform-Specific Configuration

**Status:** Done
**Theme:** Portability

Externalized all platform-specific configuration using a two-file architecture. Updated all 7 skills, 4 templates, and 2 docs. Zero hardcoded `~/projects/orangeqc/` paths remain in skills or templates.

**What was built:**
- **`pipeline.md`** (pipeline repo) — maps the pipeline to target repositories (repo paths, project tracker). This is the only file to edit when pointing the pipeline at different repos.
- **`PIPELINE.md`** (each target repo) — describes how that repo works (branch config, framework, directory structure, implementation order, test commands, guardrails, plus optional sections for API conventions, multi-tenant security, backwards compat, feature flags)
- All skills read `pipeline.md` first for repo paths, then `PIPELINE.md` from the primary repo for all framework-specific details
- Templates use generic placeholders that reference `PIPELINE.md` sections
- Three-layer architecture: `pipeline.md` (where repos are) + `PIPELINE.md` (how the repo works) + AGENTS.md (how to write code) + constraints doc (why things are the way they are)

**To use on a different project:**
1. Edit `pipeline.md` with your repo paths
2. Create `PIPELINE.md` in your target repo with framework details, directory structure, test command, and any optional sections that apply
3. Skills and templates adapt automatically — no changes needed

---

### ROAD-06: Project Document Linking/Syncing

**Status:** Planned
**Theme:** Developer experience

Provide a way to make pipeline project documents (PRD, architecture proposal, gameplan, progress, QA plan) accessible from the actual project repos — not just from the agent-pipeline repo.

**Why:** When a developer is working in the Rails repo on `pipeline/deficient-line-items-report`, they can't easily reference the architecture proposal or gameplan without switching to the agent-pipeline repo. The project context should be accessible where the work happens.

**Options to evaluate:**
| Option | Pros | Cons |
|--------|------|------|
| Copy docs into the branch | Self-contained, no external deps | Stale copies, clutters the branch |
| Symlinks | Live reference | Only works locally, breaks in CI |
| PR description with links | Low friction | Links to another repo, requires access |
| Dedicated docs service/API | Clean separation | Overkill for current scale |
| Git submodule | Standard git mechanism | Submodules are universally hated |

**Considerations:**
- The simplest v1 might be: the `/create-pr` skill includes links to the pipeline artifacts in the PR description (already partially done)
- A more complete solution could copy key docs (architecture proposal, gameplan) into a `docs/pipeline/` folder on the branch
- Whatever we choose, it should be automated by the pipeline — not a manual step

---

### ROAD-07: ADR Integration (Architecture Decision Records)

**Status:** Done
**Theme:** Knowledge capture

Integrated Architecture Decision Records into the pipeline, capturing significant technical decisions during Stage 2 (Architecture) and Stage 5 (Implementation).

**What was built:**
- **ADR template** (embedded in Stage 2 and Stage 5 skills) — lightweight format: Context, Decision, Alternatives Considered (table), Consequences
- **Stage 2 integration** — new step 10 generates ADRs for decisions with 2+ genuinely viable alternatives. ADRs are written to `<projects-path>/<slug>/decisions/ADR-NNN-<kebab-title>.md` and committed alongside the architecture proposal
- **Stage 5 integration** — new step 12 generates ADRs when implementation decisions deviate from or extend the architecture proposal. Continues the numbering sequence from Stage 2
- **Architecture proposal cross-reference** — new section 8 in the template lists all generated ADRs with links
- **Project directory convention** — `decisions/` subdirectory added to the standard project layout

**Design decisions:**
- ADRs are project-directory-only artifacts (not committed to the target repo) — they're pipeline-scoped, not repo-scoped
- Not every decision needs an ADR — only choices where alternatives were genuinely viable and the rationale matters
- Sequential numbering (ADR-001, 002, ...) shared across stages within a project
- Stage metadata (`Stage: 2` or `Stage: 5`) tracks where the decision was made

---

## Notifications & Integrations

### ROAD-08: Linear Automation

**Status:** Planned (partially designed)
**Theme:** Orchestration

Automate Linear ticket creation and status transitions as part of the pipeline flow.

**Why:** Currently Linear integration is manual. The gameplan defines milestones, but someone has to manually create Linear issues for each one. Status transitions (In Progress, In Review, Done) are also manual.

**What to automate:**
- Stage 3 completion → create Linear issues for each milestone
- Stage 5 milestone start → transition issue to "In Progress"
- Stage 5 milestone complete → transition issue to "In Review" or "Done"
- Stage 7 completion → link QA plan to the Linear project

**Related:** `docs/gap-analysis.md` § 2.2

---

## Pipeline Lifecycle

### ROAD-10: Post-QA Iteration / Re-entry for Completed Projects

**Status:** Planned
**Theme:** Pipeline lifecycle

Provide a way to feed findings back through the pipeline for a project that has already completed all stages — small fixes, QA discoveries, or follow-up tweaks that don't warrant a brand-new project.

**Why:** Discovered during the second pilot project (deficient-line-items-report). QA surfaced a small issue after the branch was already complete and PR-ready. There was no clean way to shoot it back through the pipeline — the project was "done" and the pipeline has no concept of re-entry or iteration on a finished project.

**The problem space:**
- A completed project's branch is ahead of `staging` but not yet merged
- QA finds something small (or the reviewer wants a tweak)
- The fix is too small to justify a new full pipeline run, but there's no lightweight path to get it done within the pipeline's structure
- Manually committing a fix to the branch works but bypasses all pipeline guardrails

**Ideas to explore:**

| Approach | How it works | Tradeoffs |
|----------|-------------|-----------|
| **Configurable base branch per project** | New project config field: `base_branch`. Default is `staging`, but could be set to another project's branch (e.g., `pipeline/deficient-line-items-report`). A follow-up project branches from there. | Enables stacking. But might be overkill for a one-line fix — you'd still need a PRD, discovery, architecture, etc. |
| **"Patch" mode for Stage 5** | A lightweight re-entry point that takes a description of the fix, applies it to the existing branch, and runs the relevant tests. Skips Stages 1-4. | Fast for small fixes. But no architecture/gameplan review — risky for anything non-trivial. |
| **Amendment stage** | A new stage (Stage 8?) specifically for post-QA amendments. Takes QA findings as input, produces a targeted fix on the existing branch, re-runs affected tests. | Purpose-built for this exact scenario. But adds pipeline complexity. |
| **Reopen project** | Allow a completed project to be "reopened" — append new findings to the PRD, re-run only the stages affected by the change. | Conceptually clean. But determining "which stages are affected" is hard to automate. |

**Deeper analysis:**

This is fundamentally a **pipeline linearity problem.** The pipeline is currently designed as a one-way flow: PRD → stages → code. But real development is iterative — QA finds things, reviewers want changes, requirements shift mid-flight. ROAD-10 is the first acknowledgment that the pipeline needs to handle feedback loops, not just forward sequences. Any solution here shapes how the pipeline evolves from "waterfall with checkpoints" toward something that tolerates iteration.

The **configurable base branch** idea is worth pursuing even if it's not the full answer to post-QA re-entry, because it solves two problems at once:
1. Post-QA fixes — a follow-up project branches from the existing project's branch
2. Dependent projects — Project B needs Project A's schema changes that haven't merged to `staging` yet

But it also introduces **branch stacking complexity** — if Project A's branch gets rebased or amended after Project B branches from it, Project B's branch needs to deal with that. The pipeline would need to track these dependencies and at minimum warn when an upstream branch has changed.

**The solution is probably scope-dependent** — "tiny fix" and "significant rework" likely need different mechanisms:
- A one-line CSS tweak found in QA shouldn't require re-running architecture review. A patch mode or amendment stage makes sense here.
- "We need to change the data model based on QA findings" absolutely should go back through the architecture checkpoint. A reopened project or new dependent project makes sense there.
- The pipeline could offer both paths and let the operator choose based on the scope of the change, or it could assess scope automatically based on which files/layers are affected.

**Considerations:**
- Whatever the solution, it should preserve traceability — the fix should be linked to the original project and the QA finding that triggered it
- The configurable base branch is a foundational capability that multiple approaches could build on
- Start with the simplest mechanism that handles the common case (small QA fix on an unmerged branch), then expand

---

## Quality & Process

### ROAD-09: Stage 6 — Automated Code Review

**Status:** Done
**Theme:** Quality assurance

Build the Stage 6 skill for automated code review against the target repo's AGENTS.md and the project's architecture proposal.

**What was built:**
- `/stage6-review <project-slug>` — reviews the full branch diff after all milestones complete
- 6 review dimensions: convention compliance, security, spec compliance, cross-platform consistency (V1 no-op), code quality, test coverage
- Categorized findings (Blocker / Major / Minor / Note) with specific file:line references
- Verdict: APPROVED (zero Blockers/Majors) or CHANGES REQUESTED
- Output: `review-report.md` with DORA frontmatter

**V1 scope:** Report-only (no auto-fix loop), Rails-only (cross-platform dimension is a no-op), no Linear integration, no re-review tracking.

**Related:** `docs/gap-analysis.md` § 3.6

---

## Orchestration Modes

### ROAD-11: Ludicrous Speed Mode

**Status:** Planned
**Theme:** Orchestration

Add a "ludicrous speed" mode that auto-approves human checkpoints when there are no open questions and automatically kicks off the next stage.

**Why:** The pipeline currently pauses at every human checkpoint (Stage 2 architecture review, Stage 3 gameplan review) and waits for the operator to manually approve and invoke the next stage. For projects where the pipeline operator has high confidence in the output — small projects, well-understood domains, or second-pass iterations — this friction adds time without adding value.

**How it would work:**
- A flag in the project config or invocation (e.g., `--ludicrous` or a `pipeline.md` setting) enables auto-advance mode
- After each stage completes, the pipeline checks: are there any open questions flagged as "blocking"?
- If **no blocking open questions**: auto-approve the checkpoint and immediately invoke the next stage
- If **blocking open questions exist**: stop and wait for human input (same as today)
- The operator can still review artifacts after the fact — auto-approve doesn't mean no review, it means review happens in parallel with (or after) the next stage

**Considerations:**
- This is fundamentally about trust calibration. Early projects should run with manual gates. Once the pipeline has proven itself, ludicrous mode lets experienced operators move faster.
- Open questions are the circuit breaker. If the architecture stage has questions about the data model, it should stop regardless of mode. The quality of open question detection becomes critical.
- Should log every auto-approval decision so the operator can audit what was skipped
- Could be per-checkpoint (auto-approve architecture but manually review gameplan, or vice versa) rather than all-or-nothing
- Pairs well with ROAD-02 (notifications) — even in ludicrous mode, the operator should get notified of what's happening

**Related:** ROAD-02 (Post-Stage Notifications), ROAD-08 (Linear Automation)

---

### ROAD-12: Multi-Product Support + Setup Repo Skill

**Status:** Done
**Theme:** Portability

Added support for running the pipeline against multiple products (repos), with separate pipeline configs per product and a `/setup-pipeline-repo` skill for automated repo onboarding.

**What was built:**
- **`pipelines/` directory** — named pipeline configs per product (e.g., `pipelines/orangeqc.md`, `pipelines/show-notes.md`)
- **Active pointer pattern** — `pipeline.md` at repo root is always the active config; switch products by copying from `pipelines/`
- **`/setup-pipeline-repo` skill** — explores a new repo, detects framework/tests/CI/structure, auto-generates `PIPELINE.md` in the target repo and a pipeline config in `pipelines/`, optionally activates it
- **Show Notes onboarded** — first non-OrangeQC product added to the pipeline (Rails 8.1 web app)

**Design decisions:**
- Active pointer over per-command product argument — matches session-based workflow, zero existing skill changes (all 8 skills still read `pipeline.md`)
- Product configs stored in `pipelines/` as reference copies; `pipeline.md` is the canonical active file
- `setup-pipeline-repo` uses detect → confirm → generate pattern to avoid silent misconfigurations
- OPTIONAL sections in PIPELINE.md are omitted for simpler projects (no API, no multi-tenancy, etc.)
- To switch products: `cp pipelines/<product>.md pipeline.md`

---

### ROAD-14: Externalize Project Work Directories

**Status:** Done
**Theme:** Portability

Externalized project artifacts (`projects/`) and inbox (`inbox/`) from the pipeline repo into configurable per-product directories. The pipeline repo is now purely the engine (skills, templates, docs). Each product's `pipeline.md` config points to where its project work lives.

**What was built:**
- **Work Directory section** in `pipeline.md` — two new fields: Projects path and Inbox path
- **All 9 skills updated** — read projects/inbox paths from `pipeline.md` Work Directory instead of assuming local `projects/` and `inbox/`
- **External project directories** — each product has its own git repo for project artifacts:
  - OrangeQC: `~/projects/orangeqc/pipeline-projects/`
  - Show Notes: `~/projects/show-notes/pipeline-projects/`
- **`/setup-pipeline-repo` skill updated** — generates Work Directory section in new pipeline configs, asks user for projects path
- **Migration** — 6 OrangeQC projects and 1 Show Notes project moved to external directories

**Why:** Two problems solved:
1. Personal project artifacts (Show Notes) no longer mix with work artifacts (OrangeQC) in the same repo
2. OrangeQC Level 3 projects (multi-repo: Rails + iOS + Android) need cross-repo project artifacts that don't belong inside any single target repo

**Design decisions:**
- One config field per product in `pipeline.md` — follows the existing pattern of `cp pipelines/<product>.md pipeline.md` to switch everything
- External directories are git repos (user choice) — enables version control and backup of project artifacts independently
- Inbox is a subdirectory of the projects path (convention: `<projects-path>/inbox/`)
- Pipeline repo `.gitignore` blocks accidental `projects/` or `inbox/` creation

---

### ROAD-15: Continuous Knowledge Extraction

**Status:** Done (v1)
**Theme:** Knowledge capture

Systematically extract insights from every pipeline stage and route them to the right durable location — so that future projects, future agents, and future developers benefit from what the pipeline has already learned.

**Why:** The pipeline generates valuable insights at every stage — codebase patterns discovered during Stage 1, architectural idioms during Stage 2, testing gotchas during Stage 4, implementation lessons during Stage 5, and review findings during Stage 6. Today these insights live only in project-scoped artifacts (discovery reports, progress files) or in Claude's auto-memory (session-scoped, single-instance). They don't flow back into the codebase conventions, the pipeline's shared knowledge, or the next project. Every new project starts from scratch, re-discovering things the pipeline already learned.

**The core problem:** The pipeline has no systematic way to answer "what did we learn?" and "where should that knowledge live?"

**Two orthogonal dimensions:** Knowledge capture has two independent axes that must be solved separately:
1. **When** — which stages generate insights, and at what point during execution (inline, post-stage, post-project)
2. **Where** — which durable location should store the insight (target repo conventions, pipeline docs, project artifacts)

These are orthogonal because every combination is valid: Stage 1 can produce repo-scoped insights, Stage 5 can produce pipeline-scoped insights, and the extraction mechanism for *when* shouldn't be coupled to the routing logic for *where*. Getting this separation right means the system scales — adding a new stage or a new destination doesn't require redesigning the other axis.

**Knowledge types and destinations:**

| Insight Type | Example | Destination | Stage Source |
|-------------|---------|-------------|-------------|
| Codebase pattern | "`find_or_create_by!` + `previously_new_record?` for create detection" | Target repo conventions file (`CLAUDE.md` / `AGENTS.md`) | Stage 1 (Discovery), Stage 5 (Implementation) |
| Testing pattern | "DigestMailer spec tests multipart HTML+text bodies separately" | Target repo conventions file | Stage 4 (Test Gen), Stage 5 (Implementation) |
| Implementation gotcha | "PostgreSQL `ROUND(double_precision, int)` doesn't exist — cast to `::numeric`" | Target repo conventions file | Stage 5 (Implementation) |
| Architecture pattern | "Internal notification mailers get their own class, separate from user-facing mailers" | Target repo conventions file | Stage 2 (Architecture) |
| Pipeline lesson | "Seed tasks should use ActiveRecord directly, not FactoryBot" | Pipeline memory / docs | Stage 5 (Implementation) |
| Cross-project pattern | "Level 1 projects with no existing test coverage: model specs + seed data, skip system specs" | Pipeline memory / docs | Stage 4 (Test Gen), Stage 5 (Implementation) |
| Risk pattern | "Bullet gem N+1 threshold is 2+ queries — tests with 1 record won't trigger it" | Target repo conventions file | Stage 5 (Implementation) |
| PRD pattern | "When PRD says 'hardcoded list', use a constant, not ENV var" | Pipeline templates / docs | Stage 2 (Architecture) |

**Key design questions:**

1. **When to extract:** Inline during each stage (agent writes insights as it works) vs. post-stage (a dedicated extraction pass after each stage completes) vs. post-project (a retrospective after all stages finish). Inline is most natural but risks cluttering stage execution. Post-project is simplest but knowledge gets lost if a project stalls mid-pipeline.

2. **Where to route:** The destination depends on the insight type:
   - **Repo-scoped** (patterns specific to this codebase) → target repo's conventions file
   - **Pipeline-scoped** (lessons about how to run the pipeline) → pipeline docs or memory
   - **Project-scoped** (only relevant to this project) → project artifacts (already happens naturally)

   The agent needs heuristics or explicit rules for which bucket an insight falls into. A simple test: "Would this help someone working on a *different* project in the *same* repo?" → repo-scoped. "Would this help someone running the pipeline against a *different* repo?" → pipeline-scoped.

3. **How to write without cluttering:** The target repo's conventions file shouldn't grow unbounded. Insights need to be organized by topic, deduplicated, and periodically curated. Appending to a flat list won't scale.

4. **How to avoid stale knowledge:** Codebase patterns change. A pattern discovered in February may be obsolete by June. Knowledge entries should be falsifiable — tied to specific code so they can be validated or retired.

**Proposed approach (strawman):**

- **Each stage skill gets a "knowledge extraction" step** at the end — before writing the stage output, the agent reviews what it learned and categorizes insights by destination
- **Repo-scoped insights** are appended to a staging area (e.g., `CLAUDE.md.suggestions` or a dedicated section at the bottom of the conventions file) that the human reviews and merges during checkpoint reviews
- **Pipeline-scoped insights** are written to a `docs/lessons-learned.md` or similar file in the pipeline repo, organized by topic
- **Deduplication** — before writing an insight, check if it (or something equivalent) already exists in the destination
- **Progressive refinement** — early projects generate more insights (the conventions file is sparse); mature repos generate fewer (most patterns are already documented)

**Relationship to other roadmap items:**
- **ROAD-07 (ADR Integration)** is a *subset* of this — ADRs capture architectural decisions, which are one type of insight. ROAD-15 is the broader system that would include ADR-like extraction as one component.
- **ROAD-09 (Code Review)** is a natural extraction point — the review stage sees the final code and can identify patterns worth codifying.
- **ROAD-03 (Per-Milestone Gameplans)** would benefit — tighter feedback loops mean insights are fresher and more specific.

**Considerations:**
- Start with the highest-value, lowest-effort insertion point: Stage 5 (Implementation) generates the most concrete, actionable insights
- Don't block the pipeline on knowledge extraction — it should be additive, not a gate
- The human checkpoint reviews (Stage 2, Stage 3) are natural curation points for reviewing suggested knowledge additions
- The conventions file in the target repo is the most impactful destination — it's read by every agent, every session, every project

---

### ROAD-17: CI Failure Detection and Auto-Fix

**Status:** Planned
**Theme:** Quality assurance

Automatically detect CI failures on GitHub after a PR is created (or after any push to a pipeline branch), diagnose the failures from CI logs, fix them, and re-push until CI passes.

**Why:** The pipeline currently ends at `/create-pr` — it pushes the branch, creates the PR, and hands off. But CI often catches things the local environment didn't: different Ruby/Node versions, database setup differences, stricter linting configs, missing test fixtures that only surface in parallel test runs, etc. Today, CI failures require the operator to manually check GitHub, read logs, diagnose the issue, switch to the repo, fix, commit, push, and wait again. This is exactly the kind of mechanical loop an agent should handle.

**The problem space:**

This is the pipeline's first **reactive feedback loop**. Every existing stage is forward-only: read inputs, produce outputs, advance. CI failure handling is different — an external system (GitHub Actions) produces a signal asynchronously, and the pipeline needs to:
1. Wait for CI to complete
2. Read the results
3. If failed: diagnose from logs, fix in the local repo, commit, push
4. Wait again
5. Repeat until green or bail out

This pattern doesn't fit cleanly into the existing stage numbering (Stages 1-7 are sequential production steps). It's closer to a **maintenance loop** that runs alongside or after the production pipeline.

**Proposed approach:**

A standalone skill (`/fix-ci <project-slug>`) that can be invoked:
- Manually after `/create-pr` when the operator sees CI failed
- Eventually automatically as part of `/create-pr` (opt-in, once the skill is proven)

**Skill flow:**

1. **Locate the run** — use `gh run list --branch pipeline/<slug>` to find the latest CI run
2. **Wait if in progress** — poll `gh run watch` or check status until the run completes
3. **Check result** — if all checks pass, report success and stop
4. **Diagnose failures** — use `gh run view <id> --log-failed` to pull failure logs for each failed job
5. **Categorize the failure:**
   - **Test failure** — read the failing spec, understand the assertion, read the implementation, fix
   - **Lint/style failure** — run the linter locally with auto-fix, commit
   - **Build failure** — missing dependency, syntax error, incompatible version
   - **Environment/infra failure** — CI config issue, service unavailable (not fixable by the agent)
6. **Fix and push** — make the fix on the pipeline branch, commit with a clear message (e.g., "Fix CI: resolve RSpec failure in reports_controller_spec"), push
7. **Wait for re-run** — CI triggers automatically on push; wait for the new run to complete
8. **Repeat** — loop back to step 3, up to a configurable attempt limit (default: 3)
9. **Bail out** — if the limit is reached or the failure is categorized as unfixable (infra issue, flaky test not caused by this branch), stop and report to the operator with a diagnosis

**Guardrails:**

| Guardrail | Why |
|-----------|-----|
| Attempt limit (default 3) | Prevent infinite fix-push-fail loops |
| Diff review before push | Agent reviews its own fix to avoid introducing new issues |
| No force-push | Same rule as everywhere — append commits only |
| Scope check | Only fix failures caused by changes on this branch, not pre-existing CI failures. Compare against the base branch's CI status |
| No CI config changes | Don't modify `.github/workflows/` or CI configuration to make tests pass — fix the code |

**Scope check detail:** Before attempting a fix, the agent should verify the failing test/check also passes on the base branch. If the base branch has the same failure, it's pre-existing and the agent should skip it (report it, but don't try to fix someone else's broken CI).

**Integration with `/create-pr`:**

Two possible modes:
1. **Manual** (v1) — `/create-pr` finishes, operator runs `/fix-ci <slug>` if CI fails
2. **Integrated** (v2) — `/create-pr` includes an optional `--wait-for-ci` flag that runs the fix-ci loop before declaring the PR ready

**Open questions:**

- **How long to wait for CI?** OrangeQC's CI suite takes ~5 minutes. Waiting is fine. A repo with 30-minute CI would need a different strategy (background polling, notifications).
- **What about flaky tests?** If a test fails intermittently and isn't related to this branch's changes, the agent shouldn't try to fix it. The scope check (compare against base branch) handles this, but flaky tests that pass on base and fail on the PR branch are harder to distinguish from real regressions.
- **Test-only fixes vs. implementation fixes:** If the CI failure reveals a real bug in the implementation (not just a test issue), should the agent fix it? Probably yes for small fixes, but large implementation changes should go back through the pipeline (related to ROAD-10).

**Related:** ROAD-04 (Post-Flight Checks — pre-push local checks), ROAD-09 (Code Review — catches issues before CI does), ROAD-10 (Post-QA Re-entry — if CI fix requires significant rework)

---

### ROAD-13: Configurable Base Branch (per project)

**Status:** Planned
**Theme:** Pipeline lifecycle

Allow each project to specify a custom base branch instead of always branching from the default branch declared in `PIPELINE.md`. Currently Stage 4 creates `pipeline/<slug>` from `origin/<default-branch>`. This would allow branching from another project's branch or a feature branch.

**Why:** Enables dependent projects (Project B needs Project A's unreleased changes) and post-QA follow-up projects. The `/setup-pipeline-repo` skill already derives the default branch from git and sets it as `PR base branch` in `PIPELINE.md`, but per-project overrides aren't supported yet.

**How:** A `base_branch` field in the project's `prd.md` header or a project-level config file. Stage 4 reads it when creating the branch. If not specified, falls back to `PIPELINE.md`'s `PR base branch`.

**Related:** ROAD-10 (Post-QA Iteration / Re-entry)

---

### ROAD-16: T-Shirt Size Estimates (Replace Time-Based Estimates)

**Status:** Done
**Theme:** Developer experience

Replace time-based estimates in the gameplan template (Section 7: Estimates) with t-shirt sizes (S / M / L / XL).

**Why:** Time estimates are misleading for agent-driven work. The agent implements a milestone in minutes, but human review gates, context-switching, and iteration take hours or days. "< 1 day" conflates agent execution time with wall-clock project time. T-shirt sizes communicate relative complexity and risk without implying a timeline.

**Proposed scale:**

| Size | Meaning | Rough Scope |
|------|---------|-------------|
| **S** | Trivial — one concern, few files, no ambiguity | 1-3 files changed, no migrations, no new patterns |
| **M** | Straightforward — clear pattern to follow, moderate scope | 5-10 files, simple migration, follows existing conventions |
| **L** | Significant — multiple concerns, new patterns, or cross-cutting changes | 10-20 files, complex migrations, new architectural patterns |
| **XL** | Large — should probably be split into multiple projects | 20+ files, multiple migrations, new infrastructure |

**What changes:**
- Stage 3 skill gameplan template Section 7 — replace days columns with a single Size column
- Stage 3 skill — update instructions to use t-shirt sizes instead of day estimates
- Existing gameplans are unaffected (they're project artifacts, not templates)

**Considerations:**
- T-shirt sizes apply to the *project* or *milestone*, not to individual tasks
- Size should factor in risk and ambiguity, not just line count — a 3-file change with tricky edge cases is M, not S
- Could also apply sizes at the project level in the PRD header (Level 1/2/3 already captures platform scope; t-shirt captures complexity)

---

### ROAD-18: Gameplan Coherence Checklist (Stage 3 Self-Review)

**Status:** Done
**Theme:** Quality assurance

Add an automated coherence check to the end of Stage 3 (Gameplan) that verifies internal consistency before presenting the gameplan for human review. Currently, the operator has to manually verify traceability, consistency, and completeness — which is exactly the kind of mechanical validation an agent should do.

**Why:** The first opml-import gameplan had two issues caught only by manual review: (1) SUB-002 appeared in the traceability matrix but had no acceptance criterion in any milestone, and (2) IMP-006's acceptance criterion didn't address the re-import count ambiguity from the PRD edge cases table. Both are systematic verification failures that a checklist would catch every time.

**What to check:**

| Check | What It Verifies |
|-------|-----------------|
| **Traceability completeness** | Every PRD requirement ID in the traceability matrix has at least one matching acceptance criterion (checkbox) in a milestone |
| **Reverse traceability** | Every acceptance criterion that references a PRD requirement ID uses a valid ID that exists in the PRD |
| **Architecture element coverage** | Every file listed in the architecture proposal's "Files to Create" and "Files to Modify" sections appears in at least one milestone's task list |
| **Acceptance vs. PRD edge cases** | Every edge case in PRD Section 8 is either covered by an acceptance criterion or explicitly noted as handled by existing system behavior |
| **Dependency DAG validity** | No circular dependencies; every dependency references a milestone that exists |
| **Milestone self-consistency** | Every milestone has: description, size, at least one acceptance criterion, at least one platform task, and a dependencies line |
| **Cross-milestone consistency** | No two milestones claim to create the same file; modified files are only modified after the milestone that creates them |

**How to implement:**

Option A: Add a verification step to the Stage 3 skill — after writing the gameplan, re-read it and the PRD/architecture, run the checks, fix any issues found, then present the final version.

Option B: A separate `/verify-gameplan <slug>` skill that can be run independently. Useful for re-checking after human modifications.

**Recommendation:** Option A (integrated into Stage 3) with the checks also available as Option B for re-verification. The checks are fast (document parsing, no repo access needed) and should never be skipped.

**Considerations:**
- The checks are all document-level — no repo access needed, just cross-referencing markdown files
- False positives are possible (e.g., an edge case that's genuinely handled by existing behavior and doesn't need an AC) — the check should flag, not auto-fix
- This is complementary to the human review, not a replacement — humans catch semantic issues (wrong acceptance criteria, missing context), the checklist catches structural issues (missing mappings, orphaned references)

**Related:** ROAD-15 (Knowledge Extraction — coherence failures are a type of pipeline lesson worth capturing)

---

## Measurement & Effectiveness

### ROAD-19: DORA Metrics (Before/After Pipeline)

**Status:** Done (v1)
**Theme:** Measurement

Track the four DORA metrics before and after pipeline adoption to measure whether the pipeline actually improves development outcomes.

**Why:** The pipeline is a significant investment in process infrastructure. Without baseline measurements, "it feels faster" is the best we can claim. DORA metrics are the industry-standard framework for measuring software delivery performance — they answer whether the pipeline delivers real improvement or just shifts where time is spent.

**The four metrics:**

| Metric | What It Measures | How to Capture |
|--------|-----------------|----------------|
| **Deployment Frequency** | How often code reaches production | Count of production deploys per week/month (Heroku deploy log, Kamal deploy log) |
| **Lead Time for Changes** | Time from first commit to production deploy | Git timestamp of first branch commit → deploy timestamp |
| **Change Failure Rate** | Percentage of deploys that cause a failure (rollback, hotfix, incident) | Manual tagging or post-deploy incident tracking |
| **Mean Time to Recovery** | Time from failure detection to resolution | Incident timestamps (detection → fix deployed) |

**Before/after comparison:**

The "before" baseline is the pre-pipeline development process. For OrangeQC, this is the Stepwyz agency workflow (~7 hrs/week Rails). For Show Notes, this is Dave's solo development.

- **Before data:** Mine git history, deploy logs, and incident records for the 3-6 months before pipeline adoption
- **After data:** Track the same metrics for pipeline-produced projects going forward
- **Control for confounders:** Pipeline projects may be systematically different from pre-pipeline projects (e.g., the pipeline handles well-scoped Level 2 work; pre-pipeline work included messy Level 3 projects). Compare apples to apples where possible.

**Proxy metrics available now (no new tooling):**

| Proxy | Source | Measures |
|-------|--------|----------|
| PRD-to-PR lead time | Git branch creation → PR creation timestamps | End-to-end pipeline throughput |
| PR-to-merge lead time | PR creation → merge timestamp | Review + QA cycle time |
| CI pass rate on first push | GitHub Actions | Code quality at PR time |
| QA rejection rate | Linear issue transitions or manual tracking | Change failure proxy |
| Lines changed per project | `git diff --stat` | Scope normalization |

**Implementation approach:**

1. **v1 (done — frontmatter-based):** Every pipeline stage now embeds machine-readable YAML frontmatter with `pipeline_started_at` and `pipeline_completed_at` timestamps into its output document. The `/metrics <slug>` skill reads all frontmatter, enriches with git/PR data, and computes stage-level timing, human review wait times, and total lead time. The `/backfill-timing <slug>` skill retrofits frontmatter onto existing projects using git commit timestamps, document header dates, and file modification times. This replaces the originally-planned manual spreadsheet — timing data is captured automatically as a side effect of running the pipeline.
2. **v2 (planned):** Integrate with deploy hooks and CI results for deployment frequency and change failure rate. Human fills in recovery data.
3. **v3 (planned):** Fully automated capture with incident tracking integration.

**What was built (v1):**
- **YAML frontmatter** on all pipeline output documents (`pipeline_stage`, `pipeline_started_at`, `pipeline_completed_at`)
- **Approval timestamps** (`pipeline_approved_at`) on architecture-proposal.md and gameplan.md, backfilled by the downstream stage
- **Per-milestone timing** in progress.md frontmatter (`pipeline_m1_started_at`, `pipeline_m1_completed_at`, etc.)
- **PR timing** in progress.md (`pipeline_pr_created_at`, `pipeline_pr_url`), added by the `/create-pr` skill
- **`/backfill-timing <slug>`** skill — retrofits frontmatter onto pre-existing projects from git commits, document dates, and file timestamps
- **`/metrics <slug>`** skill — reads all frontmatter, computes stage timeline, active agent time, human review time, idle time, and agent efficiency ratio
- **Templates updated** — all 5 output templates include frontmatter placeholder blocks

**Key design decisions:**
- Flat `pipeline_` prefixed keys (not nested YAML) — simpler grep/awk parsing, better Obsidian Properties rendering
- Frontmatter (not blockquotes or HTML comments) — standard format, parseable, rendered by GitHub/Obsidian
- Backfilled documents marked with `pipeline_backfilled: true` and source attribution
- `started_at` omitted on backfilled documents (unrecoverable)
- Agent Efficiency = active agent time / (agent + idle) — the key leverage metric

**Considerations:**
- Small sample size is a real limitation. OrangeQC has 3 pipeline projects so far. Statistical significance requires patience.
- DORA metrics measure the delivery *system*, not just the pipeline. Improvements may come from better PRDs, faster reviews, or CI improvements — not just the agent doing the coding
- Lead Time is the most directly measurable and the most likely to show dramatic improvement (agent implements in minutes vs. agency implements over days/weeks)
- Deployment Frequency and Change Failure Rate require v2 (deploy hook integration) — not captured by frontmatter alone

**Related:** ROAD-08 (Linear Automation — milestone transitions provide timing data), ROAD-17 (CI Auto-Fix — affects change failure rate), ROAD-21 (Pipeline Dashboard — will consume metrics data)

---

### ROAD-20: Code Quality Analysis (Before/After Pipeline)

**Status:** Planned
**Theme:** Measurement
**Parallels:** ROAD-19 (same infrastructure pattern — frontmatter capture, reporting skill, backfill skill)

Measure code complexity of pipeline-generated code vs. hand-written code in the same codebase, answering: "Is the agent writing maintainable code or accumulating tech debt?"

**Why:** The pipeline optimizes for correctness (tests pass, acceptance criteria met) and convention adherence (AGENTS.md, PIPELINE.md). But neither of those guarantees the code is *simple*. An agent can produce correct, convention-following code that's still overly complex — too many branches, too-long methods, excessive coupling. Complexity metrics provide an objective before/after comparison that catches quality dimensions the pipeline doesn't currently measure.

**Relationship to ROAD-19 (DORA Metrics):**

ROAD-19 answers "are we shipping faster?" ROAD-20 answers "is the code any good?" They use the same infrastructure but measure orthogonal things:

| | ROAD-19 `/metrics` | ROAD-20 `/quality` |
|---|---|---|
| **Question** | How fast are we delivering? | How good is the code? |
| **Frontmatter prefix** | `pipeline_` (timestamps) | `pipeline_quality_` (scores) |
| **Captured during** | Every stage (start/end times) | Stage 5 completion (per-milestone) + create-pr (summary) |
| **Backfill skill** | `/backfill-timing` — reads git timestamps | `/backfill-quality` — checks out old branches, runs tools |
| **Report skill** | `/metrics <slug>` — timing report | `/quality <slug>` — quality report |
| **PR body section** | Stage timeline, lead time, efficiency | Complexity delta, quality scorecard |

The two skills are independent — you can run either without the other. ROAD-27 (Weekly Digest) is where they converge, showing the speed-vs-quality tradeoff in a single view.

**Critical design requirement: Platform-agnostic via repo config.**

The skill must NOT hardcode any language-specific tools. Each target repo declares its own complexity analysis tools in its conventions file (Pipeline Configuration → Complexity Analysis section), following the same pattern as post-flight checks. The skill reads the config and runs whatever the repo declares.

**Repo config section (new — added to PIPELINE.md / conventions file):**

```markdown
## Complexity Analysis

| Tool | Command (per-file) | Command (repo baseline) | Metric | Output Format |
|------|--------------------|------------------------|--------|---------------|
| Flog | `flog {file}` | `flog app/` | Flog score (lower = simpler) | `{score}: {method}` |
| RuboCop Metrics | `rubocop --only Metrics {file} --format json` | `rubocop --only Metrics app/ --format json` | Cyclomatic, ABC, method/class length | JSON |
```

Each row is a tool the repo has available. The skill iterates over rows, runs both the per-file and baseline commands, and compares. Repos can declare any tools — the skill doesn't need to understand the tools, just run the commands and compare numeric output.

**Example configs by platform:**

| Platform | Tools | Detect via |
|----------|-------|-----------|
| **Ruby/Rails** | Flog, RuboCop Metrics, Flay, Reek | `flog`/`rubocop`/`flay`/`reek` in Gemfile |
| **Kotlin/Android** | detekt | `detekt` in build.gradle, `detekt-cli` |
| **Swift/iOS** | SwiftLint (metrics rules), periphery (dead code) | `.swiftlint.yml`, `periphery` in Package.swift or Brewfile |
| **TypeScript/Node** | ESLint complexity rule, ts-complexity | `eslint` in package.json with complexity rule config |
| **Go** | gocyclo, gocognit | `go install` availability |

**Universal metrics (cross-platform):**

These concepts apply to any language — the specific tool varies but the measurement is comparable:

| Metric | What It Catches | Ruby | Kotlin | Swift | TS |
|--------|----------------|------|--------|-------|----|
| **Cyclomatic complexity** | Too many branches per method | Flog, RuboCop | detekt | SwiftLint | ESLint |
| **Method/function length** | Methods doing too much | RuboCop | detekt | SwiftLint | ESLint |
| **Class/file length** | God objects | RuboCop | detekt | SwiftLint | ESLint |
| **Duplication** | Copy-paste code | Flay | detekt (or CPD) | — | jscpd |
| **Code smells** | Feature envy, long params, etc. | Reek | detekt | — | — |
| **Churn × complexity** | High-maintenance hotspots | Churn + Flog | git log + detekt | git log + SwiftLint | git log + ESLint |

**Frontmatter — captured automatically during pipeline execution:**

Stage 5 (after each milestone) and `/create-pr` embed quality scores into `progress.md` frontmatter:

```yaml
---
# Per-milestone quality (captured by Stage 5 after each milestone completes)
pipeline_quality_m1_flog_avg: 8.2
pipeline_quality_m1_flog_max: 22.1
pipeline_quality_m1_flog_max_method: "DeficientLineItemsController#generate_report"
pipeline_quality_m1_files_touched: 6

# Project summary (captured by /create-pr)
pipeline_quality_flog_avg: 10.4
pipeline_quality_flog_max: 22.1
pipeline_quality_repo_baseline_flog_avg: 15.7
pipeline_quality_delta: -5.3
pipeline_quality_verdict: "below_average"
---
```

Key naming conventions (mirroring ROAD-19):
- Prefix: `pipeline_quality_` (vs. `pipeline_` for timing)
- Per-milestone: `pipeline_quality_m{N}_{tool}_{metric}`
- Project summary: `pipeline_quality_{tool}_{metric}`
- Baseline comparison: `pipeline_quality_repo_baseline_{tool}_{metric}`
- Delta: `pipeline_quality_delta` (negative = better than baseline)
- Verdict: `pipeline_quality_verdict` — one of `below_average` (good), `at_average`, `above_average` (concerning)

The tool/metric names come from the repo's Complexity Analysis config, so they're platform-specific. A Rails project gets `flog_avg`; an Android project gets `detekt_complexity_avg`. The `/quality` skill interprets whatever keys it finds.

**Before/after comparisons (three dimensions):**

1. **Pipeline code vs. codebase average:** Compare complexity scores of files touched by a pipeline project to the repo-wide baseline. Are we raising or lowering the bar?
2. **Pipeline code vs. hand-written code for similar features:** Compare a pipeline-built feature to a hand-built feature in the same codebase. Same domain, same patterns — is the agent's output simpler or more complex?
3. **Over time:** Track whether pipeline-generated code complexity trends up or down as the pipeline matures (skills improve, conventions file grows, knowledge extraction kicks in).

**Implementation approach (mirroring ROAD-19 phases):**

1. **v1 (frontmatter + reporting skill):**
   - Modify Stage 5 to run the repo's declared complexity tools after each milestone completes. Embed scores into `progress.md` frontmatter.
   - Modify `/create-pr` to run the tools against all pipeline-touched files, compute the repo baseline, and embed the summary + delta into frontmatter. Add a "Code Quality" section to the PR body.
   - Build `/quality <slug>` skill — reads frontmatter from `progress.md`, formats the quality report, writes to `<projects-path>/<slug>/quality.md`. Same read-only, format-and-report pattern as `/metrics`.

2. **v2 (backfill):**
   - Build `/backfill-quality <slug>` skill — checks out the project's pipeline branch (from `progress.md` frontmatter or git branch naming convention), runs the repo's complexity tools against the files changed on that branch, computes the baseline from the merge target, and writes frontmatter into `progress.md`. Marks backfilled entries with `pipeline_quality_backfilled: true`.
   - This is more expensive than `/backfill-timing` (which just reads git timestamps) because it actually runs analysis tools. For old projects where the branch has been deleted, it can diff the merge commit instead.

3. **v3 (trend tracking):**
   - The `/quality` skill gains a `--all` mode that reads quality frontmatter across all projects for the active product, producing a trend report: "Project 1: -5.3 delta, Project 2: -2.1 delta, Project 3: +1.8 delta — quality trending slightly up over 3 projects."
   - ROAD-27 (Weekly Digest) consumes this trend data for the quality score section.

**Output — `/quality <slug>` report (`quality.md`):**

```markdown
# Code Quality — <slug>

> Generated: <current date/time>
> Data quality: [live / backfilled]
> Tools: Flog, RuboCop Metrics (from repo config)

## Quality Scorecard

| Metric | Pipeline Code | Repo Baseline | Delta | Verdict |
|--------|--------------|---------------|-------|---------|
| Flog (avg) | 10.4 | 15.7 | -5.3 | Below average (good) |
| Cyclomatic (avg) | 4.2 | 5.8 | -1.6 | Below average (good) |
| Method length (avg) | 12 lines | 18 lines | -6 | Below average (good) |

## Per-Milestone Breakdown

| Milestone | Files | Flog avg | Flog max | Hotspot |
|-----------|-------|----------|----------|---------|
| M1 | 6 | 8.2 | 22.1 | DeficientLineItemsController#generate_report |
| M2 | 4 | 13.1 | 18.4 | ReportExporter#to_pdf |
| **Total** | 10 | 10.4 | 22.1 | — |

## Hotspots (top 5 by complexity)

| File | Method | Flog | Note |
|------|--------|------|------|
| app/controllers/deficient_line_items_controller.rb | #generate_report | 22.1 | Consider extracting |
| ... | | | |

## Data Quality Notes

- [Live vs backfilled]
- [Which tools ran, which were skipped]
```

**setup-pipeline-repo integration:**

Add a new step to `/setup-pipeline-repo` (after Step 4: Detect Post-Flight Checks):

> **Step 4b: Detect Complexity Analysis Tools**
>
> From the dependency files, detect available complexity tools (same detection approach as post-flight checks). Present suggestions to the user — they can add, remove, or modify. Write the confirmed tools into the Complexity Analysis section of the config.

**OrangeQC considerations:**
- Larger, older codebase — the repo average may be skewed by legacy code
- More interesting comparison: pipeline code vs. *recent* hand-written code (last 6 months), not historical average
- StandardRB is already enforced (ROAD-04 post-flight) — complexity metrics go beyond style
- Available tools: Flog and RuboCop (in Gemfile). Flay and Reek could be added standalone.

**Multi-repo projects (Level 3):**
- A Level 3 project touches Rails + iOS + Android. Each repo declares its own tools.
- The quality report shows per-repo results, not cross-language averages.
- Cross-platform comparison isn't meaningful (Flog scores don't compare to detekt scores). Compare each repo to *its own* baseline.

**Considerations:**
- Complexity metrics are *indicators*, not judgments. A complex method might be justified by the domain. The goal is visibility, not enforcement.
- PR body integration (v1) is the highest-leverage deliverable — it makes quality visible at the exact moment a reviewer is deciding whether to merge
- Could feed into ROAD-15 (Knowledge Extraction) — if a pattern consistently produces high-complexity code, that's a pipeline lesson worth capturing
- Track per-milestone too, not just per-project — some milestones (data model) should be simple; others (complex business logic) may justify higher complexity
- Repos with no Complexity Analysis section in their config simply skip quality capture — graceful degradation, not a hard requirement
- The backfill skill is more resource-intensive than `/backfill-timing` — it needs to check out branches and run tools, not just read timestamps. Consider caching baseline scores per-repo so the baseline doesn't need to be recomputed for every backfilled project.

**Related:** ROAD-19 (DORA Metrics — same infrastructure pattern, complementary measurement), ROAD-09 (Code Review — reviewer should consider complexity), ROAD-15 (Knowledge Extraction — complexity patterns are learnable), ROAD-04 (Post-Flight Checks — same config-driven pattern), ROAD-12 (setup-pipeline-repo — detects and writes the config), ROAD-27 (Weekly Digest — consumes quality data for the scorecard, shows speed-vs-quality tradeoff alongside ROAD-19 timing data)

---

## Visibility & Monitoring

### ROAD-21: Pipeline Dashboard (Factorio Theme)

**Status:** Planned
**Theme:** Visibility
**Depends on:** ROAD-19 (DORA Metrics), ROAD-20 (Code Complexity Analysis) — for the metrics panels

A web dashboard that visualizes pipeline state across all products and projects. Factorio-themed — projects are items moving through an assembly line, stages are machines that process them, milestones are intermediate products on conveyor belts.

**Why:** The pipeline's state is currently spread across markdown files in multiple directories — `progress.md` per project, `gameplan.md` for milestones, git branches for implementation state. There's no single view that answers "what's the status of everything?" You have to know which product is active, find the right `pipeline-projects/` directory, read the right files. A dashboard makes the pipeline's state visible at a glance — which projects are in flight, which stage each is at, what's blocked, what's complete.

**What it shows:**

| Panel | Data Source | What You See |
|-------|------------|-------------|
| **Assembly Line** (main view) | `progress.md` per project | Each project as an item on a conveyor belt, positioned at its current stage (0-7). Completed stages glow green. Active stage pulses. Blocked stages show a red inserter arm. |
| **Project Detail** (click to expand) | `progress.md`, `gameplan.md` | Milestone breakdown with completion status, commit SHAs, test results, acceptance criteria checklist |
| **Product Switcher** | `pipelines/` directory | Toggle between OrangeQC, Show Notes, etc. Each product has its own assembly line |
| **Metrics Panel** | ROAD-19 + ROAD-20 data | DORA metrics (lead time, deployment frequency), complexity scores, test counts — displayed as Factorio-style production statistics |
| **Stage Machine Status** | Derived from project state | Each stage (0-7) shown as a Factorio assembler. Tooltip shows: projects currently in this stage, average time spent, throughput |

**Factorio visual language:**

| Pipeline Concept | Factorio Analogue |
|-----------------|-------------------|
| Project | Item on a belt |
| Stage | Assembling machine |
| Milestone | Intermediate product |
| Human checkpoint (Stage 2, 3) | Inserter waiting for manual input (blinking) |
| Blocked project | Red belt segment |
| Complete project (PR merged) | Item reaching the end of the line → into a chest |
| Metrics | Production statistics screen |
| Product (OrangeQC, Show Notes) | Separate factory floor / tab |

**Architecture options:**

| Option | How It Works | Pros | Cons |
|--------|-------------|------|------|
| **A: Static site in this repo** | Build step reads `progress.md` files from configured `pipeline-projects/` paths, generates a static HTML dashboard. Serve locally or deploy. | Simple, no runtime dependencies, all data is local files | Requires rebuild on changes, paths are machine-specific |
| **B: Separate repo with file watcher** | Standalone web app that watches `pipeline-projects/` directories via `fswatch` or polling. Live-updates when `progress.md` changes. | Real-time updates, clean separation | Another repo to maintain, needs to know directory paths |
| **C: In this repo with local server** | A small Ruby/Node server in `dashboard/` that reads project files on request. `bin/dashboard` starts it on localhost. | Single repo, live data, easy to run | Adds runtime code to a repo that's currently docs + skills only |
| **D: GitHub Pages + CI** | CI job reads progress files, generates static dashboard, deploys to GitHub Pages. | Shareable URL, no local server | Pipeline-projects are external/gitignored — CI can't see them. Would need a data push step. |

**Recommendation:** Option C for v1 — a small local server in this repo. The dashboard is a development tool, not a production service. Running `bin/dashboard` to see pipeline state on `localhost:3000` fits the workflow. The Factorio theme is a static asset concern (CSS, SVG sprites) that doesn't need a build pipeline.

For v2, if the team grows or Dave wants to check status from his phone, Option D with a data-push step (each stage completion pushes a JSON snapshot) gives a shareable URL.

**Data model:**

The dashboard doesn't need its own database. It reads the existing project artifacts:

```
For each product (from pipelines/*.md):
  Read pipeline config → get projects path
  For each project directory in projects path:
    Read progress.md → current milestone status, commits, test results
    Read gameplan.md → milestone definitions, acceptance criteria
    Read prd.md → project metadata (level, title, platforms)
    Derive current stage from:
      - Has prd.md but no discovery-report.md → Stage 0
      - Has discovery-report.md but no architecture-proposal.md → Stage 1
      - Has architecture-proposal.md (unapproved) → Stage 2 (awaiting review)
      - Has architecture-proposal.md (approved) but no gameplan.md → Stage 2 (complete)
      - Has gameplan.md (unapproved) → Stage 3 (awaiting review)
      - Has gameplan.md (approved) but no test-coverage-matrix.md → Stage 3 (complete)
      - Has test-coverage-matrix.md but no progress.md → Stage 4
      - Has progress.md with pending milestones → Stage 5
      - All milestones complete, no qa-plan.md → Stage 5 (complete)
      - Has qa-plan.md → Stage 7
```

**Metrics integration (requires ROAD-19 + ROAD-20):**

The metrics panels are the reason for the dependency. Without ROAD-19/20, the dashboard can still show project state (which stage, which milestones, test results) but can't show DORA metrics or complexity analysis. The dashboard should be designed with placeholder panels for metrics from day one, so ROAD-19/20 data slots in when available.

Possible phased approach:
- **v1 (no metrics dependency):** Assembly line view + project details. Shows stage progression, milestone status, test results. Factorio theme. No metrics panels.
- **v2 (after ROAD-19):** Add DORA metrics panel — lead time sparklines, deployment frequency chart, production statistics overlay.
- **v3 (after ROAD-20):** Add complexity panel — per-project complexity scores, trend lines, comparison to codebase baseline.

**Tech stack options:**

| Stack | Why | Tradeoff |
|-------|-----|----------|
| **Plain HTML + vanilla JS + Tailwind** | Zero dependencies, matches pipeline philosophy | More manual DOM work for the Factorio animations |
| **Ruby (Sinatra/Roda) + ERB** | Dave knows Ruby, pipeline is Ruby-adjacent | Adds a Gemfile to a repo that doesn't have one |
| **Node (Express) + vanilla JS** | Lightweight server, good for file watching + WebSocket live updates | Adds Node to a repo that doesn't use it |
| **Python (Flask)** | Simple, good markdown parsing | Mismatched with the Ruby ecosystem |

**Considerations:**
- The Factorio theme is the fun part but shouldn't block shipping. v1 could be a clean, functional dashboard with Factorio-inspired colors (dark background, orange/green/red accents) and upgrade to full sprite-based visuals later.
- File watching for live updates is a nice-to-have. Refresh-on-load is fine for v1.
- The dashboard should work for any number of products — the multi-product support (ROAD-12) means the data model is already product-aware.
- Pipeline configs (`pipeline.md`, `pipelines/*.md`) are gitignored. The dashboard needs to read them from the local filesystem, which means it only works locally (or needs a config push mechanism for remote hosting).
- Consider whether the dashboard could also serve as the "notification center" from ROAD-02 — showing recent stage completions, pending reviews, etc.

**Related:** ROAD-02 (Notifications — dashboard could display them), ROAD-08 (Linear Automation — could pull Linear issue status into the dashboard), ROAD-19 (DORA Metrics — feeds the metrics panel), ROAD-20 (Code Complexity — feeds the complexity panel)

### ROAD-22: Pipeline Status MCP Server

**Status:** Planned
**Theme:** Visibility
**Priority:** High — enables agent-to-agent coordination without external services

An MCP server that exposes pipeline project status as tools. Any agent in the ecosystem (CEO agent, review agent, planning agent) can connect to it and query project state — no filesystem access required, no Linear, no dashboard.

**Why:** The pipeline's artifact directory is already the source of truth for project state. The presence of `architecture-proposal.md`, the approval stamp inside it, the milestone statuses in `progress.md` — that *is* the project status. But only the pipeline operator knows how to find and interpret these files. Other agents have no access path. An MCP server turns the artifact directory into a queryable API using the native agent communication protocol.

**The core insight:** The pipeline already produces structured artifacts in a predictable directory layout. Stage derivation is deterministic from file existence + content. This isn't a new data model — it's an access layer over the one we already have.

**Directory schema (the "API contract"):**

The MCP server codifies this existing convention:

```
<projects-path>/<slug>/
  prd.md                      # exists → past Stage 0
  discovery-report.md          # exists → past Stage 1
  architecture-proposal.md     # exists → past Stage 2 (approval status inside)
  gameplan.md                  # exists → past Stage 3 (approval status inside)
  test-coverage-matrix.md      # exists → past Stage 4
  progress.md                  # exists → Stage 5+ (milestone table inside)
  qa-plan.md                   # exists → past Stage 7
```

Stage derivation rules:

| Files Present | Approval State | Current Stage |
|--------------|----------------|---------------|
| `prd.md` only | — | Stage 0 (PRD complete) |
| + `discovery-report.md` | — | Stage 1 (Discovery complete) |
| + `architecture-proposal.md` | Unapproved | Stage 2 (awaiting architecture review) |
| + `architecture-proposal.md` | Approved | Stage 2 (complete, ready for Stage 3) |
| + `gameplan.md` | Unapproved | Stage 3 (awaiting gameplan review) |
| + `gameplan.md` | Approved | Stage 3 (complete, ready for Stage 4) |
| + `test-coverage-matrix.md` | — | Stage 4 (tests generated) |
| + `progress.md` | Pending milestones | Stage 5 (implementation in progress) |
| + `progress.md` | All milestones complete | Stage 5 (complete, ready for Stage 7) |
| + `qa-plan.md` | — | Stage 7 (QA plan complete, ready for PR) |

Approval detection: scan for `Status` field in the approval checklist — "Approved" or "Approved with Modifications" means approved.

Milestone status: parse the milestone status table in `progress.md` — each row has milestone ID, description, and status (**Complete** / Pending / In Progress).

**MCP tools:**

| Tool | Input | Output |
|------|-------|--------|
| `list_products` | — | Available products from `pipelines/*.md` with name and projects path |
| `list_projects` | `product?` | All projects for the active (or specified) product: slug, current stage, blocking status, milestone summary |
| `get_project_status` | `slug`, `product?` | Full status: current stage, milestone breakdown, test results, branch name, next action, what's blocking |
| `get_project_artifact` | `slug`, `artifact`, `product?` | Raw content of a specific artifact (prd, gameplan, architecture-proposal, progress, qa-plan, discovery-report, test-coverage-matrix) |

Example `get_project_status("opml-import")` response:

```json
{
  "project": "opml-import",
  "product": "show-notes",
  "level": 2,
  "current_stage": {
    "number": 5,
    "label": "Implementation",
    "detail": "4 of 5 milestones complete"
  },
  "milestones": [
    { "id": "M1", "title": "OPML Parsing & Import Service", "status": "complete", "commit": "8e871ab" },
    { "id": "M2", "title": "Import Controller & Views", "status": "complete", "commit": "0a439b0" },
    { "id": "M3", "title": "Entry Points & Integration", "status": "complete", "commit": "53e3d9d" },
    { "id": "M4", "title": "QA Test Data", "status": "complete", "commit": "7e685eb" },
    { "id": "M5", "title": "Edge Cases & Polish", "status": "pending" }
  ],
  "branch": "pipeline/opml-import",
  "next_action": "Implement M5 (Edge Cases & Polish)",
  "blocking": null,
  "test_results": { "passing": 311, "failing": 1, "note": "1 pre-existing queue isolation gap" }
}
```

Example `list_projects()` response (summary view):

```json
[
  {
    "slug": "opml-import",
    "product": "show-notes",
    "stage": "Implementation (M4/M5)",
    "status": "in_progress"
  },
  {
    "slug": "email-notifications",
    "product": "show-notes",
    "stage": "Complete (ready for PR)",
    "status": "complete"
  },
  {
    "slug": "deficient-line-items-report",
    "product": "orangeqc",
    "stage": "QA Plan complete",
    "status": "complete"
  }
]
```

**Implementation:**

The server is lightweight — file reads + markdown parsing + stage derivation logic. No database, no external dependencies.

```
pipeline/
  mcp-server/
    server.js (or server.rb)     # MCP protocol handler
    status.js                    # Stage derivation + artifact parsing
    config.js                    # Reads pipelines/*.md for product configs
```

**How it finds data:**
1. Read all `pipelines/*.md` files → extract product names and project paths
2. For each product, scan its projects path for subdirectories
3. For each project directory, check which artifacts exist and parse their content
4. Apply the stage derivation rules above

**How agents connect:**
- Add the MCP server to the agent's MCP config (Claude Code's `settings.json`, or whatever the agent framework uses)
- The server runs locally — same machine as the pipeline operator
- No auth needed for v1 (local-only, same trust boundary as filesystem access)

**Parsing considerations:**
- `progress.md` milestone table is the trickiest parse — markdown table with bold markers for status
- `architecture-proposal.md` and `gameplan.md` approval status is a checklist item near the bottom
- `prd.md` header has the project level
- `gameplan.md` has milestone definitions (title, description, acceptance criteria count)
- All parsing is regex/line-based — no full markdown AST needed

**What this replaces / deprioritizes:**
- **ROAD-08 (Linear Automation)** — if the MCP server is the primary status surface, Linear integration becomes optional ("nice to have" for teams that use Linear) rather than the coordination backbone. The artifact directory is the source of truth, not Linear.
- **ROAD-21 (Dashboard)** — the dashboard becomes a *client* of the same data the MCP server reads. Could even consume the MCP tools directly. The MCP server is the data layer; the dashboard is one possible presentation layer.

**What this doesn't replace:**
- **ROAD-02 (Notifications)** — the MCP server is pull-based (agent asks "what's the status?"). Notifications are push-based (pipeline tells you "stage 2 just finished"). Both are useful.
- **ROAD-15 (Knowledge Extraction)** — different concern entirely (learning from the work vs. reporting on the work).

**Open questions:**
- **Multi-machine access:** v1 is local-only. If the CEO agent runs on a different machine, it can't connect. Options: (a) run the MCP server on a shared host, (b) expose via SSH tunnel, (c) add a REST API alongside MCP. Defer until the need arises.
- **Write tools:** Should the MCP server also expose tools for *updating* project state (e.g., approving an architecture proposal, adding a note)? Or should writes always go through the pipeline skills? Start read-only, extend later.
- **Staleness:** The MCP server reads files on demand — always fresh. But if an agent caches a response, it could go stale during an active implementation session. Document that responses are point-in-time snapshots.
- **Which product is "active"?** `list_projects` without a product argument could read `pipeline.md` (the active pointer) or scan all products. Scanning all products is more useful for a CEO agent that wants the full picture.

**Related:** ROAD-08 (Linear — deprioritized by this), ROAD-21 (Dashboard — becomes a client of this data), ROAD-02 (Notifications — complementary push model)

---

### ROAD-23: Stage 4 Test Quality Heuristics

**Status:** Done
**Theme:** Quality assurance

Add a set of test quality heuristics to the Stage 4 (Test Generation) skill to prevent recurring antipatterns that cause false failures or Stage 5 friction.

**Why:** Across 5 pipeline projects, Stage 4 has produced tests with recurring issues that only surface during Stage 5 implementation or during full-suite runs. These aren't logic errors — they're test *design* issues that a checklist of known antipatterns would prevent every time.

**Antipatterns observed:**

| Antipattern | Example | Fix |
|-------------|---------|-----|
| **Cumulative matchers** | `have_been_enqueued` checks all jobs enqueued in the describe block, not just the current example. Passes in isolation, fails in full suite. | Use block-form: `expect { action }.to have_enqueued_job.with(args)` |
| **Mixed route helper names** | Tests use both `new_import_path` (singular) and `imports_path` (plural) inconsistently — depends on whether routes use `resource` vs. `resources` | Verify route helper names by reading `config/routes.rb` or running `rails routes` before writing tests |
| **Testing implementation details** | Test asserts a specific SQL query structure or internal method call that Stage 5 may implement differently | Test observable behavior (return values, side effects, database state), not internal implementation |
| **Hardcoded values that drift** | Test asserts a specific flash message string that Stage 5 implements slightly differently | Use `include("key phrase")` instead of exact string matching where the exact wording isn't part of the acceptance criteria |
| **Missing test isolation** | Test relies on state from a prior example (e.g., database records created in a previous `it` block) | Each example should set up its own state via `let` and `before` |
| **Stubbing non-existent interfaces** | Test stubs a method with a specific signature that Stage 5 implements with a different signature | Stub at the boundary (e.g., HTTP responses, file reads), not at internal method level |

**How to implement:**

Add a "Test Quality Heuristics" section to the Stage 4 skill, referenced during test writing (Step 4). The heuristics are a checklist the agent reviews before finalizing each test file.

**Considerations:**
- These are guidelines, not hard rules — some tests legitimately need exact string matching or specific method stubs
- The list should grow as new antipatterns are discovered in future projects
- Pairs well with ROAD-15 (Knowledge Extraction) — test antipatterns discovered during Stage 5 should flow back into this list

**Related:** ROAD-15 (Knowledge Extraction — antipatterns are learnable), ROAD-18 (Gameplan Coherence — quality gates at different stages)

---

### ROAD-24: Merge PIPELINE.md into Conventions Files

**Status:** Done
**Theme:** Portability
**Supersedes:** ROAD-05 (two-file architecture becomes a one-file-per-repo architecture)

Eliminate `PIPELINE.md` as a standalone file. Fold its unique content into each target repo's conventions file (`AGENTS.md` for OrangeQC, `CLAUDE.md` for Show Notes). One file per repo, one source of truth.

**Why:** ROAD-05 created a two-file architecture: `pipeline.md` (where repos are) + `PIPELINE.md` (how the repo works). In practice, `PIPELINE.md` overlaps ~80% with the conventions file and the two have already drifted — `AGENTS.md` says the default branch is `dave/agents-staging`, `PIPELINE.md` says `staging` (correct). Having two files that describe the same repo invites inconsistency. The conventions file already serves every Claude Code session; `PIPELINE.md` only serves pipeline skills. Merging them means pipeline skills and ad-hoc Claude sessions read the same truth.

**Current state (three layers):**
```
pipeline.md (pipeline repo)     → where repos are
  ↓
PIPELINE.md (each target repo)  → how the repo works (branch, framework, dirs, checks, guardrails)
  ↓
AGENTS.md / CLAUDE.md           → how to write code (conventions, patterns, gotchas)
```

**Proposed state (two layers):**
```
pipeline.md (pipeline repo)     → where repos are + which conventions file to read
  ↓
AGENTS.md / CLAUDE.md           → how the repo works + how to write code (everything in one file)
```

**What changes:**

#### 1. Add "Pipeline Configuration" section to each conventions file

**OrangeQC AGENTS.md** — add near the top (after "Git Branch and Push Policy"):
- Fix default branch from `dave/agents-staging` to `staging`
- New section with: default branch, test command, branch prefix, platforms, seed tasks dir
- Implementation order (7 steps)
- Post-flight checks (StandardRB, Brakeman, ripsecrets)
- Guardrails
- Directory structure table for spec paths (app/ paths are already covered in "Codebase Structure")

Don't duplicate what AGENTS.md already covers (framework, app/ directory structure, multi-tenant patterns, API conventions — these are already there in different form).

**Show Notes CLAUDE.md** — add at the end. Larger addition since CLAUDE.md has less technical reference:
- Repository details, framework & stack table, directory structure, platforms
- Implementation order, post-flight checks, guardrails

#### 2. Update pipeline.md format

Add `Conventions File` column to the Target Repositories table:

```markdown
| Repository | Path | Conventions File | Purpose |
|-----------|------|-----------------|---------|
| Primary | `~/projects/orangeqc/orangeqc/` | `AGENTS.md` | Rails web app + API backend |
```

Update: `pipeline.md.example`, `pipelines/orangeqc.md`, `pipelines/show-notes.md`, and the active `pipeline.md`.

Remove the blockquote paragraphs about `PIPELINE.md` from all pipeline configs.

#### 3. Update all 9 skills

Mechanical find-and-replace across all skills:
- "Read `PIPELINE.md` in the primary repository" → "Read the conventions file (name from pipeline.md Target Repositories)"
- "from `PIPELINE.md` Repository Details" → "from the conventions file"
- Merge the two "read config" steps (PIPELINE.md + conventions file) into one step
- Remove the self-referential "Conventions file" row instructions

**Files:**
- `.claude/skills/stage0-prd/SKILL.md`
- `.claude/skills/stage1-discovery/SKILL.md`
- `.claude/skills/stage2-architecture/SKILL.md`
- `.claude/skills/stage3-gameplan/SKILL.md`
- `.claude/skills/stage4-test-generation/SKILL.md`
- `.claude/skills/stage5-implementation/SKILL.md`
- `.claude/skills/stage7-qa-plan/SKILL.md`
- `.claude/skills/create-pr/SKILL.md`
- `.claude/skills/setup-pipeline-repo/SKILL.md` — biggest change: generates a "Pipeline Configuration" section in the existing conventions file (or creates one if none exists) instead of generating a standalone `PIPELINE.md`

#### 4. Update pipeline repo docs

- `CLAUDE.md` — update "Pipeline Configuration" section (three-layer → two-layer), remove all `PIPELINE.md` references
- `pipelines/README.md` — remove `PIPELINE.md` references from "Creating a config" instructions
- `docs/roadmap.md` — update ROAD-05 description to note it was superseded by ROAD-24
- `docs/pipeline-architecture.md` — update if it references `PIPELINE.md`

#### 5. Delete PIPELINE.md from both repos

- `~/projects/orangeqc/orangeqc/PIPELINE.md` — delete
- `~/projects/show-notes/PIPELINE.md` — delete

#### 6. Update MEMORY.md

Reflect the new two-layer architecture. Remove references to PIPELINE.md as a separate file.

**Execution order:**

1. Add Pipeline Config section to OrangeQC AGENTS.md + fix default branch
2. Add Pipeline Config section to Show Notes CLAUDE.md
3. Update pipeline repo — all skills, docs, pipeline.md format (single commit)
4. Delete PIPELINE.md from both repos (one commit per repo)
5. Update MEMORY.md

**Verification:**

After all changes:
1. `grep -r "PIPELINE.md" .claude/skills/` → zero results (except possibly setup-pipeline-repo explaining the migration)
2. Activate OrangeQC config, verify pipeline.md has conventions file column
3. Activate Show Notes config, verify same
4. Verify PIPELINE.md is gone from both repos
5. Spot-check a skill (e.g., stage4) reads correctly from the conventions file

**Files modified (by repo):**

| Repo | Files |
|------|-------|
| OrangeQC Rails (`~/projects/orangeqc/orangeqc/`) | `AGENTS.md` (edit), `PIPELINE.md` (delete) |
| Show Notes (`~/projects/show-notes/`) | `CLAUDE.md` (edit), `PIPELINE.md` (delete) |
| Pipeline (`~/projects/orangeqc/agent-pipeline/`) | 9 skill files, `pipeline.md.example`, `pipeline.md`, `pipelines/orangeqc.md`, `pipelines/show-notes.md`, `pipelines/README.md`, `CLAUDE.md`, `docs/roadmap.md`, `docs/pipeline-architecture.md`, `MEMORY.md` |

**Considerations:**
- This is a zero-behavior-change refactor — skills read the same information, just from one file instead of two
- The conventions file grows, but most of the added content is structured tables that are easy to skip when reading for other purposes
- `/setup-pipeline-repo` becomes simpler to explain to users: "it adds a section to your conventions file" vs. "it creates a separate PIPELINE.md file"
- Future products onboarded via `/setup-pipeline-repo` only need one file created, not two

**Related:** ROAD-05 (superseded), ROAD-12 (Multi-Product — setup-pipeline-repo changes), ROAD-15 (Knowledge Extraction — conventions file is now the single target for repo-scoped knowledge)

---

### ROAD-25: Multi-Runtime Support (Claude Code + Codex)

**Status:** Planned
**Theme:** Portability

Make the pipeline executable by both Claude Code and OpenAI Codex CLI, so skills aren't locked to a single agent runtime. The pipeline's value is in its staged process, templates, and project artifacts — not in which LLM executes the prompts.

**Why:** The pipeline is currently coupled to Claude Code through three layers: skill metadata (YAML front matter), tool names (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Task`, `AskUserQuestion`), and discovery convention (`.claude/skills/*/SKILL.md`). If Claude Code becomes unavailable, degrades, or a better runtime emerges, every skill needs manual rewriting. More practically: Codex may outperform Claude Code on certain tasks (or vice versa), and the pipeline should let the operator choose the best tool per stage or per project.

**The two runtimes:**

| Capability | Claude Code | Codex CLI |
|-----------|------------|-----------|
| **Conventions file** | `CLAUDE.md` | `AGENTS.md` |
| **Custom skills/commands** | Yes — `.claude/skills/*/SKILL.md` with YAML front matter | No — built-in slash commands only |
| **Tool model** | Named tools (`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Task`) | Shell-first — file ops via shell commands, no granular tool abstraction |
| **Non-interactive execution** | No dedicated mode (runs in TUI) | `codex exec` — headless, JSON output, scriptable |
| **Sub-agents** | `Task` tool spawns specialized sub-agents | Agents SDK + MCP server (`codex mcp-server` exposes `codex` and `codex-reply` tools) |
| **Tool whitelisting** | `allowed-tools` in YAML front matter | Sandbox modes (`read-only`, `workspace-write`, `danger-full-access`) + approval policies |
| **User interaction** | `AskUserQuestion` tool | Interactive TUI prompts (no programmatic equivalent in exec mode) |
| **MCP support** | Client (connects to MCP servers) | Both client and server (`codex mcp-server`) |
| **Approval modes** | Permission-based (per tool type) | Policy-based (`untrusted`, `on-failure`, `on-request`, `never`) |

**The coupling points in current skills:**

| Layer | Claude Code-Specific | What Needs Abstracting |
|-------|---------------------|----------------------|
| **Metadata** | YAML front matter (`name`, `allowed-tools`, `disable-model-invocation`, `argument-hint`) | Skill registration and capability declaration |
| **Tool calls** | `Read file.rb` → structured tool | `cat file.rb` or equivalent shell command |
| **File editing** | `Edit` tool with old_string/new_string | `sed`, `patch`, or write-full-file |
| **Search** | `Glob` and `Grep` tools | `find` and `grep`/`rg` commands |
| **Sub-agents** | `Task` tool with agent types | Agents SDK hand-offs or sequential prompts |
| **User prompts** | `AskUserQuestion` with structured options | TUI interaction or pre-configured answers |
| **Arguments** | `$ARGUMENTS` variable injection | CLI arguments to `codex exec` |
| **Discovery** | `.claude/skills/*/SKILL.md` auto-scan | No equivalent — must be invoked explicitly |

**Architecture options:**

| Option | How It Works | Tradeoffs |
|--------|-------------|-----------|
| **A: Canonical format + transpilers** | Skills authored in a runtime-neutral markdown format. A build step generates `.claude/skills/` for Claude Code and `codex exec` wrapper scripts for Codex. | Single source of truth. But adds a build step, and the "neutral" format is a new invention that neither runtime natively understands. |
| **B: Dual-format skills** | Maintain two versions of each skill — one in `.claude/skills/` and one in a `codex/skills/` directory. Share the prompt body via includes or symlinks. | No build step. But double maintenance burden, divergence risk. |
| **C: Prompt body + runtime adapters** | Factor each skill into two parts: (1) the prompt body (pure markdown instructions, runtime-agnostic) and (2) a thin runtime adapter that wraps it with metadata and tool mappings. The adapter is ~10 lines per runtime. | Clean separation. Prompt body is the "program"; adapter is the "runtime". Minimal overhead per new runtime. |
| **D: MCP-based orchestration** | Skip the skill system entirely. Build a pipeline orchestrator that drives any runtime via MCP. Claude Code and Codex both support MCP. The orchestrator calls `codex mcp-server` or Claude Code's tools through a unified interface. | Most portable long-term. But significant architectural change — replaces the manual slash-command workflow with programmatic orchestration. Overlaps with ROAD-11 (Ludicrous Speed). |

**Recommendation:** Option C for v1, with Option D as the long-term direction.

Option C is the smallest change that delivers multi-runtime support. Today, each `SKILL.md` file is ~90% runtime-agnostic prompt body and ~10% Claude Code metadata + tool references. Factoring out the prompt body means:

```
.claude/skills/stage5-implementation/
  SKILL.md              # Claude Code adapter (YAML front matter + tool-specific wrappers)

skills/
  stage5-implementation/
    prompt.md            # Runtime-agnostic prompt body (the actual instructions)
    claude-code.yaml     # Claude Code metadata (allowed-tools, argument-hint)
    codex.yaml           # Codex metadata (sandbox mode, approval policy)
```

The Claude Code adapter (`SKILL.md`) includes the prompt body and wraps tool references. The Codex adapter is a shell script or `codex exec` invocation that loads the same prompt body.

**Tool mapping (Claude Code → Codex):**

| Claude Code Tool | Codex Equivalent | Notes |
|-----------------|-----------------|-------|
| `Read` | `cat` / shell | Codex reads files via shell commands |
| `Write` | Write to file via shell | `cat > file <<'EOF'` or editor commands |
| `Edit` | `sed`, `patch`, or full-file rewrite | Less precise than Claude Code's Edit tool |
| `Bash` | Direct shell execution | Native — Codex is shell-first |
| `Glob` | `find` / `fd` | Shell equivalent |
| `Grep` | `grep` / `rg` | Shell equivalent |
| `Task` | Agents SDK hand-off or sequential `codex exec` calls | Different orchestration model |
| `AskUserQuestion` | Not available in `codex exec` | Must pre-configure or skip interactive prompts |

**The `AskUserQuestion` problem:**

Several pipeline stages use interactive prompts (Stage 0 asks which inbox file to use, Stage 5 confirms before committing). Codex's `exec` mode is non-interactive. Options:
1. **Pre-configure answers** — pass decisions as CLI arguments or a config file
2. **Skip prompts in auto mode** — use sensible defaults (pairs with ROAD-11 Ludicrous Speed)
3. **Interactive stages stay Claude Code-only** — Codex handles non-interactive stages (4, 5, 7, create-pr)

Option 3 is pragmatic for v1: most pipeline value is in Stages 4, 5, and 7, which are non-interactive.

**The sub-agent problem:**

Stage 5 uses the `Task` tool heavily to explore codebases in parallel. Codex's equivalent is the Agents SDK with MCP hand-offs — architecturally different. For v1, Codex skills could skip sub-agents and run exploration sequentially (slower but functional). For v2, the MCP orchestration approach (Option D) handles this natively.

**Implementation phases:**

| Phase | What Ships | Effort |
|-------|-----------|--------|
| **v1: Factor prompt bodies** | Extract runtime-agnostic prompt bodies from all 9 skills into `skills/`. Claude Code `SKILL.md` files become thin wrappers that include the prompt body. No Codex support yet, but the separation is done. | S — mechanical refactor |
| **v2: Codex adapters for non-interactive stages** | Add `codex exec` wrapper scripts for Stages 4, 5, 7, and create-pr. Tool references in prompt bodies use a `{{read}}` / `{{write}}` / `{{bash}}` syntax that adapters expand. | M — need to test Codex execution, tune prompts |
| **v3: Interactive stage support** | Add Codex support for Stages 0-3 via pre-configuration or TUI mode. Handle `AskUserQuestion` equivalents. | M — design decisions about interaction model |
| **v4: MCP orchestration** | Build a pipeline orchestrator that drives either runtime via MCP. Replaces manual slash commands with programmatic stage chaining. Subsumes ROAD-11. | L — new architectural layer |

**What changes per phase:**

v1 file structure:
```
skills/                              # NEW — runtime-agnostic prompt bodies
  stage0-prd/prompt.md
  stage1-discovery/prompt.md
  stage2-architecture/prompt.md
  stage3-gameplan/prompt.md
  stage4-test-generation/prompt.md
  stage5-implementation/prompt.md
  stage7-qa-plan/prompt.md
  create-pr/prompt.md
  setup-pipeline-repo/prompt.md

.claude/skills/                      # EXISTING — Claude Code adapters (thin wrappers)
  stage0-prd/SKILL.md               # YAML front matter + `{% include skills/stage0-prd/prompt.md %}`
  ...
```

v2 adds:
```
codex/                               # NEW — Codex adapters
  stage4-test-generation.sh          # `codex exec` with prompt body + tool mappings
  stage5-implementation.sh
  stage7-qa-plan.sh
  create-pr.sh
```

**Conventions file convergence:**

Claude Code reads `CLAUDE.md`. Codex reads `AGENTS.md`. Both serve the same purpose. ROAD-24 already proposes merging `PIPELINE.md` into the conventions file. Multi-runtime support adds another dimension: the conventions file name varies by runtime. Options:
1. **Maintain both** — `CLAUDE.md` and `AGENTS.md` as symlinks to the same file
2. **Pick one** — standardize on `AGENTS.md` (both runtimes read it)
3. **Runtime reads both** — Claude Code already reads `CLAUDE.md`; Codex already reads `AGENTS.md`; just ensure content is equivalent

Option 3 is simplest for v1. Show Notes already has `CLAUDE.md`. If Codex is added, an `AGENTS.md` can be a symlink or a copy.

**Considerations:**
- v1 (factor prompt bodies) is valuable even if Codex support never ships — it makes skills easier to read, test, and maintain
- The pipeline's real moat is the staged process, templates, and artifact schema — not the runtime. Making this explicit via separation is good architecture regardless.
- Codex's `exec` mode + `--full-auto` flag is better suited for unattended pipeline execution than Claude Code's TUI. This could flip the "primary" runtime for CI/automation use cases.
- Codex can run as an MCP server, which means the pipeline MCP server (ROAD-22) could orchestrate Codex as a worker — pipeline status MCP server reads state, pipeline orchestrator MCP server drives execution.
- Different models may be better at different stages. Claude Opus might be better at architecture (Stage 2), while GPT-5 Codex might be faster at implementation (Stage 5). Multi-runtime enables mixing.
- The `allowed-tools` whitelisting in Claude Code skills is a security feature (prevents planning stages from modifying code). Codex's equivalent is sandbox modes. The adapter layer needs to preserve these constraints.

**Related:** ROAD-11 (Ludicrous Speed — MCP orchestration subsumes this), ROAD-22 (Pipeline Status MCP — could orchestrate Codex workers), ROAD-24 (Merge PIPELINE.md — conventions file unification)

---

### ROAD-26: Release Notes Skill

**Status:** Done
**Theme:** Developer experience

Built a `/release-notes <cycle_number>` skill that generates release notes from Linear cycle data — the first pipeline skill to use Linear MCP tools.

**What was built:**
- **Skill file** at `.claude/skills/release-notes/SKILL.md` — standalone utility (not a pipeline stage)
- **Multi-team cycle lookup** — queries Engineering, Web, iOS, and Android teams for completed issues in the target cycle
- **Automated categorization** — labels → title keywords → default Maintenance, with `[INTERNAL?]` flags for non-customer-facing items
- **Title rewriting** — transforms internal issue titles into customer-friendly descriptions
- **Template discovery** — reads the most recent file in `<projects-path>/release-notes/` as a format template; falls back to a built-in template on first run
- **Mobile build prompts** — asks operator for iOS/Android build numbers via `AskUserQuestion`
- **Output** — writes to `<projects-path>/release-notes/<end-date>-cycle-<N>.md`

**Design decisions:**
- First skill to use Linear MCP tools (`list_teams`, `list_cycles`, `list_issues`, `list_issue_statuses`)
- Batch categorization (no per-issue prompts) — operator reviews flagged items at the end
- Built-in template matches the existing Cycle 45 format (header, Mobile App Builds, Links, New Features, Maintenance, Cleaning Up)
- Statuses queried: "Done" + "Pending Release" (code-complete, awaiting deployment)

**Original design context:**

A `/release-notes <cycle_number>` skill that generates release notes from Linear cycle data — pulling closed issues, categorizing them, and formatting them using the previous cycle's notes as a template.

**Why:** Release notes are currently assembled manually: query Linear for the cycle, read through closed issues, categorize them (new features, maintenance, cleanup), check mobile build numbers, and write the formatted post. This is a repeatable, structured task — exactly the kind the pipeline should automate. The operator already has the Linear MCP plugin available, so the data is accessible.

**How it works:**

1. **Read the previous cycle's release notes** — look in the `release-notes/` directory (under the configured projects path from `pipeline.md`) for the most recent file. This establishes the template format (sections, tone, link structure). If no previous file exists (first run), use the built-in template.
2. **Fetch the target cycle** — use `list_cycles` with the team to get cycle N's metadata (start date, end date).
3. **Find closed issues** — use `list_issues` filtered to the target cycle with state "Done" (or equivalent completed state). Also check for issues that closed *between* cycles N-1 and N that aren't captured in the previous notes.
4. **Fetch mobile build numbers** — ask the operator for current iOS and Android build numbers (these aren't in Linear).
5. **Categorize issues** — group by type:
   - **New Features** — new user-facing capabilities
   - **Maintenance** — bug fixes, performance improvements, infrastructure
   - **Cleaning Up** — tech debt, code removal, deprecations
   Use issue labels, title keywords, and description to infer category. Flag ambiguous items for operator review.
6. **Generate formatted notes** — produce release notes matching the template structure:
   - Header with cycle number and date range
   - Mobile app builds section with App Store / Play Store links
   - Categorized bullet points with bold feature names and descriptions
7. **Write to file** — save the release notes to `<projects-path>/release-notes/<date>-cycle-<N>.md` (e.g., `2026-01-27-cycle-45.md`), where the date is the cycle end date. Present the draft to the operator for wordsmithing before posting.

**Template structure** (based on current format):

```markdown
# Release Notes for Cycle {N} ({start_date} - {end_date})

**Mobile App Builds**

* **iOS**: {version}
* **Android**: {version}

**Links**

* [iOS in the App Store](https://apps.apple.com/us/app/orangeqc/id324039524)
* [OrangeQC in the Google Play Store](https://play.google.com/store/apps/details?id=com.orangeqc.native)

**New Features**

* **{Feature Name}** - {Description}

**Maintenance**

* {Description of fix or improvement}

**Cleaning Up**

* {Description of removal or deprecation}
```

**Categorization heuristics:**

| Signal | Category |
|--------|----------|
| Label: "feature", "enhancement" | New Features |
| Label: "bug", "fix" | Maintenance |
| Label: "tech-debt", "cleanup", "deprecation" | Cleaning Up |
| Title contains "Add", "New", "Introduce" | New Features |
| Title contains "Fix", "Resolve", "Update" | Maintenance |
| Title contains "Remove", "Delete", "Clean up", "Deprecate" | Cleaning Up |
| Platform labels: "ios", "android", "web" | Include platform context in description |

**What the operator still does:**

- Provides mobile build numbers (not tracked in Linear)
- Wordsmithes the descriptions (agent-generated descriptions are a starting point)
- Decides what to include/exclude (some closed issues are internal and shouldn't be in release notes)
- Posts the final notes to the team channel

**Output directory:**

```
<projects-path>/
  release-notes/
    2026-01-20-cycle-44.md
    2026-01-27-cycle-45.md
    2026-02-03-cycle-46.md
```

The directory lives alongside project directories in the configurable projects path (from `pipeline.md` Work Directory). The filename uses the cycle end date + cycle number, so files sort chronologically and are easy to find. Step 1 reads the most recent file in this directory to use as the template for the next cycle.

**Considerations:**
- This is a **standalone utility skill**, not a pipeline stage — it operates on Linear cycles, not on pipeline projects
- The skill should handle the case where no previous cycle notes exist (first run / empty `release-notes/` directory) by using the built-in template structure directly
- Issues closed between cycle boundaries (e.g., closed after cycle N-1 ended but before cycle N started) should be captured — these are the ones most likely to be missed manually
- Pipeline-generated projects will naturally show up as closed issues in their cycles — the skill should describe them as features, not as "pipeline project completed"
- Could eventually auto-detect mobile build versions from App Store Connect / Play Console APIs, but manual input is fine for v1
- The existing App Store / Play Store links are stable — hardcode them in the template

**Related:** ROAD-08 (Linear Automation — shares the Linear MCP dependency), ROAD-02 (Notifications — release notes could be posted via webhook)

---

### ROAD-27: Weekly Pipeline Digest

**Status:** Planned
**Theme:** Visibility

A weekly summary report — like Slack's "updates for the week" — that shows pipeline activity, code health trends, and delivery metrics at a glance. Think heatmaps, scorecards, and sparklines, not walls of text.

**Why:** The pipeline generates a lot of data (commits, test results, DORA timing, complexity scores, shipped milestones) but there's no periodic rollup that answers "how did the week go?" Without a digest, you'd have to manually check progress files, git logs, and Linear cycles to piece together the picture. A weekly digest gives the operator (and stakeholders) a cadence-based health check without any effort.

**What it shows:**

| Section | Content | Data Source |
|---------|---------|-------------|
| **Things Shipped** | Count of milestones completed, projects that moved stages, PRs merged. Bulleted list of what shipped this week. | `progress.md` files, git log, Linear cycle data |
| **DORA Metrics** | Lead time (PRD → merged PR), deployment frequency, change failure rate — week-over-week trend with directional arrows (up/down). | ROAD-19 timing metadata from `create-pr` reports |
| **Code Quality Score** | Composite score based on complexity delta, test coverage, StandardRB/Brakeman findings. Trend indicator (improving/declining/stable). | ROAD-20 complexity data, post-flight check results |
| **Activity Heatmap** | Grid showing pipeline activity by day — which stages ran, how many milestones were implemented. Visual density = busy week. | Git commit timestamps, progress.md updates |
| **Pipeline Throughput** | Projects in flight, average stage velocity (days per stage), bottleneck identification (which stage takes longest). | Derived from project artifact timestamps |

**Output format options:**

| Format | Pros | Cons |
|--------|------|------|
| **Markdown file** | Simple, versionable, readable anywhere | No actual heatmap rendering |
| **Slack message** | Visible to the team, matches "updates for the week" pattern | Requires webhook integration (ROAD-02) |
| **HTML report** | Can render actual heatmaps and sparklines | Needs a viewer, more complex to generate |

**Recommendation:** Start with markdown (v1), add Slack posting (v2) once ROAD-02 ships.

**Code Quality Score design:**

Not a single magic number — a scorecard with a few key indicators:

| Indicator | Measurement | Good / Neutral / Concerning |
|-----------|------------|----------------------------|
| **Complexity trend** | Average Flog score of pipeline-touched files vs. repo average | Below avg / At avg / Above avg |
| **Test health** | Ratio of passing to total specs in pipeline-touched areas | All pass / Flaky / Failures |
| **Lint cleanliness** | StandardRB + Brakeman findings introduced by pipeline code | Zero / Warnings only / Errors |
| **Churn** | Files touched by pipeline that were also touched in prior week (rework signal) | Low / Moderate / High |

Each indicator gets a directional marker (improved / stable / declined) compared to the previous week.

**Implementation:**

A `/weekly-digest` skill (standalone utility, like `/release-notes`) that:

1. Reads `pipeline.md` to find all configured products and their project paths
2. Scans project directories for `progress.md` files updated in the last 7 days
3. Pulls git log for pipeline branches (commits in the last 7 days)
4. Reads DORA timing from the most recent `create-pr` metrics
5. Runs complexity tools if ROAD-20 is available (graceful skip if not)
6. Assembles the digest using a template
7. Writes to `<projects-path>/digests/<date>-weekly.md`

**Dependencies (soft):**
- ROAD-19 (DORA Metrics) — for the metrics section. Digest works without it but that section will be empty.
- ROAD-20 (Code Complexity) — for the quality score. Same graceful degradation.
- ROAD-02 (Notifications) — for Slack posting in v2.

**Considerations:**
- The digest should work even if only some data sources are available — degrade gracefully by omitting sections rather than failing
- Week boundary: use Monday-to-Sunday to align with Linear cycles
- First run bootstraps — no "previous week" comparison, just absolute numbers
- Could eventually run on a cron/schedule (pairs with ROAD-11 Ludicrous Speed for unattended execution), but v1 is manual invocation
- The "things shipped" section is the most valuable part for stakeholders — lead with it
- Heatmap in markdown can be approximated with emoji blocks (like GitHub's contribution graph) — not as pretty as HTML but functional

**Related:** ROAD-19 (DORA Metrics — primary data source), ROAD-20 (Code Complexity — quality score data), ROAD-02 (Notifications — Slack delivery), ROAD-21 (Dashboard — digest is the periodic snapshot; dashboard is the live view), ROAD-26 (Release Notes — similar "summarize the period" pattern)

---

### ROAD-28: Extract Metrics & Quality into In-Project Prompts

**Status:** Planned
**Theme:** Portability

Move metrics collection and code quality analysis logic out of pipeline skills and into in-project prompt files (e.g., `PIPELINE.md` or conventions files) so that any agent — not just one running from this pipeline repo — can capture the same data.

**Why:** Currently, metrics capture (ROAD-19 DORA timing, ROAD-20 code quality) and quality checks are baked into the skill files in `.claude/skills/`. This means they only run when you use _this_ pipeline's skills. If someone runs an agent directly against a target repo (e.g., via Claude Code in the OrangeQC repo, or via Codex), none of that instrumentation fires. Extracting the metrics and quality instructions into the target repo's own prompt files makes them portable — any agent that reads the repo's conventions will know to capture timing frontmatter, run complexity tools, and report quality metrics.

**What moves:**
- **DORA timing frontmatter** — instructions for when to stamp `pipeline_start`, `pipeline_stage_N_start/end`, etc. into project artifacts
- **Code quality tool invocation** — which tools to run, how to compare per-file vs. baseline scores, how to format the output (already partly designed in ROAD-20's "repo config section")
- **Post-flight check commands** — lint, security scan, test commands that currently live in skill logic
- **PR body metrics sections** — templates for the stage timeline, lead time, complexity delta, and quality scorecard sections in PR descriptions

**What stays in skills:**
- Orchestration logic (which stage to run, checkpoint enforcement, artifact file management)
- Template structure and stage sequencing
- Linear integration and project tracker coordination

**Design approach:**

Add a `### Metrics & Quality` sub-section to Pipeline Configuration in the conventions file that declares:

1. **Timing capture points** — which events to timestamp and where to write them
2. **Quality tools** — commands to run, expected output format, comparison strategy (extends ROAD-20's complexity analysis table)
3. **Post-flight checks** — commands and pass/fail criteria
4. **PR report template** — markdown snippets for metrics sections in PR descriptions

Skills become thinner — they read the repo config for _what_ to measure and _how_, rather than hardcoding it. This is the same pattern ROAD-20 already specifies for complexity tools, extended to all instrumentation.

**Migration path:**
1. Define the `## Metrics & Quality` schema in `PIPELINE.md`
2. Populate it for OrangeQC and Show Notes repos
3. Update `/setup-pipeline-repo` to detect and generate this section for new repos
4. Refactor skills to read metrics config from repo instead of inline logic
5. Verify that a standalone Claude Code session in a target repo (without pipeline skills) still captures metrics when following the repo's conventions

**Related:** ROAD-19 (DORA Metrics — timing data that moves to repo config), ROAD-20 (Code Quality — complexity tools already designed for repo config), ROAD-24 (Merge PIPELINE.md — the destination file may change), ROAD-25 (Multi-Runtime — this is a prerequisite for runtime-agnostic instrumentation)
