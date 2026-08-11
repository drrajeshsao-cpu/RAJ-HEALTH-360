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
