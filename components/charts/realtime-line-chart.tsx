"use client";

import { Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { SensorDataPoint } from "@/lib/types";

interface Props {
  title: string;
  color: string;
  data: SensorDataPoint[];
  isLoading?: boolean;
}

function formatUtcTime(value: string) {
  const date = new Date(value);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function RealtimeLineChart({ title, color, data, isLoading = false }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    time: formatUtcTime(point.timestamp)
  }));

  return (
    <div className="h-64 rounded-xl border border-border bg-card/80 p-4">
      <h3 className="mb-2 text-sm text-muted">{title}</h3>
      {isLoading ? (
        <div className="h-[90%] space-y-2">
          <Skeleton className="h-[78%] w-full" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={{ stroke: "var(--muted)" }}
              tickLine={{ stroke: "var(--muted)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted)" }}
              axisLine={{ stroke: "var(--muted)" }}
              tickLine={{ stroke: "var(--muted)" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                borderRadius: "8px"
              }}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            {chartData
              .filter((point) => point.is_anomaly)
              .map((point) => (
                <ReferenceDot key={point.id} x={point.time} y={point.value} r={5} fill="var(--danger)" stroke="none" />
              ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
