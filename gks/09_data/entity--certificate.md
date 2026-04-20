---
id: entity--certificate
type: data_entity
module: enrollment
status: stable
summary: "นิยามข้อมูลใบประกาศนียบัตร (Certificate Schema)"
tags: [data, schema, certificate]
created_at: 2026-04-14
updated_at: 2026-04-14
---
# Entity: Certificate

## 1. Schema (Logical)
- **id**: UUID
- **certificate_number**: String (unique) - `CERT-[YYYYMMDD]-[SERIAL]`
- **tenant_id**: UUID
- **enrollment_id**: UUID (FK to [[entity--enrollment]])
- **customer_id**: UUID (FK to [[entity--customer]])
- **tier**: Enum (`BASIC_30H`, `PRO_111H`, `MASTER_201H`)
- **issued_at**: Date
- **pdf_url**: String (Link to S3/Storage)
- **metadata**: JSON (Course Name, Student Name at time of issue)

## 2. Relations
- **N : 1** with `Enrollment`
- **N : 1** with `Customer`
