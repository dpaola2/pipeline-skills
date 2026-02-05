# Stage 4: Test Generation

> **Principle:** Write tests before implementation. Tests define the contract and catch regressions.

---

## Summary

| Field | Value |
|-------|-------|
| **Agent Type** | Test writer |
| **Input** | Approved Spec + Acceptance Criteria + Architecture Proposal |
| **Output** | Failing test suites (TDD) |
| **Repos Accessed** | Rails, iOS, Android (write access) |
| **Human Review** | Optional (recommended for first few runs) |
| **Linear** | Links test PRs to milestone tickets |

---

## What This Stage Does

The test generation agent writes comprehensive test suites from the approved spec BEFORE any implementation code is written. This is TDD at the pipeline level.

### Test Types by Platform

#### Rails
| Test Type | What It Tests | Framework | Priority |
|-----------|--------------|-----------|----------|
| Model specs | Validations, associations, scopes, methods | RSpec | High |
| Request specs | API endpoints (status codes, response format, auth) | RSpec | **Highest** |
| System specs | Admin UI workflows (if applicable) | RSpec + Capybara | Medium |
| Service specs | Business logic in service objects | RSpec | As needed |

#### iOS
| Test Type | What It Tests | Framework | Priority |
|-----------|--------------|-----------|----------|
| Unit tests | Model parsing, business logic, view models | XCTest | High |
| Integration tests | API client calls, data persistence | XCTest | High |
| UI tests | Critical user flows | XCUITest | Low (few) |

#### Android
| Test Type | What It Tests | Framework | Priority |
|-----------|--------------|-----------|----------|
| Unit tests | Model parsing, business logic, view models | JUnit | High |
| Integration tests | API client calls, data persistence | JUnit | High |
| UI tests | Critical user flows | Espresso | Low (few) |

---

## Agent Behavior

### Test Generation Strategy

1. **Start from acceptance criteria** - Each acceptance criterion becomes one or more test cases
2. **Follow existing test patterns** - Read existing tests in the repo and match style, naming, setup patterns
3. **Use the architecture proposal** - API endpoint tests use the exact request/response JSON from the proposal
4. **Include edge cases** - From the PRD's edge case table
5. **Include security tests** - Authorization, scoping, permission checks
6. **Include backwards compatibility tests** - Old API formats still work

### Mapping: Acceptance Criteria → Tests

```
Acceptance Criterion: "Admin can create a section within a checklist (SEC-001)"

→ Rails Request Spec:
  - POST /api/v1/checklists/:id/sections with valid params → 201 + section JSON
  - POST /api/v1/checklists/:id/sections with missing name → 422 + error
  - POST /api/v1/checklists/:id/sections without auth → 401
  - POST /api/v1/checklists/:id/sections for other account's checklist → 404 (scoped)
  - POST /api/v1/checklists/:id/sections with duplicate position → [defined behavior]

→ Rails Model Spec:
  - Section validates presence of name
  - Section belongs to checklist
  - Section has position (default behavior)

→ iOS Unit Test:
  - Section model parses from API response JSON
  - Section creation request sends correct payload

→ Android Unit Test:
  - Section model parses from API response JSON
  - Section creation request sends correct payload
```

### Test Naming Convention

Follow the project's existing convention. If none exists, use:

- Rails: `describe "POST /api/v1/checklists/:id/sections"` with `context`/`it` blocks
- iOS: `func testCreateSectionSuccess()`, `func testCreateSectionMissingName()`
- Android: `fun createSection_success()`, `fun createSection_missingName()`

### What Tests Should NOT Do

- Don't test implementation details (private methods, internal state)
- Don't duplicate framework tests (don't test that Rails validates presence correctly)
- Don't write flaky tests (no sleep/timing dependencies, no external service calls)
- Don't over-test (one test per behavior, not one per line of code)

---

## Output

### Per Platform

Each platform gets a PR (or set of PRs) containing:
- New test files, organized by milestone
- Test helpers/factories as needed
- All tests should FAIL (they're written before implementation)

### PR Structure

```
# Rails
spec/
  requests/
    api/v1/
      sections_spec.rb          # Request specs for new endpoints
  models/
    section_spec.rb             # Model specs
  factories/
    sections.rb                 # FactoryBot factories (if used)

# iOS
Tests/
  Models/
    SectionTests.swift          # Model parsing tests
  API/
    SectionAPITests.swift       # API client tests

# Android
app/src/test/
  models/
    SectionTest.kt              # Model parsing tests
  api/
    SectionApiTest.kt           # API client tests
```

---

## Acceptance Criteria Coverage Matrix

The output should include a coverage matrix:

| Acceptance Criterion | ID | Rails Tests | iOS Tests | Android Tests |
|---------------------|-----|-------------|-----------|---------------|
| Admin can create section | SEC-001 | `sections_spec.rb:12` | `SectionTests.swift:25` | `SectionTest.kt:18` |
| Admin can reorder sections | SEC-002 | `sections_spec.rb:45` | `SectionTests.swift:50` | `SectionTest.kt:40` |
| ... | ... | ... | ... | ... |

This matrix is used by Stage 7 (Validation) to verify coverage.

---

## Success Criteria

- [ ] Every acceptance criterion has at least one test per affected platform
- [ ] Security tests exist (auth, scoping, permissions)
- [ ] Edge case tests exist (from PRD edge case table)
- [ ] Tests follow existing project test patterns
- [ ] Tests use the exact API payloads from the architecture proposal
- [ ] All tests FAIL (no implementation yet)
- [ ] Tests are deterministic (no flakiness)
- [ ] Coverage matrix is complete

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Tests don't compile/run | CI runs tests | Fix syntax/import issues |
| Tests accidentally pass | "Failing test" check | Review test - likely testing existing behavior, not new |
| Missing acceptance criterion coverage | Coverage matrix review | Generate additional tests |
| Tests too tightly coupled to implementation | Human review | Rewrite to test behavior, not implementation |
| Test infrastructure missing | Tests can't run at all | **Escalate** - this is a Priority 1 gap (see gap-analysis.md) |

---

## Dependencies

- **Requires:** Test infrastructure to exist and run in CI (see `gap-analysis.md` Priority 1.1)
- **Requires:** AGENTS.md with test conventions (see `gap-analysis.md` Priority 1.2)
- **Requires:** Approved spec from Stage 3
- **Produces:** Failing tests that Stage 5 will make pass
