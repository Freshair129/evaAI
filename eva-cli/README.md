# 🌌 EVA Agent CLI (v1.0)
> **Architectural SSOT Agent for Zuri**
> Powered by Typhoon (Chat) + Qwen (Code) + Gemma (Fast)

EVA คือ Agent ผู้ช่วยระดับสถาปนิกที่ออกแบบมาเพื่อทำงานร่วมกับโปรเจกต์ Zuri โดยเฉพาะ โดยรวมจุดเด่นของ AI 3 สายพันธุ์เข้าด้วยกันในเครื่องเดียว

---

## 🛠️ การตั้งค่าก่อนเริ่มใช้งาน (Prerequisites)

1.  **Node.js**: ติดตั้งเวอร์ชัน 18 ขึ้นไป
2.  **Ollama**: ต้องมีโมเดลต่อไปนี้ติดตั้งบน SSD (Drive C):
    *   qwen2.5-coder:14b-instruct-q4_K_M
    *   gemma4:e2b
3.  **Doppler**: ติดตั้งและ Login ให้เรียบร้อยเพื่อดึง THAILLM_API_KEY

---

## 📥 การติดตั้ง (Installation)

ไปที่โฟลเดอร์โปรเจกต์และติดตั้ง Dependencies:
\\\powershell
cd G:\eva-cli
npm install
\\\

*(ทางเลือก) หากต้องการเรียกใช้คำสั่ง \eva\ จากทุกที่ในเครื่อง:*
\\\powershell
npm link
\\\

---

## 🚀 วิธีการใช้งาน (Usage)

### 1. การรันในโหมดพัฒนา (Development)
รันจากในโฟลเดอร์โปรเจกต์โดยตรง:
\\\powershell
doppler run -- node bin/eva.js
\\\

### 2. การรันผ่านคำสั่ง Global (หลังรัน npm link)
รันได้จากทุกที่ในเครื่อง:
\\\powershell
doppler run -- eva
\\\

---

## ✨ ความสามารถหลัก (Key Features)

1.  **Hybrid Intelligence (3-in-1)**:
    *   **Typhoon Mode**: เน้นการพูดคุย วางแผน และตรรกะภาษาไทยที่ลื่นไหล (API)
    *   **Qwen Mode**: เน้นการเขียนโค้ดซับซ้อน, SQL, และ Prisma (Local Heavy)
    *   **Gemma Mode**: เน้นการคิดวิเคราะห์เบื้องต้นที่รวดเร็ว (Local Fast)
2.  **Terminal Integration**: EVA สามารถแนะนำคำสั่ง Shell (bash/powershell) และถามเพื่อขออนุญาตรันคำสั่งนั้นให้คุณทันที
3.  **VRAM Optimized**: ระบบถูกออกแบบมาให้รันลื่นไหลบน VRAM 12GB (Sequential Processing)

---

## 📌 หมายเหตุสำหรับการพัฒนา
- ไฟล์ควบคุมหลักอยู่ที่: \in/eva.js\
- หากมีการเพิ่มความสามารถใหม่ (Tools) ให้เข้าไปแก้ไขในไฟล์ดังกล่าวและรันใหม่ได้ทันที

---
*Created by Gemini 3.1 Flash as part of Zuri Benchmark Suite 2026*
