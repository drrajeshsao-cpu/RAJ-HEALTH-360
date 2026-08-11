# RAJ HEALTH 360 V2 Pro

A polished local-first PWA prototype for a physician's own integrated health monitoring.

## Core design
- Modern medicine whole-body/system-based health record
- Daily physician-style self-round
- Ashtavidha Pariksha
- Dashavidha Pariksha
- Prakriti, Vikriti, Agni, Koshta, Ama, Bala
- Dosha state sliders
- Ritu × Desha seasonal switch with auto/manual mode
- Shatkriyakala conceptual staging
- Labs and imaging longitudinal record
- Medication start/stop/benefit/adverse-effect tracker
- Panchakarma / therapies / fasting / blood donation outcome tracker
- Mental, social and spiritual wellbeing
- Timeline linking exposures and outcomes
- Rule-based AI review prototype and safety guardrails
- JSON export/import backup
- Dark mode
- Mobile responsive / PWA-ready

## Important safety architecture
This app is a health tracking and decision-support prototype. It does not autonomously prescribe prescription medicines or intensive Panchakarma procedures. High-risk procedures require individualized assessment, contraindication screening, informed consent where applicable, proper preparation and supervision.

## Next deployment phase
1. Firebase Authentication
2. Firestore longitudinal data sync
3. Firebase Storage for PDF/photo/lab/imaging uploads
4. Encrypted backup/recovery
5. Interactive charts for BP, weight, glucose, HbA1c, uric acid, lipids, renal/liver/thyroid values
6. Real OpenAI API integration with structured safety prompts
7. Reminders for investigations, medicines, blood donation eligibility windows, follow-up and preventive screening
8. Wearable/Health Connect integration where technically appropriate
9. PDF health summary


## V3 additions
- Camera / gallery / PDF attachment selectors for daily health, Ayurveda, investigations, medicines and therapies
- Editable and deletable daily, laboratory, imaging, medicine, intervention and habit records
- Sleep start time, wake time and automatic sleep-duration calculation
- Dedicated habit builder with start/end/duration/target/quality/status
- Exercise, walking, yoga, pranayama, dhyana, mala-jap, puja/path, mauna, study, water, diet, fasting and digital-detox habits
- Dropdown-based Ashtavidha and Dashavidha fields
- Page-level automatic summaries for Daily, Ayurveda, Investigations and Habits
- Motivational lines and health-behaviour coaching throughout the app
- Floating AI Copilot access

### Attachment note
V3 stores attachment metadata locally for the prototype UI. Durable cross-device storage of the actual files should be implemented with Firebase Storage in the next cloud phase.


## V4 Professional additions
- Six-domain dashboard: Body, Recovery, Metabolic, Ayurveda, Mind, Purpose
- Dedicated Sleep Centre with timing, duration, quality and contributing-factor review
- Physician Wellness module for workload, prolonged sitting, missed meals/water, strain, fatigue and recovery
- My Health Experiments for before/after observational learning
- Preventive Calendar with clinical-context notes
- Searchable Health Vault
- Cause-effect oriented timeline
- Three major AI roles via Copilot modes: Clinical, Ayurveda, Life/Habit, plus integrated review
- Dashboard limited to Top 3 actionable priorities to reduce overload

Login/authentication code was not added or modified in this build.


## V4.1 visible-feature correction
This build makes previously planned professional features clearly visible in the UI:
- Four dedicated AI Copilot buttons: Clinical, Ayurveda, Life & Habit, Integrated Review
- Dashboard: explicit "What Needs Attention Today?" with exactly three focused recommendations
- Preventive Health Calendar buckets: Due Now, This Month, Next 3 Months, Next 6 Months, Annual/Long-term
- Health Vault category filters for Reports, Prescriptions, X-Ray, CT, MRI, USG, ECG, Photos, Ayurveda, Panchakarma, Blood Donation, Vaccination, Dental and Eye
- Search remains active alongside category filters

No login/authentication code was added or modified.


## V5 Diagnostic Intelligence
- Dedicated Lab Interpreters page
- System cards can launch relevant diagnostic panels
- CBC interpreter with Hb/RBC/Hct/MCV/MCH/MCHC/RDW/WBC differential/platelets
- LFT interpreter
- RFT/KFT interpreter with creatinine, eGFR, urea/BUN, uric acid, electrolytes, urine ACR
- Diabetes, lipid, thyroid, bone/mineral, iron/hematinic and urinalysis panels
- Male/female typical adult reference ranges where relevant
- Automatic Normal / Borderline Low / Low / Borderline High / High / Not Assessed status
- Manual reference-range and status override
- Parameter-specific meaning and remarks
- Date-wise saved interpreted panels
- PDF/image/camera attachment metadata
- Pattern summaries for CBC/LFT/RFT/thyroid/diabetes/lipids

Important: built-in reference intervals are examples. The laboratory's own reference interval and clinical context should override defaults.


## V5.1 Fixed Complete Diagnostics
- Fixed blank panel list / 0-parameter failure with independent diagnostic initialization and safe module rendering.
- 14 visible panel buttons: CBC, ESR/CRP, Iron/B12/Folate, LFT, RFT/KFT, Urine, Diabetes, Lipid, Thyroid, Electrolytes, Bone/Minerals, Coagulation, Cardiac Markers, Pancreatic Enzymes.
- Save Interpreted Panel now gives visible success/error feedback and does not depend on a full-app rerender.
- Actual selected PDF/image is stored locally in IndexedDB and can be opened/downloaded from a saved diagnostic panel.
- Built-in ranges remain editable and laboratory-specific ranges should take precedence.
- No login/authentication code changed.


