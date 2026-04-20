---
id: "INC--{id}"
type: "incident"
module: "{module}"
episode_id: "{Real ID}"
summary: "{Short summary of the failure and fix}"
tags: [incidents, failure, lesson]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Incident: {Title}

## 1. Context (A-V-O-I-D)
{What broke? Why? How did we miss it?}

## 2. Root Cause
{The core technical issue}

## 3. Mitigation
{What was done to fix it?}

## 4. Prevention
{New safety rules added to avoid this in the future}
/
---
id: "SAFETY--{id}"
type: "safety"
module: "{module}"
status: "enforced"
summary: "{The non-negotiable rule}"
tags: [safety, guardrail, critical]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Safety: {Title}

## 1. The Guard (G-U-A-R-D)
{This rule overrides other logic. If X occurs, then Y MUST be blocked.}

## 2. Enforcement Method
{How is this checked? Automated? Manual Gate?}
/
---
id: "PARAM--{name}"
type: "parametric"
module: "{module}"
status: "stable"
summary: "{What value does this parameter control?}"
tags: [config, variables]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Parametric: {Name}

## 1. Definition
{Purpose of this parameter}

## 2. Current Value
`{Value}`

## 3. Calculation Source
{Source/Reference for the value}
/
---
id: "ADR-{number}-{slug}"
type: "adr"
module: "{module}"
status: "approved"
author: "{Agent/Human}"
summary: "{Summary of the technical decision}"
tags: [decision, architecture]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# ADR-{number}: {Title}

## 1. Context
{The problem we were trying to solve}

## 2. Options Considered
- Option A
- Option B

## 3. Decision
{Why we chose this option}

## 4. Consequences
{Positive/Negative impact}
/
---
id: "term--{name}"
type: "term"
module: "{module}"
summary: "{1-sentence definition of the term}"
tags: [glossary, domain]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Term: {Name}

## 1. Definition
{Deep explanation of the term in the context of this project}

## 2. Related Terms
- [[term--{other}]]

