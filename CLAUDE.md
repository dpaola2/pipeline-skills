# Agent Pipeline - Claude Context

**WCP namespace:** PIPE
**Active work:** Check `wcp_list(namespace: "PIPE")` for current items before starting.

## What This Project Is

A toolkit for agent-orchestrated software development. The pipeline takes a PRD as input and produces QA-ready implementation code. It works with any codebase that has a conventions file with a `## Pipeline Configuration` section.

**This repo is the skill source.** Skills are copied into target repos and run from there — Claude Code sessions happen in the target repo directory, not here. When working in this repo, you're editing the skills themselves, not running them.

**Read these files to get oriented:**
1. `README.md` — Installation, usage, design priorities, skills reference
2. `docs/pipeline-architecture.md` — The full pipeline design (7 stages + orchestration)
3. `docs/skill-reference.md` — Detailed API surface for every skill
4. `docs/roadmap.md` — Future improvements

---

## Repo Structure

```
.claude/skills/          # All skill definitions (one SKILL.md per skill)
bin/install.sh           # Installs skills into target repos (copies, not symlinks)
dashboard/               # Web visualization tool (Node.js)
docs/                    # Architecture, skill reference, roadmap, design priorities
registry.yaml            # Skill registry — defines collections (core, full, etc.)
```

### Skills (`.claude/skills/`)

Each skill is a single `SKILL.md` file with YAML frontmatter + markdown. No subdirectories or supporting files.

**Pipeline stages (in order):**
| Stage | Skill | Input | Output (WCP artifact) |
|-------|-------|-------|-----------------------|
| 0 | `prd` | Work item body | `prd.md` |
| 1 | `discovery` | `prd.md` + codebase | `discovery-report.md` or `discovery-report-{repo}.md` |
| 2 | `architecture` | PRD + all discovery reports | `architecture-proposal.md` + optional ADRs |
| 3 | `gameplan` | Approved architecture + discovery + PRD | `gameplan.md` (milestones tagged with repo) |
| 4 | `test-generation` | Approved gameplan | Test files + `test-coverage-matrix[-{repo}].md` |
| 5 | `implementation` | Failing tests + gameplan | Code + `progress[-{repo}].md` |
| 6 | `review` | Branch diff + all artifacts | `review-report[-{repo}].md` |
| 7 | `qa-plan` | All artifacts + implementation | QA plan |

**Orchestration:** `pipeline-advance`, `pipeline-approve`, `pipeline-autopilot`
**Utilities:** `pipeline-setup`, `create-pr`, `metrics`, `quality`, `backfill-timing`, `release-notes`
**General:** `interviewer`, `rubber-duck`

### Installation

```bash
bin/install.sh ~/projects/target-app --collection core    # 9 pipeline stages
bin/install.sh ~/projects/target-app --collection full    # all 15 production skills
bin/install.sh ~/projects/target-app prd discovery        # individual skills
bin/install.sh ~/projects/target-app --list               # show installed skills
```

Collections are defined in `registry.yaml`.

---

## Working in This Project

### Key Principles
- **Skills are self-contained.** Each skill embeds its own template and success criteria. No external file dependencies at runtime.
- **Each stage has defined inputs and outputs.** Stages are composable and independently testable.
- **Human checkpoints are architectural, not optional.** Don't try to remove them.
- **The conventions file is the source of truth** for how a target repo works. Skills read it for all framework-specific details.
- **WCP is the artifact store.** All stage inputs/outputs are WCP artifacts on the work item. Skills read via `wcp_get_artifact` and write via `wcp_attach`.

### Multi-Repo Support

The pipeline supports both single-repo and multi-repo projects. For multi-repo features (e.g., iOS + API changes):

- **Discovery:** Run per repo with `--repo <path>`. Produces `discovery-report-{repo-name}.md` artifacts.
- **Architecture:** Reads all discovery reports, produces unified proposal with a Cross-Repo Integration section.
- **Gameplan:** Milestones tagged with target repo, ordered by cross-repo dependency.
- **Test Generation / Implementation / Review:** Run per repo with `--repo <path>`. Artifacts suffixed with repo name.
- **Orchestrators:** Detect multi-repo from artifact list, loop over repos in dependency order.

Single-repo projects are unaffected — all skills are backward compatible when `--repo` is omitted.

---

## Work Tracking: WCP

All work tracking uses WCP (Work Context Protocol), not Linear.

- **Namespace:** PIPE
- Check `wcp_list(namespace: "PIPE")` at session start
- Read full context with `wcp_get(id: "PIPE-XX")` before starting work
- Log progress with `wcp_comment`
- Attach artifacts with `wcp_attach`
- Update status with `wcp_update`

---

## Repo Conventions

- All documentation in Markdown
- Use Obsidian-compatible wiki-links where helpful: `[[filename]]`
- Checklists use `- [ ]` format
- Mermaid diagrams for flow visualization

---

## What NOT To Do

- Don't try to automate Framing or Shaping — those are human judgment phases
- Don't remove human checkpoints from the pipeline
- Don't assume PRD quality — validate it
- Don't build platform-specific code without a shared data model/API contract
- Don't give agents production access (no deploy credentials, no production remotes)
- Don't optimize for speed over correctness in early iterations
