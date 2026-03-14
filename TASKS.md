# TASKS — SmartFactory AI

Implementation roadmap for AI coding agents.

---

# Phase 0 — Project Setup

Create Next.js 14 project.

Install dependencies:

tailwindcss
shadcn/ui
supabase-js
framer-motion
recharts

Configure Tailwind.

Initialize shadcn components.

---

# Phase 1 — Landing Page

Create homepage route.

Sections:

Hero
Features
Architecture
Call To Action
Footer

Add smooth animations using Framer Motion.

Animations:

Hero fade-in
Feature card stagger animation
Button hover scale

---

# Phase 2 — Authentication

Implement login and signup modal.

Use shadcn Dialog component.

Fields:

Email
Password

Integrate Supabase Auth.

Allow users to switch between login and signup.

Protect dashboard routes.

---

# Phase 3 — Database Schema

Create Supabase tables:

sites
areas
production_lines
equipment
sensors
sensor_data
alarms
alerts

---

# Phase 4 — Core Layout

Create dashboard layout.

Sidebar navigation:

Dashboard
Assets
Sensors
Alerts
Reports

---

# Phase 5 — Asset Management

Create assets page.

Users can create:

Sites
Areas
Production lines
Equipment

Display hierarchy tree.

---

# Phase 6 — Sensor Management

Create sensors page.

Users can add sensors to equipment.

Example sensors:

Temperature
Pressure
Vibration
Speed

---

# Phase 7 — Realtime Dashboard

Create dashboard widgets.

Machine Status
Production Rate
OEE Score
Active Alerts

Add realtime charts.

---

# Phase 8 — Sensor Data Simulation

Create API route:

/api/simulate

Generate sensor values every request.

Insert values into database.

---

# Phase 9 — Alarm System

Allow users to define thresholds.

When exceeded:

Create alert record.

Show notification in dashboard.

---

# Phase 10 — Anomaly Detection

Compute rolling average.

If value deviates by more than 20 percent:

Mark anomaly.

Highlight in charts.

---

# Phase 11 — Reports

Add export functionality.

Allow export of sensor data.

Formats:

CSV
JSON
