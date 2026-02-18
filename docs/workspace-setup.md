# Workspace Setup Guide

This guide explains how to set up the agent pipeline for a new product. After following these steps, you'll be able to run pipeline stages (`/prd` through `/create-pr`) against your codebase.

---

## The Workspace Concept

The pipeline expects a **workspace** — an umbrella directory where your target repository, the pipeline toolkit (as a skill source), and project artifacts all live together:

```
~/projects/my-product/              ← The workspace
  my-app/                           ← Target repo (has conventions file with Pipeline Configuration)
    .claude/skills/                 ← Pipeline skills (copied from agent-pipeline)
    CLAUDE.md                       ← Conventions file with ## Pipeline Configuration section
  my-api/                           ← Another target repo (optional)
  agent-pipeline/                   ← This toolkit (skill source, cloned)
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

- **Pipeline repo** (`agent-pipeline/`) — skills source, docs, design specs. Shared across all products.
- **Target repo** (`my-app/`) — source code, skills (copied in), conventions file with Pipeline Configuration.
- **Projects directory** (`pipeline-projects/`) — PRDs, gameplans, progress files. Per-product, per-project.

**Why?** A feature may span multiple repos. Artifacts belong to the pipeline run, not to any single codebase.

### Skills Run From the Target Repo

Skills are self-contained files that get copied into each target repo's `.claude/skills/` directory. Claude Code sessions happen in the target repo directory. Skills read the repo's conventions file (with `## Pipeline Configuration` section) for all configuration.

**Why?** One less layer of indirection. No switching between products. The target repo is both the code and the config.

### Templates as the Program

Output quality is determined by template quality. Each skill embeds its output template directly — the template defines the structure of what gets generated. Improving a template improves every future project.

### Human Checkpoints Are Architectural

The architecture review and gameplan review aren't optional process overhead — they're structural. Stage 3 refuses to run without an approved architecture. Stage 4 refuses to run without an approved gameplan. These gates exist because the cost of building on a wrong foundation exceeds the cost of reviewing it.

---

## Getting Started

### Step 1: Clone the Pipeline (Skill Source)

```bash
cd ~/projects/my-product/
git clone <pipeline-repo-url> agent-pipeline
```

### Step 2: Copy Skills Into Your Target Repo

```bash
cp -r agent-pipeline/.claude/skills/* my-app/.claude/skills/
```

### Step 3: Run Pipeline Setup

From your target repo directory, run:

```
/pipeline-setup
```

This auto-detects your framework, test tools, linters, and directory structure, then writes the `## Pipeline Configuration` section into your conventions file (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md`). It also creates the projects directory.

Review the generated configuration and adjust any values before continuing.

**Manual alternative:** If you prefer to set up manually, copy the annotated example from [`docs/examples/pipeline-configuration.md`](examples/pipeline-configuration.md) into your conventions file and fill in the values. The example includes every required and optional section with guidance on when each applies.

**Required sections:** Work Directory, Project Tracker, Repository Details, Platforms, Framework & Stack, Directory Structure, Implementation Order, Guardrails.

**Optional sections** (include only if they apply): Post-Flight Checks, Related Repositories, API Conventions, Multi-Tenant Security, Backwards Compatibility, Complexity Analysis.

### Step 5: Start a Project

Drop raw notes (feature descriptions, Slack exports, meeting notes) into the inbox:

```bash
cp my-feature-notes.md ~/projects/my-product/pipeline-projects/inbox/
```

Then open Claude Code in your target repo (`my-app/`) and run:

```
/prd
```

This generates a structured PRD from your notes. Review it, then proceed through the pipeline stages:

```
/discovery my-feature
/architecture my-feature
# → Review and approve the architecture
/gameplan my-feature
# → Review and approve the gameplan
/test-generation my-feature
/implementation my-feature M1
/implementation my-feature M2
# ... one milestone at a time
/qa-plan my-feature
/create-pr my-feature
```

---

## Configuration Reference

### Conventions File (target repo)

The conventions file (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md`) in the target repo root contains a `## Pipeline Configuration` section with all pipeline config. Skills locate this file automatically (first found wins).

The Pipeline Configuration section includes sub-sections for Work Directory, Project Tracker, Related Repositories (optional), Repository Details, Platforms, Framework & Stack, Directory Structure, Implementation Order, Post-Flight Checks (optional), Complexity Analysis (optional), and Guardrails.

---

## Adding Product-Specific Constraints

If your product has constraints that go beyond what the Pipeline Configuration section captures (e.g., detailed API conventions, export requirements, team context), put them in the conventions file itself — that's already where pipeline skills look for codebase-specific guidance.

See `docs/examples/orangeqc-constraints.md` for an example of what product-specific constraints look like.
