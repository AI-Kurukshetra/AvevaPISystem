"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";

interface Alert {
  id: string;
  created_at: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  priority: "P1" | "P2" | "P3";
}

interface SensorOption {
  id: string;
  tag_name: string;
}

export default function AlertsPage() {
  const pageSize = 10;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensors, setSensors] = useState<SensorOption[]>([]);
  const [page, setPage] = useState(1);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [form, setForm] = useState({ sensor_id: "", operator: ">", threshold: "90" });
  const { toast } = useToast();

  const loadAlerts = async (withLoader = false) => {
    if (withLoader) {
      setIsInitialLoading(true);
    }
    try {
      const res = await fetch("/api/alerts");
      const json = await res.json();

      if (!res.ok) {
        toast({ title: "Failed to load alerts", description: json.error ?? "Unknown error", kind: "error" });
        return;
      }

      setAlerts(json.data ?? []);
      setPage(1);
    } catch (error) {
      toast({ title: "Failed to load alerts", description: String(error), kind: "error" });
    } finally {
      if (withLoader) {
        setIsInitialLoading(false);
      }
    }
  };

  const createAlarm = async () => {
    if (!form.sensor_id) {
      toast({ title: "Sensor required", description: "Select a sensor before creating an alarm.", kind: "error" });
      return;
    }

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sensor_id: form.sensor_id,
        operator: form.operator,
        threshold: Number(form.threshold)
      })
    });

    const body = await res.json();
    if (!res.ok) {
      toast({ title: "Failed to create alarm", description: body.error ?? "Unknown error", kind: "error" });
      return;
    }

    toast({ title: "Alarm created", description: "Alerts will open when threshold is crossed.", kind: "success" });
  };

  const loadSensors = async () => {
    try {
      const res = await fetch("/api/sensors");
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Failed to load sensors", description: json.error ?? "Unknown error", kind: "error" });
        return;
      }

      const rows = (json.data ?? []) as SensorOption[];
      setSensors(rows);
      if (rows.length > 0) {
        setForm((current) => ({ ...current, sensor_id: current.sensor_id || rows[0].id }));
      }
    } catch (error) {
      toast({ title: "Failed to load sensors", description: String(error), kind: "error" });
    }
  };

  const updateStatus = async (id: string, status: Alert["status"]) => {
    const res = await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });

    if (!res.ok) {
      const body = await res.json();
      toast({ title: "Failed to update alert", description: body.error ?? "Unknown error", kind: "error" });
      return;
    }

    toast({ title: `Alert ${status.toLowerCase()}`, kind: "success" });
    await loadAlerts();
  };

  useEffect(() => {
    void loadAlerts(true);
    void loadSensors();

    const channel = supabase
      .channel("alerts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        void loadAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(alerts.length / pageSize));
  const pagedAlerts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return alerts.slice(start, start + pageSize);
  }, [alerts, page]);
  const correlatedIncidents = useMemo(() => {
    const normalizeMessage = (message: string) => message.toLowerCase().replace(/\d+(\.\d+)?/g, "#").trim();

    const grouped = new Map<
      string,
      {
        key: string;
        sampleMessage: string;
        count: number;
        latestAt: string;
        highestPriority: "P1" | "P2" | "P3";
      }
    >();
    const rank = { P1: 3, P2: 2, P3: 1 };

    for (const alert of alerts) {
      const groupKey = `${alert.severity}:${normalizeMessage(alert.message).slice(0, 80)}`;
      const existing = grouped.get(groupKey);
      if (!existing) {
        grouped.set(groupKey, {
          key: groupKey,
          sampleMessage: alert.message,
          count: 1,
          latestAt: alert.created_at,
          highestPriority: alert.priority
        });
      } else {
        existing.count += 1;
        if (new Date(alert.created_at).getTime() > new Date(existing.latestAt).getTime()) {
          existing.latestAt = alert.created_at;
          existing.sampleMessage = alert.message;
        }
        if (rank[alert.priority] > rank[existing.highestPriority]) {
          existing.highestPriority = alert.priority;
        }
      }
    }

    return Array.from(grouped.values())
      .filter((group) => group.count > 1)
      .sort((a, b) => b.count - a.count || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime())
      .slice(0, 6);
  }, [alerts]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Alerts & Alarm Management</h2>

      <Card className="space-y-3">
        <p className="text-sm text-foreground/80">Configure alarm threshold</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <select
            value={form.sensor_id}
            onChange={(e) => setForm((f) => ({ ...f, sensor_id: e.target.value }))}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            {sensors.length === 0 ? <option value="">No sensors available</option> : null}
            {sensors.map((sensor) => (
              <option key={sensor.id} value={sensor.id}>
                {sensor.tag_name} ({sensor.id.slice(0, 8)})
              </option>
            ))}
          </select>
          <select value={form.operator} onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
            <option value=">">Greater than (&gt;)</option>
            <option value="<">Less than (&lt;)</option>
          </select>
          <Input placeholder="Threshold" value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))} />
          <Button onClick={createAlarm}>Create Alarm</Button>
        </div>
      </Card>

      <Card className="space-y-3 border-warning/30 bg-warning/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-warning">Alert Correlation</h3>
          <span className="text-xs text-muted">Grouped repeated patterns</span>
        </div>
        {isInitialLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full bg-warning/20" />
            <Skeleton className="h-10 w-full bg-warning/20" />
          </div>
        ) : correlatedIncidents.length === 0 ? (
          <p className="text-xs text-foreground/80">No repeated alert clusters detected yet.</p>
        ) : (
          <div className="space-y-2">
            {correlatedIncidents.map((incident) => (
              <div key={incident.key} className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-warning">Cluster x{incident.count}</span>
                  <span className="text-muted">{new Date(incident.latestAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-foreground">{incident.sampleMessage}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2">Time</th>
                <th>Priority</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b border-border/50">
                      <td className="py-2 pr-2"><Skeleton className="h-4 w-36" /></td>
                      <td className="pr-2"><Skeleton className="h-4 w-12" /></td>
                      <td className="pr-2"><Skeleton className="h-4 w-20" /></td>
                      <td className="pr-2"><Skeleton className="h-4 w-24" /></td>
                      <td className="pr-2"><Skeleton className="h-4 w-56" /></td>
                      <td><Skeleton className="h-8 w-36" /></td>
                    </tr>
                  ))
                : pagedAlerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-border/50">
                      <td className="py-2">{new Date(alert.created_at).toLocaleString()}</td>
                      <td>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            alert.priority === "P1"
                              ? "bg-danger/20 text-danger"
                              : alert.priority === "P2"
                                ? "bg-warning/20 text-warning"
                                : "bg-muted/20 text-foreground/80"
                          }`}
                        >
                          {alert.priority}
                        </span>
                      </td>
                      <td className={alert.severity === "HIGH" ? "text-danger" : alert.severity === "MEDIUM" ? "text-warning" : "text-success"}>{alert.severity}</td>
                      <td>{alert.status}</td>
                      <td>{alert.message}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Button className="px-2 py-1" onClick={() => updateStatus(alert.id, "ACKNOWLEDGED")}>Acknowledge</Button>
                          <Button className="bg-surface border border-border text-foreground hover:bg-surface/80 px-2 py-1" onClick={() => updateStatus(alert.id, "RESOLVED")}>Resolve</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted">
          <span>
            {isInitialLoading
              ? "Loading alerts..."
              : `Showing ${alerts.length === 0 ? 0 : (page - 1) * pageSize + 1}-${Math.min(page * pageSize, alerts.length)} of ${alerts.length}`}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" className="px-2 py-1" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="min-w-16 text-center text-foreground/80">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              className="px-2 py-1"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
