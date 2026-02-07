# Agent Pipeline

> **Vision:** Ingest a PRD, produce QA-ready implementation code — for any product.

---

## What This Is

An agent-orchestrated development pipeline that automates the journey from **Product Requirements Document** to **code ready for QA** through seven discrete stages with human checkpoints at critical decision points.

The pipeline runs inside [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as a set of custom skills (slash commands). Each stage reads structured inputs and produces structured outputs. Two human checkpoints gate the transition from analysis to execution — you approve the architecture and implementation plan before any code is written.

Originally built for OrangeQC (multi-platform Rails/iOS/Android), the pipeline is product-agnostic. It works with any codebase that has a conventions file and test infrastructure.

---

## Getting Started

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- A git repository you want to run the pipeline against
- That repo should have a test framework configured (RSpec, Jest, pytest, etc.)

### Setup

**1. Clone this repo:**

```bash
git clone <this-repo-url>
cd agent-pipeline
```

**2. Onboard your repository:**

Open Claude Code in this directory and run:

```
/setup-repo /path/to/your/repo
```

This will:
- Auto-detect your framework, test setup, directory structure, and CI config
- Generate a `PIPELINE.md` in your target repo (repo-specific config)
- Create a pipeline config in `pipelines/` (maps the pipeline to your repo)
- Optionally activate it as the current pipeline target

**3. Create your first project:**

Drop rough notes (feature ideas, requirements, anything) into your inbox directory (shown after setup), then:

```
/stage0-prd
```

This converts your notes into a structured PRD. Review it before continuing.

**4. Run the pipeline:**

```
/stage1-discovery my-feature          # Explore codebase, produce discovery report
/stage2-architecture my-feature       # Propose technical design
                                      # ← REVIEW AND APPROVE architecture
/stage3-gameplan my-feature           # Break into milestones + acceptance criteria
                                      # ← REVIEW AND APPROVE gameplan
/stage4-test-generation my-feature    # Write failing tests (TDD)
/stage5-implementation my-feature M1  # Implement milestone 1
/stage5-implementation my-feature M2  # Implement milestone 2 (repeat per milestone)
/stage7-qa-plan my-feature            # Generate QA plan for manual testing
/create-pr my-feature                 # Push branch and create PR
```

See `HOW_IT_WORKS.md` for a detailed walkthrough of what each stage does and why.

---

## How It Works

The pipeline has two halves separated by two human checkpoints:

```
Analysis (produces documents, zero risk)
  Stage 1: Discovery — explores the codebase
  Stage 2: Architecture — proposes data model + API design
       ↓
  Checkpoint 1: Architecture Review ← You approve the technical design
       ↓
  Stage 3: Gameplan — breaks PRD into milestones
       ↓
  Checkpoint 2: Gameplan Review ← You approve the implementation plan
       ↓
Execution (writes code)
  Stage 4: Test Generation — writes failing tests (TDD)
  Stage 5: Implementation — makes tests pass, milestone by milestone
  Stage 6: Review — (not yet automated, currently manual)
  Stage 7: QA Plan — generates manual testing checklist
```

Stages 1-2 are safe to run on any PRD — they only produce documents. The architecture gets locked down before the gameplan, and the gameplan gets locked down before any code is written. This catches design issues early when they're cheap to fix.

**Full details:** `HOW_IT_WORKS.md`

---

## Configuration

The pipeline uses a three-layer configuration:

| Layer | File | What It Contains | Checked In? |
|-------|------|-----------------|-------------|
| **Active config** | `pipeline.md` | Points pipeline at a product (repo paths, work directory) | No (gitignored) |
| **Product library** | `pipelines/<product>.md` | Named configs per product | No (gitignored) |
| **Repo config** | `PIPELINE.md` (in target repo) | How the repo works (framework, tests, directories) | Yes (per repo) |

Pipeline configs (`pipeline.md`, `pipelines/*.md`) contain machine-specific paths and are gitignored — like `.env` files. Each person generates their own via `/setup-repo`.

See `pipeline.md.example` for the config format and `pipelines/README.md` for how to manage configs.

**Switching products:**

```bash
cp pipelines/my-product.md pipeline.md
```

---

## Project Structure

```
.
├── README.md                          # You are here
├── HOW_IT_WORKS.md                    # End-to-end pipeline walkthrough
├── CLAUDE.md                          # Agent context for working on this repo
├── pipeline.md.example                # Config format reference (with placeholder paths)
│
├── pipelines/                         # Per-product configs (gitignored *.md)
│   └── README.md                      # How to create and manage configs
│
├── .claude/skills/                    # Pipeline skills (the engine)
│   ├── stage0-prd/SKILL.md            # /stage0-prd
│   ├── stage1-discovery/SKILL.md      # /stage1-discovery <slug>
│   ├── stage2-architecture/SKILL.md   # /stage2-architecture <slug>
│   ├── stage3-gameplan/SKILL.md       # /stage3-gameplan <slug>
│   ├── stage4-test-generation/SKILL.md # /stage4-test-generation <slug>
│   ├── stage5-implementation/SKILL.md # /stage5-implementation <slug> <milestone>
│   ├── stage7-qa-plan/SKILL.md        # /stage7-qa-plan <slug>
│   ├── create-pr/SKILL.md             # /create-pr <slug>
│   └── setup-repo/SKILL.md            # /setup-repo <repo-path> [product-name]
│
├── templates/                         # Input/output markdown templates
│   ├── prd-intake.md                  # Structured PRD format
│   ├── discovery-report.md            # Stage 1 output
│   ├── architecture-proposal.md       # Stage 2 output
│   ├── gameplan.md                    # Stage 3 output
│   └── qa-plan.md                     # Stage 7 output
│
└── docs/                              # Architecture and design specs
    ├── pipeline-architecture.md       # Full pipeline design (7 stages + checkpoints)
    ├── current-process.md             # The development process this automates
    ├── orangeqc-constraints.md        # OrangeQC-specific platform constraints
    ├── gap-analysis.md                # What's missing, what to build
    ├── roadmap.md                     # Future improvements
    └── stages/                        # Per-stage detailed specs
        ├── 01-discovery.md
        ├── 02-architecture.md
        ├── 03-gameplan.md
        ├── 04-test-generation.md
        ├── 05-implementation.md
        ├── 06-review.md
        └── 07-validation.md
```

Project artifacts (PRDs, gameplans, progress files) live **outside** this repo, in a per-product work directory configured in `pipeline.md`. This keeps the pipeline repo as a pure engine with no product-specific data.

---

## Skills Reference

| Skill | Usage | What It Does |
|-------|-------|-------------|
| `/setup-repo` | `/setup-repo <path> [name]` | Onboard a new repo — auto-detect framework, generate configs |
| `/stage0-prd` | `/stage0-prd` | Convert inbox notes into a structured PRD |
| `/stage1-discovery` | `/stage1-discovery <slug>` | Explore codebase, produce discovery report |
| `/stage2-architecture` | `/stage2-architecture <slug>` | Propose technical design (data model, API, migrations) |
| `/stage3-gameplan` | `/stage3-gameplan <slug>` | Break PRD into milestones with acceptance criteria |
| `/stage4-test-generation` | `/stage4-test-generation <slug>` | Write failing tests (TDD) |
| `/stage5-implementation` | `/stage5-implementation <slug> <M#>` | Implement one milestone, make tests pass |
| `/stage7-qa-plan` | `/stage7-qa-plan <slug>` | Generate manual QA testing plan |
| `/create-pr` | `/create-pr <slug>` | Push branch, create PR with generated summary |

---

## Human Checkpoints

The pipeline has two mandatory review gates:

**After Stage 2 (Architecture Review):** Open `architecture-proposal.md` in the project directory, find the Approval Checklist, set Status to "Approved", and fill in the reviewer checklist. Stage 3 refuses to run until this is done.

**After Stage 3 (Gameplan Review):** Review `gameplan.md` — verify milestones, acceptance criteria, and sequencing before any code is generated.

These checkpoints exist because errors amplify downstream. A wrong data model decision in Stage 2 propagates through the gameplan, tests, and implementation. Catching it before Stage 3 is dramatically cheaper than catching it during Stage 5.

---

## Key Principles

1. **PRD quality is the bottleneck.** The pipeline is only as good as the input. Garbage in, garbage out.
2. **Human checkpoints are non-negotiable.** Agents propose, humans dispose. Architecture and gameplan reviews happen before code generation.
3. **Agents never touch production.** No deploy credentials, no production remotes, no production database access.
4. **Templates are the program.** The markdown templates define what agents produce. Improving templates improves output.
5. **Multi-platform alignment before implementation.** Data model and API payloads are shared contracts agreed upon before any platform writes code.

---

## Status

**Phase: Operational**

The pipeline is running on real projects across multiple products. Stages 0-5 and 7 have Claude Code skills and have been validated end-to-end. Stage 6 (Review) is spec'd but not yet automated — code review is currently manual.

Each stage runs as a manual Claude Code session. Automated orchestration (stage chaining) is a future phase.

---

## Further Reading

| Document | What It Covers |
|----------|---------------|
| `HOW_IT_WORKS.md` | End-to-end walkthrough of what each stage does and why |
| `docs/pipeline-architecture.md` | Detailed stage specs, error handling, cross-cutting concerns |
| `docs/current-process.md` | The development process this pipeline automates |
| `docs/stages/01-07` | Deep specs for each individual stage |
| `templates/` | Input/output templates used by each stage |
| `docs/roadmap.md` | Planned improvements |
| `pipeline.md.example` | Config format reference |
| `pipelines/README.md` | How to manage per-product configs |
