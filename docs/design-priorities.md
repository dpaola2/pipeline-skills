# Design Priorities

> **Purpose:** The principles that govern how this pipeline evolves. Every roadmap item, skill change, and architectural decision should be evaluated against these priorities. They're ordered by importance — when two priorities conflict, the higher one wins.
>
> Each priority is derived from a fundamental software law applied to agent-orchestrated pipelines.

---

## 1. Correctness Over Speed

**Derived from:** Goodhart's Law (*"When a measure becomes a target, it ceases to be a good measure"*), Amdahl's Law

The pipeline exists to produce *correct* code, not *fast* code. Speed is a secondary benefit of automation, not the primary goal. This is the most dangerous law for agent pipelines — quality signals like test pass counts, lint results, and CI green status are proxies for correctness. The moment an agent optimizes for making those signals green rather than writing correct code, the signals become worthless.

**What this means in practice:**

- Human checkpoints are architectural, not overhead. They exist because agents optimize for measurable signals (tests pass, lint clean, CI green), and those signals are imperfect proxies for correctness. Humans evaluate intent.
- When adding automation that removes human review (ROAD-11 Ludicrous Speed, ROAD-17 CI Auto-Fix), pair it with a quality check that's hard to game (ROAD-09 Code Review).
- Never measure pipeline quality by throughput alone. "10 PRs created per week" means nothing if the PRs need extensive human rework.
- Test pass count is a quality floor, not a quality ceiling. The pipeline should treat "all tests pass" as table stakes, not as success.

**The litmus test:** If a change makes the pipeline faster but removes a quality signal with no replacement, reject it.

---

## 2. Evolve From Working Systems

**Derived from:** Gall's Law (*"A complex system that works is invariably found to have evolved from a simple system that worked"*), Lehman's Laws (*"As a system evolves, its complexity increases unless work is done to maintain or reduce it"*)

Every new capability should be an incremental evolution of something that already works. Never redesign a working subsystem to accommodate a planned feature.

**What this means in practice:**

- Each roadmap item should produce a working system, not a partial foundation for a future system. If ROAD-03 (Per-Milestone Gameplans) can't ship as a standalone improvement, it's scoped wrong.
- Validate new capabilities on a single project before making them the default. The first project to use a new feature is the pilot — it surfaces the issues. The second project is the proof.
- When a change touches multiple stages, ship it in layers: update the producing stage first, let it run, then update the consuming stages. Don't deploy both sides simultaneously.
- Alternate between "add" and "simplify" phases. After a burst of new capabilities, schedule a consolidation pass to reduce the complexity that accumulated.

**The litmus test:** Can you describe the pipeline's current state as "a simple system that works" at every point in the roadmap? If not, you're taking too big a step.

---

## 3. Respect Existing Constraints

**Derived from:** Chesterton's Fence (*"Don't remove a fence until you understand why it was put there"*)

When the pipeline modifies existing code, the default posture is to respect every validation, callback, guard clause, and naming convention it encounters. Existing constraints exist for reasons that may not be obvious.

**What this means in practice:**

- Stage 1 (Discovery) is the foundation. Its quality determines how well all downstream stages understand the codebase they're modifying. Investment in discovery depth pays compound returns.
- When Stage 5 encounters a constraint that makes implementation harder, it should adapt to the constraint, not remove it. If removal is genuinely necessary, it should be flagged for human review, not silently done.
- The conventions file in each target repo (`CLAUDE.md` / `AGENTS.md`) is a catalog of known constraints. ROAD-15 (Knowledge Extraction) should grow this catalog over time, not replace it.
- "Why does this exist?" is a question the pipeline should answer before "how do I change this?" Discovery reports, architecture proposals, and code review should all surface the *reasons* behind existing code patterns.

**The litmus test:** When the agent modifies existing code, could it explain *why* the existing code was written that way? If not, it doesn't understand enough to change it safely.

---

## 4. Stages Communicate Through Contracts, Not Coupling

**Derived from:** Conway's Law (*"Organizations which design systems are constrained to produce designs which are copies of the communication structures of those organizations"*), Postel's Law (*"Be conservative in what you send, liberal in what you accept"*)

Each stage produces structured artifacts (discovery report, architecture proposal, gameplan, tests, code). These artifacts are the contracts between stages. Stages should depend on the semantic content of their inputs, not on the exact format.

**What this means in practice:**

- **Conservative output:** Stage outputs should strictly conform to their templates. Clean, well-structured artifacts make downstream consumption reliable.
- **Liberal input:** Stage inputs should tolerate variation. If the architecture proposal has an extra section, skip it. If a heading is slightly different, still find it. Parse by meaning, not by position.
- Stage boundaries should align with natural decision boundaries. Architecture is a separate stage from gameplan because they represent genuinely different decisions (data model vs. sequencing). Don't create stages just for organizational neatness.
- When changing an artifact format (e.g., ROAD-03 restructuring gameplans), downstream stages should handle both old and new formats during the transition. No flag days.
- Templates are the contract specification. Improving a template is a contract change — evaluate it with the same care you'd give an API change.

**The litmus test:** If the upstream stage added a new section to its output, would the downstream stage still work without changes? If not, the coupling is too tight.

---

## 5. Optimize the Bottleneck

**Derived from:** Amdahl's Law

The pipeline's wall-clock time is dominated by its slowest component. Currently, that's human review, not agent execution. Optimize what's actually slow.

