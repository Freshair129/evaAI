High-Level Flow 
User
  ↓
EVA (Agent Runtime)
  ↓
MSP (Orchestrator / Brain)
  ↓
[GKS + Retrieval Layer]
  ↓
MSP (synthesis + decision)
  ↓
EVA (response shaping)
  ↓
User
0. User Input
{
  "message": "How does EVA memory system work?",
  "sessionId": "MSP-SESS-260422001"
}
1. EVA → Preprocess

EVA ทำ 3 อย่าง:

parse intent เบื้องต้น
normalize input
attach context session
{
  "intent": "explain",
  "query": "EVA memory system",
  "sessionId": "...",
  "historyRef": [...]
}

แล้วส่ง:

POST /msp/context.resolve
2. MSP → Context Resolver (🔥 Core Brain)

MSP จะ “ไม่รีบตอบ”
แต่จะ “คิดก่อนว่าใช้ knowledge อะไร”

2.1 Intent Routing
if (intent === "code") → bias = BLUEPRINT
if (intent === "design") → bias = ADR / FRAME
if (intent === "explain") → bias = CONCEPT
2.2 Retrieval Plan

MSP สร้าง plan:

{
  "strategies": [
    "vector_search",
    "keyword_search",
    "graph_traversal"
  ],
  "weights": {
    "semantic": 0.5,
    "keyword": 0.2,
    "graph": 0.3
  }
}
3. MSP → Retrieval Layer
3.1 Vector Search
vectorDB.search(query, k=10)
3.2 Keyword Search (fast + cheap)
ripgrep "EVA memory" gks/
3.3 Graph Traversal (จาก Obsidian links)
หา [[backlinks]]
depth = 1–2
4. Merge + Re-rank

MSP รวม result:

[
  { id: "CONCEPT--EVA-MEMORY", score: 0.91 },
  { id: "ADR--MEMORY-ARCH", score: 0.87 }
]

แล้ว apply:

recency boost
type priority
session relevance
5. Context Packaging

MSP ไม่ส่ง raw ทั้งก้อน
แต่ “จัด context ให้ model กิน”

{
  "contextBlocks": [
    {
      "id": "CONCEPT--EVA-MEMORY",
      "summary": "...",
      "source": "gks/..."
    }
  ],
  "instructions": {
    "style": "explain",
    "depth": "medium"
  }
}
6. EVA → Generate Response

ตอนนี้ EVA “เพิ่งเริ่มคิดจริง”

Input ที่ EVA ได้:

user query
curated context (จาก MSP)
session memory

EVA ทำ:

reasoning
synthesis
response drafting
7. EVA → MSP (Optional Feedback Loop)
POST /msp/task.complete

พร้อม:

output
confidence
usedKnowledgeIds
8. MSP → Post-process (🔥 จุดที่คนอื่นไม่มี)
8.1 Knowledge Extraction

ถ้ามี insight ใหม่:

POST /msp/knowledge.propose
8.2 Logging
POST /msp/audit.log
8.3 Memory Update (Episodic)

สรุป session → .eva/memory/

9. EVA → User Response
{
  "answer": "...",
  "sources": ["CONCEPT--EVA-MEMORY"],
  "confidence": 0.88
}

flowchart TD

U[User] --> E1[EVA: Preprocess]

E1 --> M1[MSP: Context Resolve]

M1 --> M2[Intent Routing]
M2 --> M3[Retrieval Plan]

M3 --> R1[Vector Search]
M3 --> R2[Keyword Search]
M3 --> R3[Graph Traversal]

R1 --> M4[Merge & Rerank]
R2 --> M4
R3 --> M4

M4 --> M5[Context Packaging]

M5 --> E2[EVA: Generate Response]

E2 --> M6[MSP: Post-process]

M6 --> K1[Knowledge Propose]
M6 --> A1[Audit Log]
M6 --> MEM[Update Memory]

M6 --> E3[EVA: Final Response]

E3 --> U

Insight สำคัญ (อันนี้คือของจริง)
1. EVA ไม่ควร “ยิง vector DB ตรง”

👉 ไม่งั้น:

logic กระจาย
debug ยาก
scale ไม่ได้
2. MSP = abstraction layer ของ intelligence

คุณสามารถ:

เปลี่ยน vector DB
เปลี่ยน search strategy
เพิ่ม rule engine

โดย EVA ไม่ต้องรู้เลย

3. GKS = static truth

MSP = dynamic intelligence

4. Flow นี้รองรับอนาคต:
multi-agent debate
tool calling
self-reflection loop
auto knowledge evolution
TL;DR

Flow ที่ถูกต้อง:

User → EVA (parse) → MSP (คิด+หา) → GKS/RAG (ดึง) → MSP (จัด) → EVA (ตอบ) → MSP (เก็บ+เรียนรู้)