# Pipeline Configuration — OrangeQC

> Maps this pipeline instance to target repositories for OrangeQC.
> To activate: `cp pipelines/orangeqc.md pipeline.md`

---

## Target Repositories

(REQUIRED — where does the code live?)

| Repository | Path | Purpose |
|-----------|------|---------|
| Primary | `/Users/dave/projects/orangeqc/orangeqc` | Rails web app + API |
| iOS | `/Users/dave/projects/orangeqc/ios` | iOS app (Swift) |
| Android | `/Users/dave/projects/orangeqc/android-v3` | Android app (Kotlin) |
| API Docs | `/Users/dave/projects/orangeqc/apiv4` | API documentation |

> Each repository listed here should have a `PIPELINE.md` at its root with repo-specific config
> (branch conventions, framework, directory structure, test commands, guardrails, and any optional
> sections like API conventions or multi-tenant security).
>
> The primary repository's `PIPELINE.md` is the one skills read most — it has the framework details,
> directory structure, and implementation order that drive Stages 1-7.

---

## Project Tracker

(OPTIONAL — only if using an external tracker)

| Setting | Value |
|---------|-------|
| **Tool** | Linear |
| **Workspace** | OrangeQC |

---

## Work Directory

(REQUIRED — where do project artifacts and inbox files live?)

| Setting | Path |
|---------|------|
| **Projects** | `/Users/dave/projects/orangeqc/pipeline-projects/` |
| **Inbox** | `/Users/dave/projects/orangeqc/pipeline-projects/inbox/` |
