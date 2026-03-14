import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const question = String(body.question ?? "").toLowerCase();

  const [{ data: latestAlerts }, { data: latestReadings }] = await Promise.all([
    supabaseServer.from("alerts").select("message, severity, created_at, status").order("created_at", { ascending: false }).limit(20),
    supabaseServer.from("sensor_data").select("sensor_id, value, timestamp, is_anomaly").order("timestamp", { ascending: false }).limit(120)
  ]);

  const readings = latestReadings ?? [];
  const alerts = latestAlerts ?? [];
  const anomalyCount = readings.filter((x) => x.is_anomaly).length;
  const openAlerts = alerts.filter((x) => x.status === "OPEN").length;
  const highAlerts = alerts.filter((x) => x.severity === "HIGH").length;
  const values = readings.map((item) => Number(item.value));

  let explanation = "No major issue detected in recent telemetry.";

  if (question.includes("summarize") || question.includes("open alert")) {
    explanation = `Open alerts: ${openAlerts}. High severity alerts: ${highAlerts}. Recent anomaly events: ${anomalyCount}.`;
  } else if (question.includes("top anomalies") || question.includes("latest anomalies")) {
    const latestAnomalies = readings
      .filter((entry) => entry.is_anomaly)
      .slice(0, 5)
      .map((entry) => `sensor ${entry.sensor_id.slice(0, 8)} at ${new Date(entry.timestamp).toLocaleTimeString()}`);
    explanation = latestAnomalies.length
      ? `Latest anomalies: ${latestAnomalies.join(", ")}.`
      : "No anomalies found in the latest telemetry window.";
  } else if (question.includes("recommend threshold") || question.includes("threshold")) {
    const avg = average(values);
    const max = values.length ? Math.max(...values) : avg;
    const min = values.length ? Math.min(...values) : avg;
    const suggested = avg + (max - min) * 0.25;
    explanation = `Recommended threshold: ${suggested.toFixed(2)} based on recent average ${avg.toFixed(2)} and observed range ${min.toFixed(2)}-${max.toFixed(2)}.`;
  } else if (question.includes("production") || question.includes("drop")) {
    explanation = `Production likely dropped due to ${anomalyCount} recent anomaly events and ${openAlerts} open alert signals in the last cycle.`;
  }

  return NextResponse.json({
    answer: explanation,
    context: {
      anomalyCount,
      openAlerts,
      highAlerts
    }
  });
}
