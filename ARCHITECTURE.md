# ARCHITECTURE.md

# SmartFactory AI — System Architecture

## Overview

SmartFactory AI is a lightweight Industrial IoT analytics platform designed to collect machine sensor data, store time-series information, detect anomalies, and visualize manufacturing performance in real time.

The system uses a modern serverless architecture with a Next.js frontend, Supabase backend, and deployment on Vercel.

---

# High-Level Architecture

User Browser
↓
Next.js Frontend (UI + API Routes)
↓
Supabase Backend (Database + Auth + Realtime)
↓
Sensor Data Simulation / Industrial Data Sources

---

# Core Technology Stack

Frontend
Next.js 15 (App Router)

UI Components
Tailwind CSS
shadcn/ui

Animations
Framer Motion

Backend
Next.js API Routes

Database
Supabase PostgreSQL

Realtime Updates
Supabase Realtime Subscriptions

Charts
Recharts

Deployment
Vercel

---

# System Components

## 1. Landing Page

Route: /

Purpose

Introduce the product and allow users to authenticate.

Sections

Hero
Features
Architecture Overview
Call To Action
Footer

Authentication modals are triggered from this page.

---

## 2. Authentication System

Authentication is handled by Supabase Auth.

Features

User Signup
User Login
Session Persistence
Logout

Users must be authenticated before accessing protected dashboard routes.

Protected routes

/dashboard
/assets
/sensors
/alerts
/reports

---

# Dashboard System

Route

/dashboard

Displays real-time factory data.

Widgets

Machine Status
Production Rate
Active Alerts
OEE Score

Charts

Temperature trend
Pressure trend
Machine speed trend
Production output

Dashboard data updates automatically using realtime subscriptions.

---

# Asset Management System

Route

/assets

Users can create and manage the factory hierarchy.

Hierarchy Model

Site
Area
Production Line
Equipment
Sensors

This structure organizes large industrial facilities.

---

# Sensor Management

Route

/sensors

Users create sensor tags attached to equipment.

Example Sensors

Temperature
Pressure
Vibration
Machine Speed
Production Count

Each sensor produces time-series data.

---

# Time-Series Data System

Sensor readings are stored in the sensor_data table.

Fields

sensor_id
timestamp
value

Time-series data allows trend analysis and anomaly detection.

---

# Alarm System

Users configure alarm thresholds.

Examples

Temperature > 90
Pressure < 25

When threshold exceeded

Alert record created
Notification displayed in dashboard

---

# AI Anomaly Detection

SmartFactory AI includes simple anomaly detection logic.

Method

Calculate rolling average of last N readings.

If deviation greater than 20 percent

Mark value as anomaly.

Anomalies appear highlighted in charts.

---

# Sensor Data Simulation

Industrial sensor data is simulated using an API endpoint.

API Route

/api/simulate

Function

Generate random sensor values

Example ranges

Temperature 60–100
Pressure 30–70
Speed 100–200

Insert generated values into database.

This endpoint can be triggered manually or via scheduled cron jobs.

---

# Database Architecture

Database platform

Supabase PostgreSQL

Core Tables

sites
areas
production_lines
equipment
sensors
sensor_data
alarms
alerts

Relationships

Site → Areas
Area → Production Lines
Production Line → Equipment
Equipment → Sensors
Sensors → Sensor Data

---

# Data Flow

1 User opens dashboard

2 Frontend requests sensor data from Supabase

3 Supabase returns historical time-series data

4 Realtime subscription listens for new data

5 Sensor simulation API inserts new readings

6 Dashboard charts update instantly

---

# Realtime Architecture

Supabase realtime streams updates when new records are inserted.

Realtime tables

sensor_data
alerts

Frontend subscribes to these tables to update UI automatically.

---

# Deployment Architecture

Application deployed on Vercel.

Frontend

Next.js application hosted on Vercel.

Backend

Serverless API routes running on Vercel.

Database

Supabase managed PostgreSQL.

---

# Deployment Flow

Developer pushes code to GitHub

GitHub repository connected to Vercel

Vercel automatically builds Next.js application

Application deployed globally via Vercel CDN

Environment variables connect application to Supabase

---

# Security Model

Authentication via Supabase Auth.

Protected routes require active session.

Sensitive keys stored in environment variables.

Example environment variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

---

# Scalability

System can scale through

Serverless infrastructure (Vercel)
Managed database (Supabase)
Realtime streaming architecture

Future upgrades could include

Edge computing gateways
Machine learning models
Digital twin simulation

---

# Future Enhancements

Predictive maintenance models
Advanced anomaly detection
Computer vision quality inspection
Digital twin visualization
Multi-factory monitoring

---

# Summary

SmartFactory AI demonstrates a modern Industrial IoT architecture combining:

Realtime data pipelines
AI-assisted monitoring
Modern SaaS UI design

The platform provides a simplified alternative to enterprise industrial analytics systems.
