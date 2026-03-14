# PRD - SmartFactory AI

## Product Overview

SmartFactory AI is a lightweight Industrial IoT analytics platform inspired by enterprise systems such as Aveva PI System.

The platform collects machine sensor data, stores time-series information, detects anomalies, and visualizes production metrics through real-time dashboards.

The goal is to build a hackathon-ready MVP demonstrating real-time industrial analytics and AI-assisted monitoring.

---

# Target Users

Manufacturing Operators
Plant Engineers
Production Managers

---

# Problem Statement

Modern factories generate massive amounts of machine data but lack easy tools to:

- monitor machines in real time
- detect equipment failures early
- analyze production performance
- track operational efficiency

Enterprise platforms are powerful but expensive and complex.

SmartFactory AI demonstrates a simplified alternative.

---

# Landing Page

The application must include a modern SaaS-style landing page.

Route:
/

Sections:

Hero Section
Product name: SmartFactory AI
Tagline: AI-Powered Industrial IoT Analytics

CTA Buttons:

Get Started
View Demo

---

Features Section

Highlight:

Real-time monitoring
Predictive maintenance alerts
AI anomaly detection
Production analytics dashboards

---

Architecture Section

Explain system pipeline:

Machines -> Sensors -> Data -> Analytics -> Insights

---

Call To Action

Encourage users to sign up.

Buttons:

Sign Up
Login

---

Footer

Links:

Dashboard
Documentation
GitHub

---

# Authentication

Use Supabase Auth.

Users must login before accessing the dashboard.

Authentication features:

Signup
Login
Session persistence
Logout

---

# Login & Signup Modal

Authentication UI must use modal dialogs instead of separate pages.

Fields:

Email
Password

Functions:

Login
Signup
Switch between login and signup modes

Use shadcn Dialog component.

---

# Core Features

## Asset Hierarchy

Factories structured as:

Site -> Area -> Production Line -> Equipment -> Sensors

Users can create and view this hierarchy.

---

## Sensor Tag Management

Each equipment has multiple sensors.

Examples:

Temperature
Pressure
Vibration
Machine Speed
Production Count

---

## Time Series Data

Sensor readings stored as time-series data.

Fields:

sensor_id
timestamp
value

---

## Real Time Dashboard

Widgets:

Machine Status
Production Rate
Active Alerts
OEE Score

Charts:

Temperature trend
Pressure trend
Machine speed trend
Production output

Realtime updates via Supabase subscriptions.

---

## Alarm Management

Users define thresholds.

Example:

Temperature > 90
Pressure < 25

When exceeded:

Alert generated
Notification shown

---

## AI Anomaly Detection

System detects abnormal sensor patterns.

Rule:

If value deviates from rolling average by more than 20 percent

Flag anomaly.

---

## Reports

Export sensor data.

Formats:

CSV
JSON

---

# Smooth Animations

Use subtle UI animations.

Examples:

Hero text fade-in
Feature card hover animation
Button hover scale
Modal open animation

Use Framer Motion.

Animations should feel professional and minimal.

---

# Success Metrics

Realtime data ingestion working
Dashboard updating live
Alerts triggering correctly
Anomaly detection functioning

---

# MVP Scope

Included:

Landing page
Authentication
Asset hierarchy
Sensor management
Realtime dashboard
Alarm system
Anomaly detection

Excluded:

Digital twin simulation
Complex ML models
Edge computing
