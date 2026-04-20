---
id: "phase3.5_microtasks--README"
type: knowledge
status: active
version: 1.0.0
summary: "Phase 3.5 micro-task codegen layer: decompose Phase 3 blueprints into 1-concern tasks executed by Qwen 14B local, validated by acceptance tests, composed deterministically."
tags: [phase3.5, microtask, codegen, qwen, slm, ollama]
created_at: 2026-04-19
created_by: "@claude-opus-4-7"
---
# Phase 3.5 — Micro-task Codegen Layer

**Rationale**: single-model full-file codegen fails because SLMs can't juggle >3 concerns simultaneously (proven in `gks/14_devlog/experiment/EXP-2026-04-19-qwen-codegen-benchmark.md`). Decomposing into 1-concern tasks pushes 14B success rate from ~40% → 100% on pilot.

## Layer structure

```
gks/
├── phase3_blueprints/FEAT-NNN.yaml            WHAT (contract)
├── phase3.5_microtasks/                       HOW  (decomposed)
│   ├── _SCHEMA.yaml                           Task & manifest schema
│   ├── _templates/                            Reusable task patterns
│   │   ├── input-validator.template.yaml
│   │   ├── error-mapper.template.yaml
│   │   ├── route-handler.template.yaml
│   │   └── route-export.template.yaml
│   └── FEAT-NNN/
│       ├── manifest.yaml                      What to compose
│       ├── Tn_*.task.yaml                     1 task = 1 concern
│       └── _outputs/                          SLM outputs (gitignore?)
└── src/app/api/.../route.js                   CODE (auto-generated)
```

## 3-tier agent workflow

| Tier | Agent | Rate | Role |
|---|---|---|---|
| **T3** | Claude Opus | rare | Author blueprints, decompose into tasks, review PR |
| **T2** | Gemini CLI | per-feature | Instantiate templates, write acceptance tests, compose, escalate |
| **T1** | Qwen 14B local | per-task | Execute 1 concern — pure codegen |

## Commands

```bash
# Run all micro-tasks for a feature (via Qwen local)
npm run msp:codegen FEAT-006

# Run one specific task (for iteration)
node scripts/msp/runner-microtask.mjs FEAT-006 T2_error-mapper

# Compose task outputs into final route file
npm run msp:compose FEAT-006

# Full pipeline
npm run msp:codegen FEAT-006 && npm run msp:compose FEAT-006
```

## Writing a new feature's micro-tasks

1. Copy a similar feature's folder: `cp -r FEAT-006 FEAT-NNN`
2. Update `manifest.yaml` (target_file, imports, header)
3. For each task YAML:
   - Update `task_id`, `feature`, `concern`
   - Update `prompt.template` (what SLM generates)
   - Update `acceptance_tests` (how you verify it)
4. Run `npm run msp:codegen FEAT-NNN`
5. If tests fail 3× per task, refine prompt or split further

## Pilot results (FEAT-006, 2026-04-19)

| Task | Tokens | Time | Attempts | Pass |
|---|---|---|---|---|
| T1 validate-input | 244 | 8.8s | 1 | ✅ |
| T2 error-mapper | 130 | 4.7s | 1 | ✅ |
| T3 handler-body | 138 | 5.0s | 1 | ✅ |
| T4 route-exports | 15 | 0.7s | 1 | ✅ |
| **Total** | **527** | **~20s** | **1** | **4/4** |

Composed file: [src/app/api/pos/tables/merge/route.js](../../src/app/api/pos/tables/merge/route.js) (2.4 KB, 65 lines, passed syntax check)

## Anti-hallucination (from `.brain/msp/LLM_Contract/codegen_microtask_contract.yaml`)

- Forbidden imports unless in `package.json`: joi, zod, yup, uuid, lodash, moment, axios, ...
- Always forbidden: `export default` (in exports slot), `req.body`, `req.tenantId`, TODO/FIXME
- Required per slot: `export const POST =` (exports), `export async function` (handler)
- Retry feedback: previous output + failure reason auto-injected into next attempt

## See also

- `gks/14_devlog/experiment/EXP-2026-04-19-qwen-codegen-benchmark.md` — benchmark report
- `msp/ARCHITECTURE_OVERVIEW.md` — overall MSP/GKS architecture
- `.brain/msp/LLM_Contract/codegen_microtask_contract.yaml` — SLM constraints
