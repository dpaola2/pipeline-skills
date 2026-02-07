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
| ROAD-07 | ADR Integration | Knowledge capture | Planned |
| ROAD-08 | Linear Automation | Orchestration | Planned |
| ROAD-09 | Stage 6 — Code Review | Quality assurance | Planned |
| ROAD-10 | Post-QA Iteration / Re-entry | Pipeline lifecycle | Planned |
| ROAD-11 | Ludicrous Speed Mode | Orchestration | Planned |
| ROAD-12 | Multi-Product Support + Setup Repo | Portability | **Done** |
| ROAD-13 | Configurable Base Branch | Pipeline lifecycle | Planned |
| ROAD-14 | Externalize Project Work Dirs | Portability | **Done** |
| ROAD-15 | Continuous Knowledge Extraction | Knowledge capture | **Done** (v1) |
| ROAD-16 | T-Shirt Size Estimates | Developer experience | **Done** |
| ROAD-17 | CI Failure Detection + Auto-Fix | Quality assurance | Planned |
| ROAD-18 | Gameplan Coherence Checklist | Quality assurance | **Done** |
| ROAD-19 | DORA Metrics (Before/After) | Measurement | Planned |
| ROAD-20 | Code Complexity Analysis (Before/After) | Measurement | Planned |
| ROAD-21 | Pipeline Dashboard (Factorio Theme) | Visibility | Planned |
| ROAD-22 | Pipeline Status MCP Server | Visibility | Planned |
| ROAD-23 | Stage 4 Test Quality Heuristics | Quality assurance | **Done** |
| ROAD-24 | Merge PIPELINE.md into Conventions Files | Portability | Planned |

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

**Why:** Enables dependent projects (Project B needs Project A's unreleased changes) and post-QA follow-up projects. The `/setup-repo` skill already derives the default branch from git and sets it as `PR base branch` in `PIPELINE.md`, but per-project overrides aren't supported yet.

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
- `templates/gameplan.md` Section 7 — replace days columns with a single Size column
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

**Status:** Planned
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

1. **v1 (manual):** Create a spreadsheet or markdown table in the pipeline repo that tracks these metrics per project. Fill in manually after each project completes. Low effort, immediate value.
2. **v2 (semi-automated):** A `/metrics <slug>` skill that pulls git timestamps, PR data (`gh` CLI), and CI results to auto-populate most fields. Human fills in failure/recovery data.
3. **v3 (automated):** Integrate with deploy hooks and incident tracking for fully automated capture.

**Considerations:**
- Start with v1 — the discipline of tracking is more valuable than the automation
- Small sample size is a real limitation. OrangeQC has 3 pipeline projects so far. Statistical significance requires patience.
- DORA metrics measure the delivery *system*, not just the pipeline. Improvements may come from better PRDs, faster reviews, or CI improvements — not just the agent doing the coding
- Lead Time is the most directly measurable and the most likely to show dramatic improvement (agent implements in minutes vs. agency implements over days/weeks)

**Related:** ROAD-08 (Linear Automation — milestone transitions provide timing data), ROAD-17 (CI Auto-Fix — affects change failure rate)

---

### ROAD-20: Code Complexity Analysis (Before/After Pipeline)

**Status:** Planned
**Theme:** Measurement

Measure code complexity of pipeline-generated code vs. hand-written code in the same codebase, answering: "Is the agent writing maintainable code or accumulating tech debt?"

**Why:** The pipeline optimizes for correctness (tests pass, acceptance criteria met) and convention adherence (AGENTS.md, PIPELINE.md). But neither of those guarantees the code is *simple*. An agent can produce correct, convention-following code that's still overly complex — too many branches, too-long methods, excessive coupling. Complexity metrics provide an objective before/after comparison that catches quality dimensions the pipeline doesn't currently measure.

**Metrics to track:**

| Metric | Tool (Ruby) | What It Catches |
|--------|-------------|-----------------|
| **Cyclomatic complexity** | RuboCop Metrics, Flog | Too many conditional branches per method |
| **ABC score** (Assignment, Branch, Condition) | RuboCop Metrics | Overall method complexity |
| **Method length** | RuboCop Metrics | Methods doing too much |
| **Class length** | RuboCop Metrics | God objects |
| **Flay score** (duplication) | Flay | Copy-paste code |
| **Reek smells** | Reek | Feature envy, data clump, long parameter list |
| **Churn × complexity** | Churn + Flog | Files that are both complex and frequently changed (highest maintenance cost) |

**Before/after comparisons (two dimensions):**

1. **Pipeline code vs. codebase average:** Compare complexity scores of files touched by a pipeline project to the repo-wide average. Are we raising or lowering the bar?
2. **Pipeline code vs. hand-written code for similar features:** Compare a pipeline-built report (e.g., deficient-line-items) to a hand-built report in the same codebase. Same domain, same patterns — is the agent's output simpler or more complex?
3. **Over time:** Track whether pipeline-generated code complexity trends up or down as the pipeline matures (skills improve, conventions file grows, knowledge extraction kicks in).

**Implementation approach:**

1. **v1 (snapshot):** Run `rubocop --only Metrics` and `flog` against pipeline-touched files and compare to repo averages. Manual, per-project.
2. **v2 (per-project report):** A `/complexity-report <slug>` skill that identifies files changed on the pipeline branch, runs complexity tools, and produces a comparison report (pipeline files vs. repo baseline).
3. **v3 (integrated into create-pr):** Add complexity delta to the PR body — "This PR's average Flog score: 12.3 (repo average: 15.7)" — so reviewers see it at a glance.

**Show Notes considerations:**
- Show Notes uses RuboCop (already configured) — `rubocop --only Metrics` works out of the box
- For gems not in the Gemfile (Flog, Flay, Reek), run standalone against the source files
- Smaller codebase means the "repo average" baseline stabilizes faster

**OrangeQC considerations:**
- Larger, older codebase — the repo average may be skewed by legacy code
- More interesting comparison: pipeline code vs. *recent* hand-written code (last 6 months), not historical average
- StandardRB is already enforced (ROAD-04 post-flight) — complexity metrics go beyond style

**Considerations:**
- Complexity metrics are *indicators*, not judgments. A complex method might be justified by the domain. The goal is visibility, not enforcement.
- v3 (PR body integration) is the highest-leverage long-term — it makes complexity visible at the exact moment a reviewer is deciding whether to merge
- Could feed into ROAD-15 (Knowledge Extraction) — if a pattern consistently produces high-complexity code, that's a pipeline lesson worth capturing
- Track per-milestone too, not just per-project — some milestones (data model) should be simple; others (complex business logic) may justify higher complexity

**Related:** ROAD-09 (Code Review — reviewer should consider complexity), ROAD-15 (Knowledge Extraction — complexity patterns are learnable), ROAD-04 (Post-Flight Checks — complexity could become a check)

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

**Status:** Planned
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
- `.claude/skills/setup-repo/SKILL.md` — biggest change: generates a "Pipeline Configuration" section in the existing conventions file (or creates one if none exists) instead of generating a standalone `PIPELINE.md`

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
1. `grep -r "PIPELINE.md" .claude/skills/` → zero results (except possibly setup-repo explaining the migration)
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
- `/setup-repo` becomes simpler to explain to users: "it adds a section to your conventions file" vs. "it creates a separate PIPELINE.md file"
- Future products onboarded via `/setup-repo` only need one file created, not two

**Related:** ROAD-05 (superseded), ROAD-12 (Multi-Product — setup-repo changes), ROAD-15 (Knowledge Extraction — conventions file is now the single target for repo-scoped knowledge)
