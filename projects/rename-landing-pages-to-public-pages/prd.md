# Rename "Landing Pages" to "Public Pages" — PRD

|  |  |
| -- | -- |
| **Product** | OrangeQC |
| **Version** | 1 |
| **Author** | Product |
| **Date** | February 6, 2026 |
| **Status** | Ready for Engineering |
| **Platforms** | Web only |
| **Level** | 2 (Web only) |
| **Linear Issue** | [PM-226](https://linear.app/orangeqc/issue/PM-226/question-is-it-too-late-to-rename-feature-to-public-pages) |
| **Linear Project** | [Level 2: QR Codes Landing Page 1.0](https://linear.app/orangeqc/project/level-2-qr-codes-landing-page-10-16876909c150) |

---

## 1. Executive Summary

**What:** Rename the "Landing Pages" feature to "Public Pages" across all user-facing surfaces in the web admin — sidebar navigation, page titles, headings, button labels, flash messages, help documentation references, and the area tree assignment UI.

**Why:** The product team (Rachel, raised by Kelly) identified that "Landing Pages" is a misleading name. These pages are publicly accessible views shown when unauthenticated users scan QR codes — they are public-facing informational pages, not marketing landing pages. "Public Pages" more accurately describes what the feature does and reduces customer confusion. The feature is currently in private beta, making this the last low-cost window for the rename before broader rollout.

**Key Design Principles:**
- User-facing only — rename labels, headings, and text that users see. Do not rename database tables, model classes, routes, or internal code at this stage.
- Zero functional change — behavior, permissions, data model, and API are completely untouched.
- Complete — every user-visible occurrence of "Landing Page(s)" becomes "Public Page(s)". No half-renames.

---

## 2. Goals & Success Metrics

### Goals
- All user-facing references say "Public Pages" instead of "Landing Pages"
- No user confusion about what the feature is called during beta rollout
- Help documentation reflects the new name before customer invitations go out

### Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| User-facing references to "Landing Pages" | Zero remaining | At deploy |
| Customer confusion about feature name | Zero support tickets mentioning "landing page" for the new feature | 30 days |
| Beta customer onboarding | Customers understand the feature from its name without explanation | 14 days |

---

## 3. Feature Requirements

### 3.1 Admin Sidebar & Navigation

| ID | Requirement | Priority |
|----|------------|----------|
| NAV-001 | The Tailwind setup sidebar link reads "Public Pages" instead of "Landing Pages". | Must |
| NAV-002 | The Bootstrap setup sidebar link (if still rendered for any accounts) reads "Public Pages" instead of "Landing Pages". | Must |
| NAV-003 | The archived pages link reads "Archived Public Pages" instead of "Archived Landing Pages". | Must |

### 3.2 Page Titles & Headings

| ID | Requirement | Priority |
|----|------------|----------|
| HDG-001 | The index page title/heading reads "Public Pages". | Must |
| HDG-002 | The new page title reads "New Public Page". | Must |
| HDG-003 | The edit page title reads "Edit Public Page" (or "Editing [Page Title]" if that's the current pattern). | Must |
| HDG-004 | The archived index page title reads "Archived Public Pages". | Must |
| HDG-005 | The show/preview page title references "Public Page" where applicable. | Must |

### 3.3 Buttons, Links & Actions

| ID | Requirement | Priority |
|----|------------|----------|
| BTN-001 | The "New Landing Page" button reads "New Public Page". | Must |
| BTN-002 | The "Duplicate Landing Page" action reads "Duplicate Public Page". | Must |
| BTN-003 | The "Archive Landing Page" action reads "Archive Public Page". | Must |
| BTN-004 | The "Restore Landing Page" action reads "Restore Public Page". | Must |
| BTN-005 | The area tree "Assign Landing Page" / "Assigned Landing Page" UI reads "Assign Public Page" / "Assigned Public Page". | Must |
| BTN-006 | The bulk assign modal references "Public Page" instead of "Landing Page". | Must |

### 3.4 Flash Messages & Confirmations

| ID | Requirement | Priority |
|----|------------|----------|
| MSG-001 | All flash messages (create, update, archive, restore, duplicate, delete) say "Public page" instead of "Landing page". | Must |
| MSG-002 | All confirmation dialogs reference "public page" instead of "landing page". | Must |

### 3.5 Feature Flag & Settings

| ID | Requirement | Priority |
|----|------------|----------|
| FLG-001 | If there is any admin-visible reference to "landing_pages_enabled" or "Landing Pages Enabled" in account settings, it reads "Public Pages Enabled" or similar. The underlying column name `landing_pages_enabled` remains unchanged. | Must |

### 3.6 Help Documentation

| ID | Requirement | Priority |
|----|------------|----------|
| DOC-001 | The help document being created (PM-221) uses "Public Pages" as the feature name. | Must |

---

## 4. Platform-Specific Requirements

### Web (Rails Admin)
- All changes are string/label replacements in ERB templates, JS controllers (any user-visible strings), and helper text
- No controller renames, no route changes, no model changes
- The Stimulus controller `landing-page-edit` keeps its internal name — only user-visible strings within it change (if any)
- No database migrations
- No changes to `config/routes.rb` — URL paths like `/setup/landing_pages` remain as-is

### iOS
- No changes. iOS does not render the landing pages admin.

### Android
- No changes. Android does not render the landing pages admin.

### API
- No changes. No API endpoints serve the feature name to clients.

---

## 5. User Flows

### Flow 1: Admin Navigates to Public Pages

**Persona:** Account admin with `landing_pages_enabled`
**Entry Point:** Setup sidebar

1. Admin clicks "Public Pages" in the setup sidebar.
2. Index page loads with heading "Public Pages".
3. Admin sees their list of public pages.
4. **Success:** The feature is clearly identified as "Public Pages" throughout.

### Flow 2: Admin Creates a New Public Page

**Persona:** Account admin
**Entry Point:** Public Pages index > "New Public Page" button

1. Admin clicks "New Public Page".
2. Form loads with appropriate heading.
3. Admin fills in title, description, sections.
4. Admin saves.
5. Flash message reads: "Public page was successfully created."
6. **Success:** No reference to "landing page" appears anywhere in the flow.

### Flow 3: Admin Assigns a Public Page to Areas

**Persona:** Account admin
**Entry Point:** Public Pages show > "Assign to Areas" (or area tree sidebar)

1. Admin initiates assignment.
2. Modal/UI references "Public Page" in all labels.
3. Assignment is saved.
4. Area tree shows "Public Page: [Title]" (or however assigned pages display).
5. **Success:** Assignment UI consistently says "Public Page".

---

## 6. UI Mockups

No new UI components. This is a text replacement across existing screens. For reference, every occurrence of these strings changes:

| Current Text | New Text |
|-------------|----------|
| Landing Pages | Public Pages |
| Landing Page | Public Page |
| landing page | public page |
| landing pages | public pages |
| New Landing Page | New Public Page |
| Edit Landing Page | Edit Public Page |
| Archive Landing Page | Archive Public Page |
| Restore Landing Page | Restore Public Page |
| Duplicate Landing Page | Duplicate Public Page |
| Archived Landing Pages | Archived Public Pages |
| Assign Landing Page | Assign Public Page |

---

## 7. Backwards Compatibility

**Not applicable.** This is a cosmetic rename of user-facing strings. No API, data model, or URL changes. Old mobile apps are unaffected. Bookmarked admin URLs (`/setup/landing_pages`) continue to work because routes are unchanged.

---

## 8. Edge Cases & Business Rules

| Scenario | Expected Behavior |
|----------|-------------------|
| URL paths still say `/landing_pages` | This is expected. Internal URLs are not user-facing "branding." No redirect or URL rename needed. |
| Browser tab title still says "Landing Pages" | If the `<title>` tag is set dynamically, update it. If it's generic ("OrangeQC - Setup"), no change needed. |
| Database column `landing_pages_enabled` | Remains unchanged. Only the user-visible label (if any) changes. |
| Existing help doc drafts reference "Landing Pages" | PM-221 (help doc) should be updated to use "Public Pages" before publication. |
| Customers already familiar with "Landing Pages" from beta | Rename happens before broader rollout. Private beta customers will be informed in the beta invite communication. |
| Email notifications or transactional emails | If any emails reference "Landing Pages" (unlikely at this stage), update them. |

---

## 9. Export Requirements

**Not applicable.** No exports reference the feature name.

---

## 10. Out of Scope

All structural/code-level renames are covered by a separate follow-up project: [[public-pages-codebase-rename]].

- Renaming database tables (`landing_pages`, `landing_page_sections`, `landing_page_section_forms`)
- Renaming model classes (`LandingPage`, `LandingPageSection`, `LandingPageSectionForm`)
- Renaming controllers or controller files
- Changing URL routes (e.g., `/setup/landing_pages` to `/setup/public_pages`)
- Renaming the Stimulus controller identifier (`landing-page-edit`)
- Renaming the feature flag column (`landing_pages_enabled`)
- Renaming factory names or internal test references
- Renaming the `LandingPages::SubmissionsQuery` service class
- Renaming the `LandingPagesHelper` module
- Any behavioral or functional changes

---

## 11. Open Questions

| # | Question | Status | Decision | Blocking? |
|---|----------|--------|----------|-----------|
| 1 | Has the decision to rename been finalized by Matt and Dave? PM-226 is posed as a question. | Open | Must be resolved before work begins. | **Yes** |
| 2 | Should the public-facing page (what unauthenticated QR code scanners see) display "Public Page" anywhere, or is it only the admin UI that says the name? | Open | Likely admin-only — the public page itself doesn't currently show the feature name. | No |

> **Blocking question #1 must be resolved before this PRD enters the pipeline.**

---

## 12. Release Plan

### Single Phase

All changes ship together. No feature flag required — this is a cosmetic rename within an already-flagged feature (`landing_pages_enabled`).

**Deliverables:**
- Updated sidebar navigation labels
- Updated page titles and headings
- Updated button labels and action text
- Updated flash messages and confirmation dialogs
- Updated any admin-visible feature flag labels

---

## 13. Assumptions

- The rename decision is approved by Matt and Dave (blocking question #1).
- All user-visible occurrences of "Landing Page(s)" are in ERB templates and can be found with a text search. No occurrences are dynamically generated from model/class names.
- The help documentation (PM-221) is still in draft and can be updated to use "Public Pages" before publication.
- Private beta customers have not yet been widely onboarded, so the rename will not cause significant confusion.
- URL paths (`/setup/landing_pages`) are not user-facing "branding" and do not need to change. Users do not type or share these URLs.

---

## Appendix: Rename Scope Inventory

### Files Requiring Text Changes (User-Facing Strings)

**Views — Admin Setup (~15 files):**
- `app/views/setup/landing_pages/index.html.erb`
- `app/views/setup/landing_pages/new.html.erb`
- `app/views/setup/landing_pages/edit.html.erb`
- `app/views/setup/landing_pages/_form.html.erb`
- `app/views/setup/landing_pages/_preview_modal.html.erb`
- `app/views/setup/landing_pages/_section_fields.html.erb`
- `app/views/setup/landing_pages/_section_template.html.erb`
- `app/views/setup/landing_page_assignments/new.html.erb`
- `app/views/setup/landing_page_assignments/_modal.html.erb`
- `app/views/setup/landing_page_assignments/_confirm_content.html.erb`
- `app/views/setup/archived_landing_pages/index.html.erb`
- `app/views/setup/assigned_landing_pages/_landing_page.html.erb`

**Sidebar Navigation (2 files):**
- `app/views/setup/_sidebar.html.erb`
- `app/views_tailwind/setup/_sidebar.html.erb`

**Controllers — Flash Messages (4-6 files):**
- `app/controllers/setup/landing_pages_controller.rb` (flash messages only)
- `app/controllers/setup/landing_page_assignments_controller.rb` (flash messages only)
- `app/controllers/setup/assigned_landing_pages_controller.rb` (flash messages only)
- Other controllers as needed (flash/notice strings only)

**JavaScript (check for user-visible strings):**
- `app/javascript/controllers/landing_page_edit_controller.js` (any alert/confirm text)

### Files NOT Changed (Internal Code)
- Model classes, database tables, routes, controller class names, helper module names, service classes, factory names, test files — all remain as `landing_page*`.
