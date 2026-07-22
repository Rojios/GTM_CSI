# Solution Master — GTM Discovery RAG
version: 2.0 | updated: 2026-03-17

## คำแนะนำการใช้งาน
ไฟล์นี้ใช้เป็น knowledge base สำหรับ Discovery Agent
เมื่อ Agent ได้รับ Pains และ Requirements จาก deal
จะ mapping เข้ากับ solution ในไฟล์นี้เพื่อประเมิน Fit Level

---

## 1. Advance Planning

**ชื่อ Solution:** Advance Planning System
**Category:** Software Platform
**Target Industry:** Manufacturing, Automotive, Electronics, Food & Beverage

### Capabilities
- Demand Planning และ Sales Forecasting
- Master Production Schedule (MPS)
- Material Requirements Planning (MRP)
- Capacity Planning และ Constraint Management
- What-if Scenario Analysis
- Supply Chain Optimization

### Pain ที่แก้ได้
- Plan การผลิตไม่แม่นยำ เกิด over/under production
- วัตถุดิบขาดกะทันหัน หยุดสายการผลิต
- ไม่สามารถตอบ delivery date ลูกค้าได้แม่นยำ
- Planner ใช้ Excel plan ด้วยมือ ใช้เวลานาน
- ไม่มี visibility ของ capacity แต่ละ work center

### Standard Features (Fit ทันที)
- Demand forecasting (time-series)
- MPS และ MRP calculation
- Finite capacity scheduling
- Material shortage alert
- Planning dashboard

### Customization Triggers (Partial Fit)
- Integration กับ ERP / MES เดิม
- Custom planning algorithm เฉพาะ industry
- Multi-plant planning ที่ซับซ้อน
- Vendor-managed inventory (VMI) integration

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Real-time machine control
- Financial planning (ต้องใช้ Accounting)
- HR planning (ต้องใช้ HRM)

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single plant, standard MRP | Easy |
| Multi-plant + ERP integration | Medium |
| Complex constraint + multi-vendor | Hard |

---

## 2. Production Planning

**ชื่อ Solution:** Production Planning System
**Category:** Software Platform
**Target Industry:** Manufacturing, Food Processing, Pharmaceutical

### Capabilities
- Work Order creation และ scheduling
- Production routing และ BOM management
- Shop floor scheduling (Gantt chart)
- Resource allocation: machine, labor, material
- Production progress tracking
- Yield และ waste tracking

### Pain ที่แก้ได้
- ไม่รู้ว่าแต่ละ order จะเสร็จเมื่อไหร่
- จัด schedule ด้วยมือ ไม่ทันกับการเปลี่ยนแปลง
- ไม่รู้ว่า machine/คนพอสำหรับ order ที่รับมาไหม
- Rush order เข้ามากระทบ plan เดิม
- ต้นทุน production จริงต่างจาก standard มาก

### Standard Features (Fit ทันที)
- Work Order และ routing management
- Basic Gantt scheduling
- BOM และ recipe management
- Production cost tracking
- Daily production report

### Customization Triggers (Partial Fit)
- Integration กับ ERP / MES
- Custom scheduling algorithm (setup time, sequence)
- Industry-specific compliance (GMP, FDA)
- Subcontract work order management

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Real-time machine monitoring (ต้องใช้ IoT/MES)
- Demand forecasting (ต้องใช้ Advance Planning)
- Quality management system

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single plant, standard routing | Easy |
| Multi-product + ERP integration | Medium |
| Complex scheduling + subcontract | Hard |

---

## 3. Traceability System

**ชื่อ Solution:** Traceability System
**Category:** Software Platform
**Target Industry:** Food & Beverage, Pharmaceutical, Automotive, Electronics