## V6 Smart Lab Library
New panel families:
- Arthritis / Autoimmune
- Fever / Infectious work-up
- Female hormonal / reproductive
- Male hormonal / androgen
- Female infertility evaluation
- Male fertility / semen profile
- Adrenal / stress hormones
- Cardiac biomarkers
- Coagulation / thrombosis
- Pancreatic enzymes
- Vitamin / micronutrient
- Viral / blood-borne infection screen
- Tumor-marker tracking (explicitly not general screening)

Smart Report Import:
- Digital PDF text extraction using pdf.js in the browser
- Image/screenshot OCR using Tesseract.js in the browser
- Alias-based test name recognition
- Auto-map recognized values into matching panels as DRAFTS
- Mandatory human verification before clinical use

Reference intervals are examples and may vary by lab, assay, age, sex, cycle day, pregnancy, medicines and clinical context. Use the printed laboratory range when available.


## V6.1 Omega Diagnostics Lab Template
- Selectable Omega Diagnostics sample-derived reference template based on the uploaded 14-page report.
- Patient result values are not installed as defaults; reusable test names, units and printed reference intervals are used.
- Expanded CBC, LFT, RFT, Iron, Lipid, Urine, Thyroid, Vitamin D/B12 and eAG slots to match the report.
- Smart-imported values are labelled: `Smart-imported; verify with original report.`
- RDW-SD and SGOT/SGPT ratio printed ranges that appear internally unusual are flagged VERIFY rather than trusted automatically.


## V6.2 One-Click Report Analyzer
Critical usability fixes:
- Fixed CBC/LFT/RFT parameter-table rendering.
- Selecting a panel automatically clears accidental search text such as "CBC".
- The same locally saved PDF/image can be analyzed directly; no second upload is required.
- Added "Analyze Uploaded Report & Auto-fill".
- Omega template auto-selects when the facility contains "Omega".
- Recognized results create VERIFY drafts for all matching panels.
- The best matched panel opens immediately with values visible and interpretation generated.
- Every imported value is labeled: "Smart-imported; verify with original report."


## V6.3 Full-Body Panel Sync
Fixes the key issue where the PDF was successfully read and multiple panels were created, but switching from CBC to LFT/RFT/Thyroid opened blank forms.

New behavior:
- After one full-body report is analyzed, every detected panel keeps its own imported values.
- Clicking CBC, LFT, RFT/KFT, Thyroid, Lipid, Diabetes, Iron, Vitamins, etc. automatically loads the matching smart-imported draft for the same report.
- Panel buttons show how many values were imported.
- Added Full Body Report Summary with detected panel count, total mapped tests and flagged results.
- Smart-imported values remain labeled for verification against the original report.


## V6.4 Precision Import — accuracy-first architecture
Major parser redesign after direct comparison with the Omega Diagnostics PDF:
- Replaced global fuzzy-number matching as the default with page-by-page, row-by-row exact label parsing for Omega digital PDFs.
- Prevents cross-row collisions such as:
  - Hb 11.4 being misread as 1
  - SGOT 22.392 being misread from an unrelated value
  - Creatinine 0.65 being confused with Urea/Creatinine ratio 34
- Uses exact row labels and longest-label matching.
- Stores source PDF page and original source row for every exact import.
- Adds import confidence and row-level audit table.
- Adds verification state: Unverified / Verified with PDF / Corrected manually.
- User edits remain editable and saveable.
- Smart-imported values preferentially use the report/Omega lab reference range; complex sex-specific ranges use the Omega template.
- Image OCR remains a lower-confidence fallback and requires review.
- Interpretation language is intentionally cautious and pattern-based; imported data must be verified before diagnosis or treatment decisions.


## V6.4.1 Version Visibility
- Added a clearly visible version badge near the RAJ HEALTH 360 header.
- Current visible release: V6.4.1
- Build date: 2026-08-11
- Added a small desktop build label for easy GitHub Pages verification.
- Added APP_VERSION and APP_BUILD_DATE constants for future deployment checks.

Future rule: every release should update this visible version/build label before publishing.


## V6.5 Durable Patient Report Archive
- Fixes save failures caused by storing growing interpreted-report payloads only in localStorage.
- Laboratory panels and full-body report bundles are now saved in IndexedDB (`lab_reports`) for durable on-device storage.
- Original PDF/image remains stored in IndexedDB attachment vault.
- Adds patient name, Patient ID/UHID, mobile/WhatsApp and age fields.
- Adds "Save Full Body Report" to archive CBC/LFT/RFT/thyroid/lipid/etc. together for follow-up.
- Adds searchable Patient Report Archive.
- Archived records can be reopened, edited, printed, converted to PDF, shared, and shared as WhatsApp text summary.
- On supported mobile browsers, Share can send the generated PDF through the native share sheet (including WhatsApp if available).
- Browser WhatsApp deep links cannot reliably attach a generated PDF automatically on desktop; use Share PDF/native share or download PDF then attach it in WhatsApp.
- Keeps the visible version label: V6.5 • Build 2026-08-11.


## V6.6 Reliable Save — isolated report database
- Reports no longer share or migrate the attachment IndexedDB schema.
- New independent report database: `RAJ_HEALTH_360_REPORT_ARCHIVE_V1`.
- Write verification occurs immediately after each IndexedDB save.
- Storage Health Test is visible in Lab Interpreters.
- Save Full Body Report now captures in-memory imported panels even if individual panel save has not yet succeeded.
- Added Emergency Save JSON. If IndexedDB saving fails, the app automatically downloads a recoverable JSON snapshot so interpreted work is not lost.
- Successful panel/full-body saves now show explicit confirmation.
- If storage reports "blocked", close duplicate RAJ HEALTH 360 tabs and retry.
