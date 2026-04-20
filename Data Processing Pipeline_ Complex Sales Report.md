# **Data Processing Pipeline: Complex Sales Report**

**เป้าหมาย:** แปลงไฟล์ข้อมูลดิบที่ไม่มีโครงสร้างที่แน่นอน (1SALES REPORT\_2013\_2025\_update.xlsx) ให้อยู่ในรูปแบบข้อมูลมาตรฐาน (Structured Data / JSON) เพื่อนำไปใช้งานต่อ

## **🗺️ ภาพรวมสถาปัตยกรรม (Pipeline Architecture)**

\[ 1\. Ingestion \] \---\> \[ 2\. Router/Classifier \] \---\> \[ 3\. Extraction Engines \] \---\> \[ 4\. Standardization \] \---\> \[ 5\. Output \]  
(โหลดไฟล์ต้นฉบับ)        (แยกประเภทแท็บ/Sheet)               (สกัดข้อมูลตามประเภท)             (ทำความสะอาด & จัดฟอร์แมต)    (บันทึกข้อมูล)

## **🛠️ รายละเอียดการทำงานแต่ละขั้นตอน (Step-by-Step Flow)**

### **Step 1: Data Ingestion (นำเข้าข้อมูล)**

**เลิกใช้ไฟล์ CSV ที่ถูกแยกย่อยนับร้อยไฟล์** เพราะจะทำให้การจัดการยุ่งยาก ให้กลับไปใช้ไฟล์ .xlsx ต้นฉบับเพียงไฟล์เดียว

* **เครื่องมือ:** pandas หรือ openpyxl ใน Python  
* **Action:** ใช้คำสั่งโหลดไฟล์และอ่านทุก Sheet เข้ามาเก็บไว้ในหน่วยความจำ (Memory) ในรูปแบบ Dictionary {'Sheet\_Name': DataFrame}

### **Step 2: Router / Classifier (คัดกรองและแยกประเภท Sheet)**

เขียนฟังก์ชันตรวจสอบชื่อ Sheet หรือสแกนข้อมูล 5 บรรทัดแรก เพื่อแยกประเภท (Categorize) ว่า Sheet นี้คือข้อมูลแบบไหน แล้วส่งไปหา Engine ที่เหมาะสม

* **Group A (Monthly Sales):** ชื่อ Sheet เป็นชื่อเดือนและปี (เช่น Jan 26, Feb 25, DEC19) 👉 ส่งไป **Engine A**  
* **Group B (Summary/Total):** ชื่อ Sheet มีคำว่า Total, SUMMARY (เช่น Total (2012\_2017) SUMMARY) 👉 ส่งไป **Engine B**  
* **Group C (Inventory/Logs):** ชื่อ Sheet เกี่ยวกับสต๊อกหรือบันทึกอื่นๆ (เช่น สต๊อก V School, Logbook) 👉 ส่งไป **Engine C**  
* **Group D (Messy/Unknown):** Sheet ที่จัดฟอร์แมตมั่วซั่ว หรือไม่มีแพทเทิร์น (เช่น ฟอร์ม, ทดลอง1000) 👉 ส่งไป **AI Engine**

### **Step 3: Extraction Engines (กระบวนการสกัดข้อมูล)**

**⚙️ Engine A & B: Heuristic Parser (ใช้การเขียนโค้ดดักจับ)**

เหมาะสำหรับ Sheet ที่พอมีแพทเทิร์นอยู่บ้าง (เช่น หน้า Monthly Sales)

1. **Find Anchor (หาหัวตารางของจริง):** เขียนลูปสแกนหาบรรทัดที่มีคำว่า AMOUNT (VAT INCLUDED) หรือ EX VAT เพื่อใช้เป็นบรรทัด Header (ข้ามบรรทัดขยะข้างบนทิ้ง)  
2. **Filter Rows (กรองบรรทัดข้อมูล):** \* ตัดบรรทัดที่มีคำว่า Total, รวม, ยอดยกมา ทิ้งไป  
   * ตัดบรรทัดที่คอลัมน์ "ยอดเงิน" เป็นค่าว่าง (NaN) ทิ้งไป  
3. **Extract:** ดึงเฉพาะคอลัมน์ที่ต้องการ (เช่น วันที่, รายการ, ยอดรวม)

