# Workspace Setup Guide

This guide explains how to set up the agent pipeline for a new product. After following these steps, you'll be able to run pipeline stages (`/stage0-prd` through `/create-pr`) against your codebase.

---

## The Workspace Concept

The pipeline expects a **workspace** — an umbrella directory where your target repository, the pipeline toolkit, and project artifacts all live together:

```
~/projects/my-product/              ← The workspace
  my-app/                           ← Target repo (will get PIPELINE.md)
  my-api/                           ← Another target repo (optional)
  agent-pipeline/                   ← This toolkit (cloned)
  pipeline-projects/                ← Project artifacts directory
    inbox/                          ← Raw input notes for Stage 0
    my-first-feature/               ← PRD, gameplan, progress, etc.
```

### Why This Structure?

Project artifacts (PRDs, gameplans, progress files) are **pipeline-scoped**, not repo-scoped. A feature may touch multiple repositories — its artifacts can't live inside any single target repo. Keeping them in a separate directory lets the pipeline coordinate across repos while keeping products isolated from each other.

---

## Design Principles

These principles are baked into how the pipeline works. Understanding them helps you use it effectively.

### Two-Checkpoint Architecture

The pipeline has two mandatory human review points:

1. **Architecture Review** (after Stage 2) — locks down data model, API contract, compatibility, security
2. **Gameplan Review** (after Stage 3) — locks down milestones, sequencing, acceptance criteria

**Why two?** Error amplification. A wrong data model propagates through every downstream stage — tests, implementation, QA. Catching it early is dramatically cheaper than catching it late.

### Single Branch Per Project

All milestones for a project are committed to one branch (`<branch-prefix><slug>`). The branch is created in Stage 4 and used through Stage 5, review, and PR creation.

**Why?** Simplicity. Multi-branch workflows add coordination overhead without adding safety — the pipeline already has formal checkpoints.

### Externalized Work Directory

Project artifacts live outside both the pipeline repo and the target repos:

- **Pipeline repo** (`agent-pipeline/`) — skills, templates, docs. Shared across all products.
- **Target repo** (`my-app/`) — source code. Has `PIPELINE.md` describing how it works.
- **Projects directory** (`pipeline-projects/`) — PRDs, gameplans, progress files. Per-product, per-project.

**Why?** A feature may span multiple repos. Artifacts belong to the pipeline run, not to any single codebase.

### Active Pointer Pattern

`pipeline.md` is always the active config — skills read it to find repo paths and work directories. Named configs live in `pipelines/` and can be swapped in:

```bash
cp pipelines/my-product.md pipeline.md
```

**Why?** One pipeline installation supports multiple products. Switching is a single file copy.

### Templates as the Program

Output quality is determined by template quality. Each skill embeds its output template directly — the template defines the structure of what gets generated. Improving a template improves every future project.

### Human Checkpoints Are Architectural

The architecture review and gameplan review aren't optional process overhead — they're structural. Stage 3 refuses to run without an approved architecture. Stage 4 refuses to run without an approved gameplan. These gates exist because the cost of building on a wrong foundation exceeds the cost of reviewing it.

---

## Getting Started

### Step 1: Clone the Pipeline

```bash
cd ~/projects/my-product/
git clone <pipeline-repo-url> agent-pipeline
```

### Step 2: Set Up Your Target Repo

Run the setup skill from within Claude Code (in the `agent-pipeline/` directory):

```
/setup-repo ~/projects/my-product/my-app my-product
```

This will:
- Explore your codebase and detect framework, test tools, directory structure
- Generate `PIPELINE.md` in your target repo (describes how the repo works)
- Create `pipelines/my-product.md` in the pipeline repo (points to your repo paths)
- Optionally activate the product as the current pipeline target

### Step 3: Create the Projects Directory

```bash
mkdir -p ~/projects/my-product/pipeline-projects/inbox
```

### Step 4: Verify the Setup

Check that `pipeline.md` points to the right places:

```
/setup-repo  # with no arguments — shows current config
```

### Step 5: Start a Project

Drop raw notes (feature descriptions, Slack exports, meeting notes) into the inbox:

```bash
cp my-feature-notes.md ~/projects/my-product/pipeline-projects/inbox/
```

Then run:

```
/stage0-prd
```

This generates a structured PRD from your notes. Review it, then proceed through the pipeline stages:

```
/stage1-discovery my-feature
/stage2-architecture my-feature
# → Review and approve the architecture
/stage3-gameplan my-feature
# → Review and approve the gameplan
/stage4-test-generation my-feature
/stage5-implementation my-feature M1
/stage5-implementation my-feature M2
# ... one milestone at a time
/stage7-qa-plan my-feature
/create-pr my-feature
```

---

## Configuration Reference

### `pipeline.md` (this repo, root)

The active pipeline config. Points to repo paths and work directories. Skills read this file first.

### `pipelines/` (this repo)

Named configs per product. Gitignored (machine-specific paths). See `pipelines/README.md`.

### `PIPELINE.md` (each target repo)

Describes how the target repo works — framework, directory structure, test commands, branch conventions, and optional sections for API conventions, multi-tenant security, backwards compatibility, feature flags, etc.

Skills read `pipeline.md` to find repos, then read `PIPELINE.md` from the target repo for all framework-specific details.

---

## Adding Product-Specific Constraints

If your product has constraints that go beyond what `PIPELINE.md` captures (e.g., detailed API conventions, export requirements, team context), put them in the target repo's conventions file (e.g., `AGENTS.md`, `CLAUDE.md`). That's where pipeline skills look for codebase-specific guidance.

See `docs/examples/orangeqc-constraints.md` for an example of what product-specific constraints look like.
