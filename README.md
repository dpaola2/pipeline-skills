# Agent Pipeline

> **Vision:** Ingest a PRD, produce QA-ready implementation code — for any product.

---

## What This Is

An agent-orchestrated development pipeline that automates the journey from **Product Requirements Document** to **code ready for QA** through seven discrete stages with human checkpoints at critical decision points.

The pipeline runs inside [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as a set of custom skills (slash commands). Each stage reads structured inputs and produces structured outputs. Two human checkpoints gate the transition from analysis to execution — you approve the architecture and implementation plan before any code is written.

The pipeline is product-agnostic. It works with any codebase that has a conventions file and test infrastructure.

---

## Getting Started

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- A git repository you want to run the pipeline against
- That repo should have a test framework configured (RSpec, Jest, pytest, etc.)

### Installation

Copy the pipeline skills into your project's `.claude/skills/` directory:

```bash
# Copy all pipeline skills
cp -r agent-pipeline/.claude/skills/* /path/to/your-project/.claude/skills/
```

### Setup

Run the setup skill from your target repo to auto-detect your framework, stack, and directory structure:

```
/pipeline-setup
```

This detects your framework, test tools, linters, and directory layout, then writes the `## Pipeline Configuration` section into your conventions file. It also creates the projects directory.

If you prefer manual setup, copy the annotated example from [`docs/examples/pipeline-configuration.md`](docs/examples/pipeline-configuration.md) into your conventions file and fill in the values.

**Then create your first project:**

Drop rough notes (feature ideas, requirements, anything) into the inbox directory, then run Claude Code from your repo and:

```
/prd
```

This converts your notes into a structured PRD. Review it before continuing.

**4. Run the pipeline:**

```
/discovery my-feature          # Explore codebase, produce discovery report
/architecture my-feature       # Propose technical design
                               # <- REVIEW AND APPROVE architecture
/gameplan my-feature           # Break into milestones + acceptance criteria
                               # <- REVIEW AND APPROVE gameplan
/test-generation my-feature    # Write failing tests (TDD)
/implementation my-feature M1  # Implement milestone 1
/implementation my-feature M2  # Implement milestone 2 (repeat per milestone)
/review my-feature             # Automated code review
/qa-plan my-feature            # Generate QA plan for manual testing
/create-pr my-feature          # Push branch and create PR
```

---

## How It Works

The pipeline has two halves separated by two human checkpoints:

```
Analysis (produces documents, zero risk)
  Stage 1: Discovery — explores the codebase
  Stage 2: Architecture — proposes data model + API design
       |
  Checkpoint 1: Architecture Review <- You approve the technical design
       |
  Stage 3: Gameplan — breaks PRD into milestones
       |
  Checkpoint 2: Gameplan Review <- You approve the implementation plan
       |
Execution (writes code)
  Stage 4: Test Generation — writes failing tests (TDD)
  Stage 5: Implementation — makes tests pass, milestone by milestone
  Stage 6: Review — automated code review against conventions + spec
  Stage 7: QA Plan — generates manual testing checklist
```

Stages 0-3 are safe to run on any branch — they only produce documents in the external projects directory. The architecture gets locked down before the gameplan, and the gameplan gets locked down before any code is written. This catches design issues early when they're cheap to fix.

### Branch Model

The pipeline has a deliberate split in how it treats git branches:

**Stages 0-3 (document stages)** don't care what branch you're on. They read the codebase and write artifacts to the external projects directory. You can run them on `main`, a feature branch, or anywhere — it doesn't matter because they only produce documents.

**Stage 4 (test generation)** is the transition point. It creates a project branch (`<branch-prefix><slug>`) from the **local** default branch and commits test files to it.

**Stages 5-7 + create-pr** all operate on the project branch created by Stage 4.

The branch is created from the **local** default branch (not `origin/`). This is intentional — stages 0-3 may have committed artifacts to the projects directory on the local default branch, and those commits may not be pushed yet. Branching from `origin` would create a branch that's missing those artifacts.

---

## Design Priorities

Six principles govern how the pipeline evolves, ordered by importance — when two conflict, the higher one wins. Each is derived from a fundamental software law.

1. **Correctness over speed.** Human checkpoints exist because agents optimize for measurable signals (tests pass, CI green), and those signals are imperfect proxies for correctness. Don't remove a quality gate to go faster.
2. **Evolve from working systems.** Every new capability should be an incremental evolution of something that already works. Validate on one project before making it the default.
3. **Respect existing constraints.** When the pipeline modifies existing code, the default is to adapt to every validation, callback, and guard clause it encounters — not remove them.
4. **Contracts, not coupling.** Stages communicate through structured artifacts. Produce strict output, tolerate variation in input. If an upstream stage adds a section, downstream stages shouldn't break.
5. **Optimize the bottleneck.** Wall-clock time is dominated by human review, not agent execution. Making artifacts easier to review may deliver more speedup than making agents faster.
6. **The pipeline must improve itself.** Knowledge extracted during each project should flow back into repo conventions and pipeline docs, so future projects start smarter.

Skills are the program — each skill embeds its output template directly, so improving a skill improves every project that uses it. Agents never touch production. PRD quality is the bottleneck for output quality.

**Full details:** [`docs/design-priorities.md`](docs/design-priorities.md)

---

## Configuration

Skills read all configuration from the target repo's **conventions file** (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md`). The `## Pipeline Configuration` section contains:

- **Work Directory** — where project artifacts and inbox files live (typically `../pipeline-projects/`)
- **Project Tracker** — Linear, GitHub Issues, or none
- **Related Repositories** — paths to API docs, mobile repos, etc. (optional)
- **Repository Details** — default branch, test command, branch prefix
- **Framework & Stack** — language, test framework, database, frontend tools
- **Directory Structure** — where models, controllers, tests live
- **Implementation Order** — build sequence for milestones
- **Optional sections** — API conventions, multi-tenant security, post-flight checks, guardrails

There's no separate config file in the pipeline repo. Skills run from the target repo and read its conventions file directly.

---

## Human Checkpoints

The pipeline has two mandatory review gates:

**After Stage 2 (Architecture Review):** Open `architecture-proposal.md` in the project directory, find the Approval Checklist, set Status to "Approved", and fill in the reviewer checklist. Stage 3 refuses to run until this is done.

**After Stage 3 (Gameplan Review):** Review `gameplan.md` — verify milestones, acceptance criteria, and sequencing before any code is generated.

These checkpoints exist because errors amplify downstream. A wrong data model decision in Stage 2 propagates through the gameplan, tests, and implementation. Catching it before Stage 3 is dramatically cheaper than catching it during Stage 5.

---

## Project Structure

```
.
├── README.md                           # You are here
├── CLAUDE.md                           # Agent context for working on this repo
│
├── .claude/skills/                     # Pipeline skills (the product)
│   ├── pipeline-setup/SKILL.md          # /pipeline-setup [repo-path]
│   ├── prd/SKILL.md                    # /prd
│   ├── discovery/SKILL.md              # /discovery <slug>
│   ├── architecture/SKILL.md           # /architecture <slug>
│   ├── gameplan/SKILL.md               # /gameplan <slug>
│   ├── test-generation/SKILL.md        # /test-generation <slug>
│   ├── implementation/SKILL.md         # /implementation <slug> <milestone>
│   ├── review/SKILL.md                 # /review <slug>
│   ├── qa-plan/SKILL.md                # /qa-plan <slug>
│   ├── create-pr/SKILL.md              # /create-pr <slug>
│   ├── metrics/SKILL.md                # /metrics <slug>
│   ├── quality/SKILL.md                # /quality <slug>
│   ├── release-notes/SKILL.md          # /release-notes <cycle>
│   └── backfill-timing/SKILL.md        # /backfill-timing <slug>
│
└── docs/
    ├── design-priorities.md            # Core principles governing pipeline evolution
    ├── pipeline-architecture.md        # Full pipeline design (7 stages + checkpoints)
    ├── skill-reference.md              # Detailed skill API surface reference
    ├── roadmap.md                      # Planned improvements
    └── examples/
        └── pipeline-configuration.md   # Annotated Pipeline Configuration template
```

Project artifacts (PRDs, gameplans, progress files) live **outside** this repo, in a per-product work directory configured in the target repo's conventions file. This keeps the pipeline repo as a pure skill source with no product-specific data.

---

## Skills Reference

### Pipeline Stages

| Skill | Usage | What It Does |
|-------|-------|-------------|
| `/prd` | `/prd` | Convert inbox notes into a structured PRD |
| `/discovery` | `/discovery <slug>` | Explore codebase, produce discovery report |
| `/architecture` | `/architecture <slug>` | Propose technical design (data model, API, migrations) |
| `/gameplan` | `/gameplan <slug>` | Break PRD into milestones with acceptance criteria |
| `/test-generation` | `/test-generation <slug>` | Write failing tests (TDD) |
| `/implementation` | `/implementation <slug> <M#>` | Implement one milestone, make tests pass |
| `/review` | `/review <slug>` | Automated code review against conventions + spec |
| `/qa-plan` | `/qa-plan <slug>` | Generate manual QA testing plan |
| `/create-pr` | `/create-pr <slug>` | Push branch, create PR with generated summary |

### Setup & Utility Skills

| Skill | Usage | What It Does |
|-------|-------|-------------|
| `/pipeline-setup` | `/pipeline-setup [repo-path]` | Auto-detect framework/stack, write Pipeline Configuration |
| `/metrics` | `/metrics <slug>` | Collect timing and quality metrics for a project |
| `/quality` | `/quality <slug>` | Run post-flight quality checks on a completed project |
| `/release-notes` | `/release-notes <cycle>` | Generate release notes from Linear cycle data |
| `/backfill-timing` | `/backfill-timing <slug>` | Backfill timing data from git history |

---

## Status

**Phase: Operational**

The pipeline is running on real projects across multiple products. All stages (0-7) have Claude Code skills and have been validated end-to-end.

Each stage runs as a manual Claude Code session. Automated orchestration (stage chaining) is a future phase.

---

## Further Reading

| Document | What It Covers |
|----------|---------------|
| [`docs/design-priorities.md`](docs/design-priorities.md) | Core principles and the software laws behind them |
| [`docs/pipeline-architecture.md`](docs/pipeline-architecture.md) | Detailed stage specs, error handling, cross-cutting concerns |
| [`docs/skill-reference.md`](docs/skill-reference.md) | Complete API surface for every skill |
| [`docs/roadmap.md`](docs/roadmap.md) | Planned improvements |
| [`docs/examples/pipeline-configuration.md`](docs/examples/pipeline-configuration.md) | Annotated template for Pipeline Configuration setup |
