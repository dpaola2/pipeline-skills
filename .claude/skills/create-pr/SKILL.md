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

### 3. Generate PR Title

The PR title should be:
- Derived from the feature name in the PRD/gameplan
- Under 70 characters
- Descriptive of what the feature does (not implementation details)

Example: `Add Deficient Line Item Report`

### 4. Generate PR Body

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

### 5. Push the Branch

```bash
cd <primary-repo-path> && git push -u origin <branch-prefix>$ARGUMENTS
```

If the push fails, **STOP** and report the error to the user.

### 6. Create the PR

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
