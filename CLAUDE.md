# Agent Pipeline - Claude Context

## What This Project Is

A toolkit for agent-orchestrated software development. The pipeline takes a PRD as input and produces QA-ready implementation code. It works with any codebase that has a conventions file with a `## Pipeline Configuration` section.

**This repo is the skill source.** Skills are copied into target repos and run from there — Claude Code sessions happen in the target repo directory, not here.

**Read these files to get oriented:**
1. `README.md` - Installation, usage, design priorities, skills reference
2. `docs/pipeline-architecture.md` - The full pipeline design
3. `docs/skill-reference.md` - Detailed API surface for every skill
4. `docs/roadmap.md` - Future improvements

---

## Working in This Project

### Current Phase: Operational
- Skills exist for Stages 0-7, plus setup, create-pr, metrics, quality, release-notes, and backfill-timing (`.claude/skills/`)
- Each stage runs as a manual Claude Code session from the target repo
- Skills are self-contained — templates and success criteria are embedded, not external files

### Future Phase: Orchestration
- Build orchestration code in `pipeline/` for automated stage chaining
- Wire up Linear integration (automated ticket creation, status transitions)

### Key Principles
- **Skills are self-contained.** Each skill embeds its own template and success criteria. No external file dependencies at runtime.
- **Each stage has defined inputs and outputs.** Stages are composable and independently testable.
- **Human checkpoints are architectural, not optional.** Don't try to remove them.
- **The conventions file is the source of truth** for how a target repo works. Skills read it for all framework-specific details.

---

## Linear Integration

The pipeline uses Linear for:
- **Project tracking:** Pipeline runs map to Linear projects
- **Issue creation:** Milestones from gameplans become Linear issues
- **Status updates:** Stage transitions update issue status
- **Linking:** PRDs, specs, PRs, and QA reports link to Linear issues

When working with Linear in this project:
- Use the Linear MCP tools (list_issues, create_issue, update_issue, etc.)
- Milestone tickets should be tagged with the pipeline stage that created them

---

## Repo Conventions

- All documentation in Markdown
- Use Obsidian-compatible wiki-links where helpful: `[[filename]]`
- Checklists use `- [ ]` format
- Mermaid diagrams for flow visualization

---

## What NOT To Do

- Don't try to automate Framing or Shaping - those are human judgment phases
- Don't remove human checkpoints from the pipeline
- Don't assume PRD quality - validate it
- Don't build platform-specific code without a shared data model/API contract
- Don't give agents production access (no deploy credentials, no production remotes)
- Don't optimize for speed over correctness in early iterations
