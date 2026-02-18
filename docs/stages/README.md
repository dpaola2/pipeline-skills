# Stage Specifications — Design Reference

These files document the **design rationale** and **architectural context** for each pipeline stage. They are reference material for understanding why stages work the way they do.

**These are NOT runtime dependencies.** Pipeline skills (`.claude/skills/`) are self-contained — they embed their own templates, success criteria, and behavioral guidance. Skills do not read files from this directory.

## When to Read These

- Understanding the pipeline's design decisions
- Modifying or extending a stage's behavior
- Onboarding to the pipeline architecture
- Reviewing the full scope of a stage (skills are operationalized subsets)