### Capabilities
- Lot/Batch/Serial number tracking ตลอด supply chain
- Forward trace: วัตถุดิบ → สินค้าสำเร็จรูป → ลูกค้า
- Backward trace: ลูกค้า → สินค้า → วัตถุดิบ/Supplier
- Recall management
- GS1 Barcode / QR Code / RFID support
- Certificate of Analysis (CoA) management
- Regulatory compliance reporting

### Pain ที่แก้ได้
- เกิด recall ไม่รู้ว่า lot ไหนกระทบลูกค้าคนไหน
- Audit ใช้เวลานานหาข้อมูล
- ไม่รู้ว่าวัตถุดิบ lot นี้ถูกใช้ใน order ไหนบ้าง
- บันทึก traceability ด้วยกระดาษ หาย ผิดพลาด
- ไม่ผ่าน certification เพราะ traceability ไม่ครบ

### Standard Features (Fit ทันที)
- Lot/Batch tracking (inbound → production → outbound)
- Forward และ Backward trace report
- Barcode/QR scanning
- Basic recall simulation
- Traceability report สำหรับ audit

### Customization Triggers (Partial Fit)
- Integration กับ ERP / WMS เดิม
- Industry-specific certification (FSSC22000, IATF16949)
- Supplier portal
- RFID implementation

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Quality testing equipment integration
- Blockchain-based traceability
- Consumer-facing trace portal (B2C)

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single site, standard lot tracking | Easy |
| Multi-site + ERP + supplier integration | Medium |
| Full supply chain + RFID + certification | Hard |

---

## 4. Warehouse Management System (WMS)

**ชื่อ Solution:** WMS Platform
**Category:** Software Platform
**Target Industry:** Logistics, Retail, Distribution, E-commerce, Manufacturing

### Capabilities
- Inbound: PO receiving, putaway strategy
- Outbound: Pick, Pack, Ship management
- Inventory: Location management, Cycle count
- Barcode / RFID scanning
- 3PL billing และ multi-client management
- Slotting optimization

### Pain ที่แก้ได้
- หา stock ไม่เจอใน warehouse
- Pick error สูง ส่งผิด ส่งช้า
- ไม่รู้ space utilization จริง
- ไม่มี real-time visibility ของ inventory

### Standard Features (Fit ทันที)
- Receive, Putaway, Pick, Pack, Ship
- Location และ zone management
- KPI dashboard
- Barcode scanning (mobile device)

### Customization Triggers (Partial Fit)
- Integration กับ ERP / TMS
- RFID implementation
- 3PL multi-client billing logic

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Conveyor / Automation hardware control
- Route optimization (ต้องใช้ Analytics)
- E-commerce platform

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single warehouse, standard flow | Easy |
| Multi-warehouse + ERP integration | Medium |
| Automation + RFID + 3PL multi-client | Hard |

---

## 5. HRM — Human Resource Management

**ชื่อ Solution:** HRM Platform
**Category:** Software Platform
**Target Industry:** All Industries

### Capabilities
- Employee profile และ organization chart
- Time attendance: เครื่องสแกน, mobile, biometric
- Payroll: OT, allowance, tax, SSO
- Leave management และ approval workflow
- Performance evaluation (KPI, OKR)
- Recruitment และ onboarding
- Training และ development tracking

### Pain ที่แก้ได้
- คำนวณ payroll ด้วย Excel ผิดบ่อย ใช้เวลานาน
- ไม่รู้ข้อมูล headcount, turnover real-time
- Leave approval ช้า ไม่มีระบบ
- Attendance ไม่ accurate เกิด dispute

### Standard Features (Fit ทันที)
- Employee master data
- Time attendance integration
- Standard payroll (Thai labor law)
- Leave management
- Basic HR dashboard

### Customization Triggers (Partial Fit)
- Complex payroll: shift differential, multiple pay grade
- Integration กับ ERP (cost center)
- Custom performance form
- Multi-company payroll

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Accounting / Financial reporting (ต้องใช้ Accounting)
- Training content development
- Legal advisory

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single company, standard payroll | Easy |
| Multi-company + ERP integration | Medium |
| Complex shift + union + multi-country | Hard |

