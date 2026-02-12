---
name: quality
description: "Generate a code quality report for a pipeline project by reading quality frontmatter from progress.md and optionally running fresh analysis."
disable-model-invocation: true
argument-hint: "<project-slug>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
---

# Quality

You **generate a code quality report** for a pipeline project by reading the `pipeline_quality_*` frontmatter from `progress.md`, optionally running fresh analysis against the repo baseline, and writing a quality report.

## Inputs

- `<projects-path>/$ARGUMENTS/progress.md` — quality frontmatter from Stage 5 implementation milestones
- The primary repository (path from `pipeline.md`) — for running fresh baseline and per-file analysis
- `PIPELINE.md` in the primary repository — for Complexity Analysis tool configuration

## Before You Start

1. Read `pipeline.md` to get the primary repository path and the **projects path** (from Work Directory → Projects).
2. Verify `<projects-path>/$ARGUMENTS/` exists and contains `progress.md`.
3. Read `PIPELINE.md` in the primary repository and look for a **Complexity Analysis** section.

If `progress.md` does not exist, **STOP**:

> "No progress file found for `$ARGUMENTS`. Run Stage 5 implementation first."

## Step-by-Step Procedure

### 1. Read Quality Frontmatter

Read `<projects-path>/$ARGUMENTS/progress.md` and extract YAML frontmatter. Parse all `pipeline_quality_*` fields:

**Per-milestone fields** (pattern: `pipeline_quality_mN_*`):
- `pipeline_quality_mN_flog_avg`
- `pipeline_quality_mN_flog_max`
- `pipeline_quality_mN_flog_max_method`
- `pipeline_quality_mN_files_analyzed`

**Project summary fields** (written by `/create-pr`):
- `pipeline_quality_flog_avg`
- `pipeline_quality_repo_baseline_flog_avg`
- `pipeline_quality_delta`
- `pipeline_quality_verdict`
- `pipeline_quality_files_analyzed`

If **no** `pipeline_quality_*` fields exist in the frontmatter, **STOP** with a helpful message:

> "No quality data found in progress.md for `$ARGUMENTS`. Quality metrics are captured during Stage 5 implementation when `PIPELINE.md` has a Complexity Analysis section.
>
> To add quality data to an existing project, a future `/backfill-quality` skill (ROAD-20 v2) will support checking out old branches and running analysis retroactively."

### 2. Run Current Repo Baseline

If `PIPELINE.md` has a Complexity Analysis section, run the repo baseline command for a fresh comparison:

```bash
cd <primary-repo-path> && <repo-baseline-command>
```

Parse the output to extract the current repo-wide flog/method average. Store as `current_baseline`.

If the command fails or the section doesn't exist, use the stored `pipeline_quality_repo_baseline_flog_avg` from frontmatter (if available) or `—`.

### 3. Fresh Per-File Analysis (Optional)

Check if the project branch still exists:

```bash
cd <primary-repo-path> && git branch --list 'pipeline/$ARGUMENTS'
```

If the branch exists:
1. Check out the branch: `git checkout pipeline/$ARGUMENTS`
2. Get all pipeline-touched files: `git diff --name-only origin/<pr-base-branch>...pipeline/$ARGUMENTS -- '<file-glob>'` (exclude spec/)
3. Run the score command on each file to get fresh per-file scores
4. Run the per-file command on files with the highest scores to identify current hotspot methods
5. Check out the previous branch: `git checkout -`

If the branch does not exist (already merged/deleted), note this in the report and rely solely on frontmatter data.

**Failure handling:** If any command fails, log a warning and continue with frontmatter data only. Never fail the report because of a stale branch.

### 4. Write Quality Report

Write to `<projects-path>/$ARGUMENTS/quality.md`:

```markdown
# Code Quality Report — $ARGUMENTS

> Generated: <current date/time>
> Tool: [tool name from PIPELINE.md, or from frontmatter context]
> Hotspot threshold: [threshold from PIPELINE.md, or "unknown"]

## Quality Scorecard

| Metric | Value |
|--------|-------|
| **Project flog avg** | [from frontmatter or fresh analysis] |
| **Repo baseline avg** | [current_baseline or stored baseline] |
| **Delta** | [delta] |
| **Verdict** | [verdict] |
| **Total files analyzed** | [files_analyzed] |

## Per-Milestone Breakdown

| Milestone | Flog Avg | Flog Max | Max Method | Files |
|-----------|----------|----------|------------|-------|
| M1 | [m1_flog_avg] | [m1_flog_max] | [m1_flog_max_method] | [m1_files_analyzed] |
| M2 | ... | ... | ... | ... |
[One row per milestone with quality data]

## Hotspots

[Top 5 methods above the hotspot threshold, from fresh analysis if available, otherwise from per-milestone flog_max data]

| Score | Method | Source |
|-------|--------|--------|
| [score] | [ClassName#method_name] | [file path or milestone] |

[If no methods above threshold: "No methods above the hotspot threshold of [threshold]."]

## Baseline Context

| Metric | Value |
|--------|-------|
| **Stored baseline** (at PR time) | [pipeline_quality_repo_baseline_flog_avg] |
| **Current baseline** | [current_baseline or "—"] |
| **Baseline drift** | [current - stored, or "—"] |

> Baseline drift shows how the repo average has changed since the PR was created. A rising baseline means overall repo complexity is increasing.

## Data Quality Notes

- [Note whether data is from frontmatter only or includes fresh analysis]
- [Note if project branch was available for fresh analysis]
- [Note any milestones missing quality data]
- [Note if baseline was live or stored]
```

### 5. Handle Missing Data

- If a per-milestone field is missing, display `—` in the table
- If project summary fields are missing (no `/create-pr` run yet), compute from per-milestone data if possible
- If the branch is gone, note "Fresh analysis unavailable — branch merged/deleted" and use frontmatter only
- Use `—` for any metric that cannot be computed

### 6. Commit Pipeline Artifacts

Commit the quality report to version control in the projects directory:

1. Check if the projects directory is inside a git repository:
   ```bash
   cd <projects-path> && git rev-parse --git-dir 2>/dev/null
   ```
   If this command fails (not a git repo), skip this step silently.

2. Stage and commit:
   ```bash
   cd <projects-path> && git add $ARGUMENTS/quality.md && git commit -m "pipeline: quality for $ARGUMENTS"
   ```
   If nothing to commit (no changes detected), skip silently.

## What NOT To Do

- **Do not modify any project documents.** Only write `quality.md`.
- **Do not modify source code.** This is a read-only analysis tool.
- **Do not fabricate scores.** Use `—` for missing data.
- **Do not run pipeline stages.** This is a standalone reporting tool.
- **Do not leave the repo on a different branch.** Always `git checkout -` after analysis.

## When You're Done

Tell the user:

1. The quality report has been written to `<projects-path>/$ARGUMENTS/quality.md`
2. Summarize key metrics: project flog avg, delta from baseline, verdict
3. Highlight any hotspots above threshold
4. Note data quality limitations (frontmatter vs fresh, branch availability)
