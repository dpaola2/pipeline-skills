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

### ROAD-13: Configurable Base Branch (per project)

**Status:** Planned
**Theme:** Pipeline lifecycle

Allow each project to specify a custom base branch instead of always branching from the default branch declared in `PIPELINE.md`. Currently Stage 4 creates `pipeline/<slug>` from `origin/<default-branch>`. This would allow branching from another project's branch or a feature branch.

**Why:** Enables dependent projects (Project B needs Project A's unreleased changes) and post-QA follow-up projects. The `/setup-repo` skill already derives the default branch from git and sets it as `PR base branch` in `PIPELINE.md`, but per-project overrides aren't supported yet.

**How:** A `base_branch` field in the project's `prd.md` header or a project-level config file. Stage 4 reads it when creating the branch. If not specified, falls back to `PIPELINE.md`'s `PR base branch`.

**Related:** ROAD-10 (Post-QA Iteration / Re-entry)

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