---

## 6. Auto Loan System

**ชื่อ Solution:** Auto Loan Platform
**Category:** Financial Technology
**Target Industry:** Bank, Finance Company, Auto Dealer

### Capabilities
- Loan application และ document management
- Credit scoring และ approval workflow
- Hire purchase calculation (flat rate, effective rate)
- Contract generation และ e-signature
- Payment schedule และ collection management
- Early settlement, refinancing
- BOT compliance reporting
- Integration กับ Credit Bureau

### Pain ที่แก้ได้
- Loan approval ช้า ลูกค้าหนีไปคู่แข่ง
- คำนวณดอกเบี้ยผิดพลาด เกิด dispute
- เอกสาร paper-based หาย ช้า
- ไม่มี visibility ของ portfolio risk

### Standard Features (Fit ทันที)
- Loan origination workflow
- Standard hire purchase calculation
- Payment schedule generation
- Basic collection management
- Standard regulatory report

### Customization Triggers (Partial Fit)
- Custom credit scoring model
- Integration กับ dealer management system
- Balloon payment, residual value products

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Core banking system
- Personal loan (คนละ product)
- Insurance management

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Standard hire purchase, single product | Easy |
| Multi-product + credit bureau integration | Medium |
| Custom scoring + dealer portal + BOT | Hard |

---

## 7. Personal Loan System

**ชื่อ Solution:** Personal Loan Platform
**Category:** Financial Technology
**Target Industry:** Bank, Non-bank, Nano Finance, Cooperative

### Capabilities
- Loan application: online, mobile, branch
- Identity verification (e-KYC, facial recognition)
- Credit scoring: internal + NCB
- Loan approval workflow
- Repayment tracking และ collection
- Debt restructuring
- BOT/SEC regulatory compliance

### Pain ที่แก้ได้
- Approval time นานหลายวัน
- NPL สูง เพราะ credit assessment ไม่แม่นยำ
- ลูกค้า apply หลาย channel ข้อมูลไม่ sync
- Compliance reporting ทำด้วยมือ ช้า

### Standard Features (Fit ทันที)
- Online loan application
- Standard credit scoring
- Approval workflow
- Payment schedule
- Basic collection alert

### Customization Triggers (Partial Fit)
- Custom scoring model (alternative data)
- Integration กับ payroll/HR system
- Nano finance workflow
- Debt consolidation product

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Auto loan / Mortgage (คนละ product)
- Core banking
- Insurance

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Standard personal loan, single channel | Easy |
| Multi-channel + e-KYC + NCB integration | Medium |
| Custom scoring + mobile app + compliance | Hard |

---

## 8. IoT / Sensor System

**ชื่อ Solution:** IoT Platform
**Category:** IoT / Sensor System
**Target Industry:** Manufacturing, Energy, Agriculture, Smart Building

### Capabilities
- Sensor data collection: temperature, vibration, pressure, energy
- Edge computing
- Real-time monitoring dashboard
- Alert & notification (Line, Email, SMS)
- Integration กับ MES / ERP / Analytics
- Remote monitoring

### Pain ที่แก้ได้
- ไม่รู้สถานะ machine แบบ real-time
- Energy consumption สูงแต่หาสาเหตุไม่ได้
- Downtime กะทันหัน ไม่มี early warning
- ต้องให้คนเดินตรวจ machine ทุกชั่วโมง

### Standard Features (Fit ทันที)
- Standard sensor connection (OPC-UA, Modbus, MQTT)
- Real-time dashboard และ alert
- Data logging และ history
- Mobile monitoring app

### Customization Triggers (Partial Fit)
- Proprietary machine protocol
- Custom sensor hardware
- Integration กับ existing SCADA
- Multi-site deployment

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Machine control / PLC programming
- Hardware manufacturing
- AI model development (ต้องใช้ Analytics)

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Standard sensor + dashboard | Easy |
| Custom protocol + MES integration | Medium |
| Edge AI + multi-site + legacy SCADA | Hard |