**🧠 AI Engine: LLM Data Extractor (ไพ่ตายสำหรับตารางมั่ว)**

เหมาะสำหรับตารางที่มีการรวมเซลล์ (Merge cell), มีการโน้ตข้อความแทรก (เช่น "ลูกค้าที่สนใจ ต้องตามต่อ"), หรือมีตารางหลายอันในหน้าเดียว

1. **Text Conversion:** แปลง DataFrame หน้านั้นให้ออกมาเป็น String แบบ CSV ดิบๆ หรือ Markdown Table  
2. **Prompting:** ส่ง Text นั้นเข้า Local LLM (เช่น Llama-3, Qwen) หรือ API (Gemini/OpenAI) พร้อมคำสั่ง:"คุณคือผู้เชี่ยวชาญด้าน Data Extraction จงดึงข้อมูลยอดขายจาก Text ที่ยุ่งเหยิงนี้ แยกเป็น 'วันที่', 'ชื่อลูกค้า/รายการ', 'ยอดเงิน' และ 'สถานะการจ่ายเงิน' ตัดข้อความที่เป็นโน้ตขยะทิ้งไป คืนค่าเป็น JSON Array เท่านั้น"  
3. **JSON Parsing:** รับผลลัพธ์จาก AI มาแปลงกลับเป็นข้อมูลโครงสร้าง

### **Step 4: Standardization & Validation (จัดมาตรฐานข้อมูล)**

ข้อมูลที่สกัดได้จาก Step 3 จะถูกนำมารวมกันและจัดให้อยู่ในฟอร์แมตเดียวกัน (Schema Mapping)

* **Data Types:** \* เปลี่ยน "วันที่" ให้อยู่ในฟอร์แมต YYYY-MM-DD  
  * เปลี่ยน "ยอดเงิน" ให้เป็นตัวเลข Float ทั้งหมด ลบเครื่องหมาย , ออก  
* **Schema (โครงสร้างเป้าหมาย):** ข้อมูลทุกแถวจะต้องออกมาหน้าตาแบบนี้  
  {  
    "source\_sheet": "Jan 26",  
    "transaction\_date": "2026-01-05",  
    "description": "Dinner VMC by K. WL",  
    "amount\_inc\_vat": 12000.00,  
    "amount\_ex\_vat": 11214.95,  
    "status": "paid",  
    "category": "Monthly Sales"  
  }

### **Step 5: Output Destination (การบันทึกผล)**

บันทึกข้อมูลที่ผ่านการคลีนแล้วไปเก็บไว้ในที่ที่นำไปใช้ทำ Report (เช่น PowerBI, Tableau) หรือใช้เขียน Web App ได้ง่าย

* **แนะนำ:** บันทึกเป็นไฟล์ clean\_database.parquet (เร็วกว่าและดีกว่า CSV)  
* **หรือ:** บันทึกกลับเป็น clean\_data.xlsx ที่มีแค่ Sheet เดียว แต่เป็นตารางยาวๆ แบบ Database (Flat Table)  
* **หรือ:** โยนเข้า Database (PostgreSQL / MongoDB)

## **💻 ตัวอย่าง Pseudocode สำหรับ Controller (Python)**

import pandas as pd

\# 1\. Ingestion  
excel\_file \= pd.read\_excel('1SALES REPORT\_2013\_2025\_update.xlsx', sheet\_name=None)  
all\_clean\_data \= \[\]

\# 2\. Router  
for sheet\_name, df in excel\_file.items():  
      
    if is\_monthly\_sales\_sheet(sheet\_name):  
        clean\_df \= engine\_heuristic\_monthly(df, sheet\_name)  
        all\_clean\_data.append(clean\_df)  
          
    elif is\_summary\_sheet(sheet\_name):  
        clean\_df \= engine\_heuristic\_summary(df, sheet\_name)  
        all\_clean\_data.append(clean\_df)  
          
    else:  
        \# 3\. AI Engine สำหรับหน้าที่จัดการยาก  
        clean\_json \= engine\_llm\_extractor(df, sheet\_name)  
        all\_clean\_data.append(pd.DataFrame(clean\_json))

\# 4 & 5\. Standardization & Output  
final\_df \= pd.concat(all\_clean\_data, ignore\_index=True)  
final\_df \= standardize\_columns(final\_df)  
final\_df.to\_csv('final\_clean\_sales\_data.csv', index=False)  
