"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/card";
import { RealtimeLineChart } from "@/components/charts/realtime-line-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { SensorDataPoint } from "@/lib/types";

interface DashboardProps {
  initialData: SensorDataPoint[];
  initialAlerts: number;
  sensorTags: Array<{ id: string; tag_name: string }>;
  initialTimelineAlerts: Array<{
    id: string;
    message: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    created_at: string;
    status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
    sensor_id: string | null;
  }>;
}

export function ClientDashboard({ initialData, initialAlerts, sensorTags, initialTimelineAlerts }: DashboardProps) {
  const [data, setData] = useState<SensorDataPoint[]>(initialData);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [timelineAlerts, setTimelineAlerts] = useState(initialTimelineAlerts);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const tagMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const sensor of sensorTags) {
      map[sensor.id] = sensor.tag_name;
    }
    return map;
  }, [sensorTags]);

  useEffect(() => {
    const loaderTimer = window.setTimeout(() => setIsInitialLoading(false), 700);

    async function refreshOpenAlerts() {
      const { count } = await supabase.from("alerts").select("id", { count: "exact", head: true }).eq("status", "OPEN");
      setAlerts(count ?? 0);
    }

    const channel = supabase
      .channel("sensor-data-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        (payload) => {
          setData((prev) => [...prev.slice(-399), payload.new as SensorDataPoint]);
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, async () => {
        void refreshOpenAlerts();
        const { data: latestAlertRows } = await supabase
          .from("alerts")
          .select("id, message, severity, created_at, status, sensor_id")
          .order("created_at", { ascending: false })
          .limit(20);
        setTimelineAlerts((latestAlertRows ?? []) as DashboardProps["initialTimelineAlerts"]);
      })
      .subscribe();

    return () => {
      window.clearTimeout(loaderTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const grouped = useMemo(() => {
    const bySensor: Record<string, SensorDataPoint[]> = {};
    for (const point of data) {
      if (!bySensor[point.sensor_id]) {
        bySensor[point.sensor_id] = [];
      }
      bySensor[point.sensor_id].push(point);
    }
    return bySensor;
  }, [data]);

  const latestPoint = data[data.length - 1];
  const latestValue = latestPoint?.value ?? 0;
  const latestIsAnomaly = Boolean(latestPoint?.is_anomaly);

  const machineStatus = latestIsAnomaly || latestValue > 95 ? "WARNING" : "RUNNING";
  const productionRate = Math.max(0, Math.round((Object.values(grouped)[0]?.at(-1)?.value ?? 0) * 1.2));
  const oee = Math.min(100, Math.max(0, Math.round(88 * 0.93 * 0.98)));

  const series = Object.entries(grouped).slice(0, 4);
  const anomalyCount = data.filter((point) => point.is_anomaly).length;
  const incidentTimeline = useMemo(() => {
    const alertEvents = timelineAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      timestamp: alert.created_at,
      label: `Alert ${alert.severity}`,
      detail: alert.message,
      kind: "alert" as const
    }));

    const sensorEvents = data
      .slice(-20)
      .reverse()
      .map((point) => ({
        id: `sensor-${point.id}`,
        timestamp: point.timestamp,
        label: point.is_anomaly ? "Sensor anomaly" : "Sensor reading",
        detail: `${tagMap[point.sensor_id] ?? `Sensor ${point.sensor_id.slice(0, 8)}`}: ${Number(point.value).toFixed(2)}`,
        kind: point.is_anomaly ? ("anomaly" as const) : ("sensor" as const)
      }));

    return [...alertEvents, ...sensorEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [data, tagMap, timelineAlerts]);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle>Machine Status</CardTitle>
          {isInitialLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className={`text-2xl font-semibold ${machineStatus === "WARNING" ? "text-warning" : "text-success"}`}>{machineStatus}</p>
          )}
        </Card>
        <Card>
          <CardTitle>Production Rate</CardTitle>
          {isInitialLoading ? <Skeleton className="h-8 w-32 bg-accent/20" /> : <p className="text-2xl font-semibold text-accent">{productionRate} units/h</p>}
        </Card>
        <Card>
          <CardTitle>Active Alerts</CardTitle>
          {isInitialLoading ? (
            <Skeleton className="h-8 w-16 bg-danger/20" />
          ) : (
            <p className={`text-2xl font-semibold ${alerts > 0 ? "text-danger" : "text-success"}`}>{alerts}</p>
          )}
        </Card>
        <Card>
          <CardTitle>OEE Score</CardTitle>
          {isInitialLoading ? <Skeleton className="h-8 w-20 bg-success/20" /> : <p className="text-2xl font-semibold text-success">{oee}%</p>}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isInitialLoading || series.length === 0
          ? Array.from({ length: 2 }).map((_, idx) => (
              <RealtimeLineChart
                key={`chart-skeleton-${idx}`}
                title={`Sensor Trend ${idx + 1}`}
                color={["#2db5ff", "#3dd598"][idx]}
                data={[]}
                isLoading
              />
            ))
          : series.map(([sensorId, points], idx) => (
              <RealtimeLineChart
                key={sensorId}
                title={`${tagMap[sensorId] ?? `Sensor ${sensorId.slice(0, 8)}`} Trend`}
                color={["#2db5ff", "#3dd598", "#f5a524", "#ff5d73"][idx]}
                data={points.slice(-40)}
              />
            ))}
      </section>

      <section className="rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold text-danger">AI Anomaly Detection</h4>
        {isInitialLoading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[55%]" />
          </div>
        ) : (
          <p className="mt-1 text-sm text-foreground/80">
            Rolling-average monitor active: {anomalyCount} anomaly events detected in the visible window.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface/80 p-4">
        <h4 className="text-sm font-semibold text-foreground">Incident Timeline</h4>
        <p className="mt-1 text-xs text-muted">Latest correlated events from alerts and telemetry</p>
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {isInitialLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={`timeline-skeleton-${index}`} className="rounded-lg border border-border bg-card px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="mt-2 h-4 w-[90%]" />
                </div>
              ))
            : incidentTimeline.map((event) => (
                <div key={event.id} className="rounded-lg border border-border bg-card px-3 py-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <p
                      className={
                        event.kind === "alert"
                          ? "font-medium text-danger"
                          : event.kind === "anomaly"
                            ? "font-medium text-warning"
                            : "font-medium text-accent"
                      }
                    >
                      {event.label}
                    </p>
                    <p className="text-muted">{new Date(event.timestamp).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-xs text-foreground/80">{event.detail}</p>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
}
