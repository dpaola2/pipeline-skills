# OrangeQC Agent Pipeline

> **Vision:** Ingest a PRD, produce implementation code across three platforms (Rails web/API, iOS, Android), ready for QA.

---

## What This Is

An agent-orchestrated development pipeline tailored to OrangeQC's multi-platform architecture and development process. The pipeline automates the journey from **Product Requirements Document** to **code ready for QA** through seven discrete agent stages with human checkpoints at critical judgment gates.

This is not a generic CI/CD tool. It encodes OrangeQC's specific:
- Multi-platform coordination patterns (Rails API-first, mobile follows)
- Backwards compatibility requirements (old mobile apps in the field)
- Development process (Framing → Shaping → Gameplanning → Building → Testing)
- Quality standards (TDD, security scoping, convention enforcement)
- Agentic guardrails (agents never touch production)

---

## Quick Start

1. **Start here:** Read `HOW_IT_WORKS.md` for a complete walkthrough of how the pipeline works end-to-end
2. Read `docs/pipeline-architecture.md` for detailed stage specs and error handling
3. Read `docs/gap-analysis.md` for what needs to be built and in what order
4. See `docs/stages/` for deep specs on each pipeline stage
5. See `templates/` for input/output templates used by each stage

---

## Project Structure

```
.
├── README.md                          # You are here
├── HOW_IT_WORKS.md                    # End-to-end pipeline walkthrough (share this)
├── CLAUDE.md                          # Claude context for this project
├── docs/
│   ├── current-process.md             # OrangeQC's existing development process
│   ├── pipeline-architecture.md       # Full pipeline design (7 stages + checkpoints)
│   ├── orangeqc-constraints.md        # Platform, team, and guardrail constraints
│   ├── gap-analysis.md                # What's missing, what to build, priority order
│   └── stages/
│       ├── 01-discovery.md            # PRD → Discovery Report
│       ├── 02-architecture.md         # Discovery → Technical Design
│       ├── 03-gameplan.md             # Design → Spec/Gameplan
│       ├── 04-test-generation.md      # Spec → Failing Tests (TDD)
│       ├── 05-implementation.md       # Tests → Passing Code
│       ├── 06-review.md              # Code → Reviewed Code
│       └── 07-validation.md           # Reviewed Code → QA Plan
├── templates/
│   ├── prd-intake.md                  # Structured PRD input format
│   ├── discovery-report.md            # Discovery stage output
│   ├── architecture-proposal.md       # Architecture stage output
│   ├── gameplan.md                    # Gameplan stage output
│   └── qa-plan.md                     # QA Plan stage output
├── .claude/skills/                    # Pipeline stage skills (Claude Code custom commands)
│   ├── stage1-discovery/SKILL.md      # /stage1-discovery <project-slug>
│   ├── stage2-architecture/SKILL.md   # /stage2-architecture <project-slug>
│   ├── stage3-gameplan/SKILL.md       # /stage3-gameplan <project-slug>
│   ├── stage4-test-generation/SKILL.md # /stage4-test-generation <project-slug>
│   ├── stage5-implementation/SKILL.md # /stage5-implementation <project-slug> <milestone>
│   └── stage7-qa-plan/SKILL.md       # /stage7-qa-plan <project-slug>
├── projects/                          # Pipeline project runs
│   └── deficient-line-items-report/   # First project (Level 2, web-only) — complete
│       ├── prd.md                     # Input: structured PRD
│       ├── discovery-report.md        # Stage 1 output
│       ├── architecture-proposal.md   # Stage 2 output (approved)
│       ├── gameplan.md                # Stage 3 output (approved)
│       ├── test-coverage-matrix.md    # Stage 4 output
│       ├── progress.md               # Stage 5 output (milestone tracking)
│       └── qa-plan.md                # Stage 7 output
└── pipeline/                          # (future) Orchestration code lives here
```

---

## Key Principles

1. **PRD quality is the bottleneck.** The pipeline is only as good as the input. Garbage in, garbage out.
2. **Human checkpoints are non-negotiable.** Agents propose, humans dispose. Architecture review happens before code generation.
3. **Agents never touch production.** All guardrails from the agentic development policy apply.
4. **Templates are the program.** The markdown templates define what agents produce. Improving templates improves output.
5. **Linear is the source of truth** for project state, tickets, and status tracking.
6. **Multi-platform alignment before implementation.** Data model and API payloads are shared contracts agreed upon before any platform writes code.

---

## Linear Integration

This pipeline is Linear-enabled:
- PRDs link to Linear projects/initiatives
- Each pipeline stage can create/update Linear issues
- Milestones from gameplans become Linear tickets
- Stage transitions update issue status
- QA plans link back to all related issues

---

## Status

**Phase: Operational (Rails-only projects)**

The pipeline is running on real projects. Stages 1-5 and 7 have Claude Code skills (`/stage1-discovery`, `/stage2-architecture`, etc.) and have been validated end-to-end on the first project (deficient-line-items-report). Stage 6 (Review) is spec'd but not yet automated — code review is currently manual.

Each stage runs as a manual Claude Code session. Automated orchestration (stage chaining, Linear integration) is a future phase.
