Scoring Formula (semantic vs keyword vs graph)
เป้าหมาย

ไม่ใช่ “หาเอกสารที่คล้ายที่สุด”
แต่คือ หา context ที่ “ตอบคำถามได้ดีที่สุด”

🧠 สูตรหลัก (Hybrid Score)
finalScore =
  (w_semantic * S_semantic) +
  (w_keyword  * S_keyword)  +
  (w_graph    * S_graph)    +
  (w_recency  * S_recency)  +
  (w_type     * S_typeBoost)
1. Semantic Score (vector)
S_semantic = cosine_similarity(query_embedding, doc_embedding)
range: 0 → 1
จุดแข็ง: เข้าใจความหมาย
จุดอ่อน: บางที “มั่วแบบเนียน”
2. Keyword Score (BM25 / TF-IDF)
S_keyword = BM25(query, doc)
normalize → 0–1
จุดแข็ง: แม่น exact term
จุดอ่อน: ไม่เข้าใจ context
3. Graph Score (🔥 ตัวโกงของคุณ)

คิดแบบนี้:

S_graph =
  (0.6 * direct_link) +
  (0.3 * shared_neighbors) +
  (0.1 * centrality)
อธิบาย:
direct_link = มี backlink กับ doc ที่ relevant ไหม
shared_neighbors = share topic cluster เดียวกัน
centrality = node สำคัญใน graph ไหม (degree / pagerank)

👉 Obsidian wikilink = gold mine ตรงนี้

4. Recency Boost
S_recency = exp(-lambda * age_in_days)
lambda ~ 0.01–0.05
ใหม่กว่า = ได้คะแนนเพิ่ม
5. Type Boost (สำคัญมาก)
S_typeBoost =
  if intent == "explain" → CONCEPT +0.2
  if intent == "design"  → ADR +0.3
  if intent == "code"    → BLUEPRINT +0.4
🔧 Weight Recommendation (เริ่มต้น)
Component	Weight
semantic	0.45
keyword	0.20
graph	0.20
recency	0.10
type	0.05

👉 ปรับตาม use case ทีหลัง

💥 Trick ที่คนไม่ค่อยทำ
“Score Diversity Penalty”

กัน context ซ้ำ:

if (doc.similar_to_selected > 0.9)
  score *= 0.7
2. 🧠 Context Window Optimization (Token Budget)
เป้าหมาย:

ยัด context ให้ “ฉลาดที่สุด” ไม่ใช่ “เยอะที่สุด”

🔥 Step-by-step Strategy
1. Budget Split

สมมติ model = 8K tokens

TOTAL = 8000

system      = 1000
user        = 500
response    = 1500

contextBudget = 5000
2. Chunk Ranking

หลัง scoring:

sort by finalScore DESC
3. Greedy Packing (แต่ต้องฉลาด)
for doc in ranked_docs:
  if tokens_used + doc.tokens < budget:
    add(doc)

แต่ยังไม่พอ…

🔥 Advanced: “Information Density Score”
density = info_units / token_count

👉 เลือก doc ที่ “คุ้ม token”

4. Summarization Layer

ถ้า doc ใหญ่:

if doc.tokens > 500:
   doc = summarize(doc, target=200 tokens)
5. Dedup / Merge
if overlap(docA, docB) > threshold:
   merge(docA, docB)
6. Context Structure (สำคัญมาก)

อย่าส่งมั่ว ๆ แบบ dump

[CONTEXT]

# Concept
- EVA memory = ...

# Architecture
- ADR--MEMORY-ARCH:
  - uses hybrid storage

# Related
- FLOW--REACT-LOOP

[END CONTEXT]

👉 model จะ “คิดเป็น” มากขึ้น

💣 Trick
“Top-K per Type”
CONCEPT: 3
ADR: 2
BLUEPRINT: 2

👉 กัน bias จาก type เดียว

3. 🤖 Multi-Agent Routing

นี่คือจุดที่ระบบคุณ “เหนือ RAG tool ทั่วไป”

🧠 เป้าหมาย

ไม่ใช่แค่เลือก agent
แต่คือ เลือก “สมองที่เหมาะกับงาน”

🔥 Routing Input
{
  "intent": "code",
  "complexity": "high",
  "domain": "backend",
  "confidence": 0.72
}
1. Rule-based Routing (baseline)
if intent == "code" → RWANG
if intent == "design" → EVA-ARCH
if intent == "explain" → EVA
2. Score-based Routing (ดีกว่า)
agentScore =
  (skill_match * 0.5) +
  (past_success * 0.3) +
  (latency * -0.1) +
  (cost * -0.1)
3. Multi-Agent Strategy
A. Single-shot

เลือก agent เดียว

B. Parallel
RWANG → code
EVA → explanation

แล้ว MSP merge

C. Debate Mode (🔥 advanced)
Agent A → answer
Agent B → critique
Agent A → revise
D. Tool-specialized
Agent A → retrieval
Agent B → reasoning
Agent C → formatting
4. Feedback Loop
POST /msp/task.complete

เก็บ:

success/fail
latency
user satisfaction

👉 ใช้ update routing score

💥 Trick
“Confidence Escalation”
if confidence < 0.6:
  → route to stronger agent
  → or multi-agent mode
🔥 รวมภาพทั้งหมด

คุณกำลังมี:

MSP = decision engine
scoring = brain
context = fuel
routing = execution strategy
TL;DR แบบโคตรตรง
Scoring
hybrid = semantic + keyword + graph
graph = advantage ของคุณ
Context
ไม่ใช่ยัดเยอะ → ต้อง optimize density
ต้องมี structure
Multi-agent
เริ่ม rule-based → evolve เป็น score-based
ultimate = debate + feedback loop