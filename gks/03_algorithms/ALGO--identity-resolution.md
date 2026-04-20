---
id: ALGO--identity-resolution
type: algorithm
module: crm
status: stable
summary: "อัลกอริทึมการเชื่อมโยงตัวตนลูกค้าข้ามแพลตฟอร์ม (Cross-Platform Identity Merging)"
tags: [crm, identity, hashing, matching]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Algorithm: Cross-Platform Identity Resolution

## 1. Goal
เพื่อให้ระบบสามารถจำลูกค้าคนเดียวกันได้ แม้ลูกค้าจะทักมาจากช่องทางที่ต่างกัน (FB Messenger, LINE OA) หรือสั่งซื้อผ่าน POS หน้าร้าน

## 2. Dynamic Matching Rules (The Logic)
### Rule 1: Phone Matching (Primary)
- เมื่อได้รับเบอร์โทรศัพท์จากสลิป ([[ALGO--slip-ocr]]), การลงทะเบียน, หรือพนักงานกรอก
- Normalize เบอร์โทรให้เป็นรูปแบบ E.164 (`+66XXXXXXXXX`)
- Query ฐานข้อมูล `Customer` ที่มีเบอร์โทรตรงกันภายใต้ `tenant_id` เดียวกัน
- หากเจอ -> ทำการเชื่อมโยง Platform ID (FB PSID / LINE userId) เข้ากับ Customer ID นั้น

### Rule 2: Email Matching (Secondary)
- ใช้หลักการเดียวกับเบอร์โทร แต่มีน้ำหนักความน่าเชื่อถือน้อยกว่า (หากเป็นอีเมลสาธารณะ)

### Rule 3: Manual Merge
- หากพนักงานพบว่า Record ซ้ำซ้อน -> ใช้ระบบ **Manual Merge** เพื่อรวมพิกัด Identity, ประวัติการแชท และยอดซื้อเข้าด้วยกัน

## 3. Conflict Resolution
- หากชื่อของ Profile จาก FB และ LINE ไม่ตรงกัน -> ให้ยึดชื่อที่พนักงานตั้งให้ (System Name) เป็นหลัก หรือใช้ข้อมูลล่าสุดที่มีการอัปเดต

## 4. Safety Guard
- **Tenant Isolation**: ห้าม Match ข้าม `tenant_id` โดยเด็ดขาด แม้เบอร์โทรศัพท์จะตรงกัน
