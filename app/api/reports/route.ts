import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function toCSV(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }

  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  const sensorId = req.nextUrl.searchParams.get("sensor_id");

  let query = supabaseServer
    .from("sensor_data")
    .select("id, sensor_id, timestamp, value, is_anomaly")
    .order("timestamp", { ascending: false })
    .limit(5000);

  if (sensorId) query = query.eq("sensor_id", sensorId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (format === "json") {
    return new NextResponse(JSON.stringify(data ?? [], null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=sensor-report.json"
      }
    });
  }

  const csv = toCSV((data ?? []) as Record<string, unknown>[]);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=sensor-report.csv"
    }
  });
}
