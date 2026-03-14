"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

export default function ReportsPage() {
  const [sensorId, setSensorId] = useState("");
  const { toast } = useToast();

  const handleExport = async (type: "csv" | "json") => {
    const res = await fetch(`/api/reports?format=${type}&sensor_id=${sensorId}`);

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
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Reports Export</h2>
      <div className="space-y-3 rounded-xl border border-border bg-card/80 p-4">
        <input
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="Optional Sensor ID"
          value={sensorId}
          onChange={(e) => setSensorId(e.target.value)}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => handleExport("csv")}>Export CSV</Button>
          <Button onClick={() => handleExport("json")}>Export JSON</Button>
        </div>
      </div>
    </div>
  );
}
