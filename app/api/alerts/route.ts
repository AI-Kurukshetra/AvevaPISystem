import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type AlertRow = {
  id: string;
  created_at: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  alert_type?: string | null;
  sensor_id?: string | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function computePriority(alert: AlertRow): "P1" | "P2" | "P3" {
  const ageMinutes = (Date.now() - new Date(alert.created_at).getTime()) / 60_000;
  const isFresh = ageMinutes <= 60;
  const anomalyLinked = alert.alert_type === "ANOMALY" || alert.message.toLowerCase().includes("anomaly");

  if (alert.severity === "HIGH" || (anomalyLinked && isFresh)) {
    return "P1";
  }

  if (alert.severity === "MEDIUM" || isFresh) {
    return "P2";
  }

  return "P3";
}

export async function GET() {
  const { data, error } = await supabaseServer
    .from("alerts")
    .select("id, created_at, severity, status, message, alert_type, sensor_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withPriority = (data ?? []).map((alert) => {
    const row = alert as AlertRow;
    return {
      ...row,
      priority: computePriority(row)
    };
  });

  withPriority.sort((a, b) => {
    const priorityRank = { P1: 3, P2: 2, P3: 1 };
    const rankDelta = priorityRank[b.priority] - priorityRank[a.priority];
    if (rankDelta !== 0) return rankDelta;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({ data: withPriority });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sensorId = String(body.sensor_id ?? "").trim();
  const operator = String(body.operator ?? "").trim();
  const threshold = Number(body.threshold);

  if (!isUuid(sensorId)) {
    return NextResponse.json({ error: "sensor_id must be a valid UUID" }, { status: 400 });
  }

  if (operator !== ">" && operator !== "<") {
    return NextResponse.json({ error: "operator must be '>' or '<'" }, { status: 400 });
  }

  if (!Number.isFinite(threshold)) {
    return NextResponse.json({ error: "threshold must be a valid number" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("alarms")
    .insert({ sensor_id: sensorId, operator, threshold, is_active: true })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;

  const { data, error } = await supabaseServer.from("alerts").update({ status }).eq("id", id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
