import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { detectAnomaly } from "@/lib/utils/industrial";

export async function GET(req: NextRequest) {
  const sensorId = req.nextUrl.searchParams.get("sensor_id");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 100);

  let query = supabaseServer
    .from("sensor_data")
    .select("id, sensor_id, timestamp, value, is_anomaly")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (sensorId) query = query.eq("sensor_id", sensorId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: (data ?? []).reverse() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sensor_id, value, timestamp } = body;

  const numericValue = Number(value);

  const { data: recent } = await supabaseServer
    .from("sensor_data")
    .select("id, sensor_id, timestamp, value")
    .eq("sensor_id", sensor_id)
    .order("timestamp", { ascending: false })
    .limit(20);

  const isAnomaly = detectAnomaly((recent ?? []).reverse(), numericValue);

  const { data, error } = await supabaseServer
    .from("sensor_data")
    .insert({ sensor_id, value: numericValue, timestamp: timestamp ?? new Date().toISOString(), is_anomaly: isAnomaly })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (isAnomaly) {
    await supabaseServer.from("alerts").insert({
      sensor_id,
      severity: "HIGH",
      status: "OPEN",
      message: "Potential Machine Failure Detected (AI anomaly >20% deviation)",
      alert_type: "ANOMALY"
    });
  }

  const { data: alarms } = await supabaseServer
    .from("alarms")
    .select("id, operator, threshold")
    .eq("sensor_id", sensor_id)
    .eq("is_active", true);

  for (const alarm of alarms ?? []) {
    const threshold = Number(alarm.threshold);
    const triggered = alarm.operator === ">" ? numericValue > threshold : numericValue < threshold;
    if (triggered) {
      await supabaseServer.from("alerts").insert({
        sensor_id,
        severity: "MEDIUM",
        status: "OPEN",
        message: `Alarm triggered: sensor value ${numericValue} ${alarm.operator} ${threshold}`,
        alert_type: "THRESHOLD"
      });
    }
  }

  return NextResponse.json({ data }, { status: 201 });
}
