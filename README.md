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

**1. Add Pipeline Configuration to your conventions file:**

Your repo should have a conventions file (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md`). Add a `## Pipeline Configuration` section with the required sub-sections. Use this template:

```markdown
## Pipeline Configuration

> Pipeline skills read this section to understand how to run the agent pipeline against this repo.
> Run skills from this repo's root directory.

### Work Directory

| Setting | Path |
|---------|------|
| **Projects** | `../pipeline-projects/` |
| **Inbox** | `../pipeline-projects/inbox/` |

### Project Tracker

| Setting | Value |
|---------|-------|
| **Tool** | None |

### Repository Details

| Setting | Value |
|---------|-------|
| **Default branch** | `main` |
| **Test command** | `[your test command]` |
| **Test directory** | `[your test directory]` |
| **Branch prefix** | `pipeline/` |
| **PR base branch** | `main` |

### Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| [Your platform] | Active | [description] |

### Framework & Stack

| Setting | Value |
|---------|-------|
| **Language** | [language] |
| **Framework** | [framework] |
| **Test framework** | [test framework] |
| [add more as needed] | |

### Directory Structure

| Purpose | Path |
|---------|------|
| Models | [path] |
| Controllers | [path] |
| Tests | [path] |
| [add more as needed] | |

### Implementation Order

1. [Your implementation sequence]

### Guardrails

| Guardrail | Rule |
|-----------|------|
| **Production access** | Agents NEVER have production access. |
| **Default branch** | Never commit or merge directly to the default branch. |
| **Push** | Never push without explicit user request. |
| **Destructive operations** | No `drop_table`, `reset`, or data deletion without human approval. |
```

**2. Create the projects directory:**

```bash
mkdir -p ../pipeline-projects/inbox
```

**3. Create your first project:**

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

See `HOW_IT_WORKS.md` for a detailed walkthrough of what each stage does and why.

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

Stages 1-2 are safe to run on any PRD — they only produce documents. The architecture gets locked down before the gameplan, and the gameplan gets locked down before any code is written. This catches design issues early when they're cheap to fix.

**Full details:** `HOW_IT_WORKS.md`

---

## Design Priorities

Six principles govern how the pipeline evolves, ordered by importance — when two conflict, the higher one wins. These are derived from fundamental software laws ([full analysis](docs/software-laws.md)).

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
├── README.md                          # You are here
├── HOW_IT_WORKS.md                    # End-to-end pipeline walkthrough
├── CLAUDE.md                          # Agent context for working on this repo
│
├── .claude/skills/                    # Pipeline skills (the engine)
│   ├── prd/SKILL.md                   # /prd
│   ├── discovery/SKILL.md             # /discovery <slug>
│   ├── architecture/SKILL.md          # /architecture <slug>
│   ├── gameplan/SKILL.md              # /gameplan <slug>
│   ├── test-generation/SKILL.md       # /test-generation <slug>
│   ├── implementation/SKILL.md        # /implementation <slug> <milestone>
│   ├── review/SKILL.md                # /review <slug>
│   ├── qa-plan/SKILL.md               # /qa-plan <slug>
│   ├── create-pr/SKILL.md             # /create-pr <slug>
│   ├── metrics/SKILL.md               # /metrics <slug>
│   ├── quality/SKILL.md               # /quality <slug>
│   ├── release-notes/SKILL.md         # /release-notes <cycle>
│   └── backfill-timing/SKILL.md       # /backfill-timing <slug>
│
└── docs/                              # Architecture and design specs
    ├── workspace-setup.md             # Setup guide for new adopters
    ├── design-priorities.md           # Core principles governing pipeline evolution
    ├── software-laws.md               # Fundamental software laws applied to the pipeline
    ├── pipeline-architecture.md       # Full pipeline design (7 stages + checkpoints)
    ├── current-process.md             # The development process this automates
    ├── gap-analysis.md                # What's missing, what to build
    ├── roadmap.md                     # Future improvements
    ├── examples/                      # Product-specific reference material
    │   └── orangeqc-constraints.md    # Example of product constraints
    └── stages/                        # Per-stage design specs (reference, not runtime)
        ├── README.md
        ├── 01-discovery.md
        ├── 02-architecture.md
        ├── 03-gameplan.md
        ├── 04-test-generation.md
        ├── 05-implementation.md
        ├── 06-review.md
        └── 07-validation.md
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

### Utility Skills

| Skill | Usage | What It Does |
|-------|-------|-------------|
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
| `HOW_IT_WORKS.md` | End-to-end walkthrough of what each stage does and why |
| `docs/workspace-setup.md` | Setup guide for new adopters (workspace layout, design principles) |
| `docs/pipeline-architecture.md` | Detailed stage specs, error handling, cross-cutting concerns |
| `docs/current-process.md` | The development process this pipeline automates |
| `docs/stages/` | Deep specs for each individual stage (design reference, not runtime) |
| `docs/roadmap.md` | Planned improvements |
