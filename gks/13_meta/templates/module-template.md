---
id: "module--{name}"
type: "module"
module: "{self}"
status: "draft"
version: 1.0.0
owner: "@team"
summary: "{Short 1-line description for indexers}"
tags: [module, core]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
depends_on: []
---
# Module: {Name}

## 1. Responsibility
{What does this module OWN? What is its core mission?}

## 2. Boundaries
- **Upstream**: {Who provides data?}
- **Downstream**: {Who consumes this module?}

## 3. Key Decisons
- [[ADR-XXXX-title]]

## 4. Feature Index
{List of child features}
- [[{module}--{feature}]]

## 5. API Contracts
- [[{METHOD}--{module}-{path}]]
- [[POST--{module}-{path}]]
- [[GET--{module}-{path}]]

## 6. Security & Permissions (C | R | U | D)
{Define who can do what within this module}

| Resource/Page | Role | CRUDP | Note |
|---|---|---|---|
| Dashboard | All | R | View-only |
| Settings | Admin | CRUD | Full access |
| {Resource} | {Role} | {Actions} | {Condition} |

## 5. Api,Endpoint 
- [[{module}--{api}]]
- [[{module}--{endpoint}]]
- [[{module}--{feature}--{api}]]
- [[{module}--{feature}--{endpoint}]]



