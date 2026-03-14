# SMARTFACTORY AI - Industrial IoT Analytics Hub

Hackathon-ready MVP inspired by AVEVA PI-style monitoring.

## Features
- Asset hierarchy management (Site -> Area -> Line -> Equipment -> Sensors)
- Sensor tag creation and listing
- Time-series storage with anomaly flag
- Realtime dashboard charts via Supabase Realtime
- Alarm threshold rules and alert lifecycle
- AI anomaly detection (>20% deviation from rolling average)
- OEE KPI widget
- Reports export (CSV/JSON)
- AI assistant panel for production-drop explanations

## Stack
- Next.js 14 (App Router)
- Tailwind CSS with shadcn-style component primitives
- Supabase PostgreSQL, Realtime, Auth-capable integration
- Recharts

## Setup
1. Install dependencies:
```bash
npm install
```

2. Configure env:
```bash
cp .env.example .env.local
```
Fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`)

3. Initialize database:
- Run `supabase/schema.sql` in Supabase SQL editor.
- Seed one hierarchy path (site/area/line/equipment) and create sensors.

4. Start web app:
```bash
npm run dev
```

5. Start simulator in second terminal:
```bash
npm run simulate
```

## API Routes
- `GET/POST /api/assets`
- `GET/POST /api/sensors`
- `GET/POST /api/data`
- `GET/POST/PATCH /api/alerts`
- `GET /api/reports?format=csv|json&sensor_id=<optional>`
- `POST /api/assistant`

## OEE
`OEE = Availability x Performance x Quality`

Dashboard currently uses hackathon default factors for fast demo readiness.
