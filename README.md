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

This detects your framework, test tools, linters, and directory layout, then writes the `## Pipeline Configuration` section into your conventions file.

If you prefer manual setup, copy the annotated example from [`docs/examples/pipeline-configuration.md`](docs/examples/pipeline-configuration.md) into your conventions file and fill in the values.

**Then create your first project:**

Create a WCP work item with your brief (feature description, requirements, rough notes), then run Claude Code from your repo:

```
/prd SN-3
```

This reads the work item body and converts it into a structured PRD, attached as a WCP artifact. Review it before continuing.

**4. Run the pipeline:**

```
/prd SN-3                      # Generate PRD from work item brief
/discovery SN-3                # Explore codebase, produce discovery report
/architecture SN-3             # Propose technical design
                               # <- REVIEW AND APPROVE architecture
/gameplan SN-3                 # Break into milestones + acceptance criteria
                               # <- REVIEW AND APPROVE gameplan
/test-generation SN-3          # Write failing tests (TDD)
/implementation SN-3 M1        # Implement milestone 1
/implementation SN-3 M2        # Implement milestone 2 (repeat per milestone)
/review SN-3                   # Automated code review
/qa-plan SN-3                  # Generate QA plan for manual testing
/create-pr SN-3                # Push branch and create PR
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

Stages 0-3 are safe to run on any branch — they only produce documents as WCP artifacts. The architecture gets locked down before the gameplan, and the gameplan gets locked down before any code is written. This catches design issues early when they're cheap to fix.

### Branch Model

The pipeline has a deliberate split in how it treats git branches:

**Stages 0-3 (document stages)** don't care what branch you're on. They read the codebase and write artifacts to WCP (Work Context Protocol). You can run them on `main`, a feature branch, or anywhere — it doesn't matter because they only produce documents stored as WCP artifacts.

**Stage 4 (test generation)** is the transition point. It creates a project branch (`<branch-prefix><callsign>`, e.g., `pipeline/SN-3`) from the **local** default branch and commits test files to it.

**Stages 5-7 + create-pr** all operate on the project branch created by Stage 4.

The branch is created from the **local** default branch (not `origin/`). This ensures the branch starts from the latest local state.

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

**After Stage 2 (Architecture Review):** Read the `architecture-proposal.md` artifact from the work item, find the Approval Checklist, set Status to "Approved", and fill in the reviewer checklist. Stage 3 refuses to run until this is done.

**After Stage 3 (Gameplan Review):** Review the `gameplan.md` artifact — verify milestones, acceptance criteria, and sequencing before any code is generated.

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
│   ├── prd/SKILL.md                    # /prd <callsign>
│   ├── discovery/SKILL.md              # /discovery <callsign>
│   ├── architecture/SKILL.md           # /architecture <callsign>
│   ├── gameplan/SKILL.md               # /gameplan <callsign>
│   ├── test-generation/SKILL.md        # /test-generation <callsign>
│   ├── implementation/SKILL.md         # /implementation <callsign> <milestone>
│   ├── review/SKILL.md                 # /review <callsign>
│   ├── qa-plan/SKILL.md                # /qa-plan <callsign>
│   ├── create-pr/SKILL.md              # /create-pr <callsign>
│   ├── metrics/SKILL.md                # /metrics <callsign>
│   ├── quality/SKILL.md                # /quality <callsign>
│   ├── release-notes/SKILL.md          # /release-notes <cycle>
│   └── backfill-timing/SKILL.md        # /backfill-timing <callsign>
│
└── docs/
    ├── design-priorities.md            # Core principles governing pipeline evolution
    ├── pipeline-architecture.md        # Full pipeline design (7 stages + checkpoints)
    ├── skill-reference.md              # Detailed skill API surface reference
    ├── roadmap.md                      # Planned improvements
    └── examples/
        └── pipeline-configuration.md   # Annotated Pipeline Configuration template
```

Project artifacts (PRDs, gameplans, progress files) are stored as WCP (Work Context Protocol) artifacts on work items. One WCP work item = one pipeline run. The callsign (e.g., `SN-3`) is passed to every skill. This keeps the pipeline repo as a pure skill source with no product-specific data.

---

## Skills Reference

### Pipeline Stages

| Skill | Usage | What It Does |
|-------|-------|-------------|
| `/prd` | `/prd <callsign>` | Generate PRD from work item brief |
| `/discovery` | `/discovery <callsign>` | Explore codebase, produce discovery report |
| `/architecture` | `/architecture <callsign>` | Propose technical design (data model, API, migrations) |
| `/gameplan` | `/gameplan <callsign>` | Break PRD into milestones with acceptance criteria |
| `/test-generation` | `/test-generation <callsign>` | Write failing tests (TDD) |
| `/implementation` | `/implementation <callsign> <M#>` | Implement one milestone, make tests pass |
| `/review` | `/review <callsign>` | Automated code review against conventions + spec |
| `/qa-plan` | `/qa-plan <callsign>` | Generate manual QA testing plan |
| `/create-pr` | `/create-pr <callsign>` | Push branch, create PR with generated summary |

### Setup & Utility Skills

| Skill | Usage | What It Does |
|-------|-------|-------------|
| `/pipeline-setup` | `/pipeline-setup [repo-path]` | Auto-detect framework/stack, write Pipeline Configuration |
| `/metrics` | `/metrics <callsign>` | Collect timing and quality metrics for a project |
| `/quality` | `/quality <callsign>` | Run post-flight quality checks on a completed project |
| `/release-notes` | `/release-notes <cycle>` | Generate release notes from Linear cycle data |
| `/backfill-timing` | `/backfill-timing <callsign>` | Backfill timing data from git history |

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
