---
name: setup-repo
description: "Set up a new repository for the agent pipeline. Explores the repo, generates PIPELINE.md, creates a pipeline config in pipelines/, and optionally activates it."
disable-model-invocation: true
argument-hint: "<repo-path> [product-name]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Task
  - AskUserQuestion
---

# Setup Repo

You **onboard a new repository** into the agent pipeline by exploring its structure, generating a `PIPELINE.md` in the target repo, and creating a pipeline config in the `pipelines/` directory of this repo. This is the entry point for adding a new product to the pipeline.

## Inputs

- `$ARGUMENTS` — `<repo-path>` (required) and optional `[product-name]`
- `pipelines/` directory — existing product configs (to check for conflicts)
- The OrangeQC `PIPELINE.md` at `~/projects/orangeqc/orangeqc/PIPELINE.md` — as a reference for structure (read for format only, not content)

## Outputs

- `PIPELINE.md` in the target repository (repo-specific config)
- `pipelines/<product-name>.md` in this repo (pipeline config mapping repos)
- Optionally: updated `pipeline.md` (if the user activates this product)

## Argument Parsing

Parse `$ARGUMENTS`:
- Split on whitespace. The first token is `<repo-path>`. The second token (if present) is `[product-name]`.
- If `product-name` is not provided, derive it from the repo directory name (e.g., `/Users/dave/projects/show-notes/` → `show-notes`).
- Normalize the product name to kebab-case.

## Pre-Flight Checks (MANDATORY)

### Check 1: Repo Path Exists

Verify the repo path exists and is a directory:

```bash
ls -d <repo-path>
```

If it doesn't exist, **STOP**:

> "The path `<repo-path>` does not exist. Provide a valid repository path."

### Check 2: Is a Git Repo

```bash
git -C <repo-path> rev-parse --git-dir
```

If it fails, **STOP**:

> "The path `<repo-path>` is not a git repository."

### Check 3: No Conflicting Pipeline Config

Check whether `pipelines/<product-name>.md` already exists in this repo.

If it exists, ask the user:

> "A pipeline config for `<product-name>` already exists at `pipelines/<product-name>.md`. Overwrite it?"

If they say no, **STOP**.

### Check 4: Existing PIPELINE.md

Check whether `<repo-path>/PIPELINE.md` already exists.

If it exists, ask the user:

> "A `PIPELINE.md` already exists in `<repo-path>`. Overwrite it, or skip PIPELINE.md generation and only create the pipeline config?"

## Step-by-Step Procedure

### Step 1: Detect Default Branch

Try these approaches in order:

```bash
git -C <repo-path> symbolic-ref refs/remotes/origin/HEAD 2>/dev/null
```

This returns something like `refs/remotes/origin/main`. Extract the branch name (e.g., `main`).

If that fails (no remote configured), fall back to:

```bash
git -C <repo-path> branch --show-current
```

Store the result as `default-branch`.

### Step 2: Detect Framework and Stack

Use the Task tool with an Explore agent to analyze the repository. The agent should detect:

**Language & Framework:**
- `Gemfile` → Ruby/Rails (read for Rails version, Ruby version from `.ruby-version`)
- `package.json` → Node.js (check for framework: Next.js, Express, etc.)
- `requirements.txt` or `pyproject.toml` → Python (check for Django, Flask, FastAPI)
- `go.mod` → Go
- `Cargo.toml` → Rust
- `Package.swift` or `*.xcodeproj` → iOS/Swift
- `build.gradle` or `build.gradle.kts` → Android/Kotlin

**For Rails repos, also detect:**
- Test framework: `rspec-rails` (→ RSpec) or `minitest` (→ Minitest) in Gemfile
- CSS: `tailwindcss-rails`, `bootstrap`, `sassc-rails`
- JS bundling: `importmap-rails`, `jsbundling-rails` (esbuild/rollup/webpack)
- Asset pipeline: `propshaft`, `sprockets`
- Database: `pg` (PostgreSQL), `sqlite3` (SQLite), `mysql2` (MySQL) — check both Gemfile and `config/database.yml`
- Serialization: `blueprinter`, `jbuilder`, `active_model_serializers`, `alba`
- Deploy: `kamal`, `capistrano`, presence of `Procfile` (Heroku)
- Background jobs: `sidekiq`, `solid_queue`, `good_job`, `delayed_job`

**For all repos, detect:**
- Test command: `.rspec` file → `bundle exec rspec`, `pytest.ini`/`conftest.py` → `pytest`, `jest.config.*` → `npx jest`
- Conventions file: `CLAUDE.md`, `AGENTS.md`, `CONVENTIONS.md`, `CONTRIBUTING.md`
- CI config: `.github/workflows/`, `.circleci/`, `Jenkinsfile`
- Linters and security tools from CI config and dependency files
- Directory structure: `app/models/`, `app/controllers/`, `app/services/`, `app/views/`, `app/jobs/`, `app/mailers/`, `spec/`, `test/`, `src/`, `lib/`

### Step 3: Present Findings for Confirmation

Use `AskUserQuestion` to present the detected configuration and get corrections. Show the key findings and ask the user to confirm or correct:

