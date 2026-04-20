# **User Journey: ประสบการณ์ผู้ใช้งานและการจัดการกรรมสิทธิ์ในระบบ SaaS CRM**

เอกสารฉบับนี้รวบรวมเส้นทางของผู้ใช้งาน (User Journey) ตั้งแต่เริ่มรู้จักระบบ ไปจนถึงการใช้งานเชิงลึกและการบริหารจัดการทีม รวมถึงขั้นตอนการโอนสิทธิ์ความเป็นเจ้าของ (Ownership Transfer) และการจัดการหลายพื้นที่ทำงาน (Multi-Tenant)

## **1\. ระยะที่ 1: การค้นพบ (Awareness & Discovery)**

**เป้าหมาย:** มองหาเครื่องมือมาแก้ปัญหาการจัดการลูกค้า

* **สถานการณ์:** ข้อมูลลูกค้ากระจัดกระจายใน Excel หรือ Line ทำให้ติดตามงานยาก ข้อมูลสูญหายเมื่อพนักงานลาออก  
* **Touchpoints:** ค้นหาผ่าน Google, อ่านรีวิวบน Social Media, หรือได้รับคำแนะนำจากพนักงาน/พาร์ทเนอร์  
* **Action:** เข้าชมหน้า Landing Page เพื่อดูฟีเจอร์และราคา แล้วตัดสินใจสมัครใช้งานแบบ **Free Trial**

## **2\. ระยะที่ 2: การเริ่มต้นใช้งาน (Onboarding & Setup)**

**เป้าหมาย:** ตั้งค่าระบบให้พร้อมใช้งานเร็วที่สุด (Time to Value)

### **2.1 การสมัครเปิดระบบ (Public Signup)**

* **User ก (คนแรก):** สมัครผ่านหน้าเว็บหลัก (saas.com/signup)  
* **Tenant Creation:** ระบบสร้างพื้นที่ทำงานใหม่ (Workspace) และมอบบทบาท **Owner (เจ้าของ)** ให้ User ก ทันที  
* **Setup Wizard:** ระบบนำทางให้ตั้งค่าประเภทธุรกิจ, สกุลเงิน, และอัปโหลดไฟล์ลูกค้า (CSV/Excel)

### **2.2 กรณีพนักงานสมัครแทนเจ้านาย (Proxy Setup)**

ในกรณีที่เจ้านายมอบหมายให้พนักงานเป็นคนเซตระบบให้:

1. **Setup โดยพนักงาน:** พนักงานดำเนินการในฐานะ Owner ชั่วคราว เพื่อเตรียมระบบให้พร้อมใช้  
2. **การส่งคำเชิญ:** พนักงานเชิญเจ้านายเข้ามาในระบบผ่านเมนูทีม  
3. **การโอนสิทธิ์:** เมื่อระบบพร้อม พนักงานจะทำการโอนสิทธิ์ความเป็นเจ้าของให้เจ้านายจริง

## **3\. ระยะที่ 3: การขยายทีมและการใช้งาน (Active Usage)**

**เป้าหมาย:** ทำงานร่วมกับทีมเพื่อปิดการขาย

### **3.1 การเชิญทีมงาน (Invitation Flow)**

* **Admin Action:** Owner/Admin ส่งลิงก์เชิญพิเศษทางอีเมล (Invitation Link)  
* **Role Assignment:** กำหนดบทบาทให้ทีมงานทันที (เช่น Sales, Manager, Admin)  
* **Member Join:** ทีมงานกดลิงก์เชิญเพื่อตั้งรหัสผ่าน และเข้าสู่ Tenant เดิมโดยอัตโนมัติ

## **4\. การจัดการกรณี "User หนึ่งคน มีหลายบริษัท" (Multi-Tenant Experience)**

หากคนที่ถูกเชิญมีระบบ CRM ของตัวเองอยู่แล้ว (เป็น Owner ที่อื่น) ระบบจะจัดการดังนี้:

1. **Identity Shared, Data Isolated:** \* ระบบจะใช้ **อีเมลเดียว** เป็นตัวระบุตัวตน (Unique Identity)  
   * แต่ **ข้อมูลลูกค้าและสิทธิ์ (Role)** จะถูกแยกขาดตาม Tenant ID ข้อมูลบริษัท A จะไม่มีทางหลุดไปบริษัท B  
2. **Workspace Switcher:** \* เมื่อ User Login เข้ามา ระบบจะแสดงหน้า **"เลือกพื้นที่ทำงาน" (Workspace Selection)** เพื่อให้เลือกว่าจะเข้าบริษัทไหน  
   * ภายในแอปจะมีเมนู "Switch Workspace" เพื่อให้สลับไปมาระหว่างบริษัทได้โดยไม่ต้อง Logout  
