---
id: "ALGO--{name}"
type: "algorithm"
module: "{module}"
status: "stable"
summary: "{Short technical description of the logic}"
tags: [logic, compute]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
last_reviewed: 2026-04-14
---
# Algorithm: {Name}

## 1. Technical Goal
{How does this logic achieve the result?}

## 2. Logic Steps (HOW)
1. {Step 1}
2. {Step 2}

## 3. Formulas
$${Result} = \sum_{i=1}^{n} {x_i}$$

## 4. Implementation
- Reference: `src/path/to/code.ts`
--- slide ---
---
id: "PROTO--{name}"
type: "protocol"
module: "{module}"
status: "active"
summary: "{What process does this define?}"
tags: [workflow, guide]
created_at: 2026-04-14
updated_at: 2026-04-14
previous_update: null
created_by: "@architect"
updated_by: "@architect"
---
# Protocol: {Procedure Name}

## 1. Prerequisites
{What is needed before starting?}

## 2. Step-by-Step (PROCESS)
- [ ] Task A
- [ ] Task B

## 3. Verification
{How to know if the protocol was followed correctly?}
--- slide ---
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
--- slide ---
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

