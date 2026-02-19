# Pipeline Configuration Example

This is an annotated example of the `## Pipeline Configuration` section that goes in your target repo's conventions file (`CLAUDE.md`, `AGENTS.md`, or `CONVENTIONS.md`). Copy this into your conventions file and fill in the values for your project.

Comments in `<!-- -->` are guidance — remove them from your final version.

---

## Pipeline Configuration

> Pipeline skills read this section to understand how to run the agent pipeline against this repo.
> Run skills from this repo's root directory (not from the pipeline repo).

<!-- REQUIRED sections below. Every target repo needs all of these. -->

### Project Tracker

<!-- Which issue tracker to use for linking pipeline projects to tickets.
     Options: Linear, GitHub Issues, or None.
     If using Linear, skills will create/update issues automatically. -->

| Setting | Value |
|---------|-------|
| **Tool** | None |

<!-- If using Linear:
| Setting | Value |
|---------|-------|
| **Tool** | Linear |
| **Team** | My Team |

If using GitHub Issues:
| Setting | Value |
|---------|-------|
| **Tool** | GitHub Issues |
| **Repository** | my-org/my-repo |
-->

### Repository Details

<!-- Core git and testing configuration.
     - Test command: whatever runs your full test suite
     - Branch prefix: pipeline branches are named <prefix><callsign>
     - PR base branch: where /create-pr targets (usually same as default branch) -->

| Setting | Value |
|---------|-------|
| **Default branch** | `main` |
| **Test command** | `bundle exec rspec` |
| **Test directory** | `spec/` |
| **Branch prefix** | `pipeline/` |
| **PR base branch** | `main` |

### Platforms

<!-- List every platform this repo targets.
     This determines project levels:
     - Single platform: L1=small, L2=medium, L3=large
     - Multiple platforms: L1=single-platform, L2=primary only, L3=cross-platform
     Mark platforms as Active or Planned. -->

| Platform | Status | Notes |
|----------|--------|-------|
| Web (Rails) | Active | Primary platform |

<!-- Multi-platform example:
| Platform | Status | Notes |
|----------|--------|-------|
| Web (Rails) | Active | Admin dashboard + API |
| iOS (Swift) | Active | Native mobile app |
| Android (Kotlin) | Active | Native mobile app |
-->

### Framework & Stack

<!-- Describe the technical stack. Skills use this to generate framework-appropriate
     code, tests, and architecture proposals. Include everything relevant. -->

| Setting | Value |
|---------|-------|
| **Language** | Ruby 3.3 |
| **Framework** | Rails 7.2 |
| **Test framework** | RSpec |
| **ORM** | ActiveRecord |
| **Frontend JS** | Hotwire (Turbo + Stimulus) |
| **CSS** | Tailwind |
| **Asset pipeline** | Sprockets |
| **JS bundling** | esbuild |
| **Database** | PostgreSQL |
| **Background jobs** | Sidekiq |

<!-- Adapt to your stack. Some common alternatives:
     - Test framework: Minitest, Jest, pytest, ExUnit
     - Frontend: React, Vue, Svelte, plain ERB
     - CSS: Bootstrap, vanilla CSS, CSS modules
     - Database: SQLite3, MySQL
     - Background jobs: Solid Queue, Delayed Job, Celery
     - Deploy: Kamal, Heroku, Fly.io, AWS

     Add any other stack details that affect how code is written:
     | **Search** | Elasticsearch |
     | **Cache** | Redis |
     | **File storage** | Active Storage (S3) |
-->

### Directory Structure

<!-- Map each purpose to a path. Skills use this to know where to put new files
     and where to look for existing code. Include all directories relevant to
     your framework. -->

| Purpose | Path |
|---------|------|
| Models | `app/models/` |
| Controllers | `app/controllers/` |
| Views | `app/views/` |
| Services | `app/services/` |
| Helpers | `app/helpers/` |
| Mailers | `app/mailers/` |
| JavaScript | `app/javascript/` |
| Background jobs | `app/jobs/` |
| Routes | `config/routes.rb` |
| Migrations | `db/migrate/` |
| Schema | `db/schema.rb` |
| Model specs | `spec/models/` |
| Request specs | `spec/requests/` |
| Service specs | `spec/services/` |
| Job specs | `spec/jobs/` |
| Factories | `spec/factories/` |
| Support/helpers | `spec/support/` |

<!-- For non-Rails projects, adapt to your framework:

     Node/Express:
     | Models | `src/models/` |
     | Routes | `src/routes/` |
     | Middleware | `src/middleware/` |
     | Tests | `test/` or `__tests__/` |

     Python/Django:
     | Models | `myapp/models.py` |
     | Views | `myapp/views.py` |
     | URLs | `myapp/urls.py` |
     | Tests | `myapp/tests/` |

     Elixir/Phoenix:
     | Contexts | `lib/myapp/` |
     | Controllers | `lib/myapp_web/controllers/` |
     | Templates | `lib/myapp_web/templates/` |
     | Tests | `test/` |
