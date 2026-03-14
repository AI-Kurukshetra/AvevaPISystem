import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[], avg: number) {
  if (!values.length) return 0;
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export async function GET(req: NextRequest) {
  const sensorId = req.nextUrl.searchParams.get("sensor_id");
  const tagName = req.nextUrl.searchParams.get("tag_name");

  let targetSensorId = sensorId;
  if (!targetSensorId && tagName) {
    const { data: sensors, error: sensorError } = await supabaseServer
      .from("sensors")
      .select("id")
      .eq("tag_name", tagName)
      .order("created_at", { ascending: false })
      .limit(1);

    if (sensorError) {
      return NextResponse.json({ error: sensorError.message }, { status: 500 });
    }

    targetSensorId = sensors?.[0]?.id ?? null;
  }

  if (!targetSensorId) {
    return NextResponse.json({ error: "sensor_id or tag_name is required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("sensor_data")
    .select("value, timestamp")
    .eq("sensor_id", targetSensorId)
    .order("timestamp", { ascending: false })
    .limit(60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const values = (data ?? []).map((item) => Number(item.value));
  if (values.length < 5) {
    return NextResponse.json({
      data: {
        sensor_id: targetSensorId,
        suggested_threshold: null,
        reason: "Not enough telemetry data. Need at least 5 readings."
      }
    });
  }

  const avg = mean(values);
  const sigma = stdDev(values, avg);
  const suggestedThreshold = avg + sigma * 1.5;

  return NextResponse.json({
    data: {
      sensor_id: targetSensorId,
      suggested_threshold: Number(suggestedThreshold.toFixed(2)),
      baseline_avg: Number(avg.toFixed(2)),
      sample_size: values.length
    }
  });
}
