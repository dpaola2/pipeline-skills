# Pipeline Roadmap

> **Purpose:** Future improvements to the agent pipeline, organized by theme. Each item has an ID for easy reference (e.g., "see ROAD-03").

---

## Pipeline Capabilities

### ROAD-01: Stage 0 — PRD Generation Skill

**Status:** Planned
**Theme:** Pipeline intake

Create a Stage 0 skill that takes arbitrary content (Google Doc, Slack thread, conversation notes, feature request) and produces a structured PRD suitable for pipeline intake.

**Why:** Currently PRDs are manually converted to the `templates/prd-intake.md` format. This is a friction point — especially for smaller projects where the shaping phase is lightweight. An agent that can take messy input and produce a clean PRD removes a bottleneck at the very start of the pipeline.

**Considerations:**
- Input could be a URL, pasted text, file path, or combination
- Output must conform to the existing PRD template structure
- Should prompt the human to confirm/edit the generated PRD before it enters the pipeline (this is still a human judgment phase — the agent assists, not replaces)
- Level classification (1/2/3) should be suggested but human-confirmed

**Related:** `docs/gap-analysis.md` § 1.3, `templates/prd-intake.md`

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

**Status:** Planned
**Theme:** Quality assurance

Add a final stage (or sub-stage of implementation) that runs linters, security scanners, and auto-fixers before opening a PR.

**Why:** Currently the pipeline doesn't run Brakeman (security) or StandardRB (style) before creating a PR. These tools catch real issues and their fixes are mechanical — perfect for automation.

**Checks to include:**
- **StandardRB** — Ruby style linting and auto-fix
- **Brakeman** — Rails security scanner (SQL injection, XSS, mass assignment, etc.)
- **Bundle audit** — dependency vulnerability check
- Any other project-specific linters defined in the repo

**Considerations:**
- Could be a standalone stage (Stage 6.5?) or the final step of the `/create-pr` skill
- Auto-fix what can be auto-fixed (StandardRB), flag what can't (Brakeman warnings)
- Results should be included in the PR description or as a checklist
- This is partially OrangeQC-specific (StandardRB, Brakeman) but the pattern is universal — every project has its own linters
- The repo's AGENTS.md could declare which post-flight checks to run

**Related:** OrangeQC's StandardRB pre-commit hook already catches style issues at commit time, but running it proactively (and fixing issues) before the PR is cleaner.

---

## Pipeline Architecture

### ROAD-05: Externalize Platform-Specific Configuration

**Status:** Planned
**Theme:** Portability

Ensure OrangeQC-specific knowledge lives in the OrangeQC repos (via AGENTS.md, conventions files, etc.) — not baked into the pipeline repo's skills or templates.

**Why:** The pipeline should be portable. If someone forks this repo to use with a different Rails app, OrangeQC-specific assumptions (error format, API versioning, permission model, etc.) shouldn't be hardcoded in the pipeline skills.

**What to audit:**
- Skills in `.claude/skills/` — do they reference OrangeQC-specific patterns directly, or do they read them from the target repo's AGENTS.md?
- Templates in `templates/` — are they generic enough, or do they assume OrangeQC conventions?
- Stage prompts — do they assume specific directory structures, test frameworks, or tooling?

**Goal:** Pipeline skills should be parameterized by the target repo's AGENTS.md, not by hardcoded knowledge about OrangeQC.

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

## Item Index

| ID | Title | Theme | Status |
|----|-------|-------|--------|
| ROAD-01 | Stage 0 — PRD Generation | Pipeline intake | Planned |
| ROAD-02 | Post-Stage Notifications | Orchestration | Planned |
| ROAD-03 | Per-Milestone Gameplans | Pipeline architecture | Planned |
| ROAD-04 | Post-Flight Checks | Quality assurance | Planned |
| ROAD-05 | Externalize Platform Config | Portability | **Done** |
| ROAD-06 | Project Document Linking | Developer experience | Planned |
| ROAD-07 | ADR Integration | Knowledge capture | Planned |
| ROAD-08 | Linear Automation | Orchestration | Planned |
| ROAD-09 | Stage 6 — Code Review | Quality assurance | Planned |
| ROAD-10 | Post-QA Iteration / Re-entry | Pipeline lifecycle | Planned |
| ROAD-11 | Ludicrous Speed Mode | Orchestration | Planned |