---

## 9. BI — Business Intelligence

**ชื่อ Solution:** BI Platform
**Category:** Analytics
**Target Industry:** All Industries

### Capabilities
- Self-service dashboard และ report
- Data visualization: chart, map, KPI card
- Drill-down analysis
- Scheduled report delivery (email, Line)
- Role-based access control
- Multi-source data connection
- Mobile BI app

### Pain ที่แก้ได้
- ผู้บริหารไม่เห็นข้อมูลแบบ real-time
- แต่ละแผนกส่ง Excel ตัวเลขไม่ตรงกัน
- ทำ report ใช้เวลาหลายชั่วโมงต่อสัปดาห์
- ไม่มี single source of truth

### Standard Features (Fit ทันที)
- Pre-built dashboard template
- Standard chart types
- SQL / Excel data source connection
- Basic KPI tracking
- Scheduled email report

### Customization Triggers (Partial Fit)
- Custom data pipeline จาก multiple sources
- Advanced calculated metrics
- Embedded analytics ใน existing system
- Real-time streaming dashboard

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Predictive model (ต้องใช้ Data Analytics)
- Data warehouse (ต้องใช้ Big Data)
- Transactional system

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single source, standard dashboard | Easy |
| Multi-source + custom metric | Medium |
| Real-time + DWH + embedded | Hard |

---

## 10. Data Analytics

**ชื่อ Solution:** Data Analytics Platform
**Category:** Analytics
**Target Industry:** Manufacturing, Retail, Finance, Healthcare

### Capabilities
- Descriptive, Diagnostic, Predictive, Prescriptive Analytics
- Statistical analysis และ hypothesis testing
- Machine learning model development
- Customer segmentation
- Churn prediction, demand forecasting
- Root cause analysis

### Pain ที่แก้ได้
- ไม่รู้ว่า customer segment ไหนทำกำไรสูงสุด
- Sales forecast ผิดพลาดทำให้ over/under stock
- ลูกค้าเลิกใช้บริการโดยไม่มีสัญญาณเตือน
- Quality defect หาสาเหตุ root cause ไม่ได้

### Standard Features (Fit ทันที)
- EDA (Exploratory Data Analysis)
- Standard ML model (regression, classification)
- Customer segmentation (RFM, clustering)
- Time-series forecasting
- Analytics report

### Customization Triggers (Partial Fit)
- Domain-specific feature engineering
- Real-time prediction API
- Computer Vision / NLP
- Custom model integration กับ existing system

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Data infrastructure (ต้องใช้ Big Data)
- BI dashboard (ต้องใช้ BI)
- Data น้อยกว่า 6 เดือน

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Standard model, clean structured data | Easy |
| Custom model + data pipeline | Medium |
| Real-time AI + edge + complex domain | Hard |

---

## 11. Big Data

**ชื่อ Solution:** Big Data Platform
**Category:** Data Infrastructure
**Target Industry:** Telecom, Finance, Retail, Government, Manufacturing

### Capabilities
- Data Lake / Data Warehouse design และ implementation
- ETL / ELT pipeline: batch และ real-time streaming
- Data governance: catalog, lineage, quality
- Cloud data platform (AWS, GCP, Azure)
- Apache Spark, Kafka ecosystem
- Data API layer
- Master Data Management (MDM)

### Pain ที่แก้ได้
- ข้อมูลกระจายใน 10+ systems ไม่มีที่รวมศูนย์
- Query ข้อมูลใหญ่ช้ามาก
- ไม่รู้ว่า data ถูกต้องและ up-to-date ไหม
- ทีม Analytics ใช้เวลา 80% กับ data preparation

### Standard Features (Fit ทันที)
- Cloud data warehouse setup
- Basic ETL pipeline
- Data catalog
- Standard data quality check
- Basic governance framework

