---
id: "{module}--{feature_name}"
type: "feature"
module: "{parent_module}"
status: "draft"
version: 1.0.0
owner: "@team"
summary: "{Short 1-line description of what this feature does}"
tags: [feature, {module}]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
depends_on: []
touch_points: []
---
# Feature: {Feature Name}

## 1. User Story
As a {role}, I want to {action} so that {value}.

## 2. Business Rules
- **RULE-1**: {Critical rule}
- **RULE-2**: {Validation rule}

## 3. UI/UX Flow
- [[flow--{name}]]

## 4. Technical Specs
- **Blueprint**: [[FEAT-{NN}.yaml]]
- **APIs**: [[{METHOD}--{module}-{feature}-{path}]]

## 5. Security & Permissions (C | R | U | D)
{Role/permission matrix for this specific feature}

| Resource | Role | CRUDP | Note |
|---|---|---|---|
| {Page/Component} | {Role} | {Actions} | {Condition} |

