# Frontmatter Schema (GKS)

> ⚠️ **v1 Legacy** — ดู [[13_meta/schema-v2|Schema v2]] สำหรับ MSP-Inspired fields (crosslinks, epistemic, context_anchor)
> note ใหม่ทุกตัวควรใช้ **v2** — v1 ยังใช้ได้สำหรับ backward compat

All notes in the GKS must follow this schema to ensure compatibility with automated indexing and agents.

```yaml
---
id: string          # Required. Unique slug (e.g., auth--login)
type: enum          # Required. [module, feature, algorithm, protocol, parametric, incident, safety, api, entity, flow, adr, term, moc]
module: string      # Required. Parent module name
status: enum        # Required. [draft, stable, deprecated, enforced, active, stub]
version: string     # Optional. Semver format (e.g. 1.0.0)
owner: string       # Required. Team or Agent responsible
summary: string     # Required. Max 200 characters. Single sentence description.
tags: array         # Optional. Category tags
depends_on: array   # Optional. List of [[note_id]]
used_by: array      # Optional. List of [[note_id]]
touch_points: array # Optional. Paths to source code files
created_at: date    # Required. YYYY-MM-DD
updated_at: date    # Required. YYYY-MM-DD
previous_update: date # Optional. YYYY-MM-DD
created_by: string  # Required. Author ID (e.g. @architect)
updated_by: string  # Required. Last updater ID
last_reviewed: date # Optional. YYYY-MM-DD
---
```