**What this means in practice:**

- Making agent stages faster yields diminishing returns unless human review time is also reduced.
- Pipeline improvements that reduce human friction (ROAD-02 Notifications, ROAD-06 Document Linking) may deliver more wall-clock speedup than agent optimizations.
- Making artifacts *easier to review* — better formatting, executive summaries, clear diffs — attacks the actual bottleneck. The architecture proposal and gameplan are reviewed by a human; their readability is a performance concern.
- Auto-advancing low-risk stages (e.g., Stage 1 → Stage 2, since Stage 1 is read-only exploration) removes sequential steps that don't require human attention without sacrificing quality.
- ROAD-11 (Ludicrous Speed) should be guided by: "Which checkpoint has the lowest value-to-friction ratio?" Auto-advance those first.

**The litmus test:** Before optimizing a stage, ask: "Is this stage on the critical path, or is a human checkpoint the bottleneck?"

---

## 6. The Pipeline Must Improve Itself

**Derived from:** Lehman's Laws, Gall's Law

A pipeline that processes dozens of projects without learning from them is leaving value on the table. Knowledge extracted during each project should flow back into the pipeline and the target repo's conventions, making future projects better.

**What this means in practice:**

- ROAD-15 (Knowledge Extraction) is not a nice-to-have — it's the mechanism by which the pipeline gets better over time. Without it, each project starts from scratch, re-discovering constraints the pipeline has already encountered.
- Knowledge has two destinations: **repo-scoped** (patterns specific to this codebase → target repo's conventions file) and **pipeline-scoped** (lessons about how to run the pipeline → pipeline docs, templates, skills). Route to the right place.
- The conventions file in each target repo is the highest-leverage destination. It's read by every agent session, every project, every stage. Growing it with accurate, well-organized knowledge has compound returns.
- Knowledge extraction should not block the pipeline. It's additive — a "we also learned X" step at the end of each stage, not a gate.
- Stale knowledge is worse than no knowledge. Insights should be tied to specific code so they can be validated or retired when the code changes.

**The litmus test:** After completing a project, are there concrete, reusable insights that future projects would benefit from? If yes, are they written down somewhere durable?

---

## How These Laws Reinforce Each Other

**Goodhart + Amdahl:** The fastest way to speed up the pipeline is to remove human checkpoints (Amdahl). But human checkpoints are the primary defense against Goodhart's Law (agents gaming metrics). The pipeline's two-checkpoint architecture is the current resolution of that tension.

**Conway + Postel:** Conway's Law says stage boundaries shape code boundaries. Postel's Law says stages should be tolerant of each other's output. Together: design stage boundaries carefully (Conway), but don't couple stages tightly to each other's exact output format (Postel).

**Gall + Lehman:** Gall's Law says evolve from working simple systems. Lehman's Law says complexity increases unless actively reduced. Together: add one capability at a time (Gall), and periodically simplify (Lehman). The roadmap should alternate between "add" and "simplify" phases.

**Chesterton + Conway:** Chesterton's Fence says understand existing constraints before changing them. Conway's Law says the pipeline's stage structure shapes what agents see. Together: Stage 1 (Discovery) must make existing constraints visible to all downstream stages. If Conway's Law hides a fence behind a stage boundary, Chesterton's Fence gets violated.

---

## Priority Conflicts

These priorities sometimes conflict. The ordering resolves ambiguity:

| Conflict | Resolution |
|----------|------------|
| Speed vs. Correctness | Correctness wins. Don't remove a quality gate to go faster. |
| New feature vs. Simplicity | Evolve from working systems. If the feature can't be added incrementally, scope it down. |
| Agent efficiency vs. Existing constraints | Respect constraints. Adapt the implementation, don't remove the guardrail. |
| Tight integration vs. Loose coupling | Loose coupling wins. Stages should work even if upstream output varies slightly. |
| Agent speed vs. Human friction | Optimize the bottleneck. If humans are slow, make their job easier before making agents faster. |
| Shipping features vs. Self-improvement | Both matter, but features fund self-improvement. Ship first, extract knowledge second. |

---

## Applying These Priorities to the Roadmap

Every roadmap item should be evaluable against these priorities. As a quick reference:

| Roadmap Item | Primary Priority Served | Watch Out For |
|-------------|------------------------|---------------|
| ROAD-02 (Notifications) | #5 Optimize the Bottleneck | Don't add noise — notify on actions needed, not status updates |
| ROAD-03 (Per-Milestone Gameplans) | #4 Contracts Not Coupling | Big change — validate on one project first (#2 Evolve) |
| ROAD-08 (Linear Automation) | #5 Optimize the Bottleneck | External dependency — keep stages working without it (#4 Loose Coupling) |
| ROAD-09 (Code Review) | #1 Correctness Over Speed | Don't make it a rubber stamp — it's the Goodhart defense |
| ROAD-10 (Post-QA Re-entry) | #2 Evolve From Working Systems | Start with the simplest mechanism (patch mode), not the most general |
| ROAD-11 (Ludicrous Speed) | #5 Optimize the Bottleneck | Highest Goodhart risk — pair with strong quality checks (#1) |
| ROAD-15 (Knowledge Extraction) | #6 Pipeline Improves Itself | Don't block the pipeline on extraction — it's additive, not a gate |
| ROAD-17 (CI Auto-Fix) | #1 Correctness Over Speed | Agent must fix *why* tests fail, not *that* they fail (Goodhart) |
