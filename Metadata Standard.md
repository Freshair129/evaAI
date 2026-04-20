# **GKS v3 Metadata & Phase Standard**

มาตรฐานการกำกับดูแลเอกสารเพื่อให้ Agent สามารถระบุ "Phase" และ "ความสัมพันธ์" ของข้อมูลได้โดยไม่ต้องพึ่งพาโครงสร้างโฟลเดอร์

## **1\. โครงสร้าง Frontmatter (YAML)**

ทุกไฟล์ในระบบ GKS ต้องเริ่มด้วย Frontmatter ตามรูปแบบนี้:

id: "{PREFIX}--{UNIQUE\_NAME}" \# เช่น CONCEPT--POS-SYSTEM  
phase: {0-6}                 \# ระบุ Phase ตาม Master Spec  
type: "{TYPE}"               \# เช่น idea, concept, algorithm, entity, framework  
status: "{STATUS}"           \# stub, raw, stable, verified, deprecated  
vault\_id: "{VAULT\_ID}"       \# ID ของโมดูล (เช่น POS-001)  
epistemic:  
  confidence: {0.0-1.0}      \# ระดับความมั่นใจ  
  source\_type: "{SOURCE}"    \# direct\_experience, external, inference, axiom  
crosslinks:  
  derived\_from: \["ID"\]       \# ชี้กลับไป Phase ก่อนหน้า (Upstream)  
  implements: \["ID"\]         \# ชี้ไปหาเป้าหมาย/กฎที่ต้องทำตาม  
  used\_by: \["ID"\]           \# ใครอ้างอิงถึงเราบ้าง (Downstream)

## **2\. การระบุ Phase ผ่าน ID Prefix**

| Phase | ID Prefix | คำอธิบาย |
| :---- | :---- | :---- |
| **P0** | IDEA-- | ไอเดียดิบ, พรอมต์โง่ๆ, บันทึกสั้นๆ |
| **P1** | CONCEPT-- | แนวคิดทางธุรกิจ, PRD, User Story |
| **P2** | ALGO-- | ขั้นตอนการคำนวณและลอจิก |
| **P2** | ENTITY-- | นิยามข้อมูลและ Schema |
| **P2** | FLOW-- | เส้นทางการไหลของข้อมูล/UI |
| **P2** | FEAT-- | รายละเอียดฟีเจอร์และพฤติกรรมระบบ |
| **P2** | PARAMS-- | ตัวเลข, ค่าคงที่, Config ทางธุรกิจ |
| **P2** | FRAME-- | มาตรฐานโค้ดและสถาปัตยกรรม |
| **P3** | BLUEPRINT-- | แผนการแก้ไขโค้ด (YAML) |
| **P5** | AUDIT-- | รายงานการตรวจสอบคุณภาพและ Test Results |

## **3\. สถานะเอกสาร (Status Lifecycle)**

1. **Stub:** มีแค่หัวข้อและพิกัดไฟล์ (สร้างโดย Auto-Discovery หรือมนุษย์ที่จองที่ไว้)  
2. **Raw:** มีเนื้อหาเบื้องต้น แต่ยังไม่ได้รับการวิเคราะห์ผลกระทบครบถ้วน  
3. **Stable:** เนื้อหาสมบูรณ์ พร้อมให้ Agent นำไปใช้เขียนโค้ด (Phase 4\)  
4. **Verified:** ผ่านการตรวจสอบความถูกต้องกับโค้ดจริงใน Phase 5 แล้ว  
5. **Deprecated:** ข้อมูลที่ล้าสมัย ไม่ควรนำมาอ้างอิงอีก

## **4\. กฎการตรวจสอบ (Validation Rule)**

Agent (Tier 3\) จะถือว่าข้อมูลนั้น **"กำพร้า"** และต้องแจ้งเตือนทันที หากพบเงื่อนไขดังนี้:

* ไฟล์ไม่มีฟิลด์ phase ใน Frontmatter  
* ไฟล์ใน Phase 1 (CONCEPT--) ไม่มีฟิลด์ derived\_from ชี้กลับไป IDEA--  
* ไฟล์ใน Phase 2 ไม่มีฟิลด์ implements ชี้กลับไป CONCEPT-- หรือ LAWS--