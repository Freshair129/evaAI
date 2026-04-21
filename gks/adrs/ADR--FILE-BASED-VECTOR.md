---
id: "ADR--FILE-BASED-VECTOR"
phase: 2
type: "adr"
status: "raw"
vault_id: "EVA-AGENT-001"
epistemic:
  confidence: 0.75
  source_type: "inference"
crosslinks:
  derived_from: ["CONCEPT--EVA-TRI-BRAIN"]
  implements: ["FRAME--TRI-BRAIN-ARCHITECTURE"]
  used_by: []
---

# ADR--FILE-BASED-VECTOR — Use File-Based Vector Store (No External DB)

> **Status:** Accepted
> **Date:** 2026-04-21

---

## Context

Agent ต้อง semantic search บน GKS + Obsidian vault (~หลักพัน markdown files). ทางเลือกคือใช้ vector DB (Qdrant/Chroma/pgvector) หรือเก็บ embedding เป็นไฟล์

---

## Decision

ใช้ **file-based vector store** — เก็บ embedding ใน JSONL และ cosine similarity ทำใน memory

### Structure

```
.brain/msp/vector/
├── atomic.jsonl          # embedding ของทุก atomic note ใน gks/
├── obsidian.jsonl        # embedding ของ Obsidian vault (ถ้า enabled)
├── episodic.jsonl        # embedding ของ session memory
└── _manifest.json        # version, model, dim, count, last_updated
```

### File Format

```jsonl
{"id":"CONCEPT--POS-SYSTEM","path":"gks/concepts/POS.md","chunk":0,"text":"...","vec":[0.021,-0.13,...],"meta":{"phase":1}}
{"id":"ADR--042","path":"gks/adrs/ADR-042.md","chunk":0,"text":"...","vec":[...],"meta":{}}
```

### Embedding Model

- **Primary**: `bge-m3` (multilingual, รองรับไทยดี) via Ollama `ollama run bge-m3`
- **Fallback**: OpenAI `text-embedding-3-small` ผ่าน API (ถ้า local ล่ม)
- **Dimension**: 1024 (bge-m3) / 1536 (openai)

### Search Algorithm

1. Load JSONL → memory (lazy, ทำครั้งแรก)
2. Embed query
3. Cosine similarity กับทุก row (brute force)
4. Return top-K

สำหรับ ~10k chunks, brute force ใช้เวลา ~10-50ms — ยอมรับได้

---

## Alternatives Considered

### A. Qdrant (local docker)
- ✅ Production-grade, scales ดี
- ❌ ต้องติดตั้ง/รัน Docker
- ❌ Overkill สำหรับ <100k vectors
- ❌ เพิ่มจุดล้ม (Docker ล่ม = agent ใช้งานไม่ได้)

### B. Chroma (embedded SQLite)
- ✅ No external process
- ❌ เพิ่ม native dependency (ปัญหา Windows install)
- ❌ Migration ยุ่งยาก

### C. pgvector
- ❌ ต้อง Postgres — หนักเกินสำหรับ agent เดี่ยว

### D. File-based (chosen)
- ✅ Zero infrastructure
- ✅ Git-trackable (รู้ว่า embedding เปลี่ยนเมื่อไหร่)
- ✅ Portable (copy folder = backup)
- ✅ Debug ง่าย (จับตาดูด้วย `jq`)
- ❌ Scale จำกัด (~100k vectors ก่อน memory จะพอง)
- ❌ ไม่มี ANN index (brute force เท่านั้น)

---

## Consequences

### Positive
- Setup ง่าย, ไม่มี external service
- Deploy = เอาโฟลเดอร์ไป
- Integrate กับ GKS governance ได้ตรง (embed file = embed document)

### Negative
- ถ้าเกิน ~100k chunks ต้องย้ายไป real vector DB
- ไม่มี real-time incremental update (ต้อง re-embed ทั้งไฟล์เมื่อแก้)
- Loading time เพิ่มขึ้นเมื่อ vector file โต

### Scale-out Plan
- เมื่อ `.brain/msp/vector/atomic.jsonl` เกิน **50MB** หรือ query > 200ms → ย้ายไป Qdrant
- Migration path: แค่เปลี่ยน adapter ใน `src/memory/vector/index.ts` — API ไม่เปลี่ยน

---

## Implementation Notes

- Re-embed trigger: `scripts/msp/re-embed.mjs` scan mtime diff → update เฉพาะไฟล์ที่เปลี่ยน
- Chunk strategy: split ตาม heading + max 512 tokens overlap 64
- Integrate กับ `re-indexer.mjs` เดิม (run คู่กัน)
- Hook pre-commit: เตือนถ้า atomic.jsonl ไม่ sync กับ atomic_index.jsonl
