# Pipeline Roadmap

> **Purpose:** Future improvements to the agent pipeline, organized by theme. Each item has an ID for easy reference (e.g., "see ROAD-03").

---

## Pipeline Capabilities

### ROAD-01: Stage 0 — PRD Generation Skill

**Status:** Done
**Theme:** Pipeline intake

Built a Stage 0 skill (`/stage0-prd`) that generates structured PRDs from raw input notes.

**What was built:**
- **Inbox pattern** — user drops raw notes (feature descriptions, Slack threads, meeting notes, Google Doc exports) into `inbox/` directory
- **Interactive file selection** — skill lists inbox contents, asks user to pick a file and provide a project slug
- **Full PRD generation** — produces a complete PRD conforming to `templates/prd-intake.md` with all 13 sections
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

**Status:** Planned
**Theme:** Knowledge capture

Integrate Architecture Decision Records into the pipeline process, capturing significant architectural decisions made during Stage 2 (Architecture) and Stage 3 (Gameplan).

**Why:** The architecture proposal captures *what* was decided, but not always *why* one approach was chosen over alternatives. ADRs formalize this. They're especially valuable when a future developer (or agent) asks "why was it done this way?"

**When ADRs would be generated:**
- Stage 2 makes a non-obvious architectural choice (e.g., "service object vs. concern", "new table vs. column on existing table")
- Human reviewer during architecture approval flags a decision worth recording
- Stage 5 encounters an implementation surprise that changes the approach

**Format:** Standard ADR template (Title, Status, Context, Decision, Consequences). Stored in the project directory and optionally copied to the target repo.

**Considerations:**
- Not every project needs ADRs — small projects (Level 1) rarely make decisions worth recording
- The pipeline should make it easy to create ADRs, not mandate them
- Could be a section in the architecture proposal that gets extracted into standalone ADR files when warranted
- ADRs should reference the pipeline project that created them

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

**Status:** Planned (designed, not built)
**Theme:** Quality assurance

Build the Stage 6 skill for automated code review against the target repo's AGENTS.md and the project's architecture proposal.

**Why:** Currently code review is manual. An automated first-pass review that checks for convention violations, security scoping issues, and architecture drift would catch mechanical issues before human review.

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

Added support for running the pipeline against multiple products (repos), with separate pipeline configs per product and a `/setup-repo` skill for automated repo onboarding.

**What was built:**
- **`pipelines/` directory** — named pipeline configs per product (e.g., `pipelines/orangeqc.md`, `pipelines/show-notes.md`)
- **Active pointer pattern** — `pipeline.md` at repo root is always the active config; switch products by copying from `pipelines/`
- **`/setup-repo` skill** — explores a new repo, detects framework/tests/CI/structure, auto-generates `PIPELINE.md` in the target repo and a pipeline config in `pipelines/`, optionally activates it
- **Show Notes onboarded** — first non-OrangeQC product added to the pipeline (Rails 8.1 web app)

**Design decisions:**
- Active pointer over per-command product argument — matches session-based workflow, zero existing skill changes (all 8 skills still read `pipeline.md`)
- Product configs stored in `pipelines/` as reference copies; `pipeline.md` is the canonical active file
- `setup-repo` uses detect → confirm → generate pattern to avoid silent misconfigurations
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
- **`/setup-repo` skill updated** — generates Work Directory section in new pipeline configs, asks user for projects path
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

**Status:** Planned
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

**Why:** Enables dependent projects (Project B needs Project A's unreleased changes) and post-QA follow-up projects. The `/setup-repo` skill already derives the default branch from git and sets it as `PR base branch` in `PIPELINE.md`, but per-project overrides aren't supported yet.

**How:** A `base_branch` field in the project's `prd.md` header or a project-level config file. Stage 4 reads it when creating the branch. If not specified, falls back to `PIPELINE.md`'s `PR base branch`.

**Related:** ROAD-10 (Post-QA Iteration / Re-entry)

---

### ROAD-16: T-Shirt Size Estimates (Replace Time-Based Estimates)

**Status:** Planned
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
- `templates/gameplan.md` Section 7 — replace days columns with a single Size column
- Stage 3 skill — update instructions to use t-shirt sizes instead of day estimates
- Existing gameplans are unaffected (they're project artifacts, not templates)

**Considerations:**
- T-shirt sizes apply to the *project* or *milestone*, not to individual tasks
- Size should factor in risk and ambiguity, not just line count — a 3-file change with tricky edge cases is M, not S
- Could also apply sizes at the project level in the PRD header (Level 1/2/3 already captures platform scope; t-shirt captures complexity)

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
| ROAD-07 | ADR Integration | Knowledge capture | Planned |
| ROAD-08 | Linear Automation | Orchestration | Planned |
| ROAD-09 | Stage 6 — Code Review | Quality assurance | Planned |
| ROAD-10 | Post-QA Iteration / Re-entry | Pipeline lifecycle | Planned |
| ROAD-11 | Ludicrous Speed Mode | Orchestration | Planned |
| ROAD-12 | Multi-Product Support + Setup Repo | Portability | **Done** |
| ROAD-13 | Configurable Base Branch | Pipeline lifecycle | Planned |
| ROAD-14 | Externalize Project Work Dirs | Portability | **Done** |
| ROAD-15 | Continuous Knowledge Extraction | Knowledge capture | Planned |
| ROAD-16 | T-Shirt Size Estimates | Developer experience | Planned |
| ROAD-17 | CI Failure Detection + Auto-Fix | Quality assurance | Planned |