### Customization Triggers (Partial Fit)
- Legacy system migration
- Real-time streaming (Kafka)
- Custom data model
- On-premise + cloud hybrid

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Application development
- BI / Analytics model
- Hardware infrastructure

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Cloud DWH, structured data | Easy |
| Multi-source ETL + governance | Medium |
| Real-time + hybrid + MDM + legacy | Hard |

---

## 12. OEE Dashboard

**ชื่อ Solution:** OEE Dashboard
**Category:** Manufacturing Analytics
**Target Industry:** Manufacturing, Automotive, Electronics, Food Processing

### Capabilities
- OEE calculation: Availability × Performance × Quality
- Real-time machine status monitoring
- Downtime tracking และ categorization
- Loss analysis: Six Big Losses
- Shift report และ daily summary
- Trend analysis และ benchmark
- Alert เมื่อ OEE ต่ำกว่า threshold

### Pain ที่แก้ได้
- ไม่รู้ OEE จริงของแต่ละ machine/line
- Downtime เยอะแต่ไม่รู้สาเหตุหลัก
- บันทึก downtime ด้วยกระดาษ ข้อมูลช้า
- เปรียบเทียบ performance ระหว่าง shift ไม่ได้

### Standard Features (Fit ทันที)
- OEE calculation และ dashboard
- Manual downtime input
- Shift และ daily report
- Basic loss analysis
- Machine status tracking

### Customization Triggers (Partial Fit)
- Auto data collection จาก PLC/SCADA
- Integration กับ MES / ERP
- Custom loss category
- Multi-plant consolidation

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Machine control
- Predictive maintenance (ต้องใช้ IoT + Analytics)
- Full MES functionality

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Manual input, single line | Easy |
| Auto collect + multi-line + MES | Medium |
| Multi-plant + real-time + custom protocol | Hard |

---

## 13. Operation Dashboard

**ชื่อ Solution:** Operation Dashboard
**Category:** Analytics / Visibility
**Target Industry:** All Industries

### Capabilities
- Real-time KPI monitoring สำหรับ Operations
- Multi-department visibility
- Exception alert และ escalation
- SLA tracking
- Daily/Weekly/Monthly operation report
- Mobile-friendly dashboard
- Custom KPI configuration

### Pain ที่แก้ได้
- ผู้จัดการไม่เห็นภาพรวม operation แบบ real-time
- ต้องรอ report เช้าวันถัดไป
- KPI tracking ทำด้วย Excel
- ไม่มีระบบ alert เมื่อเกิดปัญหา

### Standard Features (Fit ทันที)
- Pre-built operation KPI template
- Real-time data refresh
- Alert configuration
- Standard operation report
- Mobile app

### Customization Triggers (Partial Fit)
- Custom KPI formula
- Integration กับ multiple source systems
- Custom escalation workflow
- Embedded ใน existing portal

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Transactional system
- Advanced analytics (ต้องใช้ Analytics)
- ERP / WMS functionality

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single source, standard KPI | Easy |
| Multi-source + custom KPI + alert | Medium |
| Real-time + multi-plant + embedded | Hard |

---

## 14. Operation Consultant

**ชื่อ Solution:** Operation Consulting Service
**Category:** Consulting Service
**Target Industry:** Manufacturing, Logistics, Service Industry

### Capabilities
- Process improvement: Lean, Six Sigma, Kaizen
- Operational excellence assessment
- SOP design
- Layout and flow optimization
- Workforce productivity improvement
- Cost reduction analysis
- KPI design และ measurement framework

### Pain ที่แก้ได้
- ต้นทุน operation สูงแต่หาสาเหตุไม่ได้
- Process ซ้ำซ้อน ไม่มีประสิทธิภาพ
- ไม่มี SOP ทำให้ quality ไม่สม่ำเสมอ
- Productivity ต่ำ แต่ไม่รู้จะเริ่มแก้ตรงไหน

