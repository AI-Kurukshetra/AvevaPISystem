"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";

interface Sensor {
  id: string;
  tag_name: string;
  unit: string;
  description: string | null;
  equipment?: {
    name: string;
  } | null;
}

interface Hierarchy {
  id: string;
  name: string;
  areas?: Array<{
    id: string;
    name: string;
    production_lines?: Array<{
      id: string;
      name: string;
      equipment?: Array<{ id: string; name: string }>;
    }>;
  }>;
}

const defaultTagUnits: Record<string, string> = {
  Temperature: "C",
  Pressure: "bar",
  "Machine Speed": "rpm",
  "Production Count": "count",
  Vibration: "mm/s"
};

export default function SensorsPage() {
  const pageSize = 10;
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [page, setPage] = useState(1);
  const [equipment, setEquipment] = useState<Array<{ id: string; name: string }>>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendedThreshold, setRecommendedThreshold] = useState<number | null>(null);
  const [recommendationNote, setRecommendationNote] = useState<string>("");
  const [form, setForm] = useState({ equipment_id: "", tag_name: "Temperature", unit: "C", description: "" });
  const { toast } = useToast();

  async function loadSensors() {
    const res = await fetch("/api/sensors?include_equipment=true");
    const json = await res.json();

    if (!res.ok) {
      toast({ title: "Failed to load sensors", description: json.error ?? "Unknown error", kind: "error" });
      return;
    }

    setSensors(json.data ?? []);
    setPage(1);
  }

  async function loadEquipment() {
    const res = await fetch("/api/assets");
    const json = await res.json();

    if (!res.ok) {
      toast({ title: "Failed to load assets", description: json.error ?? "Unknown error", kind: "error" });
      return;
    }

    const tree = (json.data ?? []) as Hierarchy[];
    const rows = tree.flatMap((site) =>
      (site.areas ?? []).flatMap((area) =>
        (area.production_lines ?? []).flatMap((line) =>
          (line.equipment ?? []).map((eq) => ({
            id: eq.id,
            name: `${eq.name} (${line.name} / ${area.name} / ${site.name})`
          }))
        )
      )
    );

    setEquipment(rows);
    if (rows[0]) {
      setForm((current) => ({ ...current, equipment_id: current.equipment_id || rows[0].id }));
    }
  }

  async function createSensor() {
    const res = await fetch("/api/sensors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const body = await res.json();
    if (!res.ok) {
      toast({ title: "Failed to create sensor", description: body.error ?? "Unknown error", kind: "error" });
      return;
    }

    setForm((current) => ({ ...current, tag_name: "Temperature", unit: "C", description: "" }));
    toast({ title: "Sensor created", kind: "success" });
    await loadSensors();
  }

  async function loadThresholdRecommendation(tagName: string) {
    setRecommendationLoading(true);
    try {
      const res = await fetch(`/api/sensors/recommendation?tag_name=${encodeURIComponent(tagName)}`);
      const json = await res.json();

      if (!res.ok) {
        setRecommendedThreshold(null);
        setRecommendationNote(json.error ?? "No recommendation available.");
        return;
      }

      const suggested = json.data?.suggested_threshold;
      setRecommendedThreshold(typeof suggested === "number" ? suggested : null);
      setRecommendationNote(
        typeof suggested === "number"
          ? `Based on ${json.data?.sample_size ?? 0} readings and baseline ${json.data?.baseline_avg ?? 0}.`
          : String(json.data?.reason ?? "Not enough telemetry data for recommendation.")
      );
    } catch (error) {
      setRecommendedThreshold(null);
      setRecommendationNote(`Recommendation failed: ${String(error)}`);
    } finally {
      setRecommendationLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      setIsInitialLoading(true);
      await Promise.all([loadSensors(), loadEquipment()]);
      if (active) {
        setIsInitialLoading(false);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (form.tag_name) {
      void loadThresholdRecommendation(form.tag_name);
    }
  }, [form.tag_name]);

  const tagOptions = useMemo(() => Object.keys(defaultTagUnits), []);
  const totalPages = Math.max(1, Math.ceil(sensors.length / pageSize));
  const pagedSensors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sensors.slice(start, start + pageSize);
  }, [page, sensors]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Sensor Tag Management</h2>
      <Card className="space-y-3">
        {isInitialLoading ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-9 w-32" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              <select
                value={form.equipment_id}
                onChange={(e) => setForm((f) => ({ ...f, equipment_id: e.target.value }))}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name}
                  </option>
                ))}
              </select>
              <select
                value={form.tag_name}
                onChange={(e) => {
                  const tagName = e.target.value;
                  setForm((f) => ({ ...f, tag_name: tagName, unit: defaultTagUnits[tagName] ?? f.unit }));
                }}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              <Input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <Button onClick={createSensor}>Create Sensor</Button>
          </>
        )}
      </Card>

      <Card className="border-accent/30 bg-accent/10 p-4">
        <p className="text-sm font-medium text-accent">Smart Rule Suggestion</p>
        {isInitialLoading || recommendationLoading ? (
          <Skeleton className="mt-2 h-4 w-64 bg-accent/20" />
        ) : (
          <>
            <p className="mt-1 text-sm text-foreground">
              Suggested threshold for <span className="font-medium">{form.tag_name}</span>:{" "}
              <span className="font-semibold text-accent">
                {recommendedThreshold !== null ? `${recommendedThreshold} ${form.unit}` : "Unavailable"}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">{recommendationNote}</p>
          </>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2">Tag</th>
                <th>Unit</th>
                <th>Equipment</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b border-border/60">
                      <td className="py-2 pr-2"><Skeleton className="h-4 w-24" /></td>
                      <td className="pr-2"><Skeleton className="h-4 w-14" /></td>
                      <td className="pr-2"><Skeleton className="h-4 w-40" /></td>
                      <td><Skeleton className="h-4 w-52" /></td>
                    </tr>
                  ))
                : pagedSensors.map((sensor) => (
                    <tr key={sensor.id} className="border-b border-border/60">
                      <td className="py-2">{sensor.tag_name}</td>
                      <td>{sensor.unit}</td>
                      <td>{sensor.equipment?.name ?? "-"}</td>
                      <td>{sensor.description}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted">
          <span>
            {isInitialLoading
              ? "Loading sensors..."
              : `Showing ${sensors.length === 0 ? 0 : (page - 1) * pageSize + 1}-${Math.min(page * pageSize, sensors.length)} of ${sensors.length}`}
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
