---
id: "ADR-073"
type: "architecture_decision"
status: "active"
version: "1.0.0"
summary: "Refactors CLAUDE.md into a Lean Navigator by migrating detailed technical specifications and rules into a specialized Obsidian vault to reduce context bloat and improve maintenance."
tags: [adr, architecture, documentation, obsidian, prompt-engineering]
created_at: "2026-04-18"
created_by: "@gemini-draft"
epistemic:
  confidence: 1.0
  source_type: "documented_source"
context_anchor:
  duration: "universal"
---

# ADR-073: Rulebook Navigator System (The Lean Prompt)

**Status:** ACCEPTED
**Date:** 2026-04-09
**Author:** Claude (Architect)
**Approver:** Boss

---

## Context

As the Zuri Platform scales, the `CLAUDE.md` file grew to over 100 lines, containing detailed technical specs, architectural laws, and coding conventions. This project utilizes an Obsidian-based documentation vault in `docs/`. Loading the full `CLAUDE.md` in every session caused "context bloat," high token costs, and made it difficult for the user to manage individual rules within Obsidian.

## Decision

1. **Refactor CLAUDE.md**: Transform the file into a "Lean Navigator" (v3.0.0). It now serves as a high-level map with absolute file links to detailed documents.
2. **The Ledger Migration**: Move all detailed specifications into specialized files in the Obsidian vault:
    - **`docs/architecture/TECH_STACK.md`**: Infrastructure details.
    - **`docs/architecture/LAWS.md`**: Multi-tenancy, RBAC, Data flow.
    - **`docs/guide/CONVENTIONS.md`**: Code style and maintenance workflow.
3. **Implicit Search Rule**: AI agents are instructed to "query the vault" (`docs/`) using tools if specific context (like RBAC details) is missing from the navigator.

## Consequences

### Positive
- **Drastic Context Reduction**: Initial prompt size reduced significantly (~70% reduction in `CLAUDE.md`).
- **Improved Maintainability**: User can edit specific rules in Obsidian (e.g., adding a new database field to the tech stack) without touching the main prompt file.
- **Tool-Oriented Workflow**: Encourages the AI to act as a researcher, fetching only the information relevant to the current task.

### Negative
- **Latency**: The AI might need one extra tool call (`view_file`) to see detailed rules when starting a specific module.
- **Link Maintenance**: File links in the Navigator must be kept up-to-date.

---

## Related

- ADR-071: AI Master Rulebook & Doc-Code Sync
- [CLAUDE.md](file:///e:/zuri/CLAUDE.md)
