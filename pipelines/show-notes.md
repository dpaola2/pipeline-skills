# Pipeline Configuration — Show Notes

> Maps this pipeline instance to target repositories for Show Notes.
> To activate: `cp pipelines/show-notes.md pipeline.md`

---

## Target Repositories

(REQUIRED — where does the code live?)

| Repository | Path | Purpose |
|-----------|------|---------|
| Primary | `/Users/dave/projects/show-notes` | Rails web app |

> Each repository listed here should have a `PIPELINE.md` at its root with repo-specific config
> (branch conventions, framework, directory structure, test commands, guardrails, and any optional
> sections like API conventions or multi-tenant security).
>
> The primary repository's `PIPELINE.md` is the one skills read most — it has the framework details,
> directory structure, and implementation order that drive Stages 1-7.

---

## Project Tracker

(OPTIONAL — only if using an external tracker)

_None configured._

---

## Work Directory

(REQUIRED — where do project artifacts and inbox files live?)

| Setting | Path |
|---------|------|
| **Projects** | `/Users/dave/projects/show-notes/pipeline-projects/` |
| **Inbox** | `/Users/dave/projects/show-notes/pipeline-projects/inbox/` |
