# Pipeline Configs

This directory holds **named pipeline configs** — one per product. Each config maps the pipeline to a product's target repositories, project tracker, and work directory.

## How It Works

Pipeline configs contain machine-specific absolute paths (repo locations, project directories). They're gitignored — each person generates their own.

### Creating a config

**Option A (recommended):** Run `/setup-repo` in Claude Code:

```
/setup-repo /path/to/your/repo my-product
```

This auto-detects the framework, generates `PIPELINE.md` in the target repo, creates `pipelines/my-product.md` here, and optionally activates it.

**Option B (manual):** Copy `pipeline.md.example` from the repo root and fill in your paths:

```bash
cp pipeline.md.example pipelines/my-product.md
# Edit pipelines/my-product.md with your paths
```

### Activating a config

The pipeline always reads `pipeline.md` (in the repo root) as the active config. To switch products:

```bash
cp pipelines/my-product.md pipeline.md
```

### File naming

Use kebab-case product names: `my-product.md`, `orangeqc.md`, `show-notes.md`.

### What's in a config

See `pipeline.md.example` for the full format. Three sections:

1. **Target Repositories** — paths to the code repos this product uses
2. **Project Tracker** — Linear, GitHub Issues, or none
3. **Work Directory** — where project artifacts (PRDs, gameplans, progress) and inbox files live
