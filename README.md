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
