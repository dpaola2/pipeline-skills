---
name: create-pr
description: "Push the implementation branch and create a PR against the default branch with a generated summary from project artifacts."
disable-model-invocation: true
argument-hint: "<project-slug>"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Edit
  - Write
---

# Create PR

You **push the implementation branch and create a GitHub pull request** against the default branch (from the target repo's `PIPELINE.md`) with a summary generated from the project's pipeline artifacts. This is the delivery step after all pipeline stages are complete.

This skill runs post-flight checks (if configured in `PIPELINE.md`), reads project artifacts, generates a PR summary, and runs git/gh commands.

## Inputs

- `<projects-path>/$ARGUMENTS/progress.md` — milestone table, commit SHAs, test counts, files summary
- `<projects-path>/$ARGUMENTS/qa-plan.md` — manual test scenario count, known limitations
- `<projects-path>/$ARGUMENTS/gameplan.md` — project overview, milestone descriptions
- `<projects-path>/$ARGUMENTS/prd.md` — project name and level (from header)

## Pre-Flight Checks (MANDATORY)

Run ALL of these checks before doing anything else. If any check fails, **STOP** and report the issue to the user.

First, read `pipeline.md` to determine the primary repository path and the **projects path** (from Work Directory → Projects), then read `PIPELINE.md` in that repo to determine the branch prefix and PR base branch.

### Check 1: All Milestones Complete

Read `<projects-path>/$ARGUMENTS/progress.md` and check the **Milestone Status** table.

- If ALL milestones are marked **Complete** → proceed.
- If ANY milestone is still **Pending** or **In Progress** → **STOP**:

> "Not all milestones are complete. Remaining: [list pending milestones]. Complete them before creating a PR."

### Check 2: QA Plan Exists

Verify `<projects-path>/$ARGUMENTS/qa-plan.md` exists.

- If it exists → proceed.
- If missing → **STOP**:

> "No QA plan found. Run `/stage7-qa-plan $ARGUMENTS` first."

### Check 3: Branch Exists in Primary Repo

In the primary repository (path from `pipeline.md`), verify the project branch exists:

```bash
cd <primary-repo-path> && git branch --list '<branch-prefix>$ARGUMENTS'
```

If the branch does not exist, **STOP**:

> "The branch `<branch-prefix>$ARGUMENTS` does not exist in the primary repository."

### Check 4: Clean Working Tree

```bash
cd <primary-repo-path> && git status --porcelain
```

If there are uncommitted changes, **STOP**:

> "The primary repository has uncommitted changes. Please commit or stash them before creating a PR."

### Check 5: No Existing PR

Check whether a PR already exists for this branch:

```bash
cd <primary-repo-path> && gh pr list --head '<branch-prefix>$ARGUMENTS' --state open --json number,url
```

If a PR already exists, **STOP** and show its URL:

> "A PR already exists for this branch: [URL]. To update the PR description, close the existing PR first or update it manually."

## Step-by-Step Procedure

### 1. Run Post-Flight Checks

Read the `PIPELINE.md` from the primary repository. If it has a **Post-Flight Checks** section, run them now. If the section doesn't exist, skip to step 2.

**Ensure you're on the project branch** in the primary repo before running checks:

```bash
cd <primary-repo-path> && git checkout <branch-prefix>$ARGUMENTS
```

**Phase A: Auto-fix checks**

Run each check marked "Auto-fix? Yes" in the table. For example:

```bash
cd <primary-repo-path> && <auto-fix-command>
```

After each auto-fix command, check `git status --porcelain` for changes. If files were modified:

1. Review the changes briefly (make sure they're style fixes, not semantic changes)
2. Stage and commit them:

```bash
cd <primary-repo-path> && git add -A && git commit -m "Post-flight: auto-fix style issues"
```

3. Re-run the same check without the fix flag to confirm it's clean. If it still reports issues, **STOP** and report them to the user.

**Phase B: Report-only checks**

Run each check marked "Auto-fix? No" in the table:

```bash
cd <primary-repo-path> && <check-command>
```

For each check:
- If the check passes (exit code 0, no concerning output) → continue
- If the check fails and is marked "Blocking? Yes" → **STOP** and report the findings to the user:

> "Post-flight check '[Check name]' failed with blocking findings:\n[output]\nPlease fix these issues before creating the PR."

- If the check fails and is marked "Blocking? No" → record the findings to include in the PR body, but continue

**Phase C: Record results**

Build a post-flight summary to include in the PR body later:
- Which checks ran
- Which auto-fixes were applied (and the commit SHA)
- Any non-blocking findings

### 2. Read Project Artifacts

Read these files and extract the data needed for the PR summary:

1. **`<projects-path>/$ARGUMENTS/progress.md`** — extract:
   - Milestone status table (milestone names, descriptions, commit SHAs)
   - "Project Complete" section (total commits, test count, files created/modified)

2. **`<projects-path>/$ARGUMENTS/qa-plan.md`** — extract:
   - Count of manual test scenarios (QA-NNN entries in Section 4)
   - Key feature areas covered (section headings under Section 4)
   - Known limitations count and list (Section 6)

3. **`<projects-path>/$ARGUMENTS/gameplan.md`** — extract:
   - Project overview (first paragraph under "Project Overview" or "Overview")
   - This becomes the PR summary description

4. **`<projects-path>/$ARGUMENTS/prd.md`** — extract:
   - Feature name from the document title
   - Project level from the header table

### 3. Quality Analysis

Capture code complexity metrics for the project branch. This data populates the Code Quality section in the PR body and project-level quality frontmatter in progress.md.

**Step A: Check for Complexity Analysis configuration**

Read `PIPELINE.md` in the primary repository and look for a **Complexity Analysis** section.

- If the section **does not exist** → skip this entire step silently. Set `HAS_QUALITY_DATA` to false. Proceed to Step 4.
- If the section **exists** → extract: tool name, score command, per-file command, repo baseline command, hotspot threshold, file glob, and exclude pattern.

**Step B: Run repo baseline**

```bash
cd <primary-repo-path> && <repo-baseline-command>
```

Parse the output to extract the repo-wide flog/method average. Store as `repo_baseline_flog_avg`.

**Step C: Get all pipeline-touched files**

```bash
cd <primary-repo-path> && git diff --name-only origin/<pr-base-branch>...<branch-prefix>$ARGUMENTS -- '<file-glob>'
```

Filter out any files matching the exclude pattern (e.g., files under `spec/`). If no files remain after filtering, set `HAS_QUALITY_DATA` to false and skip to Step 4.

**Step D: Run score command per file**

For each file from Step C, run the score command (replacing `{file}` with the file path):

```bash
cd <primary-repo-path> && <score-command>
```

Parse the output. Flog score output format is: `N: flog total, N: flog/method average`. Collect all per-file averages.

Compute:
- `project_flog_avg`: mean of all per-file averages (rounded to 1 decimal)
- `project_flog_max`: highest individual method score across all files
- `files_analyzed`: count of files

**Step E: Compute delta and verdict**

- `delta` = `project_flog_avg` - `repo_baseline_flog_avg` (rounded to 1 decimal)
- `verdict`:
  - `delta <= -1.0` → `"below_baseline"` (new code is less complex than repo average)
  - `delta >= 1.0` → `"above_baseline"` (new code is more complex than repo average)
  - otherwise → `"at_baseline"` (within ±1.0 of repo average)

**Step F: Identify hotspot methods**

For each file from Step C, run the per-file command:

```bash
cd <primary-repo-path> && <per-file-command>
```

Collect all methods scoring above the hotspot threshold. Keep the top 5 by score. Store as `hotspots` list with: score, method name, file path.

Set `HAS_QUALITY_DATA` to true.

**Failure handling:** If any command fails (non-zero exit, unparseable output), log a warning to the console, set `HAS_QUALITY_DATA` to false, and continue. Never block PR creation on a quality analysis failure.

### 4. Generate PR Title

The PR title should be:
- Derived from the feature name in the PRD/gameplan
- Under 70 characters
- Descriptive of what the feature does (not implementation details)

Example: `Add Deficient Line Item Report`

### 5. Generate PR Body

Assemble the PR body using this structure:

```markdown
## Summary

[2-3 sentence description from gameplan project overview. What does this feature do? Who is it for?]

### Milestones

| Milestone | Description | Commit |
|-----------|-------------|--------|
[One row per milestone from progress.md, including QA Test Data if present]

### Test Results

- **[N]** automated tests, **0** failures
- Test files: [comma-separated list of spec files]

### Post-Flight Checks

[If post-flight checks ran, include results from Step 1:]

| Check | Result |
|-------|--------|
| [Check name] | Passed / Auto-fixed (commit `SHA`) / [N] non-blocking findings |

[If no Post-Flight Checks section in PIPELINE.md, omit this section entirely.]

### Code Quality

[Include only if `HAS_QUALITY_DATA` is true. Omit this section entirely if quality analysis was skipped or failed.]

| Metric | Value |
|--------|-------|
| **Project flog avg** | [project_flog_avg] |
| **Repo baseline avg** | [repo_baseline_flog_avg] |
| **Delta** | [delta] ([verdict]) |
| **Files analyzed** | [files_analyzed] |

<details>
<summary>Per-milestone breakdown</summary>

| Milestone | Flog Avg | Flog Max | Max Method | Files |
|-----------|----------|----------|------------|-------|
[One row per milestone, reading pipeline_quality_mN_* from progress.md frontmatter]

</details>

[Include the following only if there are methods above the hotspot threshold:]

<details>
<summary>Hotspots (above threshold [threshold])</summary>

| Score | Method | File |
|-------|--------|------|
[Top 5 methods above threshold from Step 3F]

</details>

### Files Changed

- **[N]** new files ([brief breakdown: migration, model, service, etc.])
- **[N]** modified files ([brief breakdown])

### QA Plan

**[N]** manual test scenarios covering [list key feature areas from qa-plan.md Section 4 headings].

Full QA plan: `<projects-path>/[slug]/qa-plan.md`

### Known Limitations

[Bulleted list of the most significant items from qa-plan.md Section 6. Keep it to the top 5-7 items. If none, write "None."]

---

Generated by the Agent Pipeline
```

### 6. Push the Branch

```bash
cd <primary-repo-path> && git push -u origin <branch-prefix>$ARGUMENTS
```

If the push fails, **STOP** and report the error to the user.

### 7. Create the PR

```bash
cd <primary-repo-path> && gh pr create \
  --base <pr-base-branch> \
  --head "<branch-prefix>$ARGUMENTS" \
  --title "[title]" \
  --body "$(cat <<'EOF'
[generated PR body]
EOF
)"
```

Use a HEREDOC for the body to preserve formatting.

### 8. Update Progress File with PR Timing

After the PR is created, capture the timestamp and PR URL, then update `<projects-path>/$ARGUMENTS/progress.md` frontmatter:

1. Capture the timestamp: `date +"%Y-%m-%dT%H:%M:%S%z"` — save as PR_CREATED_AT.
2. Extract the PR URL from the `gh pr create` output.
3. If progress.md has YAML frontmatter (between `---` markers), use the Edit tool to add these fields before the closing `---`:

```yaml
pipeline_pr_created_at: "<PR_CREATED_AT>"
pipeline_pr_url: "<PR_URL>"
```

4. If `HAS_QUALITY_DATA` is true, also add project-level quality summary fields to the frontmatter:

```yaml
pipeline_quality_flog_avg: [project_flog_avg]
pipeline_quality_repo_baseline_flog_avg: [repo_baseline_flog_avg]
pipeline_quality_delta: [delta]
pipeline_quality_verdict: "[verdict]"
pipeline_quality_files_analyzed: [files_analyzed]
```

If progress.md has no frontmatter, prepend one with the stage 5 fields plus the PR fields (and quality fields if applicable).

### 9. Generate Metrics Report

After updating the PR timing, generate the project metrics report. This provides an immediate timing summary for every completed project.

1. Read all `.md` files in `<projects-path>/$ARGUMENTS/` and extract YAML frontmatter from each (lines between `---` markers). Parse `pipeline_started_at`, `pipeline_completed_at`, `pipeline_approved_at`, `pipeline_m*_started_at`, `pipeline_m*_completed_at`, `pipeline_pr_created_at`, `pipeline_pr_url`, and `pipeline_backfilled` fields.

2. Enrich with git data — get PR merge status:

```bash
cd <primary-repo-path> && gh pr list --head '<branch-prefix>$ARGUMENTS' --state all --json mergedAt,createdAt,url --limit 1
```

3. Compute metrics:
   - **Stage durations**: `completed_at - started_at` for each stage (where both exist)
   - **Human review time**: `approved_at - completed_at` for architecture and gameplan
   - **Per-milestone deltas**: time between consecutive milestone `completed_at` timestamps
   - **Implementation window**: first milestone `completed_at` → last milestone `completed_at`
   - **PR review time**: PR `createdAt` → PR `mergedAt` (if merged)
   - **Total lead time**: earliest `started_at` (or `completed_at`) → PR merge (or latest timestamp)

4. Write the report to `<projects-path>/$ARGUMENTS/metrics.md` with:
   - Stage timeline table (stage, document, started, completed, duration, wait)
   - Implementation breakdown table (per-milestone completed_at, delta from prior, commit SHA)
   - Summary table (total lead time, active agent time, human review time, PR review time)
   - Data quality notes (which timestamps are live vs backfilled)

Format durations as: `Xm` (under 1h), `Xh Ym` (1-24h), `Xd Yh` (over 24h). Use `—` for unavailable data.

## What NOT To Do

- **Do not write implementation code.** The only modifications this skill makes are auto-fix commits from post-flight checks.
- **Do not push to the default branch directly.** Always push to the `<branch-prefix>$ARGUMENTS` branch.
- **Do not merge the PR.** Only create it. Human merges after review.
- **Do not force-push.** If the push fails, stop and ask the user.
- **Do not create the PR if one already exists.** Pre-flight Check 5 catches this.
- **Do not include test data credentials in the PR body.** Those are in the QA plan, not the PR.

## When You're Done

Tell the user:
1. The PR URL
2. Summary stats: milestones, test count, files changed
3. **Remind them:** "Share the QA plan (`<projects-path>/$ARGUMENTS/qa-plan.md`) with the tester when QA begins."