### Standard Services (Fit ทันที)
- Operation assessment (2-4 สัปดาห์)
- Process mapping และ waste identification
- Quick win recommendation
- Basic SOP development

### Customization Triggers (Partial Fit)
- Industry-specific methodology
- Long-term improvement program
- Training program สำหรับ internal team
- KPI system design

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Software implementation
- IT infrastructure
- Financial restructuring

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single site assessment | Easy |
| Multi-site improvement program | Medium |
| Enterprise transformation + change management | Hard |

---

## 15. Digital Transformation Consultant

**ชื่อ Solution:** Digital Transformation Consulting
**Category:** Consulting Service
**Target Industry:** All Industries

### Capabilities
- DX Readiness Assessment
- Digital Strategy และ Roadmap (3-5 ปี)
- Technology selection และ vendor evaluation
- Business case และ ROI analysis
- Change management framework
- DX PMO
- DXC Framework: Discover → Map → Design → Solution

### Pain ที่แก้ได้
- ไม่รู้ว่าจะเริ่ม DX จากตรงไหน
- ซื้อ technology แล้วใช้ไม่ได้ผล
- ทีม IT และ Business ไม่ align กัน
- ไม่มี roadmap ชัดเจน budget บาน

### Standard Services (Fit ทันที)
- DX Assessment และ maturity scoring
- Technology roadmap
- Quick win identification
- Business case development

### Customization Triggers (Partial Fit)
- Industry-specific DX playbook
- Ongoing advisory retainer
- PMO setup และ governance

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Software development
- IT infrastructure management
- Legal / Financial advisory

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| DX assessment, single BU | Easy |
| Enterprise roadmap + change management | Medium |
| Full DX + PMO + capability building | Hard |

---

## 16. Accounting System

**ชื่อ Solution:** Accounting System
**Category:** Software Platform
**Target Industry:** All Industries

### Capabilities
- General Ledger (GL) และ Chart of Accounts
- Accounts Payable (AP) และ Receivable (AR)
- Fixed Asset management
- Bank reconciliation
- Financial statements: Balance Sheet, P&L, Cash Flow
- Budget management และ variance analysis
- Tax management: VAT, WHT, Corporate Tax
- Multi-company consolidation
- Thai GAAP / IFRS compliance

### Pain ที่แก้ได้
- ปิดบัญชีช้า ใช้เวลามากกว่า 15 วัน
- ข้อมูลบัญชีไม่ตรงกับ operation system
- ทำ VAT / WHT report ด้วยมือ ผิดบ่อย
- ไม่มี visibility ของ cash flow real-time

### Standard Features (Fit ทันที)
- Full GL, AP, AR
- Standard financial report
- Thai VAT และ WHT report
- Bank reconciliation
- Basic budget tracking

### Customization Triggers (Partial Fit)
- Integration กับ ERP / operation system
- Multi-company consolidation
- Project accounting
- IFRS reporting

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Payroll (ต้องใช้ HRM)
- Tax advisory service
- Audit service

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Single company, standard accounting | Easy |
| Multi-company + ERP integration | Medium |
| Group consolidation + IFRS + custom | Hard |

---

## 17. Purchasing System

**ชื่อ Solution:** Purchasing System
**Category:** Software Platform
**Target Industry:** Manufacturing, Retail, Government, Healthcare

### Capabilities
- Purchase Requisition (PR) และ approval workflow
- RFQ / e-Bidding
- Purchase Order (PO) management
- Vendor management และ evaluation
- Goods Receipt (GR) และ 3-way matching
- Contract management
- Spend analysis dashboard
- e-Procurement portal สำหรับ supplier

### Pain ที่แก้ได้
- Procurement process ช้า ไม่มี visibility
- ซื้อของราคาแพงเพราะไม่มีการเปรียบเทียบ
- Vendor performance ไม่มีการติดตาม
- PO กับ Invoice ไม่ตรงกัน เกิด dispute

