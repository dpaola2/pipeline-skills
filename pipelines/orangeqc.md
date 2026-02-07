# Pipeline Configuration — OrangeQC

> Maps this pipeline instance to target repositories for the OrangeQC product.
> To activate: `cp pipelines/orangeqc.md pipeline.md`

---

## Target Repositories

(REQUIRED — where does the code live?)

| Repository | Path | Purpose |
|-----------|------|---------|
| Primary | `~/projects/orangeqc/orangeqc/` | Rails web app + API backend |
| API docs | `~/projects/orangeqc/apiv4/` | Endpoint documentation |
| iOS | `~/projects/orangeqc/orangeqc-ios/` | iOS mobile app |
| Android | `~/projects/orangeqc/orangeqc-android/` | Android mobile app |

> Each repository listed here should have a `PIPELINE.md` at its root with repo-specific config (branch conventions, framework, directory structure, test commands, guardrails, and any optional sections like API conventions or multi-tenant security).
>
> The primary repository's `PIPELINE.md` is the one skills read most — it has the framework details, directory structure, and implementation order that drive Stages 1-7.

---

## Project Tracker

(OPTIONAL — only if using an external tracker)

| Setting | Value |
|---------|-------|
| **Tool** | Linear |
| **Workspace** | OrangeQC |