3. **Role Independence:**  
   * User คนนี้สามารถเป็น **Owner** ในบริษัทตัวเอง (Company A)  
   * และในขณะเดียวกันสามารถเป็นแค่ **Member** ในบริษัทที่ถูกเชิญ (Company B) ได้พร้อมๆ กัน

## **5\. ระบบการโอนกรรมสิทธิ์ (Ownership Transfer Management)**

เมื่อต้องการเปลี่ยนตัวผู้รับผิดชอบหลัก หรือส่งต่อระบบจากพนักงานให้เจ้าของกิจการ

### **5.1 ขั้นตอนการโอนสิทธิ์ (Transfer Workflow)**

1. **ผู้โอน (Current Owner):** เข้าไปที่เมนู **Account Settings \> Ownership**.  
2. **การเลือกผู้รับ:** ระบบแสดงรายชื่อสมาชิกที่มีบทบาทเป็น **Admin** เท่านั้น  
3. **การยืนยัน:** ระบบแสดงข้อความเตือน *"การโอนสิทธิ์จะทำให้คุณไม่สามารถจัดการเรื่องการชำระเงินหรือลบบัญชีบริษัทได้อีกต่อไป"*  
4. **ความปลอดภัย:** ต้องระบุรหัสผ่านหรือยืนยันผ่าน OTP เพื่อทำรายการ  
5. **ผลลัพธ์:** \* ผู้รับสิทธิ์ใหม่เปลี่ยนจาก Admin \-\> **Owner**  
   * ผู้โอนเดิมเปลี่ยนจาก Owner \-\> **Admin** (หรือตามที่ตกลงกัน)

## **6\. ระยะที่ 4: การวิเคราะห์และปรับปรุง (Analysis & Optimization)**

**เป้าหมาย:** ดูภาพรวมเพื่อตัดสินใจเชิงธุรกิจ

* **Reporting:** เจ้าของระบบดูรายงานยอดขายรายบุคคล หรือแหล่งที่มาของลูกค้า  
* **Forecasting:** คาดการณ์รายได้จาก Sale Pipeline ในเดือนถัดไป

## **7\. ระยะที่ 5: การใช้ซ้ำและบอกต่อ (Retention & Advocacy)**

**เป้าหมาย:** ขยายการใช้งานให้เติบโตไปพร้อมกับธุรกิจ

* **Subscription:** ต่ออายุการใช้งาน หรืออัปเกรดเป็นแพ็กเกจที่สูงขึ้น  
* **Referral:** แนะนำระบบให้พาร์ทเนอร์ใช้งานเพื่อรับสิทธิพิเศษ

## **8\. สรุปบทบาทและความแตกต่าง (Role Summary)**

| หัวข้อ | Owner (เจ้าของ) | Admin (ผู้ดูแล) | Member (พนักงาน) |
| :---- | :---- | :---- | :---- |
| **สิทธิ์สูงสุด** | มี (จ่ายเงิน, ลบระบบ, โอนสิทธิ์) | มี (เพิ่ม/ลดทีมงาน, ดู Report) | ไม่มี (ดูเฉพาะงานตัวเอง) |
| **การจัดการ Billing** | จัดการได้ทั้งหมด | ดูได้บางส่วน | เข้าถึงไม่ได้ |
| **การลบข้อมูล** | ลบ Tenant ได้ | ลบข้อมูลลูกค้าได้ | ลบข้อมูลตัวเองได้เท่านั้น |

### **แผนผังการตรวจสอบสิทธิ์ (Permission Logic)**

1. **Identity Check:** เมื่อ Login ระบบจะเช็ค User ID \-\> Tenant ID \-\> Role  
2. **UI Adaptation:** ระบบจะแสดงผล UI ตาม Role ของ Tenant ที่กำลัง "Active" อยู่ในขณะนั้น

   **// ตัวอย่าง Prisma Schema สำหรับระบบ CRM แบบ SaaS (Multi-tenant)**  