Questions to ask:
1. "I detected **[framework] [version]** with **[test framework]**, **[CSS]**, **[database]**. Default branch: **[branch]**. Is this correct?"
2. "Which optional sections apply to this repo?" (multi-select):
   - API Conventions (versioned API endpoints consumed by other clients)
   - Multi-Tenant Security (multiple organizations/accounts in one database)
   - Backwards Compatibility (old clients that can't be force-updated)
   - Feature Flags (feature flag system for gradual rollout)
3. "What project tracker do you use for this product?" (options: Linear, GitHub Issues, None)

### Step 4: Detect Post-Flight Checks

From the CI config and dependency files, suggest post-flight checks:

| Tool | Detect via | Command | Auto-fix? |
|------|-----------|---------|-----------|
| StandardRB | `standard` in Gemfile | `bundle exec standardrb --fix` | Yes |
| RuboCop | `rubocop` in Gemfile | `bundle exec rubocop -A` | Yes |
| Brakeman | `brakeman` in Gemfile | `bundle exec brakeman -q --no-pager` | No |
| bundler-audit | `bundler-audit` in Gemfile | `bundle exec bundler-audit` | No |
| ESLint | `eslint` in package.json | `npx eslint --fix .` | Yes |
| ripsecrets | presence of `.ripsecrets.toml` or CI config | `git diff origin/<default-branch>...HEAD -- . \| ripsecrets` | No |

Present the suggested checks to the user. They can add, remove, or modify.

### Step 5: Detect Directory Structure

Use Glob to find which standard directories exist in the repo:

```
app/models/
app/controllers/
app/views/
app/services/
app/helpers/
app/javascript/controllers/
app/jobs/
app/mailers/
app/blueprints/
app/serializers/
spec/models/
spec/requests/
spec/controllers/
spec/services/
spec/jobs/
spec/mailers/
spec/system/
spec/features/
spec/factories/
test/
src/
lib/tasks/pipeline/
```

Include only directories that actually exist.

### Step 6: Generate PIPELINE.md

Write `<repo-path>/PIPELINE.md` following the standard structure. Use the OrangeQC `PIPELINE.md` as a structural reference (read it for section ordering and formatting).

**REQUIRED sections** (always include):
- Repository Details (with detected default branch, test command, branch prefix `pipeline/`, PR base branch = default branch)
- Platforms (single row for the detected platform)
- Framework & Stack (detected values)
- Directory Structure (detected paths)
- Implementation Order (standard for the detected framework)
- Guardrails (standard rules: no direct commits to default branch, no push without request, no destructive operations)

**OPTIONAL sections** (include only if the user confirmed they apply in Step 3):
- API Conventions
- Multi-Tenant Security
- Backwards Compatibility
- Feature Flags

**Post-Flight Checks** (include if any were confirmed in Step 4).

### Step 7: Generate Pipeline Config

Write `pipelines/<product-name>.md` in this repo:

```markdown
# Pipeline Configuration — [Product Name]

> Maps this pipeline instance to target repositories for the [Product Name] project.
> To activate: `cp pipelines/<product-name>.md pipeline.md`

---

## Target Repositories

(REQUIRED — where does the code live?)

| Repository | Path | Purpose |
|-----------|------|---------|
| Primary | `<repo-path>` | [Detected purpose: e.g., "Rails web app", "Node.js API", "iOS app"] |

---

## Project Tracker

(OPTIONAL — only if using an external tracker)

| Setting | Value |
|---------|-------|
| **Tool** | [From Step 3: Linear, GitHub Issues, or None] |
| **Workspace** | [Product name or workspace name] |
```

If the user mentioned additional repos (API docs, mobile, etc.), add rows to the Target Repositories table. For a single-repo project, only include the Primary row.

### Step 8: Offer Activation

Ask the user:

> "Activate **[product-name]** as the current pipeline target? This will overwrite `pipeline.md` with the [product-name] config."
>
> "Current active product: [read the Active product line from pipeline.md header, or 'unknown']"

If they say yes:
1. Copy `pipelines/<product-name>.md` to `pipeline.md`
2. Update the `Active product:` line in `pipeline.md` to reflect the new product

If they say no, skip. Tell them how to activate later:

> "To activate later: `cp pipelines/<product-name>.md pipeline.md`"

## What NOT To Do

- **Do not modify any source code** in the target repository. Only create `PIPELINE.md`.
- **Do not run tests** in the target repository. Only read files and run git commands.
- **Do not create project directories** (`projects/<slug>/`). This skill sets up the repo, not the project.
- **Do not commit anything** in the target repository. `PIPELINE.md` is created but the user commits it.
- **Do not guess framework details.** If detection is ambiguous, ask the user via `AskUserQuestion`.
- **Do not include OPTIONAL sections that the user didn't confirm.** Fewer sections is better for simple projects.

## When You're Done

Tell the user:

1. **What was created:**
   - `PIPELINE.md` in `<repo-path>` (needs to be committed by the user in that repo)
   - `pipelines/<product-name>.md` in this repo

2. **Whether activated:** "Pipeline is now pointing at [product-name]" or "Pipeline is still pointing at [current product]. To switch: `cp pipelines/<product-name>.md pipeline.md`"

3. **Next steps:**
   - Review and commit `PIPELINE.md` in the target repo
   - Create a project: drop notes in `inbox/` and run `/stage0-prd`
   - Or create `projects/<slug>/prd.md` manually and run `/stage1-discovery <slug>`
