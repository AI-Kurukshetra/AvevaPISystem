# AGENTS.md

Instructions for AI coding agents working in this repository.

Project Name:
SmartFactory AI

---

# Tech Stack

Frontend
Next.js 15 App Router

Styling
Tailwind CSS
shadcn/ui

Animations
Framer Motion

Database
Supabase PostgreSQL

Realtime
Supabase Realtime

Charts
Recharts or Tremor

Deployment Target
Vercel

---

# Setup

Install dependencies

npm install

Start dev server

npm run dev

---

# Folder Structure

/app
/dashboard
/assets
/sensors
/alerts
/reports

/components
/landing
/auth
/charts
/ui

/lib
/supabase
/utils

/app/api
/sensors
/data
/alerts
/simulate

---

# Coding Rules

Use TypeScript

Use functional React components

Prefer modular components

Follow Next.js App Router conventions

---

# UI Guidelines

Design style:

Modern SaaS dashboard

Dark theme
Industrial look
Clean data visualization

Use shadcn components:

Sidebar
Card
Dialog
Table
Button

---

# Landing Page

Implement landing page at route:

/

Sections:

Hero
Features
Architecture
Call To Action
Footer

Animations should use Framer Motion.

Examples:

Hero fade-in
Feature cards stagger animation
Hover effects on buttons

---

# Authentication

Use Supabase Auth.

Functions:

signUp
signInWithPassword
signOut

Store user session using Supabase client.

Dashboard routes must require authentication.

---

# Realtime Data

Use Supabase subscriptions.

Tables:

sensor_data
alerts

Realtime updates should refresh charts automatically.

---

# Sensor Simulation

Create API route:

/api/simulate

Function:

Generate random sensor data.

Example ranges:

Temperature 60-100
Pressure 30-70
Speed 100-200

Insert values into sensor_data table.

This API may be triggered manually or via cron.

---

# Alerts

If sensor value exceeds threshold:

Create alert record
Display alert in dashboard

---

# Anomaly Detection

Calculate rolling average of last 10 sensor values.

If deviation greater than 20 percent:

Mark anomaly.

Show anomaly warning in UI.

---

# Code Quality

Avoid unnecessary dependencies.

Keep components reusable.

Ensure project can deploy on Vercel.
