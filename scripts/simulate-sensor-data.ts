import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

function randomInRange(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const profiles: Record<string, { min: number; max: number }> = {
  Temperature: { min: 60, max: 100 },
  Pressure: { min: 30, max: 70 },
  "Machine Speed": { min: 100, max: 200 },
  "Production Count": { min: 10, max: 50 },
  Vibration: { min: 1, max: 8 }
};

async function ingestPoint(sensorId: string, value: number) {
  const response = await fetch(`${baseUrl}/api/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sensor_id: sensorId, value })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to ingest sensor point: ${details}`);
  }
}

async function tick() {
  const { data: sensors, error } = await supabase.from("sensors").select("id, tag_name");
  if (error) {
    console.error("Failed to load sensors:", error.message);
    return;
  }

  for (const sensor of sensors ?? []) {
    const profile = profiles[sensor.tag_name] ?? { min: 20, max: 120 };
    let value = randomInRange(profile.min, profile.max);

    if (Math.random() < 0.08) {
      value = Number((value * randomInRange(1.25, 1.5)).toFixed(2));
    }

    try {
      await ingestPoint(sensor.id, value);
    } catch (ingestError) {
      console.error(`[SIMULATOR] ${sensor.id}:`, ingestError);
    }
  }

  console.log(`[SIMULATOR] Inserted data at ${new Date().toISOString()}`);
}

console.log(`Starting SMARTFACTORY AI simulator (5s interval) against ${baseUrl} ...`);
setInterval(tick, 5000);
void tick();
