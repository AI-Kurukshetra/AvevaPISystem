"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";

type SensorOption = {
  id: string;
  tag_name: string;
  unit: string;
};

type DataPoint = {
  id: string;
  sensor_id: string;
  timestamp: string;
  value: number;
  is_anomaly: boolean;
};

export default function ReportsPage() {
  const [sensors, setSensors] = useState<SensorOption[]>([]);
  const [sensorId, setSensorId] = useState("");
  const [rows, setRows] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "json" | null>(null);
  const { toast } = useToast();

  async function loadSensors() {
    const res = await fetch("/api/sensors");
    const body = await res.json();

    if (!res.ok) {
      toast({ title: "Failed to load sensors", description: body.error ?? "Unknown error", kind: "error" });
      return;
    }

    setSensors(body.data ?? []);
  }

  async function loadReportData(currentSensorId: string) {
    setIsLoading(true);

    try {
      const query = currentSensorId ? `?sensor_id=${encodeURIComponent(currentSensorId)}&limit=120` : "?limit=120";
      const res = await fetch(`/api/data${query}`);
      const body = await res.json();

      if (!res.ok) {
        toast({ title: "Failed to load report data", description: body.error ?? "Unknown error", kind: "error" });
        return;
      }

      setRows(body.data ?? []);
    } catch (error) {
      toast({ title: "Failed to load report data", description: String(error), kind: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  const handleExport = async (type: "csv" | "json") => {
    setExporting(type);
    try {
      const sensorQuery = sensorId ? `&sensor_id=${encodeURIComponent(sensorId)}` : "";
      const res = await fetch(`/api/reports?format=${type}${sensorQuery}`);

      if (!res.ok) {
        const body = await res.json();
        toast({ title: `Failed to export ${type.toUpperCase()}`, description: body.error ?? "Unknown error", kind: "error" });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sensor-report.${type}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `${type.toUpperCase()} exported`, kind: "success" });
    } catch (error) {
      toast({ title: `Failed to export ${type.toUpperCase()}`, description: String(error), kind: "error" });
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    void loadSensors();
  }, []);

  useEffect(() => {
    void loadReportData(sensorId);
  }, [sensorId]);

  const previewRows = useMemo(() => [...rows].slice(-12).reverse(), [rows]);

  const summary = useMemo(() => {
    if (rows.length === 0) {
      return { total: 0, anomaly: 0, average: 0, latest: "-" };
    }

    const anomaly = rows.filter((item) => item.is_anomaly).length;
    const average = rows.reduce((sum, item) => sum + Number(item.value), 0) / rows.length;
    const latest = rows[rows.length - 1]?.timestamp ?? "-";
    return { total: rows.length, anomaly, average, latest };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Reports Export</h2>
        <p className="mt-1 text-sm text-muted">Filter sensor data, review recent telemetry, then export CSV or JSON.</p>
      </div>

      <Card className="space-y-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <select
            value={sensorId}
            onChange={(e) => setSensorId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">All sensors</option>
            {sensors.map((sensor) => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.tag_name} ({sensor.unit}) - {sensor.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <Input value={sensorId} onChange={(e) => setSensorId(e.target.value)} placeholder="Or paste Sensor ID" />
          <Button type="button" onClick={() => loadReportData(sensorId)}>
            Refresh Data
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" disabled={exporting !== null} onClick={() => handleExport("csv")}>
            {exporting === "csv" ? "Exporting CSV..." : "Export CSV"}
          </Button>
          <Button type="button" disabled={exporting !== null} onClick={() => handleExport("json")}>
            {exporting === "json" ? "Exporting JSON..." : "Export JSON"}
          </Button>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs text-muted">Rows in preview window</p>
          {isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 text-xl font-semibold text-foreground">{summary.total}</p>}
        </Card>
        <Card>
          <p className="text-xs text-muted">Anomaly points</p>
          {isLoading ? <Skeleton className="mt-2 h-7 w-20 bg-warning/20" /> : <p className="mt-1 text-xl font-semibold text-warning">{summary.anomaly}</p>}
        </Card>
        <Card>
          <p className="text-xs text-muted">Average value</p>
          {isLoading ? <Skeleton className="mt-2 h-7 w-24 bg-accent/20" /> : <p className="mt-1 text-xl font-semibold text-accent">{summary.average.toFixed(2)}</p>}
        </Card>
        <Card>
          <p className="text-xs text-muted">Latest timestamp</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-5 w-44" />
          ) : (
            <p className="mt-1 text-sm font-medium text-foreground">{summary.latest === "-" ? "-" : new Date(summary.latest).toLocaleString()}</p>
          )}
        </Card>
      </section>

      <Card>
        <h3 className="text-sm font-semibold text-foreground">Recent Telemetry Preview</h3>
        <p className="mt-1 text-xs text-muted">Showing latest {Math.min(12, previewRows.length)} rows from current selection.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted border-border/90">
                <th className="py-2">Time</th>
                <th>Sensor</th>
                <th>Value</th>
                <th>Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={`report-skeleton-${index}`} className="border-b dark:border-border dark:border-border">
                    <td className="py-2 pr-2"><Skeleton className="h-4 w-36" /></td>
                    <td className="pr-2"><Skeleton className="h-4 w-20" /></td>
                    <td className="pr-2"><Skeleton className="h-4 w-16" /></td>
                    <td><Skeleton className="h-4 w-14" /></td>
                  </tr>
                ))
              ) : previewRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-5 text-center text-muted">
                    No data found for current filter.
                  </td>
                </tr>
              ) : (
                previewRows.map((row) => (
                  <tr key={row.id} className="border-b dark:border-border dark:border-border">
                    <td className="py-2">{new Date(row.timestamp).toLocaleString()}</td>
                    <td>{row.sensor_id.slice(0, 8)}</td>
                    <td>{Number(row.value).toFixed(2)}</td>
                    <td>{row.is_anomaly ? <span className="text-warning">Yes</span> : <span className="text-success">No</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