### Standard Features (Fit ทันที)
- PR → PO workflow
- Vendor master management
- Basic RFQ
- GR และ 3-way matching
- Standard spend report

### Customization Triggers (Partial Fit)
- Integration กับ ERP / Accounting
- e-Bidding สำหรับ government
- Custom approval hierarchy
- Supplier portal

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Inventory management (ต้องใช้ WMS/ERP)
- Accounting / AP (ต้องใช้ Accounting)
- Legal contract review

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Standard PR/PO, single company | Easy |
| e-Bidding + ERP + supplier portal | Medium |
| Government compliance + multi-company | Hard |

---

## 18. Electronic TAX

**ชื่อ Solution:** Electronic TAX System
**Category:** Software Platform / Compliance
**Target Industry:** All Industries

### Capabilities
- e-Tax Invoice & e-Receipt ตามมาตรฐาน สรรพากร
- e-Withholding Tax (e-WHT) submission
- VAT report (ภ.พ.30) อัตโนมัติ
- Digital signature และ timestamp
- Integration กับ Revenue Department portal
- Bulk document generation และ delivery
- Tax document archive
- Integration กับ Accounting / ERP

### Pain ที่แก้ได้
- ออก tax invoice ด้วยมือ ช้า ผิดพลาด
- ส่ง WHT certificate ให้ vendor ช้า
- ต้นทุนกระดาษและการจัดส่งเอกสาร
- ไม่พร้อมรับ e-Tax จาก buyer รายใหญ่
- เก็บเอกสารภาษีไม่ครบ เสี่ยง audit

### Standard Features (Fit ทันที)
- e-Tax Invoice ตามมาตรฐาน สรรพากร
- e-WHT generation และ submission
- Basic VAT report
- Digital archive
- Email delivery

### Customization Triggers (Partial Fit)
- Integration กับ ERP / Accounting เดิม
- Custom document format
- High volume automation (10,000+ docs/month)
- API integration สำหรับ buyer/supplier portal

### ขอบเขตที่ทำไม่ได้ (Full Custom / Out of Scope)
- Tax planning advisory
- Full accounting system (ต้องใช้ Accounting)
- Payroll tax (ต้องใช้ HRM)

### Difficulty Matrix
| Scenario | Difficulty |
|----------|-----------|
| Standard e-Tax Invoice, manual | Easy |
| ERP integration + bulk automation | Medium |
| Full tax ecosystem + multi-company + API | Hard |

---

## Fit Level Definition

| Level | ความหมาย | Customization % |
|-------|---------|----------------|
| **Full Fit** | มี solution ตอบโจทย์ได้ทั้งหมด | < 20% |
| **Partial Fit** | มี solution ใกล้เคียง ต้อง customize | 20–50% |
| **Full Custom** | ไม่มี solution ใดใน master match | > 50% |

## Difficulty Definition

| Level | ความหมาย | Timeline |
|-------|---------|----------|
| **Easy** | Standard implementation | 1–3 เดือน |
| **Medium** | มี integration / customization | 3–6 เดือน |
| **Hard** | ซับซ้อน multi-system | 6–12 เดือน |

## Solution Cross-reference Matrix

| Pain Area | Primary Solution | Supporting Solution |
|-----------|-----------------|-------------------|
| Production efficiency | Production Planning, Advance Planning | IoT, OEE Dashboard |
| Supply chain | Advance Planning, WMS | BI, Operation Dashboard |
| Quality & compliance | Traceability | OEE, Production Planning |
| Financial control | Accounting, Purchasing | Electronic TAX |
| HR & payroll | HRM | Accounting |
| Data & analytics | BI, Data Analytics | Big Data |
| Machine monitoring | IoT, OEE Dashboard | Operation Dashboard |
| Financial product | Auto Loan, Personal Loan | Accounting |
| DX strategy | DT Consultant, Operation Consultant | All solutions |