3. // รองรับการใช้งานผ่าน Supabase และจัดการสิทธิ์ผ่าน Membership  
4.   
5. generator client {  
6.   provider \= "prisma-client-js"  
7. }  
8.   
9. datasource db {  
10.   provider  \= "postgresql"  
11.   url       \= env("DATABASE\_URL")  
12.   directUrl \= env("DIRECT\_URL") // สำหรับการเชื่อมต่อตรงกับ Supabase  
13. }  
14.   
15. // กำหนดบทบาทของผู้ใช้งานในแต่ละ Workspace  
16. enum Role {  
17.   OWNER    // เจ้าของระบบ (มีได้ 1 คนต่อ 1 Tenant หรือตามเงื่อนไขการโอนสิทธิ์)  
18.   ADMIN    // ผู้ดูแลระบบ (จัดการทีมได้)  
19.   MANAGER  // หัวหน้าทีม (ดูรีพอร์ตและทีมได้)  
20.   MEMBER   // พนักงานทั่วไป (จัดการข้อมูลลูกค้าของตนเอง)  
21. }  
22.   
23. // ข้อมูลผู้ใช้งานหลัก (Unique Identity)  
24. model User {  
25.   id            String       @id @default(uuid())  
26.   email         String       @unique  
27.   name          String?  
28.   avatarUrl     String?  
29.   createdAt     DateTime     @default(now())  
30.   updatedAt     DateTime     @updatedAt  
31.   
32.   // ความสัมพันธ์: หนึ่งคนสามารถเป็นสมาชิกได้หลายบริษัท (Multi-tenant)  
33.   memberships   Membership\[\]  
34. }  
35.   
36. // ข้อมูลพื้นที่ทำงาน หรือ บริษัท (Tenant)  
37. model Tenant {  
38.   id            String       @id @default(uuid())  
39.   name          String       // ชื่อบริษัท  
40.   slug          String       @unique // สำหรับ URL เช่น company-a.crm.com  
41.   createdAt     DateTime     @default(now())  
42.   updatedAt     DateTime     @updatedAt  
43.   
44.   // ความสัมพันธ์: หนึ่งบริษัทมีสมาชิกได้หลายคน  
45.   memberships   Membership\[\]  
46.     
47.   // ข้อมูลทางธุรกิจภายในบริษัทนั้นๆ (Data Isolated by tenantId)  
48.   contacts      Contact\[\]  
49.   leads         Lead\[\]  
50.   deals         Deal\[\]  
51. }  
52.   
53. // ตารางกลางสำหรับจัดการสิทธิ์ (Mapping User \<-\> Tenant)  
54. model Membership {  
55.   id        String   @id @default(uuid())  
56.   userId    String  
57.   tenantId  String  
58.   role      Role     @default(MEMBER) // บทบาทในบริษัทนี้  
59.   joinedAt  DateTime @default(now())  
60.   
61.   user      User     @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)  
62.   tenant    Tenant   @relation(fields: \[tenantId\], references: \[id\], onDelete: Cascade)  
63.   
64.   // ป้องกันการสมัครสมาชิกซ้ำในบริษัทเดียวกัน  
65.   @@unique(\[userId, tenantId\])  
66. }  
67.   
68. // \--- ส่วนของข้อมูล CRM (Business Data) \---  
69.   
70. model Contact {  
71.   id        String   @id @default(uuid())  
72.   tenantId  String   // เชื่อมโยงกับบริษัท  
73.   firstName String  
74.   lastName  String  
75.   email     String?  
76.   phone     String?  
77.   createdAt DateTime @default(now())  
78.   updatedAt DateTime @updatedAt  
79.   
80.   tenant    Tenant   @relation(fields: \[tenantId\], references: \[id\], onDelete: Cascade)  
81.   deals     Deal\[\]  
82.   
83.   @@index(\[tenantId\]) // เพิ่ม Index เพื่อให้ค้นหาข้อมูลตามบริษัทได้เร็วขึ้น  
84. }  
85.   
86. model Lead {  
87.   id        String   @id @default(uuid())  
88.   tenantId  String  
89.   title     String   // หัวข้อความสนใจ  
90.   status    String   @default("NEW") // NEW, CONTACTED, QUALIFIED, LOST  
91.   source    String?  // แหล่งที่มา เช่น Facebook, Google  
92.   createdAt DateTime @default(now())  
93.   
94.   tenant    Tenant   @relation(fields: \[tenantId\], references: \[id\], onDelete: Cascade)  
95.   
96.   @@index(\[tenantId\])  
97. }  
98.   
99. model Deal {  
100.   id        String   @id @default(uuid())  
101.   tenantId  String  
102.   contactId String  
103.   amount    Float    @default(0)  
104.   stage     String   // PROPOSAL, NEGOTIATION, CLOSED\_WON, CLOSED\_LOST  
105.   closeDate DateTime?  
106.   
107.   tenant    Tenant   @relation(fields: \[tenantId\], references: \[id\], onDelete: Cascade)  
108.   contact   Contact  @relation(fields: \[contactId\], references: \[id\])  
109.   
110.   @@index(\[tenantId\])  
111. }