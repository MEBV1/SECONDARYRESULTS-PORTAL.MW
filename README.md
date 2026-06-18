# School Results Management Portal (Malawi Curriculum Specification)

An elegant, mobile-friendly, educational results portal allowing students to securely retrieve published term scorecard records (JCE & MSCE), while administrators maintain institutions, verify student enrollment, and record subject scores with automatic grade and rank calculations.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** HTML5, CSS3 (including custom fluid layouts and native print stylesheets), vanilla ECMAScript 6.
- **Backend-as-a-Service:** Supabase (Database, Authentication, Row-Level Security).
- **Database Engine:** PostgreSQL (with integrated triggers for student codes, MSCE "best 6" points calculation, and recursive-safe class ranking calculations).

---

## 📁 Repository Directory Structure

```text
├── README.md                           # Project documentation and deployment blueprint
├── database/
│   └── supabase_schema.sql             # Comprehensive SQL schema, triggers, and RLS policies
└── public/
    ├── index.html                      # Structured SPA markup for Student Portal and Admin Panels
    ├── style.css                       # Unified design system, glassmorphism, and print rules
    └── app.js                          # Core state controller and Supabase client engine