-->

### Implementation Order

<!-- The natural build sequence for your framework. Skills use this to order
     milestone work correctly (e.g., migrations before models, models before
     controllers). -->

1. Migration(s)
2. Model(s) — with validations, associations, scopes
3. Service(s) — business logic
4. Route(s)
5. Controller(s)
6. Views
7. JavaScript / frontend interactivity

### Guardrails

(REQUIRED — safety rules for agents)

| Guardrail | Rule |
|-----------|------|
| **Production access** | Agents NEVER have production access. No deploy credentials, no production database access. |
| **Default branch** | Never commit or merge directly to the default branch. |
| **Push** | Never push without explicit user request. |
| **Destructive operations** | No `drop_table`, `reset`, or data deletion without human approval. |

<!-- Add project-specific guardrails as needed:
| **PII handling** | Never log or expose personally identifiable information. |
| **External APIs** | Never call external APIs in test mode without mocking. |
| **Billing** | Never modify billing or payment code without human approval. |
-->

---

<!-- OPTIONAL sections below. Include only those that apply to your project.
     Skills check for these sections and skip gracefully if they're absent. -->

### Post-Flight Checks

(OPTIONAL — linters, security scanners, and quality checks to run before opening a PR)

<!-- The /create-pr skill reads this table and runs each check on the project
     branch before pushing. Auto-fixable checks run first; their fixes are
     committed. Then report-only checks run. If any blocking check fails after
     auto-fix, the skill stops and reports the findings. -->

| Check | Command | Auto-fix? | Blocking? |
|-------|---------|-----------|-----------|
| **Ruby style** | `bin/rubocop -A` | Yes | Yes — commit fixes, re-run to confirm clean |
| **Security scan** | `bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error` | No | Yes — any findings block the PR |

<!-- Common checks by framework:

     Rails:
     | **Gem audit** | `bundle-audit` | No | Yes |

     Node:
     | **Lint** | `npm run lint -- --fix` | Yes | Yes |
     | **Type check** | `npx tsc --noEmit` | No | Yes |
     | **Audit** | `npm audit` | No | Yes |

     Python:
     | **Lint** | `ruff check --fix .` | Yes | Yes |
     | **Type check** | `mypy .` | No | Yes |
     | **Security** | `bandit -r src/` | No | Yes |
-->

### Related Repositories

(OPTIONAL — for multi-platform or multi-repo projects)

<!-- Skills like /discovery and /architecture will search these repos for
     API contracts, shared types, or cross-platform patterns. -->

| Repository | Path | Purpose |
|------------|------|---------|
| API docs | `../api-docs/` | OpenAPI specs, shared contracts |
| Mobile app | `../mobile/` | iOS/Android codebase |

### API Conventions

(OPTIONAL — include if your project has an API)

<!-- The /architecture and /review skills use this to enforce API design
     consistency. -->

| Setting | Value |
|---------|-------|
| **Primary key type** | UUID |
| **Error format** | `{ "error": { "code": "...", "message": "..." } }` |
| **Response envelope** | `{ "data": ... }` |
| **Serializer** | ActiveModel Serializers |
| **Versioning** | URL path (`/api/v1/...`) |
| **Authentication** | Bearer token (JWT) |
| **Pagination** | Cursor-based |

### Multi-Tenant Security

(OPTIONAL — include if your app has accounts/tenants with data isolation)

<!-- Skills use this to ensure every query is tenant-scoped and test generation
     includes tenant isolation tests. -->

| Setting | Value |
|---------|-------|
| **Tenant model** | `Account` |
| **Scoping method** | `current_account` set in `ApplicationController` |
| **Query pattern** | All queries chain from `current_account.things` — never `Thing.where(...)` without tenant scope |
| **Test requirement** | Every request spec must verify tenant isolation (user from Account A cannot access Account B's data) |

### Backwards Compatibility

(OPTIONAL — include if supporting old clients or multiple API versions)

<!-- The /architecture skill uses this to flag breaking changes and propose
     migration strategies. -->

| Setting | Value |
|---------|-------|
| **API versions supported** | v1, v2 |
| **Deprecation policy** | Old endpoints return `Sunset` header 90 days before removal |
| **Mobile compatibility** | Must support 2 most recent app versions |

### Complexity Analysis

(OPTIONAL — include if tracking code quality metrics)

<!-- The /quality and /create-pr skills run these tools and include results
     in PR descriptions. -->

| Tool | Command | Threshold |
|------|---------|-----------|
| **Flog** | `flog -a app/` | Methods scoring > 30 flagged for review |
| **RuboCop Metrics** | `rubocop --only Metrics` | Enforces method length, class length, ABC size |
