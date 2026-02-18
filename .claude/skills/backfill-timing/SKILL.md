---
name: backfill-timing
description: "Retrofit YAML frontmatter with pipeline timing metadata onto existing project documents that were created before timing was implemented."
disable-model-invocation: true
argument-hint: "<project-slug>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Edit
---

# Backfill Timing

You **retrofit YAML frontmatter** with pipeline timing metadata onto existing project documents. This is for projects that completed stages before the timing system was added.

## Inputs

- `<projects-path>/$ARGUMENTS/` — the project directory containing pipeline documents
- The current repository — for git commit timestamps

## Before You Start

1. Locate the **conventions file** in the current repo root — look for `CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md` (use the first one found). Read it in full. From the `## Pipeline Configuration` section, extract the **projects path** (from Work Directory → Projects).
2. Verify `<projects-path>/$ARGUMENTS/` exists and contains pipeline documents.

## Document-to-Stage Mapping

| Document | Stage | Stage Name |
|----------|-------|------------|
| `prd.md` | 0 | prd |
| `discovery-report.md` | 1 | discovery |
| `architecture-proposal.md` | 2 | architecture |
| `gameplan.md` | 3 | gameplan |
| `test-coverage-matrix.md` | 4 | test-generation |
| `progress.md` | 5 | implementation |
| `qa-plan.md` | 7 | qa-plan |

## Step-by-Step Procedure

### 1. Inventory Documents

List all `.md` files in `<projects-path>/$ARGUMENTS/`. For each file in the mapping table above, check:

- Does the file exist?
- Does it already have YAML frontmatter (starts with `---` on line 1)?

If a file already has frontmatter with `pipeline_stage` set, **skip it** — it was created with live timing.

### 2. Determine Timestamps per Document

For each document that needs backfilling, try these data sources in priority order:

#### Source A: Git Commit Timestamps (best precision)

For `progress.md`, read its milestone sections. Each milestone section has a `**Commit:** \`SHORT_SHA\`` field. For each commit SHA found:

```bash
git log -1 --format='%aI' <sha>
```

This gives the commit's author date in ISO 8601 format. Use this as `pipeline_mN_completed_at` for the corresponding milestone.

#### Source B: Document Header Dates (day-level precision)

Most documents have a header like `> **Date:** February 5, 2026`. Parse this date and format as `YYYY-MM-DDT00:00:00-0600` (use local timezone offset from `date +%z`).

Use this as `pipeline_completed_at`.

#### Source C: Approval Checklist Dates

For `architecture-proposal.md` and `gameplan.md`, read the Approval Checklist section. The `### Date:` field contains the approval date. Parse and format as ISO 8601.

Use this as `pipeline_approved_at`.

#### Source D: File Modification Timestamps (last resort)

If no other source is available:

```bash
stat -f '%Sm' -t '%Y-%m-%dT%H:%M:%S' "<projects-path>/$ARGUMENTS/<filename>" && date +%z
```

Combine the two outputs (timestamp + timezone offset) for the `pipeline_completed_at`.

### 3. Write Frontmatter

For each document, prepend a YAML frontmatter block. Use the Edit tool to insert at the top of the file.

**Standard documents** (prd.md, discovery-report.md, test-coverage-matrix.md, qa-plan.md):

```yaml
---
pipeline_stage: <N>
pipeline_stage_name: "<name>"
pipeline_project: "$ARGUMENTS"
pipeline_completed_at: "<timestamp>"
pipeline_backfilled: true
pipeline_backfill_source: "<source description>"
---
```

Note: `pipeline_started_at` is **omitted** — it cannot be recovered from backfill sources.

**Documents with approval** (architecture-proposal.md, gameplan.md):

```yaml
---
pipeline_stage: <N>
pipeline_stage_name: "<name>"
pipeline_project: "$ARGUMENTS"
pipeline_completed_at: "<timestamp>"
pipeline_approved_at: "<approval timestamp>"
pipeline_backfilled: true
pipeline_backfill_source: "<source description>"
---
```

**progress.md** (per-milestone timing):

```yaml
---
pipeline_stage: 5
pipeline_stage_name: implementation
pipeline_project: "$ARGUMENTS"
pipeline_m1_completed_at: "<timestamp from commit>"
pipeline_m2_completed_at: "<timestamp from commit>"
pipeline_backfilled: true
pipeline_backfill_source: "git commit timestamps"
---
```

### 4. Backfill Source Descriptions

Use these descriptions for the `pipeline_backfill_source` field:

| Source | Description |
|--------|-------------|
| Git commit | `"git commit <short-sha>"` |
| Document header date | `"document header date"` |
| Approval checklist date | `"approval checklist date"` |
| File modification time | `"file modification timestamp"` |

If multiple sources were used for different fields, use the primary source.

## What NOT To Do

- **Do not fabricate timestamps.** If no source exists, omit the field.
- **Do not overwrite existing frontmatter.** Skip documents that already have `pipeline_stage` in their frontmatter.
- **Do not modify document content below the frontmatter.** Only prepend/update the YAML block.
- **Do not set `pipeline_started_at` on backfilled documents.** Start times are unrecoverable.

## When You're Done

Tell the user:
1. Which documents were backfilled (and which were skipped)
2. What data sources were used for each document
3. Any documents where no timestamp could be determined
4. **Remind them:** "Backfilled documents have `pipeline_backfilled: true` to distinguish them from live-captured timestamps. Run `/metrics $ARGUMENTS` to see the computed timing data."
