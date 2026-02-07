# Pipeline Configuration

> Platform-specific settings for this pipeline instance.
> Skills read this file first to determine repo locations, branch conventions, and framework details.
> To use this pipeline for a different project, modify this file. Skills and templates are platform-agnostic.
>
> Sections marked REQUIRED apply to every project.
> Sections marked OPTIONAL can be omitted entirely if they don't apply.

---

## Target Repositories

(REQUIRED — where does the code live?)

| Repository | Path | Purpose |
|-----------|------|---------|
| Primary | `~/projects/orangeqc/orangeqc/` | Rails web app + API backend |
| API docs | `~/projects/orangeqc/apiv4/` | Endpoint documentation |
| iOS | `~/projects/orangeqc/orangeqc-ios/` | iOS mobile app |
| Android | `~/projects/orangeqc/orangeqc-android/` | Android mobile app |

---

## Repository Details

(REQUIRED — branch and test config for the primary repository)

| Setting | Value |
|---------|-------|
| **Default branch** | `staging` |
| **Conventions file** | `AGENTS.md` (repo root) |
| **Test command** | `bundle exec rspec` |
| **Test directory** | `spec/` |
| **Branch prefix** | `pipeline/` |
| **PR base branch** | `staging` |

---

## Platforms

(REQUIRED — which platforms does this project target?)

| Platform | Status | Notes |
|----------|--------|-------|
| Web (Rails) | Active | Primary platform — pipeline builds this now |
| iOS | Future | Deferred until test infra matures |
| Android | Future | Deferred until test infra matures |

> Skills use this table to determine which template sections to fill vs. mark N/A.
> For a single-platform project, list only one row.

---

## Framework & Stack

(REQUIRED — language, framework, tools)

| Setting | Value |
|---------|-------|
| **Language** | Ruby |
| **Framework** | Rails |
| **Test framework** | RSpec |
| **ORM** | ActiveRecord |
| **Serialization** | Blueprinter (new code), ActiveModel::Serializers (legacy) |
| **Frontend JS** | Stimulus |
| **CSS** | Tailwind (migrating from legacy stylesheets) |
| **Database** | PostgreSQL |
| **Deploy target** | Heroku |

---

## Directory Structure

(REQUIRED — where things live in the primary repository)

| Purpose | Path |
|---------|------|
| Models | `app/models/` |
| Model concerns | `app/models/concerns/` |
| Controllers | `app/controllers/` |
| Views | `app/views/` |
| Services | `app/services/` |
| Serializers (new) | `app/blueprints/` |
| Serializers (legacy) | `app/serializers/` |
| JavaScript controllers | `app/javascript/controllers/` |
| Background jobs | `app/jobs/` |
| Routes | `config/routes.rb` |
| Migrations | `db/migrate/` |
| Schema | `db/schema.rb` |
| Model specs | `spec/models/` |
| Request specs | `spec/requests/` |
| Controller specs | `spec/controllers/` |
| Service specs | `spec/services/` |
| System specs | `spec/system/` |
| Feature specs | `spec/features/` |
| Factories | `spec/factories/` |
| Seed tasks | `lib/tasks/pipeline/` |

---

## Implementation Order

(RECOMMENDED — natural build sequence when implementing a milestone)

1. Migration(s)
2. Model(s) — with validations, associations, scopes
3. Service(s) — business logic
4. Route(s)
5. Controller(s)
6. Views (ERB)
7. Stimulus controller(s)

---

## API Conventions

(OPTIONAL — only if the project has an API)

| Convention | Value |
|-----------|-------|
| **Response envelope** | Resource-keyed: `{ "tickets": [...] }` (collections), `{ "ticket": {...} }` (single) |
| **Error format** | Flat: `{ "error": "Type", "message": "..." }` (NOT field-level errors) |
| **ID format** | UUIDv7 (new endpoints), Integer (legacy v4) |
| **Primary key concern** | `DistributedEntity` (for UUIDv7 models) |
| **Pagination** | Cursor-based (new), page-based (legacy v4) |
| **Versioning** | Date-based: `/api/v20260201/` (new), `/api/v4/` (legacy) |

---

## Multi-Tenant Security

(OPTIONAL — only for multi-tenant / SaaS apps)

| Rule | Detail |
|------|--------|
| **Query scoping** | All queries MUST be scoped to `current_account` |
| **Authorization** | Use `accessible_to(user)` pattern |
| **Permissions** | Feature-level + role-based permissions |
| **Area access** | Queries respect user's allowed areas/facilities |

---

## Backwards Compatibility

(OPTIONAL — only if old clients must be supported)

Old mobile apps cannot be force-updated. ~75% of users are on older versions. New API changes must not break old clients. Architecture proposals must include a compatibility matrix:

| Scenario | Web (current) | iOS (current) | iOS (old) | Android (current) | Android (old) |
|----------|:---:|:---:|:---:|:---:|:---:|
| [Feature scenario] | [Behavior] | [Behavior] | [Behavior] | [Behavior] | [Behavior] |

---

## Feature Flags

(OPTIONAL — only if the project uses feature flags)

Standard rollout: feature flag defaults OFF, enabled per-account for beta, then globally for GA.

---

## Project Tracker

(OPTIONAL — only if using an external tracker)

| Setting | Value |
|---------|-------|
| **Tool** | Linear |
| **Workspace** | OrangeQC |

---

## Guardrails

(REQUIRED — safety rules for agents)

| Guardrail | Rule |
|-----------|------|
| **Production access** | Agents NEVER have production access. No Heroku remotes, no App Store/Play Store credentials. |
| **Default branch** | Never commit or merge directly to the default branch. |
| **Push** | Never push without explicit user request. |
| **Destructive operations** | No `drop_table`, `reset`, or data deletion without human approval. |
